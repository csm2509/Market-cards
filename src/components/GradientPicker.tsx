'use client';

import { GRADIENT_PRESETS, getGradientCSS } from '@/lib/gradients';

// ─── Props ──────────────────────────────────────────────────────────────────
interface GradientPickerProps {
  /** ID do gradiente atualmente selecionado */
  selectedId: string;
  /** Callback quando o usuário seleciona um gradiente */
  onSelect: (id: string) => void;
}

// ─── Componente ─────────────────────────────────────────────────────────────
export default function GradientPicker({ selectedId, onSelect }: GradientPickerProps) {
  return (
    <div>
      {/* ── Título da seção ──────────────────────────────────────────────── */}
      <h3 className="mb-3 text-sm font-semibold text-zinc-300">
        🎨 Tema do Card
      </h3>

      {/* ── Grid de thumbnails ───────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {GRADIENT_PRESETS.map((preset) => {
          const isSelected = preset.id === selectedId;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(preset.id)}
              className="group flex flex-col items-center"
            >
              {/* Thumbnail do gradiente */}
              <div
                className={`aspect-[16/10] w-full cursor-pointer rounded-lg
                           transition-all duration-200 ease-out
                           ${
                             isSelected
                               ? 'scale-105 ring-2 ring-indigo-500 ring-offset-2 ring-offset-zinc-950'
                               : 'hover:scale-[1.02] hover:shadow-lg'
                           }`}
                style={{ background: getGradientCSS(preset) }}
              />

              {/* Nome do gradiente */}
              <span
                className={`mt-1 w-full truncate text-center text-xs
                           transition-colors duration-200
                           ${isSelected ? 'text-indigo-400' : 'text-zinc-500'}`}
              >
                {preset.nome}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
