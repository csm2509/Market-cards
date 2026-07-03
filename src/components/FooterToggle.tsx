'use client';

import React from 'react';

// ─── Props ──────────────────────────────────────────────────────────────────
interface FooterToggleProps {
  /** Se a assinatura está habilitada */
  enabled: boolean;
  /** Callback para alternar o estado */
  onToggle: (enabled: boolean) => void;
  /** Texto da assinatura */
  text: string;
  /** Callback para alterar o texto */
  onTextChange: (text: string) => void;
}

// ─── Componente ─────────────────────────────────────────────────────────────
export default function FooterToggle({ enabled, onToggle, text, onTextChange }: FooterToggleProps) {
  return (
    <div>
      {/* ── Título da seção ──────────────────────────────────────────────── */}
      <h3 className="mb-3 text-sm font-semibold text-zinc-300">
        👤 Assinatura
      </h3>

      {/* ── Linha do toggle ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-400">Incluir nome no card</span>

        {/* Toggle customizado */}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onToggle(!enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full
                     transition-colors duration-200 ease-out
                     focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-zinc-950
                     ${enabled ? 'bg-indigo-500' : 'bg-zinc-700'}`}
        >
          {/* Bolinha do toggle */}
          <span
            className={`pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full
                       bg-white shadow transition-transform duration-200 ease-out
                       ${enabled ? 'translate-x-[22px]' : 'translate-x-[2px]'}`}
          />
        </button>
      </div>

      {/* ── Campo de texto (aparece com animação ao habilitar) ────────────── */}
      <div
        className={`overflow-hidden transition-all duration-200 ease-out
                   ${enabled ? 'mt-3 max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <input
          type="text"
          value={text}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onTextChange(e.target.value)}
          placeholder="Giovanna Crescitelli"
          className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-2.5
                     text-sm text-zinc-50 placeholder-zinc-500
                     transition-all duration-200 ease-out
                     focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
      </div>
    </div>
  );
}
