import { NextRequest, NextResponse } from "next/server";

/**
 * API Route para buscar cotações de múltiplos ativos.
 * Usa fetch direto ao Yahoo Finance para evitar CORS.
 *
 * GET /api/quotes?tickers=CL=F,ZW=F,ZS=F
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tickersParam = searchParams.get("tickers");

  if (!tickersParam) {
    return NextResponse.json(
      { error: "Parâmetro 'tickers' é obrigatório" },
      { status: 400 }
    );
  }

  const tickers = tickersParam.split(",").map((t) => t.trim()).filter(Boolean);

  if (tickers.length === 0) {
    return NextResponse.json(
      { error: "Nenhum ticker válido fornecido" },
      { status: 400 }
    );
  }

  if (tickers.length > 20) {
    return NextResponse.json(
      { error: "Máximo de 20 tickers por requisição" },
      { status: 400 }
    );
  }

  const quotes = [];
  const errors = [];

  for (const ticker of tickers) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=10d&interval=1d&includePrePost=false`;

      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        next: { revalidate: 60 }, // Cache por 60 segundos
      });

      if (!response.ok) {
        throw new Error(`Yahoo Finance retornou status ${response.status}`);
      }

      const data = await response.json();
      const result = data?.chart?.result?.[0];

      if (!result) {
        throw new Error("Nenhum resultado encontrado");
      }

      const meta = result.meta;
      const currentPrice = meta.regularMarketPrice;
      const previousClose =
        meta.previousClose ?? meta.chartPreviousClose ?? null;

      let changePercent: number | null = null;
      let change: number | null = null;

      if (previousClose && currentPrice) {
        change = parseFloat((currentPrice - previousClose).toFixed(4));
        changePercent = parseFloat(
          (((currentPrice - previousClose) / previousClose) * 100).toFixed(2)
        );
      }

      // Cálculo da variação semanal (comparação com 5 dias úteis atrás)
      const closePrices = result.indicators?.quote?.[0]?.close || [];
      const validCloses = closePrices.filter((val: any) => val !== null) as number[];
      const L = validCloses.length;
      
      let changePercentWeekly: number | null = null;
      if (L > 0 && currentPrice) {
        // Se temos pelo menos 6 dias de dados, o dia de 1 semana atrás (5 dias úteis) está no índice L - 6.
        // Caso contrário, usamos o preço mais antigo disponível.
        const price5DaysAgo = L >= 6 ? validCloses[L - 6] : validCloses[0];
        if (price5DaysAgo) {
          changePercentWeekly = parseFloat(
            (((currentPrice - price5DaysAgo) / price5DaysAgo) * 100).toFixed(2)
          );
        }
      }

      const marketTime = meta.regularMarketTime
        ? new Date(meta.regularMarketTime * 1000).toISOString()
        : null;

      quotes.push({
        ticker: meta.symbol || ticker,
        price: currentPrice ?? null,
        previousClose,
        change,
        changePercent,
        changePercentWeekly,
        currency: meta.currency ?? "USD",
        marketTime,
        shortName: meta.shortName ?? meta.longName ?? null,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.error(`Erro ao buscar cotação de ${ticker}:`, message);
      errors.push({ ticker, message });
    }
  }

  return NextResponse.json({ quotes, errors });
}
