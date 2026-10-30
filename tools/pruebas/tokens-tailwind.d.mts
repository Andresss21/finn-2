export interface TokensJson {
  color: Record<string, unknown>;
  elevacion: Record<string, unknown>;
  otros: Record<string, string>;
  tipografia: Record<
    string,
    { fuente: string; tamano: string; interlineado: string; peso: number; extra: string }
  >;
}
export function generar(tokens: TokensJson): string;
