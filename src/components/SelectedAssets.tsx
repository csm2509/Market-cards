"use client";

import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import type { SelectedAsset } from "@/lib/types";

// ─── Props ─────────────────────────────────────────────────────────────────────
interface SelectedAssetsProps {
  assets: SelectedAsset[];
  onReorder: (assets: SelectedAsset[]) => void;
  onRemove: (id: string) => void;
  loading: boolean;
}

// ─── Sortable Item ─────────────────────────────────────────────────────────────
interface SortableAssetItemProps {
  asset: SelectedAsset;
  onRemove: (id: string) => void;
  loading: boolean;
}

function SortableAssetItem({ asset, onRemove, loading }: SortableAssetItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: asset.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  /** Formata o preço com o símbolo da moeda */
  const formatPrice = (price: number | null, currency: string): string => {
    if (price === null) return "—";
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: currency || "BRL",
      minimumFractionDigits: 2,
    });
  };

  /** Formata a variação percentual */
  const formatChangePercent = (changePercent: number | null): string => {
    if (changePercent === null) return "";
    const sign = changePercent >= 0 ? "+" : "";
    return `${sign}${changePercent.toFixed(2)}%`;
  };

  const quote = asset.quote;
  const isPositive = quote?.changePercent != null && quote.changePercent >= 0;
  const isNegative = quote?.changePercent != null && quote.changePercent < 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3
        flex items-center gap-3 transition-all duration-200 ease-out
        ${isDragging ? "opacity-50 shadow-lg scale-[1.02] z-10" : ""}
      `}
    >
      {/* ── Grip Handle ─────────────────────────────────────────── */}
      <button
        {...attributes}
        {...listeners}
        className="text-zinc-600 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        aria-label="Arrastar para reordenar"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 6-dot grip icon (2×3) */}
          <circle cx="5" cy="3" r="1.5" />
          <circle cx="11" cy="3" r="1.5" />
          <circle cx="5" cy="8" r="1.5" />
          <circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="13" r="1.5" />
          <circle cx="11" cy="13" r="1.5" />
        </svg>
      </button>

      {/* ── Asset Info ──────────────────────────────────────────── */}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-zinc-100 font-medium text-sm truncate">
          {asset.nome}
        </span>
        <span className="text-zinc-500 text-xs">{asset.ticker}</span>
      </div>

      {/* ── Price & Change ─────────────────────────────────────── */}
      <div className="flex flex-col items-end flex-shrink-0 ml-auto">
        {loading ? (
          /* Pulse skeleton enquanto carrega */
          <div className="flex flex-col items-end gap-1">
            <div className="h-4 w-20 bg-white/[0.06] rounded animate-pulse" />
            <div className="h-3 w-14 bg-white/[0.06] rounded animate-pulse" />
          </div>
        ) : quote ? (
          <>
            <span className="text-zinc-100 font-mono text-sm">
              {formatPrice(quote.price, quote.currency)}
            </span>
            {quote.changePercent !== null && (
              <span
                className={`text-xs font-medium ${
                  isPositive ? "text-green-400" : isNegative ? "text-red-400" : "text-zinc-400"
                }`}
              >
                {isPositive && "▲ "}
                {isNegative && "▼ "}
                {formatChangePercent(quote.changePercent)}
              </span>
            )}
          </>
        ) : null}
      </div>

      {/* ── Remove Button ──────────────────────────────────────── */}
      <button
        onClick={() => onRemove(asset.id)}
        className="text-zinc-600 hover:text-red-400 transition-colors flex-shrink-0 p-1 rounded-lg hover:bg-white/[0.04]"
        aria-label={`Remover ${asset.nome}`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line x1="4" y1="4" x2="12" y2="12" />
          <line x1="12" y1="4" x2="4" y2="12" />
        </svg>
      </button>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function SelectedAssets({
  assets,
  onReorder,
  onRemove,
  loading,
}: SelectedAssetsProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /** Callback ao finalizar o arraste — reordena a lista via arrayMove */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = assets.findIndex((a) => a.id === active.id);
    const newIndex = assets.findIndex((a) => a.id === over.id);
    onReorder(arrayMove(assets, oldIndex, newIndex));
  };

  return (
    <section>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-zinc-100 text-sm font-semibold tracking-wide">
          📋 Ativos Selecionados
        </h2>
        <span className="bg-white/[0.06] text-zinc-400 text-xs font-medium px-2 py-0.5 rounded-full">
          {assets.length}
        </span>
      </div>

      {/* ── Lista ou Estado Vazio ───────────────────────────────── */}
      {assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          {/* Ícone sutil de lista vazia */}
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-zinc-700 mb-3"
          >
            <rect
              x="6"
              y="8"
              width="28"
              height="24"
              rx="4"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <line x1="12" y1="16" x2="28" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="12" y1="21" x2="24" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="12" y1="26" x2="20" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="text-zinc-500 text-sm">
            Selecione ativos acima para começar
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={assets.map((a) => a.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {assets.map((asset) => (
                <SortableAssetItem
                  key={asset.id}
                  asset={asset}
                  onRemove={onRemove}
                  loading={loading}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}
