// OP-07, variante en lote (CF-19; 04 §3.2): un `escribir()` por elemento, en orden y en serie, cada uno con su
// transacción. No es atómica en conjunto: un elemento que falla no detiene a los demás; si falla un grupo, las
// categorías de esta llamada que cuelgan de él responden con el mismo motivo y no se intentan.
import { errorDeValidacion, type ErrorFinn, type ResultadoAccion } from '../../errores/index.ts';
import { op07Lote, type SalidaOp07Lote } from '../../contratos/categorias.ts';
import { confirmar, type DepsMarco } from '../marco.ts';
import { OP07 } from './OP-07-crear.ts';

type Elemento = SalidaOp07Lote['elementos'][number];

export async function crearEnLote(
  cruda: unknown,
  deps: DepsMarco,
): Promise<ResultadoAccion<SalidaOp07Lote>> {
  const analizada = op07Lote.safeParse(cruda);
  if (!analizada.success) return { ok: false, error: errorDeValidacion(analizada.error.issues) };
  const gruposFallidos = new Map<string, ErrorFinn>();
  const elementos: Elemento[] = [];
  for (const e of analizada.data.elementos) {
    const heredado = e.tipo === 'categoria' ? gruposFallidos.get(e.grupoId) : undefined;
    if (heredado !== undefined) {
      elementos.push({ id: e.id, resultado: heredado });
      continue;
    }
    const r = await confirmar(OP07, e, deps);
    if (r.ok) elementos.push({ id: e.id, resultado: r.yaAplicada ? 'ya_aplicada' : 'creado' });
    else {
      if (e.tipo === 'grupo') gruposFallidos.set(e.id, r.error);
      elementos.push({ id: e.id, resultado: r.error });
    }
  }
  return { ok: true, valor: { elementos }, yaAplicada: false, avisos: [] };
}
