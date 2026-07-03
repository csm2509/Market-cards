"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { SelectedAsset, GradientPreset, EXPORT_DIMENSIONS } from "@/lib/types";
import CardTemplate from "./CardTemplate";

// ─── Props ───────────────────────────────────────────────────────────────────
interface CardPreviewProps {
  assets: SelectedAsset[];
  gradient: GradientPreset;
  showFooter: boolean;
  footerText: string;
}

// ─── Componente ──────────────────────────────────────────────────────────────
export default function CardPreview({
  assets,
  gradient,
  showFooter,
  footerText,
}: CardPreviewProps) {
  // Sempre usa o formato horizontal para o preview
  const dims = EXPORT_DIMENSIONS.horizontal;
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4); // valor inicial seguro

  // Calcula o fator de escala com base na largura do container
  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const newScale = containerWidth / dims.width;
    setScale(newScale);
  }, [dims.width]);

  // Observa mudanças de tamanho do container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Calcula escala inicial
    updateScale();

    const observer = new ResizeObserver(() => {
      updateScale();
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [updateScale]);

  // Altura escalada para manter a proporção
  const scaledHeight = dims.height * scale;

  return (
    <section>
      {/* Título da seção */}
      <h2 className="text-lg font-semibold text-zinc-50 mb-4 flex items-center gap-2">
        <span>👁️</span>
        Visualização
      </h2>

      {/* Container do preview */}
      <div
        ref={containerRef}
        className="relative bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden"
        style={{ height: scaledHeight || "auto" }}
      >
        {/* Label "Preview" */}
        <span className="absolute top-3 right-3 z-10 text-xs text-zinc-500 bg-zinc-900/80 px-2 py-0.5 rounded select-none">
          Preview
        </span>

        {/* Template escalado */}
        <div
          style={{
            width: dims.width,
            height: dims.height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
          className="transition-all duration-200 ease-out"
        >
          <CardTemplate
            assets={assets}
            gradient={gradient}
            showFooter={showFooter}
            footerText={footerText}
            format="horizontal"
          />
        </div>
      </div>
    </section>
  );
}
