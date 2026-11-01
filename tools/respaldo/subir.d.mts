export type Salida = { status: number | null; salida: string };
export type Deps = {
  ahora: () => Date;
  log: (linea: string) => void;
  correr: (cmd: string, args: string[], entorno?: Record<string, string>) => Salida;
  consultar: (url: string, sql: string) => Promise<string[]>;
  c5: (url: string) => Promise<string[]>;
  c6: (url: string) => Promise<string[]>;
  pedir: (url: string, init: RequestInit) => Promise<{ ok: boolean; status: number }>;
};
export const REQUERIDAS: Record<string, string[]>;
export function depsReales(): Deps;
export function claves(ahora: Date): string[];
export function ejecutar(
  sub: string,
  env: Record<string, string | undefined>,
  d?: Deps,
): Promise<number>;
