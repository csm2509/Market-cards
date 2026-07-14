"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { SelectedAsset, GradientPreset } from "@/lib/types";
import { GRADIENT_PRESETS } from "@/lib/gradients";
import { useQuotes } from "@/hooks/useQuotes";
import { ASSETS } from "@/config/assets";

import AssetSearch from "@/components/AssetSearch";
import SelectedAssets from "@/components/SelectedAssets";
import GradientPicker from "@/components/GradientPicker";
import CardPreview from "@/components/CardPreview";

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
  const [selectedGradient, setSelectedGradient] = useState<GradientPreset>(
    GRADIENT_PRESETS[0]
  );
  const [showFooter, setShowFooter] = useState(true);
  const [footerText, setFooterText] = useState("Giovanna Crescitelli");
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

  const handleReorder = useCallback((reordered: SelectedAsset[]) => {
    setSelectedAssets(reordered);
  }, []);

  const handleSelectGradient = useCallback((id: string) => {
    const preset = GRADIENT_PRESETS.find((g) => g.id === id);
    if (preset) setSelectedGradient(preset);
  }, []);

  const handleRefreshQuotes = useCallback(() => {
    const tickers = selectedAssets.map((a) => a.ticker);
    if (tickers.length > 0) fetchQuotes(tickers);
    setCountdown(30);
  }, [selectedAssets, fetchQuotes]);

  const handleGoToShare = () => {
    const tickers = selectedAssets.map((a) => a.ticker).join(",");
    const params = new URLSearchParams();
    if (tickers) params.set("tickers", tickers);
    params.set("gradient", selectedGradient.id);
    params.set("footer", showFooter ? "true" : "false");
    if (footerText) params.set("text", footerText);

    router.push(`/compartilhar?${params.toString()}`);
  };

  // 1. Inicializar do link da URL
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tickersParam = params.get("tickers");
    const gradientParam = params.get("gradient");
    const footerParam = params.get("footer");
    const textParam = params.get("text");

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
      // Se não há parâmetros na URL, vamos tentar ler do localStorage
      const localTickers = localStorage.getItem("market-cards-tickers");
      const localGradient = localStorage.getItem("market-cards-gradient");
      const localFooter = localStorage.getItem("market-cards-footer");
      const localText = localStorage.getItem("market-cards-text");

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
        // Inicializa com alguns ativos padrão se estiver 100% limpo
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

      if (localGradient) {
        const preset = GRADIENT_PRESETS.find(g => g.id === localGradient);
        if (preset) setSelectedGradient(preset);
      }
      if (localFooter) {
        setShowFooter(localFooter === "true");
      }
      if (localText) {
        setFooterText(localText);
      }
    }

    setIsInitialized(true);
  }, [fetchQuotes]);

  // 2. Sincronizar na URL e no LocalStorage
  useEffect(() => {
    if (!isInitialized) return;
    const tickers = selectedAssets.map(a => a.ticker);
    
    // Salva localmente
    localStorage.setItem("market-cards-tickers", tickers.join(","));
    localStorage.setItem("market-cards-gradient", selectedGradient.id);
    localStorage.setItem("market-cards-footer", showFooter ? "true" : "false");
    localStorage.setItem("market-cards-text", footerText);

    // Atualiza a URL sem recarregar
    const params = new URLSearchParams();
    if (tickers.length > 0) {
      params.set("tickers", tickers.join(","));
    }
    params.set("gradient", selectedGradient.id);
    params.set("footer", showFooter ? "true" : "false");
    if (footerText) {
      params.set("text", footerText);
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({ path: newUrl }, "", newUrl);
  }, [selectedAssets, selectedGradient, showFooter, footerText, isInitialized]);

  // 3. Atualização automática Ao Vivo
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

  // Busca cotações para ativos adicionados manualmente
  useEffect(() => {
    if (!isInitialized) return;
    const tickersWithoutQuotes = selectedAssets
      .filter((a) => !quotes.has(a.ticker))
      .map((a) => a.ticker);
    if (tickersWithoutQuotes.length > 0) {
      fetchQuotes(tickersWithoutQuotes);
    }
  }, [selectedAssets, quotes, fetchQuotes, isInitialized]);

  return (
    <div className="flex-1 flex flex-col">
      {/* ===== Header ===== */}
      <header className="border-b border-white/[0.06] bg-white/[0.01] backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-50 flex items-center gap-3">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <svg
                  className="w-5 h-5 text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13h2l3-8 4 16 3-8h6"
                  />
                </svg>
              </span>
              Dashboard de Commodities
            </h1>
            <p className="text-zinc-500 text-sm mt-1 ml-12">
              Painel de consulta e monitoramento em tempo real
            </p>
          </div>

          {/* Indicador Ao Vivo e Manual Refresh */}
          <div className="flex items-center gap-3 flex-wrap justify-end">
            {selectedAssets.length > 0 && (
              <div className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.06] rounded-xl px-3 py-1.5">
                <span className="flex h-2 w-2 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${autoRefresh ? "bg-emerald-400" : "bg-zinc-500"}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${autoRefresh ? "bg-emerald-500" : "bg-zinc-600"}`}></span>
                </span>
                <span className="text-xs font-semibold text-zinc-400 min-w-[85px]">
                  {autoRefresh ? `Ao vivo (${countdown}s)` : "Ao vivo pausado"}
                </span>
                
                {/* Botão Play/Pause */}
                <button
                  type="button"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors ml-1 p-0.5 cursor-pointer"
                  title={autoRefresh ? "Pausar atualização automática" : "Iniciar atualização automática"}
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
            )}

            {selectedAssets.length > 0 && (
              <button
                onClick={handleRefreshQuotes}
                disabled={loading}
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors px-3 py-1.5 rounded-xl border border-white/[0.06] hover:bg-white/[0.04] disabled:opacity-50 cursor-pointer"
                title="Atualizar cotações manualmente"
              >
                <svg
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {loading ? "Atualizando..." : "Atualizar"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ===== Main Content ===== */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 animate-fade-in">
          {/* ===== Left Panel: Watchlist & Controls ===== */}
          <div className="lg:col-span-5 space-y-5">
            {/* Search */}
            <div className="section-card">
              <AssetSearch
                selectedTickers={selectedAssets.map((a) => a.ticker)}
                onSelect={handleAddAsset}
              />
            </div>

            {/* Selected Assets List */}
            <div className="section-card">
              <SelectedAssets
                assets={assetsWithQuotes}
                onReorder={handleReorder}
                onRemove={handleRemoveAsset}
                loading={loading}
              />
            </div>

            {/* Theme Picker */}
            <div className="section-card">
              <GradientPicker
                selectedId={selectedGradient.id}
                onSelect={handleSelectGradient}
              />
            </div>

            {/* Go to Exporter Button */}
            <button
              onClick={handleGoToShare}
              disabled={selectedAssets.length === 0}
              className="btn-primary w-full flex items-center justify-center gap-3 text-base cursor-pointer disabled:opacity-50"
            >
              <span>Personalizar e Exportar Card</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>

          {/* ===== Right Panel: Monitor Dashboard View ===== */}
          <div className="lg:col-span-7">
            <div className="lg:sticky lg:top-8">
              <CardPreview
                assets={assetsWithQuotes}
                gradient={selectedGradient}
                showFooter={showFooter}
                footerText={footerText}
                format="vertical" // Dashboard de consulta é vertical por padrão
              />
            </div>
          </div>
        </div>
      </main>

      {/* ===== Footer ===== */}
      <footer className="border-t border-white/[0.04] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <p className="text-xs text-zinc-600">
            Cotações via Yahoo Finance · Uso pessoal
          </p>
          <p className="text-xs text-zinc-600">Market Cards v1.0</p>
        </div>
      </footer>
    </div>
  );
}
