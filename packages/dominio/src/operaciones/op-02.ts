// OP-02 Editar cuenta (01 §5.1, 04 §3.1): los atributos que cambian; el saldo inicial se mueve con la
// apertura (PE, y PC si estaba conciliado) y la categoría de pago sigue el nombre de la tarjeta (BE-35).
import type * as H from '../hechos';
import { FechaLocal } from '../valores/fecha-local';
import type { Efecto } from './aplicar';
import { buscarCuenta, nombreRepetido, pagoDe, SUBTIPO, ultimos4Repetidos } from './op-01';
import { esRechazo, rechazo } from './rechazos';

const DIA_MS = 86_400_000;

/** `máx(instante, anterior + 1 ms)` (04 §13.1.2) sobre el texto ISO UTC con milisegundos. */
export function claveOrdenEditada(instante: H.Instante, anterior: H.Instante): H.Instante {
  if (instante > anterior) return instante;
  const [dia = '', hora = ''] = anterior.split('T');
  const n = (a: number, b: number) => Number(hora.slice(a, b));
  const ms = n(0, 2) * 3_600_000 + n(3, 5) * 60_000 + n(6, 8) * 1000 + n(9, 12) + 1;
  const fecha = ms === DIA_MS ? FechaLocal.sumarDias(FechaLocal.desdeTexto(dia), 1) : dia;
  const [r, p] = [ms % DIA_MS, (v: number, d = 2) => String(Math.floor(v)).padStart(d, '0')];
  const reloj = `${p(r / 3_600_000)}:${p((r / 60_000) % 60)}:${p((r / 1000) % 60)}`;
  return `${fecha}T${reloj}.${p(r % 1000, 3)}Z` as H.Instante;
}

/** Los campos pedidos cuyo valor difiere del actual, o `undefined` si ninguno. */
export function distintos<T extends object>(actual: T, pedidos: object): Partial<T> | undefined {
  const viejo = actual as Readonly<Record<string, unknown>>;
  const c = Object.entries(pedidos).filter(([k, v]) => v !== undefined && v !== viejo[k]);
  return c.length > 0 ? (Object.fromEntries(c) as Partial<T>) : undefined;
}

export function op02(antes: H.Instantanea, x: H.ComandoOp02): Efecto | H.Rechazo {
  const { hechos: h, hoy } = antes;
  const k = buscarCuenta(h, x.cuentaId);
  if (esRechazo(k)) return k;
  const nueva = { ...k, ...x.campos };
  const apertura = nueva.fechaApertura;
  const efectos = new Map(
    h.efectos.filter((e) => e.cuentaId === k.id).map((e) => [e.transaccionId, e]),
  );
  const txs = h.transacciones.filter((t) => efectos.has(t.id));
  const si = txs.find((t) => t.tipo === 'saldo_inicial');
  const primera = txs.flatMap((t) => (t === si ? [] : [t.fecha])).sort()[0];
  if (apertura > hoy) return rechazo('fecha_posterior_a_hoy', { fecha: apertura, hoy });
  const datos = { fecha: primera ?? apertura };
  if (datos.fecha < apertura)
    return { codigo: 'apertura_posterior_a_movimientos', campo: 'fechaApertura', datos };
  const tarjeta = k.tipo === 'tarjeta';
  const repetido =
    ultimos4Repetidos(h, nueva) ?? (tarjeta ? nombreRepetido(h, k.id, nueva.nombre) : undefined);
  if (repetido !== undefined) return repetido;

  const cambios: H.Cambio[] = [];
  const campos = distintos(k, x.campos);
  if (campos !== undefined)
    cambios.push({ tipo: 'actualizar', tabla: 'cuentas', id: k.id, campos });
  if (x.subtipo !== undefined) {
    if (k.tipo === 'efectivo') throw new TypeError(`OP-02: la cuenta ${k.id} no tiene subtipo`);
    const tabla = SUBTIPO[k.tipo];
    const sub = distintos(h[tabla].find((s) => s.cuentaId === k.id) ?? {}, x.subtipo);
    if (sub !== undefined) cambios.push({ tipo: 'actualizar', tabla, id: k.id, campos: sub });
  }
  const avisos: H.AvisoOperacion[] = [];
  if (si !== undefined && si.fecha !== apertura) {
    const claveOrden = claveOrdenEditada(x.instante, si.claveOrden);
    const tx: Partial<H.Transaccion> = { fecha: apertura, claveOrden };
    if (si.estadoBancario === 'conciliada' && si.conciliacionId !== null) {
      // PC (04 §3.0.4): la foto de lo conciliado; la transacción vuelve a confirmada (AV-16).
      const foto = {
        fecha: si.fecha,
        montoEfecto: efectos.get(si.id)?.monto,
        comercio: si.comercio,
      };
      const pc = { conciliacionId: si.conciliacionId, transaccionId: si.id, motivos: ['fecha'] };
      const fila = { id: x.ids.siguiente(), ...pc, registradoEn: x.instante, ...foto };
      cambios.push({ tipo: 'insertar', tabla: 'cambios_posteriores', fila } as H.Cambio);
      Object.assign(tx, { estadoBancario: 'confirmada', conciliacionId: null });
      const av16 = { codigo: 'AV-16', momento: 'antes', requiereConfirmacion: true } as const;
      avisos.push({ ...av16, datos: { transaccionId: si.id } });
    }
    cambios.push({ tipo: 'actualizar', tabla: 'transacciones', id: si.id, campos: tx });
  }
  const pago = tarjeta && campos?.nombre !== undefined ? pagoDe(h, k.id) : undefined;
  const nombre = { nombre: nueva.nombre };
  if (pago) cambios.push({ tipo: 'actualizar', tabla: 'categorias', id: pago.id, campos: nombre });
  return { cambios, avisos };
}
