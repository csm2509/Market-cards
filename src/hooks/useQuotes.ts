"use client";

import { useState, useCallback } from "react";
import type { QuoteData, QuotesApiResponse } from "@/lib/types";

/**
 * Hook para buscar cotações via API Route interna.
 */
export function useQuotes() {
  const [quotes, setQuotes] = useState<Map<string, QuoteData>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotes = useCallback(async (tickers: string[]) => {
    if (tickers.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/quotes?tickers=${tickers.map(encodeURIComponent).join(",")}`
      );

      if (!response.ok) {
        throw new Error(`Erro ao buscar cotações: ${response.status}`);
      }

      const data: QuotesApiResponse = await response.json();

      setQuotes((prev) => {
        const next = new Map(prev);
        for (const quote of data.quotes) {
          next.set(quote.ticker, quote);
        }
        return next;
      });

      if (data.errors.length > 0) {
        console.warn("Erros em alguns tickers:", data.errors);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      console.error("Erro ao buscar cotações:", message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { quotes, loading, error, fetchQuotes };
}
