/**
 * Lista configurável de ativos financeiros.
 *
 * Para adicionar um novo ativo, basta inserir uma nova entrada neste array.
 * Nenhuma outra alteração no código é necessária.
 */

export interface AssetConfig {
  /** Nome em português (exibido no card e na busca) */
  nome: string;
  /** Nome em inglês (usado na busca bilíngue) */
  nomeEn: string;
  /** Ticker do Yahoo Finance */
  ticker: string;
  /** Categoria para agrupamento visual */
  categoria: string;
}

export const ASSETS: AssetConfig[] = [
  // Energia
  { nome: "Petróleo WTI", nomeEn: "WTI Crude Oil", ticker: "CL=F", categoria: "Energia" },
  { nome: "Petróleo Brent", nomeEn: "Brent Crude Oil", ticker: "BZ=F", categoria: "Energia" },
  { nome: "Gás Natural", nomeEn: "Natural Gas", ticker: "NG=F", categoria: "Energia" },

  // Grãos
  { nome: "Milho", nomeEn: "Corn", ticker: "ZC=F", categoria: "Grãos" },
  { nome: "Trigo Chicago (SRW)", nomeEn: "Chicago Wheat SRW", ticker: "ZW=F", categoria: "Grãos" },
  { nome: "Trigo KC (HRW)", nomeEn: "KC Wheat HRW", ticker: "KE=F", categoria: "Grãos" },
  { nome: "Soja", nomeEn: "Soybean", ticker: "ZS=F", categoria: "Grãos" },
  { nome: "Farelo de Soja", nomeEn: "Soybean Meal", ticker: "ZM=F", categoria: "Grãos" },

  // Moedas
  { nome: "Índice do Dólar", nomeEn: "US Dollar Index", ticker: "DX-Y.NYB", categoria: "Moedas" },
];
