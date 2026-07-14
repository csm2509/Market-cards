"use client";

import React from "react";
import { SelectedAsset, GradientPreset, ExportFormat, EXPORT_DIMENSIONS } from "@/lib/types";
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
// ... [rest of helpers code remains unchanged] ...
// (We are replacing up to the component principal return)

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

/** Formata variação com rótulo, seta, cores e estilos de badge */
function formatChangeValue(val: number | null | undefined, label: string) {
  if (val == null) {
    return {
      text: `${label} —`,
      color: "rgba(255,255,255,0.4)",
      bg: "rgba(255, 255, 255, 0.03)",
      border: "rgba(255, 255, 255, 0.06)",
    };
  }
  
  if (val > 0) {
    return {
      text: `${label} ▲ ${val.toFixed(2)}%`,
      color: "#22c55e", // green-500
      bg: "rgba(34, 197, 94, 0.12)",
      border: "rgba(34, 197, 94, 0.22)",
    };
  } else if (val < 0) {
    return {
      text: `${label} ▼ ${Math.abs(val).toFixed(2)}%`,
      color: "#ef4444", // red-500
      bg: "rgba(239, 68, 68, 0.12)",
      border: "rgba(239, 68, 68, 0.22)",
    };
  } else {
    return {
      text: `${label} 0.00%`,
      color: "rgba(255,255,255,0.6)",
      bg: "rgba(255, 255, 255, 0.05)",
      border: "rgba(255, 255, 255, 0.1)",
    };
  }
}

// ─── Tamanhos por formato ────────────────────────────────────────────────────
const SIZES = {
  horizontal: {
    paddingX: 48,
    paddingY: 36,
    titleSize: 22,
    dateSize: 14,
    assetNameSize: 18,
    priceSize: 18,
    changeSize: 15,
    footerSize: 12,
    rowGap: 14,
    sectionGap: 22,
    separatorMargin: 18,
    iconSize: 24,
  },
  vertical: {
    paddingX: 56,
    paddingY: 64,
    titleSize: 34,
    dateSize: 20,
    assetNameSize: 26,
    priceSize: 26,
    changeSize: 21,
    footerSize: 16,
    rowGap: 26,
    sectionGap: 40,
    separatorMargin: 30,
    iconSize: 32,
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
    const dims = EXPORT_DIMENSIONS[format];
    const gradientCSS = getGradientCSS(gradient);

    return (
      <div
        ref={ref}
        style={{
          width: `${dims.width}px`,
          height: `${dims.height}px`,
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
              const daily = formatChangeValue(quote?.changePercent, "1D");
              const weekly = formatChangeValue(quote?.changePercentWeekly, "1S");

              return (
                <div
                  key={asset.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "rgba(0, 0, 0, 0.2)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: format === "vertical" ? "16px" : "12px",
                    padding: format === "vertical" ? "18px 24px" : "10px 16px",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  {/* Nome do ativo */}
                  <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, marginRight: 16 }}>
                    <span
                      style={{
                        fontSize: s.assetNameSize,
                        fontWeight: 600,
                        color: "#ffffff",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {asset.nome}
                    </span>
                    <span
                      style={{
                        fontSize: s.assetNameSize - (format === "vertical" ? 6 : 4),
                        color: "rgba(255, 255, 255, 0.4)",
                        fontWeight: 500,
                        marginTop: 2,
                      }}
                    >
                      {asset.ticker}
                    </span>
                  </div>

                  {/* Preço + variação */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: format === "vertical" ? 20 : 14,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: s.priceSize + (format === "vertical" ? 2 : 1),
                        fontWeight: 700,
                        color: "#ffffff",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatPrice(price, currency)}
                    </span>
                    <span
                      style={{
                        fontSize: s.changeSize,
                        fontWeight: 700,
                        color: daily.color,
                        background: daily.bg,
                        border: `1px solid ${daily.border}`,
                        borderRadius: "8px",
                        padding: format === "vertical" ? "6px 12px" : "4px 8px",
                        minWidth: format === "vertical" ? "105px" : "85px",
                        textAlign: "center",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {daily.text}
                    </span>
                    <span
                      style={{
                        fontSize: s.changeSize,
                        fontWeight: 700,
                        color: weekly.color,
                        background: weekly.bg,
                        border: `1px solid ${weekly.border}`,
                        borderRadius: "8px",
                        padding: format === "vertical" ? "6px 12px" : "4px 8px",
                        minWidth: format === "vertical" ? "105px" : "85px",
                        textAlign: "center",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {weekly.text}
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
