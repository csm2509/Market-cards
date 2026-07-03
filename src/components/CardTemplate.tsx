"use client";

import React from "react";
import { SelectedAsset, GradientPreset, ExportFormat } from "@/lib/types";
import { getGradientCSS } from "@/lib/gradients";

// ─── Props ───────────────────────────────────────────────────────────────────
interface CardTemplateProps {
  assets: SelectedAsset[];
  gradient: GradientPreset;
  showFooter: boolean;
  footerText: string;
  format: ExportFormat;
  date?: string; // ISO date string – padrão: hoje
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Formata a data em português: 'Quinta-feira, 03 de Julho de 2026' */
function formatDatePtBR(isoDate?: string): string {
  const d = isoDate ? new Date(isoDate) : new Date();
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  // Capitaliza a primeira letra do dia da semana
  const formatted = formatter.format(d);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/** Retorna símbolo de moeda adequado */
function currencySymbol(currency: string): string {
  const map: Record<string, string> = {
    USD: "$",
    BRL: "R$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    USd: "¢", // centavos (ex: trigo/soja em bushel)
  };
  return map[currency] || currency + " ";
}

/** Formata preço com separador de milhares e 2 decimais */
function formatPrice(value: number | null | undefined, currency: string): string {
  if (value == null) return "—";
  const symbol = currencySymbol(currency);
  // Usa formato americano (vírgula para milhar, ponto para decimal)
  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}

/** Formata variação percentual com seta */
function formatChange(changePercent: number | null | undefined): {
  text: string;
  color: string;
} {
  if (changePercent == null || changePercent === 0) {
    return { text: "— 0.00%", color: "#a1a1aa" }; // zinc-400
  }
  if (changePercent > 0) {
    return { text: `▲ ${changePercent.toFixed(2)}%`, color: "#22c55e" }; // green-500
  }
  return { text: `▼ ${Math.abs(changePercent).toFixed(2)}%`, color: "#ef4444" }; // red-500
}

// ─── Tamanhos por formato ────────────────────────────────────────────────────
const SIZES = {
  horizontal: {
    paddingX: 48,
    paddingY: 36,
    titleSize: 18,
    dateSize: 13,
    assetNameSize: 15,
    priceSize: 15,
    changeSize: 14,
    footerSize: 11,
    rowGap: 14,
    sectionGap: 20,
    separatorMargin: 16,
    iconSize: 20,
  },
  vertical: {
    paddingX: 56,
    paddingY: 64,
    titleSize: 28,
    dateSize: 18,
    assetNameSize: 22,
    priceSize: 22,
    changeSize: 20,
    footerSize: 15,
    rowGap: 24,
    sectionGap: 36,
    separatorMargin: 28,
    iconSize: 28,
  },
} as const;

// ─── Ícone SVG de mini-gráfico ──────────────────────────────────────────────
function ChartIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.7)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <polyline points="22 12 18 8 13 13 9 9 2 16" />
      <polyline points="18 8 22 8 22 12" />
    </svg>
  );
}

// ─── Componente Principal ───────────────────────────────────────────────────
const CardTemplate = React.forwardRef<HTMLDivElement, CardTemplateProps>(
  ({ assets, gradient, showFooter, footerText, format, date }, ref) => {
    const s = SIZES[format];
    const gradientCSS = getGradientCSS(gradient);

    return (
      <div
        ref={ref}
        style={{
          width: "100%",
          height: "100%",
          background: gradientCSS,
          fontFamily: "'Inter', system-ui, sans-serif",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: `${s.paddingY}px ${s.paddingX}px`,
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Overlay sutil para profundidade */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.04) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />

        {/* Borda interna sutil (inner glow) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            boxShadow: "inset 0 0 80px rgba(0,0,0,0.3)",
            pointerEvents: "none",
          }}
        />

        {/* ── Conteúdo principal ── */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Header: ícone + título */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: format === "vertical" ? 8 : 4,
            }}
          >
            <ChartIcon size={s.iconSize} />
            <span
              style={{
                fontSize: s.titleSize,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.9)",
              }}
            >
              Fechamento de Mercado
            </span>
          </div>

          {/* Data */}
          <div
            style={{
              fontSize: s.dateSize,
              color: "rgba(255,255,255,0.5)",
              marginBottom: s.separatorMargin,
              paddingLeft: s.iconSize + 10, // alinha com o texto do título
            }}
          >
            {formatDatePtBR(date)}
          </div>

          {/* Separador superior */}
          <div
            style={{
              height: 1,
              background: "rgba(255,255,255,0.1)",
              marginBottom: s.sectionGap,
            }}
          />

          {/* Lista de ativos */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: s.rowGap,
            }}
          >
            {assets.map((asset) => {
              const quote = asset.quote;
              const price = quote?.price;
              const currency = quote?.currency || "USD";
              const change = formatChange(quote?.changePercent);

              return (
                <div
                  key={asset.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  {/* Nome do ativo */}
                  <span
                    style={{
                      fontSize: s.assetNameSize,
                      fontWeight: 500,
                      color: "rgba(255,255,255,0.95)",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginRight: 16,
                    }}
                  >
                    {asset.nome}
                  </span>

                  {/* Preço + variação */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: format === "vertical" ? 16 : 12,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: s.priceSize,
                        fontWeight: 600,
                        color: "rgba(255,255,255,0.9)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatPrice(price, currency)}
                    </span>
                    <span
                      style={{
                        fontSize: s.changeSize,
                        fontWeight: 600,
                        color: change.color,
                        minWidth: format === "vertical" ? 100 : 80,
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {change.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Separador inferior */}
          <div
            style={{
              height: 1,
              background: "rgba(255,255,255,0.1)",
              marginBottom: s.separatorMargin,
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {/* Fonte */}
            <span
              style={{
                fontSize: s.footerSize,
                color: "rgba(255,255,255,0.35)",
              }}
            >
              Fonte: Yahoo Finance
            </span>

            {/* Texto customizável do footer (nome da pessoa) */}
            {showFooter && footerText && (
              <span
                style={{
                  fontSize: s.footerSize + 2,
                  color: "rgba(255,255,255,0.45)",
                  fontWeight: 500,
                }}
              >
                {footerText}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
);

CardTemplate.displayName = "CardTemplate";

export default CardTemplate;
