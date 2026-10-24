import Papa from 'papaparse';

export type ResultadoDecodificacion =
  { ok: true; texto: string; filas: string[][] } | { ok: false; error: 'archivo_pdf' };

const PDF = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"

/** 04 §9.3 (V-25): PDF, UTF-8 estricto (sin BOM), respaldo Windows-1252, PapaParse. */
export function decodificar(bytes: Uint8Array): ResultadoDecodificacion {
  if (PDF.every((b, i) => bytes[i] === b)) return { ok: false, error: 'archivo_pdf' };
  let texto: string;
  try {
    texto = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    texto = new TextDecoder('windows-1252').decode(bytes);
  }
  const { data } = Papa.parse<string[]>(texto, { skipEmptyLines: 'greedy', delimiter: '' });
  return { ok: true, texto, filas: data };
}
