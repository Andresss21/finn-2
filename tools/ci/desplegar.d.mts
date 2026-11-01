import type { CorrerVercel, Entorno } from './barrera-1b.mjs';

export type Pasos = {
  migrar: () => Promise<void> | void;
  c5: () => Promise<string[]> | string[];
  c6: () => Promise<string[]> | string[];
  barrera: () => string[];
  vercelDeploy: () => void;
  etiquetar: () => Promise<void> | void;
};
export type Pedir = (url: string, init: RequestInit) => Promise<{ ok: boolean; status: number }>;
export type Log = (linea: string) => void;
export const REQUERIDAS: string[];
export function consultar(url: string, sql: string, Cliente?: unknown): Promise<string[]>;
export function nombreEtiqueta(env: Entorno): string;
export function pasosReales(env: Entorno, correr?: CorrerVercel, pedir?: Pedir, log?: Log): Pasos;
export function desplegar(env: Entorno, pasos: Pasos, log?: Log): Promise<number>;
export function principal(env: Entorno, pasos: Pasos, log?: Log): Promise<number>;
