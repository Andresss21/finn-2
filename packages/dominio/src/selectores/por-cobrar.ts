// Por cobrar (04 §6.12.3): el saldo abierto por deudor con el estado de cada línea y el dinero en
// camino (AV-09). Solo lee la instantánea; las líneas abiertas a una fecha las comparte el contexto
// de `cobrar` del formulario (6.14.4). El `Encabezado` lo agrega la consulta.
import { type PorCobrar, porCobrar as porCobrarA } from '../calculo/por-cobrar';
import type { Instantanea, Linea, Transaccion, Uuid } from '../hechos';
import { propuestaCondonacion } from '../operaciones/op-32';
import { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';
import { nombres, type Ref } from './comunes';

export type EstadoPorCobrar = 'abierto' | 'parcial' | 'cerrado';

/** Una línea por cobrar con lo que la interfaz necesita de su compra. */
export interface LineaPorCobrar {
  readonly lineaId: Uuid;
  readonly transaccionId: Uuid;
  readonly deudor: Ref;
  readonly fechaOrigen: FechaLocal;
  readonly comercio: string | null;
  readonly monto: Centavos;
  readonly restituido: Centavos;
  readonly condonado: Centavos;
  readonly devuelto: Centavos;
  readonly abierto: Centavos;
  readonly medio: 'tarjeta' | 'debito';
  readonly tarjeta?: Ref;
}

export interface PorCobrarSel {
  readonly enCamino: Centavos;
  readonly totalAbierto: Centavos;
  readonly deudores: readonly {
    readonly deudor: Ref;
    readonly abierto: Centavos;
    readonly items: readonly (Omit<LineaPorCobrar, 'deudor' | 'tarjeta'> & {
      readonly estado: EstadoPorCobrar;
      readonly categoriaPropuestaCondonacion?: Ref;
    })[];
  }[];
}

const suma = (xs: readonly Centavos[]) => xs.reduce(Centavos.sumar, Centavos.cero);
const menor = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

const estadoDe = (x: Pick<PorCobrar, 'abierto' | 'monto'>): EstadoPorCobrar =>
  x.abierto === Centavos.cero ? 'cerrado' : x.abierto === x.monto ? 'abierto' : 'parcial';

/** Las líneas por cobrar de los hechos, abiertas o no, con el saldo a `fecha` (por defecto, hoy). */
export function lineasPorCobrar(i: Instantanea, fecha?: FechaLocal): LineaPorCobrar[] {
  const h = i.hechos;
  const n = nombres(i);
  const lineas = new Map<Uuid, Linea>(h.lineas.map((l) => [l.id, l]));
  const txs = new Map<Uuid, Transaccion>(h.transacciones.map((t) => [t.id, t]));
  const deudores = new Map(h.deudores.map((d) => [d.id, d]));
  const cobros = fecha === undefined ? i.porCobrar : porCobrarA(h, fecha);
  return cobros.map((x): LineaPorCobrar => {
    const l = lineas.get(x.lineaId);
    const t = l === undefined ? undefined : txs.get(l.transaccionId);
    const d = deudores.get(x.deudorId);
    if (l === undefined || t === undefined || d === undefined)
      throw new RangeError(`la línea por cobrar ${x.lineaId} no tiene su compra o su deudor`);
    const base = {
      lineaId: x.lineaId,
      transaccionId: t.id,
      deudor: { id: d.id, nombre: d.nombre },
      fechaOrigen: x.fecha,
      comercio: t.comercio,
      monto: x.monto,
      restituido: x.restituido,
      condonado: x.condonado,
      devuelto: x.devuelto,
      abierto: x.abierto,
    };
    return x.medio.tarjetaId === null
      ? { ...base, medio: 'debito' }
      : { ...base, medio: 'tarjeta', tarjeta: n.cuenta(x.medio.tarjetaId) };
  });
}

/** `consultas.porCobrar` (6.12.3): deudores por nombre, líneas por fecha de origen. */
export function porCobrar(i: Instantanea, o: { incluirCerrados?: boolean } = {}): PorCobrarSel {
  const n = nombres(i);
  const porDeudor = new Map<Uuid, LineaPorCobrar[]>();
  for (const x of lineasPorCobrar(i))
    if (o.incluirCerrados === true || x.abierto > 0)
      porDeudor.set(x.deudor.id, [...(porDeudor.get(x.deudor.id) ?? []), x]);
  return {
    enCamino: i.lpa.dineroEnCamino,
    totalAbierto: suma(i.porCobrar.map((x) => x.abierto)),
    deudores: [...porDeudor.values()]
      .map((xs) => ({
        deudor: (xs[0] as LineaPorCobrar).deudor,
        abierto: suma(xs.map((x) => x.abierto)),
        items: [...xs]
          .sort((a, b) => menor(a.fechaOrigen, b.fechaOrigen) || menor(a.lineaId, b.lineaId))
          .map((x) => {
            const categoria = x.abierto > 0 ? propuestaCondonacion(i.hechos, x.lineaId) : null;
            return {
              ...{ lineaId: x.lineaId, transaccionId: x.transaccionId, comercio: x.comercio },
              ...{ fechaOrigen: x.fechaOrigen, monto: x.monto, restituido: x.restituido },
              ...{ condonado: x.condonado, devuelto: x.devuelto, abierto: x.abierto },
              medio: x.medio,
              estado: estadoDe(x),
              ...(categoria === null
                ? {}
                : { categoriaPropuestaCondonacion: n.categoria(categoria) }),
            };
          }),
      }))
      .sort((a, b) => menor(a.deudor.nombre, b.deudor.nombre) || menor(a.deudor.id, b.deudor.id)),
  };
}
