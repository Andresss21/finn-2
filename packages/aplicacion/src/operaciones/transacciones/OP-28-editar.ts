// OP-28 Editar transacción (04 §3.4): valor absoluto (4.6.2). Cada campo que cambia trae el valor que vio la interfaz;
// bajo el bloqueo, todos en el valor nuevo es `ya_aplicada`, todos en el visto se aplica y cualquier otra mezcla es
// `conflicto_desactualizado` con los valores actuales. Las líneas se comparan como conjunto de `(monto, destino)`: una
// línea sin eventos que cambia se reemplaza con otro id (BE-16), así que el `lineaId` no sirve para reconocerla.
import { montoOriginalDe, type LectorTx } from '@finn/db';
import type { ComandoOp28, DecimalTexto, Hechos, Transaccion, Uuid } from '@finn/dominio';
import { CAMPOS_OP28, op28, type EntradaOp28 } from '../../contratos/transacciones.ts';
import type { DefinicionOperacion } from '../marco.ts';
import { decimal, destinoIds, forma, type DestinoEsperado } from './comunes.ts';

type Campo = (typeof CAMPOS_OP28)[number];
type Valores = Partial<Record<Campo, unknown>>;
interface LineaVista {
  readonly lineaId?: Uuid | undefined;
  readonly monto: number;
  readonly destino?: DestinoEsperado | undefined;
}

/** Lo que hay hoy, con las claves y la forma del contrato (`esperado` y `actuales` hablan igual). */
async function actualesDe(
  tx: LectorTx,
  h: Hechos,
  t: Transaccion,
  claves: readonly Campo[],
): Promise<Valores> {
  const efectos = h.efectos.filter((f) => f.transaccionId === t.id);
  const tipoDe = new Map(h.cuentas.map((c) => [c.id, c.tipo]));
  const cuota = t.tipo === 'cuota_prestamo' || t.tipo === 'abono_capital';
  const fijo = efectos.find((f) => cuota && tipoDe.get(f.cuentaId) === 'prestamo');
  const movibles = efectos.filter((f) => f !== fijo);
  const una = movibles.length === 1;
  const ajena = claves.find((k) =>
    una ? k === 'origenId' || k === 'destinoId' : k === 'cuentaId',
  );
  if (ajena !== undefined) throw new TypeError(`OP-28: ${ajena} no aplica a una ${t.tipo}`);
  const todos: Valores = {
    fecha: t.fecha,
    total: t.total,
    cuentaId: movibles[0]?.cuentaId,
    origenId: movibles.find((f) => f.monto < 0)?.cuentaId,
    destinoId: movibles.find((f) => f.monto > 0)?.cuentaId,
    comercio: t.comercio,
    nota: t.nota,
    monedaOriginal: t.monedaOriginal,
    lineas: h.lineas
      .filter((l) => l.transaccionId === t.id)
      .sort((a, b) => a.orden - b.orden)
      .map((l) => ({
        lineaId: l.id,
        monto: l.monto,
        ...(l.categoriaId !== null
          ? { destino: { categoriaId: l.categoriaId } }
          : l.deudorId !== null
            ? { destino: { deudorId: l.deudorId } }
            : {}),
      })),
    desglose:
      fijo === undefined
        ? undefined
        : { capital: -fijo.monto, interes: fijo.interes ?? 0, seguro: fijo.seguro ?? 0 },
  };
  // `monto_original` no está en los hechos [M] (03 §3.12): solo se lee de la fila si se pide
  if (claves.includes('montoOriginal')) todos.montoOriginal = await montoOriginalDe(tx, t.id);
  return Object.fromEntries(claves.map((k) => [k, todos[k]]));
}

/** `[monto, categoría, deudor]` de una línea pedida; sin destino ni línea que lo dé, el destino no se conoce (`null`). */
function ternaDe(h: Hechos, propias: Hechos['lineas'], p: LineaVista) {
  const linea = propias.find((l) => l.id === p.lineaId);
  if (p.destino === undefined && linea === undefined) return null;
  const [c, d] = p.destino
    ? destinoIds(h, p.destino)
    : [linea?.categoriaId ?? null, linea?.deudorId ?? null];
  return forma([p.monto, c, d]);
}

/**
 * ¿Son las mismas líneas? Como conjunto de `(monto, destino)`. Una línea pedida sin destino cuyo `lineaId` ya no existe
 * (se reemplazó al editarla, BE-16) coincide con cualquier línea de su monto.
 */
function mismasLineas(h: Hechos, propias: Hechos['lineas'], a: unknown, b: unknown): boolean {
  const resto = (a as readonly LineaVista[]).map((p) => ternaDe(h, propias, p));
  const pedidas = b as readonly LineaVista[];
  if (resto.length !== pedidas.length) return false;
  const montos = new Map(resto.map((t, i) => [i, t]));
  const quitar = (f: (t: string) => boolean): boolean => {
    for (const [i, t] of montos) if (t !== null && f(t)) return montos.delete(i);
    return false;
  };
  const sinDestino = pedidas.filter((p) => ternaDe(h, propias, p) === null);
  const conDestino = pedidas.filter((p) => ternaDe(h, propias, p) !== null);
  return (
    conDestino.every((p) => quitar((t) => t === ternaDe(h, propias, p))) &&
    sinDestino.every((p) => quitar((t) => (JSON.parse(t) as number[])[0] === p.monto))
  );
}

/** ¿Es el mismo valor? Las líneas por conjunto, el decimal sin ceros sobrantes y el desglose por sus tres partes. */
function iguales(h: Hechos, propias: Hechos['lineas'], k: Campo, a: unknown, b: unknown): boolean {
  if (k === 'lineas') return mismasLineas(h, propias, a, b);
  if (k === 'montoOriginal') return decimal(a as string | null) === decimal(b as string | null);
  if (k !== 'desglose') return forma(a) === forma(b);
  const [x, y] = [a, b].map((d) => d as { capital: number; interes: number; seguro: number });
  return x?.capital === y?.capital && x?.interes === y?.interes && x?.seguro === y?.seguro;
}

export const OP28: DefinicionOperacion<EntradaOp28, EntradaOp28, { id: Uuid }> = {
  id: 'OP-28',
  contrato: op28,
  idempotencia: 'valor_absoluto',
  async comprobarIdempotencia(tx, e, h) {
    const t = h.transacciones.find((x) => x.id === e.transaccionId);
    if (t === undefined) return { tipo: 'no_encontrado' };
    const claves = CAMPOS_OP28.filter((k) => e[k] !== undefined);
    const actual = await actualesDe(tx, h, t, claves);
    const propias = h.lineas.filter((l) => l.transaccionId === t.id);
    const mismo = (k: Campo, otro: unknown) => iguales(h, propias, k, actual[k], otro);
    if (claves.every((k) => mismo(k, e[k]))) return { tipo: 'ya_aplicada', salida: { id: t.id } };
    if (claves.every((k) => mismo(k, e.esperado[k]))) return { tipo: 'aplicar' };
    return { tipo: 'conflicto_desactualizado', actuales: actual };
  },
  /**
   * `monto_original` no está en los hechos (03 §3.12) y el dominio exige la moneda y su monto juntos (M4): si la
   * transacción tiene moneda original y la edición no la toca, se completa con el monto de la fila.
   */
  async resolver(tx, e, h) {
    const t = h.transacciones.find((x) => x.id === e.transaccionId);
    if (t?.monedaOriginal == null || e.monedaOriginal !== undefined) return e;
    const monto = await montoOriginalDe(tx, t.id);
    return monto === null
      ? e
      : { ...e, monedaOriginal: t.monedaOriginal, montoOriginal: monto as DecimalTexto };
  },
  comando: ({ transaccionId, esperado: _visto, ...cambios }, instante, ids) =>
    // lo que el contrato no trae no es una clave (Zod): el comando solo lleva los campos que cambian
    ({ operacion: 'OP-28', transaccionId, instante, ids, ...cambios }) as ComandoOp28,
  salida: (_r, e) => ({ id: e.transaccionId }),
};
