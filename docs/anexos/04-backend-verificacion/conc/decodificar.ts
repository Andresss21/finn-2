import Papa from 'papaparse';
export type Codificacion = 'utf-8' | 'windows-1252';
export function decodificar(bytes: Uint8Array): { texto: string; codificacion: Codificacion; bom: boolean } {
  const bom = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
  try {
    const texto = new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes);
    return { texto, codificacion: 'utf-8', bom };
  } catch {
    return { texto: new TextDecoder('windows-1252').decode(bytes), codificacion: 'windows-1252', bom: false };
  }
}
export const leerCsv = (texto: string) => Papa.parse<string[]>(texto, { skipEmptyLines: 'greedy', delimiter: '' });
