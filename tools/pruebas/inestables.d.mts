export interface Inestable {
  id: string;
  titulo: string;
  proyecto: string;
  traza: string | null;
}
export interface EntradaCuarentena {
  id: string;
  motivo: string;
  desde: string;
  vence: string;
}
export function flaky(informe: unknown): Inestable[];
export function fechas(textos: (string | null | undefined)[]): string[];
export function aCuarentena(
  cuarentena: EntradaCuarentena[],
  id: string,
  historial: string[],
  hoy: Date,
): EntradaCuarentena | null;
