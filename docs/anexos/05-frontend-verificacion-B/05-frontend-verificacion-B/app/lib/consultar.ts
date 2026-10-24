// Prototipo del envoltorio consultar() de 05 §7 (FE-28): traduce un ErrorFinn de una consulta
// al mecanismo de Next que corresponde.
import { headers } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import type { ErrorFinn } from './tipos';

export class ErrorConsulta extends Error {
  digest: string;
  constructor(public error: ErrorFinn & { idError?: string }) {
    super(error.codigo);
    this.digest = error.idError ?? 'E-SINREF';   // Next respeta un digest que ya trae el error
  }
}
export function rutaSegura(r: string | null): string {
  return r && r.startsWith('/') && !r.startsWith('//') && !r.startsWith('/\\') ? r : '/';
}
export async function consultar<T>(fn: () => Promise<{ ok: true; valor: T } | { ok: false; error: ErrorFinn & { idError?: string } }>): Promise<T> {
  const r = await fn();
  if (r.ok) return r.valor;
  const ruta = rutaSegura((await headers()).get('x-finn-ruta'));
  switch (r.error.categoria) {
    case 'NO_AUTORIZADO': redirect(`/ingresar?volver=${encodeURIComponent(ruta)}`);
    case 'NO_ENCONTRADO': notFound();
    default: throw new ErrorConsulta(r.error);
  }
}
