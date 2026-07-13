/** Dados de cotação retornados pela API */
export interface QuoteData {
  ticker: string;
  price: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  changePercentWeekly: number | null;
  currency: string;
  marketTime: string | null;
  shortName: string | null;
}

/** Ativo selecionado na interface (com dados de cotação carregados) */
export interface SelectedAsset {
  id: string;
  nome: string;
  ticker: string;
  categoria: string;
  quote?: QuoteData;
}

/** Formato de exportação da imagem */
export type ExportFormat = "horizontal" | "vertical";

/** Dimensões de cada formato de exportação */
export const EXPORT_DIMENSIONS: Record<ExportFormat, { width: number; height: number; label: string; description: string }> = {
  horizontal: {
    width: 1200,
    height: 630,
    label: "Horizontal",
    description: "Ideal para LinkedIn e Twitter",
  },
  vertical: {
    width: 1080,
    height: 1920,
    label: "Vertical",
    description: "Ideal para WhatsApp Status e Stories",
  },
};

/** Definição de um gradiente pré-definido */
export interface GradientPreset {
  id: string;
  nome: string;
  colors: string[];
  direction?: string;
}

/** Resposta da API de cotações */
export interface QuotesApiResponse {
  quotes: QuoteData[];
  errors: { ticker: string; message: string }[];
}
