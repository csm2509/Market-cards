"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SelectedAsset } from "@/lib/types";
import { useQuotes } from "@/hooks/useQuotes";
import { ASSETS } from "@/config/assets";
import AssetSearch from "@/components/AssetSearch";

// Helper para decodificar cme code
function parseCmeCode(query: string) {
  const clean = query.trim().toUpperCase();
  const match = clean.match(/^([A-Z]{2})([FGHJKMNQUVXZ])(\d{1,2})$/);
  if (!match) return null;

  const [, root, month, year] = match;
  const yearStr = year.length === 1 ? `2${year}` : year;

  const exchangeMap: Record<string, string> = {
    ZC: ".CBT", ZS: ".CBT", ZW: ".CBT", KE: ".CBT", ZM: ".CBT", ZL: ".CBT",
    CL: ".NYM", NG: ".NYM", BZ: ".ICE", GC: ".CMX", SI: ".CMX", HG: ".CMX",
  };

  const nameMap: Record<string, string> = {
    ZC: "Milho", ZS: "Soja", ZW: "Trigo Chicago (SRW)", KE: "Trigo KC (HRW)",
    ZM: "Farelo de Soja", ZL: "Óleo de Soja", CL: "Petróleo WTI", NG: "Gás Natural",
    BZ: "Petróleo Brent", GC: "Ouro", SI: "Prata", HG: "Cobre",
  };

  const monthMap: Record<string, string> = {
    F: "Jan", G: "Fev", H: "Mar", J: "Abr", K: "Mai", M: "Jun",
    N: "Jul", Q: "Ago", U: "Set", V: "Out", X: "Nov", Z: "Dez"
  };

  const suffix = exchangeMap[root];
  if (!suffix) return null;

  const ticker = `${root}${month}${yearStr}${suffix}`;
  const friendlyName = `${nameMap[root]} (${monthMap[month]}/${yearStr})`;

  return {
    nome: friendlyName,
    ticker,
    categoria: "Contratos Futuros CME",
  };
}

export default function HomePage() {
  const router = useRouter();

  // --- State ---
  const [selectedAssets, setSelectedAssets] = useState<SelectedAsset[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // --- Auto Refresh ---
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(30);

  // --- Quotes ---
  const { quotes, loading, fetchQuotes } = useQuotes();

  // Merge quotes into selected assets
  const assetsWithQuotes: SelectedAsset[] = selectedAssets.map((asset) => ({
    ...asset,
    quote: quotes.get(asset.ticker),
  }));

  // --- Handlers ---
  const handleAddAsset = useCallback(
    (asset: { nome: string; ticker: string; categoria: string }) => {
      const newAsset: SelectedAsset = {
        id: `${asset.ticker}-${Date.now()}-${Math.random()}`,
        nome: asset.nome,
        ticker: asset.ticker,
        categoria: asset.categoria,
      };
      setSelectedAssets((prev) => [...prev, newAsset]);
      fetchQuotes([asset.ticker]);
    },
    [fetchQuotes]
  );

  const handleRemoveAsset = useCallback((id: string) => {
    setSelectedAssets((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleRefreshQuotes = useCallback(() => {
    const tickers = selectedAssets.map((a) => a.ticker);
    if (tickers.length > 0) fetchQuotes(tickers);
    setCountdown(30);
  }, [selectedAssets, fetchQuotes]);

  // 1. Inicializar do LocalStorage (ou URL fallback)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tickersParam = params.get("tickers");

    if (tickersParam) {
      const tickers = tickersParam.split(",").map(t => t.trim()).filter(Boolean);
      const initialAssets: SelectedAsset[] = tickers.map((ticker) => {
        const baseAsset = ASSETS.find(a => a.ticker.toUpperCase() === ticker.toUpperCase());
        if (baseAsset) {
          return {
            id: `${baseAsset.ticker}-${Date.now()}-${Math.random()}`,
            nome: baseAsset.nome,
            ticker: baseAsset.ticker,
            categoria: baseAsset.categoria,
          };
        }

        const cmeParsed = parseCmeCode(ticker);
        if (cmeParsed) {
          return {
            id: `${cmeParsed.ticker}-${Date.now()}-${Math.random()}`,
            nome: cmeParsed.nome,
            ticker: cmeParsed.ticker,
            categoria: cmeParsed.categoria,
          };
        }

        return {
          id: `${ticker}-${Date.now()}-${Math.random()}`,
          nome: `Ativo: ${ticker.toUpperCase()}`,
          ticker: ticker.toUpperCase(),
          categoria: "Ativo Personalizado (Yahoo)",
        };
      });

      setSelectedAssets(initialAssets);
      fetchQuotes(tickers);
    } else {
      const localTickers = localStorage.getItem("market-cards-tickers");
      if (localTickers) {
        const tickers = localTickers.split(",").filter(Boolean);
        const initialAssets: SelectedAsset[] = tickers.map((ticker) => {
          const baseAsset = ASSETS.find(a => a.ticker.toUpperCase() === ticker.toUpperCase());
          if (baseAsset) {
            return {
              id: `${baseAsset.ticker}-${Date.now()}-${Math.random()}`,
              nome: baseAsset.nome,
              ticker: baseAsset.ticker,
              categoria: baseAsset.categoria,
            };
          }

          const cmeParsed = parseCmeCode(ticker);
          if (cmeParsed) {
            return {
              id: `${cmeParsed.ticker}-${Date.now()}-${Math.random()}`,
              nome: cmeParsed.nome,
              ticker: cmeParsed.ticker,
              categoria: cmeParsed.categoria,
            };
          }

          return {
            id: `${ticker}-${Date.now()}-${Math.random()}`,
            nome: `Ativo: ${ticker.toUpperCase()}`,
            ticker: ticker.toUpperCase(),
            categoria: "Ativo Personalizado (Yahoo)",
          };
        });
        setSelectedAssets(initialAssets);
        fetchQuotes(tickers);
      } else {
        // Fallback inicial padrão
        const defaultTickers = ["CL=F", "ZW=F", "ZS=F"];
        const initialAssets: SelectedAsset[] = defaultTickers.map((ticker) => {
          const baseAsset = ASSETS.find(a => a.ticker === ticker)!;
          return {
            id: `${baseAsset.ticker}-${Date.now()}-${Math.random()}`,
            nome: baseAsset.nome,
            ticker: baseAsset.ticker,
            categoria: baseAsset.categoria,
          };
        });
        setSelectedAssets(initialAssets);
        fetchQuotes(defaultTickers);
      }
    }

    setIsInitialized(true);
  }, [fetchQuotes]);

  // 2. Salvar tickers no LocalStorage
  useEffect(() => {
    if (!isInitialized) return;
    const tickers = selectedAssets.map(a => a.ticker);
    localStorage.setItem("market-cards-tickers", tickers.join(","));

    // Atualiza URL de forma limpa
    const params = new URLSearchParams();
    if (tickers.length > 0) {
      params.set("tickers", tickers.join(","));
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({ path: newUrl }, "", newUrl);
  }, [selectedAssets, isInitialized]);

  // 3. Auto Refresh
  useEffect(() => {
    if (!autoRefresh || selectedAssets.length === 0 || !isInitialized) {
      setCountdown(30);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          const tickers = selectedAssets.map((a) => a.ticker);
          fetchQuotes(tickers);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefresh, selectedAssets, fetchQuotes, isInitialized]);

  // Busca inicial das cotações
  useEffect(() => {
    if (!isInitialized) return;
    const tickersWithoutQuotes = selectedAssets
      .filter((a) => !quotes.has(a.ticker))
      .map((a) => a.ticker);
    if (tickersWithoutQuotes.length > 0) {
      fetchQuotes(tickersWithoutQuotes);
    }
  }, [selectedAssets, quotes, fetchQuotes, isInitialized]);

  // Formatações auxiliares
  const formatPrice = (price: number | null | undefined, currency: string) => {
    if (price === null || price === undefined) return "-";
    const symbol = currency === "USD" ? "US$" : currency === "USX" ? "USX" : "$";
    return `${symbol} ${price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatChange = (percent: number | null | undefined) => {
    if (percent === null || percent === undefined) return "-";
    const sign = percent >= 0 ? "▲" : "▼";
    const color = percent >= 0 ? "text-green-400" : "text-red-400";
    return (
      <span className={`font-mono text-sm font-semibold ${color}`}>
        {sign} {Math.abs(percent).toFixed(2)}%
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      {/* ===== Global Navigation Menu Header ===== */}
      <header className="border-b border-white/[0.06] bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h2l3-8 4 16 3-8h6" />
                </svg>
              </span>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-300 bg-clip-text text-transparent">
                Market Dash
              </span>
            </div>

            {/* Menu */}
            <nav className="flex items-center gap-1.5">
              <Link
                href="/"
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-white/[0.06] text-white border border-white/[0.08]"
              >
                📈 Dashboard
              </Link>
              <Link
                href={`/compartilhar?tickers=${selectedAssets.map(a => a.ticker).join(",")}`}
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] transition-colors"
              >
                🎴 Gerador de Cards
              </Link>
            </nav>
          </div>

          {/* Ao Vivo / Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.06] rounded-xl px-3 py-1.5">
              <span className="flex h-2 w-2 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${autoRefresh ? "bg-emerald-400" : "bg-zinc-500"}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${autoRefresh ? "bg-emerald-500" : "bg-zinc-600"}`}></span>
              </span>
              <span className="text-xs font-semibold text-zinc-400">
                {autoRefresh ? `Ao vivo (${countdown}s)` : "Atualização pausada"}
              </span>
              <button
                type="button"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors ml-1 p-0.5 cursor-pointer"
              >
                {autoRefresh ? (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>
            </div>
            
            <button
              onClick={handleRefreshQuotes}
              disabled={loading}
              className="p-2 rounded-xl border border-white/[0.06] hover:bg-white/[0.04] text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50 cursor-pointer"
              title="Forçar Atualização"
            >
              <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ===== Main View (Dashboard de Consulta) ===== */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
        {/* Search / Filter Container */}
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-zinc-900/40 border border-white/[0.06] p-4 rounded-2xl">
          <div className="w-full sm:max-w-md">
            <AssetSearch
              selectedTickers={selectedAssets.map((a) => a.ticker)}
              onSelect={handleAddAsset}
            />
          </div>
          
          <Link
            href={`/compartilhar?tickers=${selectedAssets.map(a => a.ticker).join(",")}`}
            className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl cursor-pointer"
          >
            <span>Montar Card de Compartilhamento</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>

        {/* Dashboard Grid / Table */}
        <div className="bg-zinc-900/30 border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02] text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Ativo / Código</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4 text-right">Preço Atual</th>
                  <th className="px-6 py-4 text-center">Variação Diária (1D)</th>
                  <th className="px-6 py-4 text-center">Variação Semanal (1S)</th>
                  <th className="px-6 py-4 text-center">Atualizado Em</th>
                  <th className="px-6 py-4 text-center w-20">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {assetsWithQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 text-sm">
                      Nenhum ativo monitorando no momento. Digite acima para buscar e adicionar ativos ao seu painel.
                    </td>
                  </tr>
                ) : (
                  assetsWithQuotes.map((asset) => {
                    const q = asset.quote;
                    return (
                      <tr key={asset.id} className="hover:bg-white/[0.02] transition-colors group">
                        {/* Name / Ticker */}
                        <td className="px-6 py-4.5">
                          <div className="font-semibold text-zinc-200 text-sm">{asset.nome}</div>
                          <div className="text-xs text-zinc-500 font-mono mt-0.5">{asset.ticker}</div>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-4.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-white/[0.04] text-zinc-400 uppercase border border-white/[0.02]">
                            {asset.categoria}
                          </span>
                        </td>

                        {/* Current Price */}
                        <td className="px-6 py-4.5 text-right font-mono font-medium text-sm text-zinc-200">
                          {loading && !q ? (
                            <span className="inline-block w-16 h-4 bg-white/[0.05] animate-pulse rounded" />
                          ) : (
                            formatPrice(q?.price, q?.currency || "USD")
                          )}
                        </td>

                        {/* 1D Change */}
                        <td className="px-6 py-4.5 text-center">
                          {loading && !q ? (
                            <span className="inline-block w-12 h-4 bg-white/[0.05] animate-pulse rounded" />
                          ) : (
                            formatChange(q?.changePercent)
                          )}
                        </td>

                        {/* 1S Change */}
                        <td className="px-6 py-4.5 text-center">
                          {loading && !q ? (
                            <span className="inline-block w-12 h-4 bg-white/[0.05] animate-pulse rounded" />
                          ) : (
                            formatChange(q?.changePercentWeekly)
                          )}
                        </td>

                        {/* Last Updated Time */}
                        <td className="px-6 py-4.5 text-center text-xs text-zinc-500">
                          {q?.marketTime ? new Date(q.marketTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "-"}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4.5 text-center">
                          <button
                            onClick={() => handleRemoveAsset(asset.id)}
                            className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                            title="Remover ativo"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ===== Footer ===== */}
      <footer className="border-t border-white/[0.04] py-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            Dados financeiros fornecidos pelo Yahoo Finance · Consulta para fins educacionais e pessoais.
          </p>
          <p className="text-xs text-zinc-600">Market Dash v1.0</p>
        </div>
      </footer>
    </div>
  );
}
