// Reglas comunes de 01 §5.0 que `aplicar` verifica sobre el estado resultante (§5.0.1): períodos
// cerrados (§5.0.4), archivo (§5.0.5), fechas (§5.0.6); y `hechosNuevos` con las cascadas (DB-12).
import { saldo } from '../calculo/saldos';
import type { Cambio, Hechos, Instantanea, Rechazo, TablaMotor } from '../hechos';
import { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';
import { rechazo } from './rechazos';

type Fila = Readonly<Record<string, unknown>>;

/** El id de una fila; los subtipos de cuenta se identifican por su cuenta. */
export const claveDe = (x: object): string =>
  String('id' in x ? x.id : (x as { readonly cuentaId: unknown }).cuentaId);

/** `ON DELETE CASCADE` entre tablas [M] (DB-12: solo composición), como `tabla.columna`. */
const CASCADAS: Partial<Record<string, readonly string[]>> = {
  transacciones: ['efectos.transaccionId', 'lineas.transaccionId'],
  cuentas: ['tarjetas.cuentaId', 'prestamos.cuentaId', 'inversiones.cuentaId'],
  categorias: ['metas.categoriaId'],
  programadas: ['programada_lineas.programadaId'],
};

/**
 * Los hechos después de los cambios; `revision` y `secuencia` las fija la base (BE-32) y quedan en
 * `null`. Las tablas [H] no entran. Insertar una fila existente o tocar una inexistente lanza.
 */
export function aplicarCambios(h: Hechos, cambios: readonly Cambio[]): Hechos {
  const t: Record<string, Fila[]> = Object.fromEntries(
    Object.entries(h).map(([k, xs]) => [k, [...(xs as unknown as readonly Fila[])]]),
  );
  const quitar = (tabla: string, campo: string, id: unknown) => {
    t[tabla] = (t[tabla] ?? []).filter((y) => (campo === '' ? claveDe(y) : y[campo]) !== id);
  };
  for (const x of cambios) {
    if (x.tipo === 'eliminarConciliacionesDeCuenta') {
      quitar('conciliaciones', 'cuentaId', x.cuentaId);
      continue;
    }
    const filas = t[x.tabla];
    if (filas === undefined) continue;
    const id = x.tipo === 'insertar' ? claveDe(x.fila) : x.id;
    const k = filas.findIndex((y) => claveDe(y) === id);
    if (k < 0 !== (x.tipo === 'insertar')) throw new RangeError(`${x.tipo} ${x.tabla} ${id}`);
    if (x.tipo === 'insertar')
      filas.push({ ...x.fila, revision: null, ...('secuencia' in x.fila && { secuencia: null }) });
    else if (x.tipo === 'actualizar') filas[k] = { ...filas[k], ...x.campos, revision: null };
    else {
      quitar(x.tabla, '', id);
      for (const c of CASCADAS[x.tabla] ?? [])
        quitar(c.split('.')[0] ?? '', c.split('.')[1] ?? '', id);
    }
  }
  return t as unknown as Hechos;
}

/** Ids de las filas de `tabla` que los cambios insertan (y actualizan, si `editadas`). */
const escritas = (cambios: readonly Cambio[], tabla: TablaMotor, editadas = true) =>
  new Set(
    cambios.flatMap((x) =>
      x.tipo === 'eliminarConciliacionesDeCuenta' || x.tabla !== tabla
        ? []
        : x.tipo === 'insertar'
          ? [claveDe(x.fila)]
          : x.tipo === 'actualizar' && editadas
            ? [x.id]
            : [],
    ),
  );

/** Celdas (categoría, período) cuya Σ Asig cambia entre `a` y `b`, de las que cumplen `en`. */
function diferencias(a: Hechos, b: Hechos, en: (p: FechaLocal, c: string) => boolean) {
  const suma = (h: Hechos) => {
    const m = new Map<string, Centavos>();
    for (const x of h.asignaciones.filter((y) => en(y.periodoInicio, y.categoriaId))) {
      const k = `${x.categoriaId}|${x.periodoInicio}`;
      m.set(k, Centavos.sumar(m.get(k) ?? Centavos.cero, x.monto));
    }
    return m;
  };
  const [ma, mb] = [suma(a), suma(b)];
  return [...new Set([...ma.keys(), ...mb.keys()])].sort().flatMap((k) => {
    const d = Centavos.restar(mb.get(k) ?? Centavos.cero, ma.get(k) ?? Centavos.cero);
    const [categoriaId = '', periodoInicio = ''] = k.split('|');
    return d === 0 ? [] : [{ categoriaId, periodoInicio, d }];
  });
}

/** Los rechazos comunes (04 §3.0.6) de pasar de la instantánea `antes` a los hechos `despues`. */
export function verificarComunes(
  antes: Instantanea,
  despues: Hechos,
  cambios: readonly Cambio[],
  operacion: string,
): readonly Rechazo[] {
  const r: Rechazo[] = [];
  const { hechos: h, hoy } = antes;

  // §5.0.4, inv. 18: Asig(c, p) de un período cerrado solo cambia por OP-12 y OP-06.
  const cerradas = diferencias(h, despues, (p) => p < antes.presupuesto.activo.inicio);
  if (operacion !== 'OP-12' && operacion !== 'OP-06')
    for (const { categoriaId, periodoInicio } of cerradas)
      r.push(rechazo('periodo_cerrado', { categoriaId, periodoInicio }));

  // §5.0.5, A-1: una cuenta archivada no recibe transacciones nuevas ni cambia de saldo.
  const saldoAntes = new Map(antes.cuentas.map((k) => [k.cuentaId, k.saldo]));
  const nuevas = escritas(cambios, 'transacciones', false);
  const usadas = new Set(
    despues.efectos.filter((e) => nuevas.has(e.transaccionId)).map((e) => e.cuentaId),
  );
  for (const k of despues.cuentas)
    if (k.archivada && (usadas.has(k.id) || saldo(despues, k.id) !== (saldoAntes.get(k.id) ?? 0)))
      r.push(rechazo('cuenta_archivada', { cuentaId: k.id }));

  // §5.0.5, inv. 20: una categoría archivada no recibe asignaciones positivas ni destinos nuevos.
  const archivadas = new Set<string>(
    despues.categorias.filter((x) => x.archivada).map((x) => x.id),
  );
  const destino = new Map<string, unknown>(
    [...h.lineas, ...h.condonaciones].map((x) => [x.id, x.categoriaId]),
  );
  const [lineas, condonaciones] = [escritas(cambios, 'lineas'), escritas(cambios, 'condonaciones')];
  // OP-09 sube Asig(c, A) para cubrir el sobregiro de la categoría que archiva (01 §5.2).
  const cubre = operacion === 'OP-09';
  const categorias = new Set([
    ...diferencias(h, despues, (_, c) => archivadas.has(c) && !cubre)
      .filter((x) => x.d > 0)
      .map((x) => x.categoriaId),
    ...[
      ...despues.lineas.filter((x) => lineas.has(x.id)),
      ...despues.condonaciones.filter((x) => condonaciones.has(x.id)),
    ]
      // Inv. 20, ajuste 1: una devolución vinculada va a la categoría de su línea original.
      .filter((x) => {
        const original = 'lineaOriginalId' in x ? x.lineaOriginalId : null;
        return (destino.get(x.id) ?? destino.get(original ?? '')) !== x.categoriaId;
      })
      .map((x) => String(x.categoriaId)),
  ]);
  for (const c of [...categorias].sort())
    if (archivadas.has(c)) r.push(rechazo('categoria_archivada', { categoriaId: c }));

  // §5.0.6, inv. 12: fecha de las transacciones y eventos que se crean o editan.
  const fechaDe = new Map(despues.transacciones.map((t) => [t.id as string, t.fecha]));
  const original = new Map(
    despues.lineas.map((l) => [l.id as string, fechaDe.get(l.transaccionId)]),
  );
  const apertura = new Map(despues.cuentas.map((k) => [k.id as string, k.fechaApertura]));
  const evento = (fecha: FechaLocal, de: readonly (string | null)[]) => {
    if (fecha > hoy) r.push(rechazo('fecha_posterior_a_hoy', { fecha, hoy }));
    for (const o of de.map((l) => original.get(l ?? '')))
      if (o !== undefined && fecha < o) r.push(rechazo('evento_anterior_a_original', { fecha: o }));
  };
  const efectos = escritas(cambios, 'efectos');
  const txs = new Set([
    ...escritas(cambios, 'transacciones'),
    ...despues.efectos.filter((e) => efectos.has(e.id)).map((e) => e.transaccionId),
    ...despues.lineas.filter((l) => lineas.has(l.id)).map((l) => l.transaccionId),
  ]);
  for (const t of despues.transacciones.filter((x) => txs.has(x.id))) {
    const propias = despues.lineas.filter((l) => l.transaccionId === t.id);
    evento(t.fecha, [t.lineaCobradaId, ...propias.map((l) => l.lineaOriginalId)]);
    for (const e of despues.efectos.filter((x) => x.transaccionId === t.id)) {
      const desde = apertura.get(e.cuentaId);
      if (desde !== undefined && t.fecha < desde)
        r.push(rechazo('fecha_anterior_a_apertura', { cuentaId: e.cuentaId, apertura: desde }));
    }
  }
  for (const x of despues.condonaciones.filter((y) => condonaciones.has(y.id)))
    evento(x.fecha, [x.lineaId]);
  return r;
}
