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
  const [enabledTickers, setEnabledTickers] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  // --- Auto Refresh ---
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(30);

  // --- Quotes ---
  const { quotes, loading, fetchQuotes } = useQuotes();

  // Inicializar todos os ativos pré-configurados do config/assets.ts + customizados salvos
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Tickers customizados adicionais salvos no LocalStorage
    const localCustomTickers = localStorage.getItem("market-cards-custom-tickers");
    const localEnabled = localStorage.getItem("market-cards-enabled-tickers");

    // Monta a lista inicial a partir do ASSETS padrão
    const initialAssets: SelectedAsset[] = ASSETS.map((asset) => ({
      id: `${asset.ticker}-default`,
      nome: asset.nome,
      ticker: asset.ticker,
      categoria: asset.categoria,
    }));

    // Se houver tickers customizados salvos, adiciona à lista
    if (localCustomTickers) {
      const customTickers = localCustomTickers.split(",").filter(Boolean);
      customTickers.forEach((ticker) => {
        // Evita duplicar caso já esteja nos padrões
        if (initialAssets.some(a => a.ticker.toUpperCase() === ticker.toUpperCase())) return;

        const cmeParsed = parseCmeCode(ticker);
        if (cmeParsed) {
          initialAssets.push({
            id: `${cmeParsed.ticker}-${Date.now()}-${Math.random()}`,
            nome: cmeParsed.nome,
            ticker: cmeParsed.ticker,
            categoria: cmeParsed.categoria,
          });
        } else {
          initialAssets.push({
            id: `${ticker}-${Date.now()}-${Math.random()}`,
            nome: `Ativo: ${ticker.toUpperCase()}`,
            ticker: ticker.toUpperCase(),
            categoria: "Ativos Personalizados",
          });
        }
      });
    }

    setSelectedAssets(initialAssets);

    // Configura quais ativos estão "habilitados" (marcados para ir para o card)
    const enabledMap: Record<string, boolean> = {};
    if (localEnabled) {
      try {
        const parsed = JSON.parse(localEnabled);
        initialAssets.forEach((asset) => {
          enabledMap[asset.ticker] = parsed[asset.ticker] !== false;
        });
      } catch (e) {
        initialAssets.forEach((asset) => {
          enabledMap[asset.ticker] = true;
        });
      }
    } else {
      // Habilita todos por padrão
      initialAssets.forEach((asset) => {
        enabledMap[asset.ticker] = true;
      });
    }
    setEnabledTickers(enabledMap);

    // Dispara a busca das cotações de todos eles de uma vez
    const allTickers = initialAssets.map((a) => a.ticker);
    fetchQuotes(allTickers);

    setIsInitialized(true);
  }, [fetchQuotes]);

  // Salva alterações customizadas e marcadas no LocalStorage
  useEffect(() => {
    if (!isInitialized) return;
    
    // Salva quais estão marcados
    localStorage.setItem("market-cards-enabled-tickers", JSON.stringify(enabledTickers));

    // Salva a lista de customizados (os que não pertencem ao ASSETS padrão)
    const customTickers = selectedAssets
      .filter((asset) => !ASSETS.some(a => a.ticker === asset.ticker))
      .map((asset) => asset.ticker);
    localStorage.setItem("market-cards-custom-tickers", customTickers.join(","));
  }, [selectedAssets, enabledTickers, isInitialized]);

  // Auto Refresh de todos de uma vez
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

  // Busca cotações de novos ativos inseridos
  useEffect(() => {
    if (!isInitialized) return;
    const tickersWithoutQuotes = selectedAssets
      .filter((a) => !quotes.has(a.ticker))
      .map((a) => a.ticker);
    if (tickersWithoutQuotes.length > 0) {
      fetchQuotes(tickersWithoutQuotes);
    }
  }, [selectedAssets, quotes, fetchQuotes, isInitialized]);

  // --- Handlers ---
  const handleAddAsset = useCallback(
    (asset: { nome: string; ticker: string; categoria: string }) => {
      // Verifica se já existe na watchlist
      if (selectedAssets.some((a) => a.ticker.toUpperCase() === asset.ticker.toUpperCase())) {
        return;
      }

      const newAsset: SelectedAsset = {
        id: `${asset.ticker}-${Date.now()}-${Math.random()}`,
        nome: asset.nome,
        ticker: asset.ticker,
        categoria: asset.categoria,
      };

      setSelectedAssets((prev) => [...prev, newAsset]);
      setEnabledTickers((prev) => ({ ...prev, [asset.ticker]: true }));
      fetchQuotes([asset.ticker]);
      setSearchQuery(""); // Limpa filtro
    },
    [selectedAssets, fetchQuotes]
  );

  const handleRemoveAsset = useCallback((ticker: string) => {
    // Só deixa remover se for customizado (não for ativo padrão do ASSETS)
    if (ASSETS.some(a => a.ticker === ticker)) {
      alert("Ativos padrão do painel não podem ser removidos, apenas desmarcados.");
      return;
    }
    setSelectedAssets((prev) => prev.filter((a) => a.ticker !== ticker));
    setEnabledTickers((prev) => {
      const copy = { ...prev };
      delete copy[ticker];
      return copy;
    });
  }, []);

  const handleToggleTicker = (ticker: string) => {
    setEnabledTickers((prev) => ({
      ...prev,
      [ticker]: prev[ticker] === false ? true : false,
    }));
  };

  const handleRefreshQuotes = useCallback(() => {
    const tickers = selectedAssets.map((a) => a.ticker);
    if (tickers.length > 0) fetchQuotes(tickers);
    setCountdown(30);
  }, [selectedAssets, fetchQuotes]);

  // --- Helpers ---
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

  // Junta cotações e filtra pela busca do usuário
  const assetsWithQuotes: SelectedAsset[] = selectedAssets.map((asset) => ({
    ...asset,
    quote: quotes.get(asset.ticker),
  }));

  const filteredAssets = assetsWithQuotes.filter((asset) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      asset.nome.toLowerCase().includes(query) ||
      asset.ticker.toLowerCase().includes(query) ||
      asset.categoria.toLowerCase().includes(query)
    );
  });

  // Agrupamento por categorias
  const categoriesMap: Record<string, SelectedAsset[]> = {};
  filteredAssets.forEach((asset) => {
    if (!categoriesMap[asset.categoria]) {
      categoriesMap[asset.categoria] = [];
    }
    categoriesMap[asset.categoria].push(asset);
  });

  const categories = Object.keys(categoriesMap);

  // Gera os query params para a página de exportação
  const getShareLinkParams = () => {
    const activeTickers = selectedAssets
      .filter((a) => enabledTickers[a.ticker] !== false)
      .map((a) => a.ticker);
    
    const params = new URLSearchParams();
    if (activeTickers.length > 0) {
      params.set("tickers", activeTickers.join(","));
    }
    return params.toString();
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      {/* ===== Global Navigation Header ===== */}
      <header className="border-b border-white/[0.06] bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
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

            <nav className="flex items-center gap-1.5">
              <Link
                href="/"
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-white/[0.06] text-white border border-white/[0.08]"
              >
                📈 Dashboard
              </Link>
              <Link
                href={`/compartilhar?${getShareLinkParams()}`}
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] transition-colors"
              >
                🎴 Gerador de Cards
              </Link>
            </nav>
          </div>

          {/* Live countdown status */}
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
        {/* Search & Actions Panel */}
        <div className="flex flex-col md:flex-row items-center gap-4 justify-between bg-zinc-900/40 border border-white/[0.06] p-4 rounded-2xl">
          <div className="w-full md:max-w-md flex gap-2">
            <div className="flex-1">
              <AssetSearch
                selectedTickers={selectedAssets.map((a) => a.ticker)}
                onSelect={handleAddAsset}
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="px-3 text-xs bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 border border-white/[0.06] rounded-xl transition-colors cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Quick Text Filter */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar nesta tela... (ex: Soja)"
              className="flex-1 md:w-48 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-zinc-50 placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all"
            />

            <Link
              href={`/compartilhar?${getShareLinkParams()}`}
              className="btn-primary flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl cursor-pointer"
            >
              <span>Montar Card para Postar</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Dashboard Grid por Categorias */}
        <div className="space-y-8">
          {categories.length === 0 ? (
            <div className="bg-zinc-900/30 border border-white/[0.06] rounded-2xl py-16 text-center text-zinc-500 text-sm">
              Nenhum ativo corresponde à busca ou o painel está vazio.
            </div>
          ) : (
            categories.map((catName) => {
              const items = categoriesMap[catName];
              return (
                <div key={catName} className="space-y-3">
                  {/* Categoria Header */}
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-xs uppercase tracking-widest font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                      {catName}
                    </span>
                    <span className="text-zinc-500 text-xs">({items.length} ativos)</span>
                  </div>

                  {/* Categoria Tabela */}
                  <div className="bg-zinc-900/30 border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b border-white/[0.06] bg-white/[0.02] text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                            <th className="px-5 py-3.5 w-16 text-center">Exportar</th>
                            <th className="px-5 py-3.5">Ativo</th>
                            <th className="px-5 py-3.5">Código (Ticker)</th>
                            <th className="px-5 py-3.5 text-right">Preço Atual</th>
                            <th className="px-5 py-3.5 text-center">Variação Diária (1D)</th>
                            <th className="px-5 py-3.5 text-center">Variação Semanal (1S)</th>
                            <th className="px-5 py-3.5 text-center">Atualizado</th>
                            {catName === "Ativos Personalizados" || catName === "Contratos Futuros CME" ? (
                              <th className="px-5 py-3.5 text-center w-16">Ações</th>
                            ) : null}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {items.map((asset) => {
                            const q = asset.quote;
                            const isChecked = enabledTickers[asset.ticker] !== false;
                            const isCustom = !ASSETS.some(a => a.ticker === asset.ticker);

                            return (
                              <tr key={asset.ticker} className="hover:bg-white/[0.02] transition-colors group">
                                {/* Checkbox Exportar */}
                                <td className="px-5 py-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleTicker(asset.ticker)}
                                    className="w-4 h-4 rounded text-indigo-600 bg-zinc-800 border-zinc-700 focus:ring-indigo-500 cursor-pointer"
                                    title="Marcar para incluir no Card final"
                                  />
                                </td>

                                {/* Asset Name */}
                                <td className="px-5 py-3 font-semibold text-zinc-200 text-sm">
                                  {asset.nome}
                                </td>

                                {/* Ticker */}
                                <td className="px-5 py-3 text-xs text-zinc-500 font-mono">
                                  {asset.ticker}
                                </td>

                                {/* Current Price */}
                                <td className="px-5 py-3 text-right font-mono font-medium text-sm text-zinc-200">
                                  {loading && !q ? (
                                    <span className="inline-block w-16 h-4 bg-white/[0.05] animate-pulse rounded" />
                                  ) : (
                                    formatPrice(q?.price, q?.currency || "USD")
                                  )}
                                </td>

                                {/* 1D Change */}
                                <td className="px-5 py-3 text-center">
                                  {loading && !q ? (
                                    <span className="inline-block w-12 h-4 bg-white/[0.05] animate-pulse rounded" />
                                  ) : (
                                    formatChange(q?.changePercent)
                                  )}
                                </td>

                                {/* 1S Change */}
                                <td className="px-5 py-3 text-center">
                                  {loading && !q ? (
                                    <span className="inline-block w-12 h-4 bg-white/[0.05] animate-pulse rounded" />
                                  ) : (
                                    formatChange(q?.changePercentWeekly)
                                  )}
                                </td>

                                {/* Last Updated */}
                                <td className="px-5 py-3 text-center text-xs text-zinc-500">
                                  {q?.marketTime ? new Date(q.marketTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "-"}
                                </td>

                                {/* Actions (Delete if custom) */}
                                {catName === "Ativos Personalizados" || catName === "Contratos Futuros CME" ? (
                                  <td className="px-5 py-3 text-center">
                                    {isCustom ? (
                                      <button
                                        onClick={() => handleRemoveAsset(asset.ticker)}
                                        className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                                        title="Remover ativo"
                                      >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    ) : null}
                                  </td>
                                ) : null}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })
          )}
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
