'use server';
const aprobados: { movimientoId: string; categoriaId: string }[] = [];
export async function aprobarConCategoria(e: { movimientoId: string; categoriaId: string }) {
  aprobados.push(e);
  return { ok: true as const, aprobado: e };
}
export async function aprobadosHastaAhora() { return aprobados.slice(); }
