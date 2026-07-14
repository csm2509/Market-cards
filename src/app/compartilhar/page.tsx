"use client";

import { useState, useCallback, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toPng } from "html-to-image";
import type { SelectedAsset, ExportFormat, GradientPreset } from "@/lib/types";
import { EXPORT_DIMENSIONS } from "@/lib/types";
import { GRADIENT_PRESETS } from "@/lib/gradients";
import { useQuotes } from "@/hooks/useQuotes";
import { ASSETS } from "@/config/assets";

import GradientPicker from "@/components/GradientPicker";
import FooterToggle from "@/components/FooterToggle";
import CardPreview from "@/components/CardPreview";
import CardTemplate from "@/components/CardTemplate";

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

function CompartilharContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // --- State ---
  const [selectedAssets, setSelectedAssets] = useState<SelectedAsset[]>([]);
  const [enabledTickers, setEnabledTickers] = useState<Record<string, boolean>>({});
  const [selectedGradient, setSelectedGradient] = useState<GradientPreset>(
    GRADIENT_PRESETS[0]
  );
  const [showFooter, setShowFooter] = useState(true);
  const [footerText, setFooterText] = useState("Giovanna Crescitelli");
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("horizontal");
  const [copied, setCopied] = useState(false);

  // --- Refs ---
  const cardRef = useRef<HTMLDivElement>(null);

  // --- Quotes ---
  const { quotes, loading, fetchQuotes } = useQuotes();

  // Filtra ativos que estão selecionados E ativos para o card final
  const activeAssets = selectedAssets.filter((asset) => enabledTickers[asset.ticker] !== false);
  
  const assetsWithQuotes: SelectedAsset[] = activeAssets.map((asset) => ({
    ...asset,
    quote: quotes.get(asset.ticker),
  }));

  // Inicializa dados com base nos query params da URL
  useEffect(() => {
    const tickersParam = searchParams.get("tickers");
    const gradientParam = searchParams.get("gradient");
    const footerParam = searchParams.get("footer");
    const textParam = paramsGet("text");

    // Função de fallback caso o Next params falhe
    function paramsGet(name: string) {
      if (typeof window === "undefined") return null;
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(name);
    }

    const finalTickersParam = tickersParam || paramsGet("tickers");
    const finalGradientParam = gradientParam || paramsGet("gradient");
    const finalFooterParam = footerParam || paramsGet("footer");
    const finalTextParam = textParam || paramsGet("text");

    if (finalTickersParam) {
      const tickers = finalTickersParam.split(",").map(t => t.trim()).filter(Boolean);
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

      // Ativa todos por padrão
      const initialEnabled: Record<string, boolean> = {};
      tickers.forEach((t) => {
        initialEnabled[t] = true;
      });
      setEnabledTickers(initialEnabled);

      fetchQuotes(tickers);
    }

    if (finalGradientParam) {
      const preset = GRADIENT_PRESETS.find((g) => g.id === finalGradientParam);
      if (preset) setSelectedGradient(preset);
    }

    if (finalFooterParam) {
      setShowFooter(finalFooterParam === "true");
    }

    if (finalTextParam) {
      setFooterText(finalTextParam);
    }
  }, [searchParams, fetchQuotes]);

  // --- Handlers ---
  const handleToggleTicker = (ticker: string) => {
    setEnabledTickers((prev) => ({
      ...prev,
      [ticker]: prev[ticker] === false ? true : false,
    }));
  };

  const moveAsset = (index: number, direction: "up" | "down") => {
    const newAssets = [...selectedAssets];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newAssets.length) return;
    
    // Swap
    const temp = newAssets[index];
    newAssets[index] = newAssets[targetIndex];
    newAssets[targetIndex] = temp;
    
    setSelectedAssets(newAssets);
  };

  const handleSelectGradient = useCallback((id: string) => {
    const preset = GRADIENT_PRESETS.find((g) => g.id === id);
    if (preset) setSelectedGradient(preset);
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    await new Promise((resolve) => setTimeout(resolve, 150));

    try {
      const node = cardRef.current;
      if (!node) throw new Error("Card não encontrado");

      const dims = EXPORT_DIMENSIONS[exportFormat];

      const dataUrl = await toPng(node, {
        width: dims.width,
        height: dims.height,
        pixelRatio: 2,
        cacheBust: true,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
        },
      });

      const link = document.createElement("a");
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      link.download = `market-card-${exportFormat}-${dateStr}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
      alert("Erro ao gerar a imagem. Tente novamente.");
    } finally {
      setExporting(false);
    }
  }, [exportFormat]);

  const handleCopyLink = () => {
    if (typeof window === "undefined") return;
    
    const params = new URLSearchParams();
    const activeTickers = selectedAssets
      .filter((a) => enabledTickers[a.ticker] !== false)
      .map((a) => a.ticker);

    if (activeTickers.length > 0) {
      params.set("tickers", activeTickers.join(","));
    }
    params.set("gradient", selectedGradient.id);
    params.set("footer", showFooter ? "true" : "false");
    if (footerText) {
      params.set("text", footerText);
    }

    // Link público para visualização limpa
    const shareUrl = `${window.location.origin}/compartilhar?${params.toString()}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleBackToDashboard = () => {
    // Retorna ao dashboard principal
    router.push("/");
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
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] transition-colors"
              >
                📈 Dashboard
              </Link>
              <Link
                href="/compartilhar"
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-white/[0.06] text-white border border-white/[0.08]"
              >
                🎴 Gerador de Cards
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* ===== Main Content ===== */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* ===== Left Column: Styles ===== */}
          <div className="lg:col-span-5 space-y-5">
            {/* Ticker Selector */}
            <div className="section-card">
              <h2 className="section-title">
                <span>📋</span>
                Ativos no Card
              </h2>
              <p className="text-xs text-zinc-500 mb-3">
                Selecione os ativos que deseja incluir e mude a ordem se necessário:
              </p>
              {selectedAssets.length === 0 ? (
                <p className="text-sm text-zinc-500 py-2">Nenhum ativo vindo do Dashboard.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedAssets.map((asset, index) => {
                    const isChecked = enabledTickers[asset.ticker] !== false;
                    return (
                      <div
                        key={asset.ticker}
                        className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl border transition-all
                          ${isChecked 
                            ? "border-indigo-500/30 bg-indigo-500/5 text-zinc-200" 
                            : "border-white/[0.04] bg-white/[0.01] text-zinc-500 opacity-60"
                          }`}
                      >
                        <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleTicker(asset.ticker)}
                            className="w-4 h-4 rounded text-indigo-600 bg-zinc-800 border-zinc-700 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate">{asset.nome}</div>
                            <div className="text-[10px] opacity-70">{asset.ticker}</div>
                          </div>
                        </label>

                        {/* Controles de Ordenação (Subir/Descer) */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => moveAsset(index, "up")}
                            disabled={index === 0}
                            className="p-1 rounded bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                            title="Mover para cima"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => moveAsset(index, "down")}
                            disabled={index === selectedAssets.length - 1}
                            className="p-1 rounded bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                            title="Mover para baixo"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Format Selector */}
            <div className="section-card">
              <h2 className="section-title">
                <span>📐</span>
                Formato do Card
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExportFormat("horizontal")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-200 cursor-pointer
                    ${
                      exportFormat === "horizontal"
                        ? "border-indigo-500 bg-indigo-500/10 text-zinc-100"
                        : "border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.04]"
                    }`}
                >
                  <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-semibold">Horizontal</span>
                  <span className="text-[10px] opacity-60">LinkedIn (1200x630)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat("vertical")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-200 cursor-pointer
                    ${
                      exportFormat === "vertical"
                        ? "border-indigo-500 bg-indigo-500/10 text-zinc-100"
                        : "border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.04]"
                    }`}
                >
                  <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-semibold">Vertical</span>
                  <span className="text-[10px] opacity-60">Status/Stories (1080x1920)</span>
                </button>
              </div>
            </div>

            {/* Gradient Picker */}
            <div className="section-card">
              <GradientPicker
                selectedId={selectedGradient.id}
                onSelect={handleSelectGradient}
              />
            </div>

            {/* Footer Toggle */}
            <div className="section-card">
              <FooterToggle
                enabled={showFooter}
                onToggle={setShowFooter}
                text={footerText}
                onTextChange={setFooterText}
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleExport}
                disabled={activeAssets.length === 0 || loading || exporting}
                className="btn-primary w-full flex items-center justify-center gap-3 text-base cursor-pointer disabled:opacity-50"
              >
                {exporting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Gerando Imagem...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Gerar e Baixar Imagem
                  </>
                )}
              </button>

              <button
                onClick={handleCopyLink}
                disabled={activeAssets.length === 0}
                className="w-full flex items-center justify-center gap-3 text-sm text-zinc-300 hover:text-zinc-100 transition-colors py-3 px-4 rounded-xl border border-white/[0.08] hover:bg-white/[0.02] cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                {copied ? "Link Copiado!" : "Copiar Link Configurado"}
              </button>
            </div>
          </div>

          {/* ===== Right Column: Preview ===== */}
          <div className="lg:col-span-7">
            <div className="lg:sticky lg:top-8">
              <CardPreview
                assets={assetsWithQuotes}
                gradient={selectedGradient}
                showFooter={showFooter}
                footerText={footerText}
                format={exportFormat}
              />
            </div>
          </div>
        </div>
      </main>

      {/* ===== Hidden Card Template for Image Generation ===== */}
      <div
        style={{
          position: "fixed",
          left: "-9999px",
          top: "-9999px",
          width: `${EXPORT_DIMENSIONS[exportFormat].width}px`,
          height: `${EXPORT_DIMENSIONS[exportFormat].height}px`,
          zIndex: -1,
          pointerEvents: "none",
        }}
      >
        <CardTemplate
          ref={cardRef}
          assets={assetsWithQuotes}
          gradient={selectedGradient}
          showFooter={showFooter}
          footerText={footerText}
          format={exportFormat}
        />
      </div>

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

export default function CompartilharPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-4" />
        Carregando designer...
      </div>
    }>
      <CompartilharContent />
    </Suspense>
  );
}
