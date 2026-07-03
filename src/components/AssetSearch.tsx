'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ASSETS, type AssetConfig } from '@/config/assets';

// ─── Props ──────────────────────────────────────────────────────────────────
interface AssetSearchProps {
  /** Tickers que já foram selecionados (aparecem desabilitados na lista) */
  selectedTickers: string[];
  /** Callback quando o usuário clica em um ativo */
  onSelect: (asset: { nome: string; ticker: string; categoria: string }) => void;
}

// ─── Componente ─────────────────────────────────────────────────────────────
export default function AssetSearch({ selectedTickers, onSelect }: AssetSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Filtrar ativos com base na busca ────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return [];

    return ASSETS.filter(
      (a) =>
        a.nome.toLowerCase().includes(q) ||
        a.nomeEn.toLowerCase().includes(q) ||
        a.ticker.toLowerCase().includes(q),
    );
  }, [query]);

  // ── Agrupar resultados por categoria ────────────────────────────────────
  const grouped = useMemo(() => {
    const map = new Map<string, AssetConfig[]>();

    for (const asset of filtered) {
      const list = map.get(asset.categoria) ?? [];
      list.push(asset);
      map.set(asset.categoria, list);
    }

    return map;
  }, [filtered]);

  // ── Selecionar ativo ────────────────────────────────────────────────────
  const handleSelect = useCallback(
    (asset: AssetConfig) => {
      // Ignora clique em ativo já selecionado
      if (selectedTickers.includes(asset.ticker)) return;

      onSelect({ nome: asset.nome, ticker: asset.ticker, categoria: asset.categoria });
      setQuery('');
      setIsOpen(false);
      inputRef.current?.blur();
    },
    [selectedTickers, onSelect],
  );

  // ── Fechar dropdown ao clicar fora ──────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Fechar dropdown com Escape ──────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Abrir dropdown quando há texto digitado
  useEffect(() => {
    setIsOpen(query.trim().length > 0);
  }, [query]);

  const showDropdown = isOpen && filtered.length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* ── Campo de busca ───────────────────────────────────────────────── */}
      <div className="relative">
        {/* Ícone de busca (inline SVG) */}
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          placeholder="Buscar ativo... (ex: trigo, soja, WTI)"
          className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] py-3 pl-10 pr-4
                     text-zinc-50 placeholder-zinc-500
                     transition-all duration-200 ease-out
                     focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
      </div>

      {/* ── Dropdown de resultados ───────────────────────────────────────── */}
      <div
        className={`absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-white/[0.08]
                    bg-zinc-900/95 shadow-2xl backdrop-blur-xl
                    transition-all duration-200 ease-out
                    ${showDropdown ? 'max-h-64 opacity-100' : 'pointer-events-none max-h-0 opacity-0'}`}
      >
        <div className="max-h-64 overflow-y-auto">
          {Array.from(grouped.entries()).map(([categoria, assets]) => (
            <div key={categoria}>
              {/* Cabeçalho da categoria */}
              <div className="sticky top-0 bg-zinc-900/95 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 backdrop-blur-xl">
                {categoria}
              </div>

              {/* Itens da categoria */}
              {assets.map((asset) => {
                const isDisabled = selectedTickers.includes(asset.ticker);

                return (
                  <button
                    key={asset.ticker}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleSelect(asset)}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left
                               transition-colors duration-150
                               ${
                                 isDisabled
                                   ? 'cursor-not-allowed opacity-40 hover:bg-transparent'
                                   : 'cursor-pointer text-zinc-200 hover:bg-white/[0.06]'
                               }`}
                  >
                    <span className="truncate font-medium">{asset.nome}</span>
                    <span className="ml-3 shrink-0 text-xs text-zinc-500">{asset.ticker}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
