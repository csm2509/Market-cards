"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toPng } from "html-to-image";
import type { SelectedAsset, ExportFormat, GradientPreset } from "@/lib/types";
import { EXPORT_DIMENSIONS } from "@/lib/types";
import { GRADIENT_PRESETS } from "@/lib/gradients";
import { useQuotes } from "@/hooks/useQuotes";

import AssetSearch from "@/components/AssetSearch";
import SelectedAssets from "@/components/SelectedAssets";
import GradientPicker from "@/components/GradientPicker";
import FooterToggle from "@/components/FooterToggle";
import CardPreview from "@/components/CardPreview";
import CardTemplate from "@/components/CardTemplate";

export default function HomePage() {
  // --- State ---
  const [selectedAssets, setSelectedAssets] = useState<SelectedAsset[]>([]);
  const [selectedGradient, setSelectedGradient] = useState<GradientPreset>(
    GRADIENT_PRESETS[0]
  );
  const [showFooter, setShowFooter] = useState(true);
  const [footerText, setFooterText] = useState("Giovanna Crescitelli");
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("horizontal");

  // --- Refs ---
  const cardRef = useRef<HTMLDivElement>(null);

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
        id: `${asset.ticker}-${Date.now()}`,
        nome: asset.nome,
        ticker: asset.ticker,
        categoria: asset.categoria,
      };
      setSelectedAssets((prev) => [...prev, newAsset]);

      // Fetch quote for the new asset
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

  const handleSelectGradient = useCallback(
    (id: string) => {
      const preset = GRADIENT_PRESETS.find((g) => g.id === id);
      if (preset) setSelectedGradient(preset);
    },
    []
  );

  const handleRefreshQuotes = useCallback(() => {
    const tickers = selectedAssets.map((a) => a.ticker);
    if (tickers.length > 0) fetchQuotes(tickers);
  }, [selectedAssets, fetchQuotes]);

  // --- Export ---
  const handleExport = useCallback(
    async () => {
      setExporting(true);

      // Small delay to let the CardTemplate render
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

        // Download
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
    },
    [exportFormat]
  );

  // Fetch all quotes on initial load when assets change
  useEffect(() => {
    // Only fetch if we have assets without quotes
    const tickersWithoutQuotes = selectedAssets
      .filter((a) => !quotes.has(a.ticker))
      .map((a) => a.ticker);
    if (tickersWithoutQuotes.length > 0) {
      fetchQuotes(tickersWithoutQuotes);
    }
  }, [selectedAssets, quotes, fetchQuotes]);

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
              Market Cards
            </h1>
            <p className="text-zinc-500 text-sm mt-1 ml-12">
              Gerador de cards de fechamento de mercado
            </p>
          </div>
          {selectedAssets.length > 0 && (
            <button
              onClick={handleRefreshQuotes}
              disabled={loading}
              className="hidden sm:flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors px-3 py-2 rounded-lg hover:bg-white/[0.04]"
              title="Atualizar cotações"
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
      </header>

      {/* ===== Main Content ===== */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* ===== Left Panel: Controls ===== */}
          <div className="lg:col-span-5 space-y-5 animate-slide-up">
            {/* Search */}
            <div className="section-card">
              <AssetSearch
                selectedTickers={selectedAssets.map((a) => a.ticker)}
                onSelect={handleAddAsset}
              />
            </div>

            {/* Selected Assets */}
            <div className="section-card">
              <SelectedAssets
                assets={assetsWithQuotes}
                onReorder={handleReorder}
                onRemove={handleRemoveAsset}
                loading={loading}
              />
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

            {/* Generate Button */}
            <button
              onClick={handleExport}
              disabled={selectedAssets.length === 0 || loading || exporting}
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
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Gerar e Baixar Imagem
                </>
              )}
            </button>
          </div>

          {/* ===== Right Panel: Preview ===== */}
          <div
            className="lg:col-span-7 animate-slide-up"
            style={{ animationDelay: "100ms" }}
          >
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
