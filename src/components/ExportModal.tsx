"use client";

import React, { useEffect, useState, useCallback } from "react";
import { EXPORT_DIMENSIONS, type ExportFormat } from "@/lib/types";

// ─── Props ─────────────────────────────────────────────────────────────────────
interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardRef: React.RefObject<HTMLDivElement | null>;
  onExport: (format: ExportFormat) => void;
  exporting: boolean;
}

// ─── Format Card Sub-Component ────────────────────────────────────────────────
interface FormatCardProps {
  format: ExportFormat;
  selected: boolean;
  exporting: boolean;
  onClick: () => void;
}

function FormatCard({ format, selected, exporting, onClick }: FormatCardProps) {
  const dim = EXPORT_DIMENSIONS[format];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={exporting}
      className={`
        w-full text-left rounded-xl p-6
        border transition-all duration-200 ease-out cursor-pointer
        ${
          selected
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-indigo-500/30"
        }
        disabled:cursor-not-allowed disabled:opacity-70
      `}
    >
      <div className="flex items-start gap-4">
        {/* ── Ícone do formato ─────────────────────────────────── */}
        <div className="flex-shrink-0 mt-0.5">
          {format === "horizontal" ? (
            /* Monitor icon */
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-zinc-300"
            >
              <rect
                x="3"
                y="5"
                width="26"
                height="17"
                rx="2.5"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <line
                x1="11"
                y1="26"
                x2="21"
                y2="26"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line
                x1="16"
                y1="22"
                x2="16"
                y2="26"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            /* Phone icon */
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-zinc-300"
            >
              <rect
                x="9"
                y="3"
                width="14"
                height="26"
                rx="3"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <line
                x1="14"
                y1="25"
                x2="18"
                y2="25"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>

        {/* ── Descrição ────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <h3 className="text-zinc-100 font-semibold text-sm mb-1">
            {dim.label}
          </h3>
          <p className="text-zinc-500 text-xs mb-2">{dim.description}</p>
          <span className="text-zinc-400 font-mono text-xs">
            {dim.width} × {dim.height}
          </span>
        </div>

        {/* ── Spinner quando está exportando neste formato ───── */}
        {exporting && selected && (
          <div className="flex-shrink-0 mt-1">
            <svg
              className="animate-spin h-5 w-5 text-indigo-400"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2.5"
                className="opacity-20"
              />
              <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ExportModal({
  isOpen,
  onClose,
  cardRef,
  onExport,
  exporting,
}: ExportModalProps) {
  // Formato selecionado para destacar o card ativo
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat | null>(null);
  // Controla a animação de entrada/saída
  const [visible, setVisible] = useState(false);

  // ── Animação de entrada ────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      // Pequeno delay para garantir a transição CSS
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      // Reseta a seleção ao fechar
      setSelectedFormat(null);
    }
  }, [isOpen]);

  // ── Fechar com Escape ──────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !exporting) {
        onClose();
      }
    },
    [onClose, exporting]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // ── Handler de clique no card de formato ────────────────────
  const handleFormatClick = (format: ExportFormat) => {
    setSelectedFormat(format);
    onExport(format);
  };

  // Não renderizar nada se não estiver aberto
  if (!isOpen) return null;

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        transition-all duration-300 ease-out
        ${visible ? "bg-black/60 backdrop-blur-sm" : "bg-black/0"}
      `}
      onClick={(e) => {
        // Fechar ao clicar no backdrop (não no modal)
        if (e.target === e.currentTarget && !exporting) {
          onClose();
        }
      }}
    >
      {/* ── Modal Card ─────────────────────────────────────────── */}
      <div
        className={`
          relative bg-zinc-900 border border-white/[0.08] rounded-2xl
          p-8 max-w-md w-full mx-4 shadow-2xl
          transition-all duration-300 ease-out
          ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Botão Fechar ───────────────────────────────────────── */}
        <button
          onClick={onClose}
          disabled={exporting}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200 transition-colors disabled:opacity-50 p-1 rounded-lg hover:bg-white/[0.04]"
          aria-label="Fechar modal"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line x1="4" y1="4" x2="14" y2="14" />
            <line x1="14" y1="4" x2="4" y2="14" />
          </svg>
        </button>

        {/* ── Título ─────────────────────────────────────────────── */}
        <h2 className="text-zinc-100 text-lg font-semibold mb-1">
          Exportar Card
        </h2>
        <p className="text-zinc-500 text-sm mb-6">
          Escolha o formato de exportação da imagem
        </p>

        {/* ── Cards de Formato ───────────────────────────────────── */}
        <div className="space-y-3">
          <FormatCard
            format="horizontal"
            selected={selectedFormat === "horizontal"}
            exporting={exporting}
            onClick={() => handleFormatClick("horizontal")}
          />
          <FormatCard
            format="vertical"
            selected={selectedFormat === "vertical"}
            exporting={exporting}
            onClick={() => handleFormatClick("vertical")}
          />
        </div>

        {/* ── Nota de rodapé ─────────────────────────────────────── */}
        <p className="text-zinc-600 text-xs text-center mt-6">
          A imagem será salva em formato PNG de alta qualidade
        </p>
      </div>
    </div>
  );
}
