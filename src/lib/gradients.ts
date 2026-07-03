import { GradientPreset } from "./types";

/**
 * Gradientes pré-definidos para o card de mercado.
 * 12 opções variadas para uso no dia a dia.
 */
export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    id: "obsidian",
    nome: "Obsidian",
    colors: ["#0a0a0f", "#1a1a2e", "#16213e"],
    direction: "135deg",
  },
  {
    id: "deep-ocean",
    nome: "Oceano Profundo",
    colors: ["#0c1445", "#1a237e", "#283593"],
    direction: "135deg",
  },
  {
    id: "midnight-purple",
    nome: "Púrpura Noturna",
    colors: ["#1a0a2e", "#2d1b69", "#4a1a8a"],
    direction: "135deg",
  },
  {
    id: "emerald",
    nome: "Esmeralda",
    colors: ["#0a1f0a", "#1b4332", "#2d6a4f"],
    direction: "135deg",
  },
  {
    id: "carbon",
    nome: "Carbono",
    colors: ["#0f0f0f", "#1c1c1c", "#2a2a2a"],
    direction: "180deg",
  },
  {
    id: "arctic",
    nome: "Ártico",
    colors: ["#0f172a", "#1e293b", "#334155"],
    direction: "135deg",
  },
  {
    id: "royal-blue",
    nome: "Azul Royal",
    colors: ["#0a1628", "#162850", "#1e3a78"],
    direction: "150deg",
  },
  {
    id: "burgundy",
    nome: "Borgonha",
    colors: ["#1a0a0a", "#3d0c0c", "#5c1a1a"],
    direction: "135deg",
  },
  {
    id: "teal-night",
    nome: "Noite Teal",
    colors: ["#0a1a1a", "#0d3b3b", "#115e5e"],
    direction: "135deg",
  },
  {
    id: "warm-earth",
    nome: "Terra Quente",
    colors: ["#1a0f00", "#3d2200", "#5c3a10"],
    direction: "135deg",
  },
  {
    id: "sapphire",
    nome: "Safira",
    colors: ["#0a0a2e", "#141452", "#1e1e7a"],
    direction: "160deg",
  },
  {
    id: "charcoal-rose",
    nome: "Rosa Carvão",
    colors: ["#1a0a14", "#2e1528", "#4a1942"],
    direction: "135deg",
  },
];

/** Gera a string CSS do gradiente */
export function getGradientCSS(preset: GradientPreset): string {
  const dir = preset.direction || "135deg";
  return `linear-gradient(${dir}, ${preset.colors.join(", ")})`;
}
