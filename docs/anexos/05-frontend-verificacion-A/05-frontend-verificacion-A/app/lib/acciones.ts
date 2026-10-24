'use server';
import { revalidatePath } from 'next/cache';
import { estado, huella, esperar } from './estado';
import type { ResultadoAccion } from './tipos';

// Simula una operación de valor absoluto (OP-14) con AV-11: requiere confirmación si deja LPA < 0.
export async function asignar(e: { montoNuevo: number; esperado: number; revisionVista?: string; huellaImpacto?: string; demoraMs?: number })
  : Promise<ResultadoAccion<{ asignado: number }>> {
  estado.llamadas.push(`asignarX:${e.montoNuevo}:${e.huellaImpacto ? 'con_huella' : 'sin_huella'}`);
  if (e.demoraMs) await esperar(e.demoraMs);
  if (estado.asignado === e.montoNuevo) return { ok: true, valor: { asignado: estado.asignado }, yaAplicada: true };
  if (estado.asignado !== e.esperado)
    return { ok: false, error: { categoria: 'CONFLICTO', codigo: 'conflicto_desactualizado', mensaje: 'Este valor cambió mientras lo editabas.', datos: { actual: estado.asignado } } };
  const deltaLpa = -(e.montoNuevo - estado.asignado);
  if (estado.lpa + deltaLpa < 0) {
    const impacto = { deltaLpa };
    const h = huella(impacto);
    if (e.huellaImpacto !== h)
      return { ok: false, error: { categoria: 'REQUIERE_CONFIRMACION', codigo: 'AV-11', mensaje: 'Listo para asignar quedará negativo.',
        previsualizacion: { revisionVista: String(estado.revision), huellaImpacto: h, impacto } } };
  }
  estado.lpa += deltaLpa; estado.asignado = e.montoNuevo; estado.revision++;
  revalidatePath('/', 'layout');
  return { ok: true, valor: { asignado: estado.asignado }, yaAplicada: false };
}

// Simula una creación idempotente por id (4.6.1). fallo: 'ocupado' | 'incierto' hace que el primer intento falle.
export async function crear(e: { id: string; monto: number; fallo?: 'ocupado' | 'incierto' })
  : Promise<ResultadoAccion<{ id: string }>> {
  estado.llamadas.push(`crear:${e.id}:${e.monto}`);
  if (!/^[0-9a-f-]{36}$/.test(e.id)) return { ok: false, error: { categoria: 'VALIDACION', codigo: 'uuid', mensaje: 'id inválido' } };
  const previo = estado.creadas.get(e.id);
  if (previo !== undefined) return previo === e.monto
    ? { ok: true, valor: { id: e.id }, yaAplicada: true }
    : { ok: false, error: { categoria: 'CONFLICTO', codigo: 'conflicto_id', mensaje: 'Ya existe con datos distintos.' } };
  const clave = `${e.fallo}:${e.id}`;
  if (e.fallo === 'ocupado' && !estado.fallos[clave]) { estado.fallos[clave] = 1; return { ok: false, error: { categoria: 'OCUPADO', codigo: '55P03', mensaje: 'Ocupado' } }; }
  estado.creadas.set(e.id, e.monto); estado.revision++;
  revalidatePath('/', 'layout');
  if (e.fallo === 'incierto' && !estado.fallos[clave]) { estado.fallos[clave] = 1; return { ok: false, error: { categoria: 'INCIERTO', codigo: 'commit', mensaje: 'Incierto' } }; }
  return { ok: true, valor: { id: e.id }, yaAplicada: false };
}

// Lectura de solo lectura (CP-3): sugerencia con demora variable, para probar el descarte de respuestas viejas.
export async function sugerir(e: { comercio: string; demoraMs: number }): Promise<ResultadoAccion<{ para: string }>> {
  estado.llamadas.push(`sugerir:${e.comercio}`);
  await esperar(e.demoraMs);
  return { ok: true, valor: { para: e.comercio }, yaAplicada: false };
}
