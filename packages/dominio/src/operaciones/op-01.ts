// OP-01 Crear cuenta (01 §5.1, 04 §3.1): la cuenta, su subtipo, la categoría de pago de una tarjeta
// con su nombre (BE-35) y el saldo inicial. Aquí viven también las reglas que comparten OP-02 a OP-06.
import type * as H from '../hechos';
import { Centavos } from '../valores/centavos';
import type { Efecto } from './aplicar';
import { rechazo } from './rechazos';

type R = H.Rechazo;

/** La cuenta `id`, o el rechazo `no_encontrado` (04 §3.0.7). */
export function buscarCuenta(h: H.Hechos, id: H.Uuid): H.Cuenta | R {
  const datos = { entidad: 'cuentas', id };
  return h.cuentas.find((k) => k.id === id) ?? { codigo: 'no_encontrado', datos };
}

/** pago(t): la categoría de pago de la tarjeta (inv. 22). */
export const pagoDe = (h: H.Hechos, t: H.Uuid) => h.categorias.find((x) => x.tarjetaId === t);

/** El grupo del sistema "Pagos de tarjeta" (S3-9); sin él, los hechos están mal formados. */
function grupoDePagos(h: H.Hechos) {
  const g = h.grupos.find((x) => x.claveSistema === 'pagos_tarjeta');
  if (g === undefined) throw new RangeError('falta el grupo del sistema Pagos de tarjeta (S3-9)');
  return g;
}

/** (institución, últimos 4) no se repite en otra cuenta, abierta o archivada (B-5, CB-14). */
export function ultimos4Repetidos(h: H.Hechos, k: H.Cuenta): R | undefined {
  const { institucionId, ultimos4 } = k;
  if (institucionId === null || ultimos4 === null) return undefined;
  const igual = (x: H.Cuenta) => x.institucionId === institucionId && x.ultimos4 === ultimos4;
  if (!h.cuentas.some((x) => x.id !== k.id && igual(x))) return undefined;
  return { codigo: 'ultimos4_repetidos', campo: 'ultimos4', datos: { institucionId, ultimos4 } };
}

/** BE-35: ninguna otra categoría de pago, tampoco la de una tarjeta archivada, lleva ese nombre. */
export function nombreRepetido(h: H.Hechos, tarjetaId: H.Uuid, nombre: string): R | undefined {
  const g = grupoDePagos(h);
  const ajena = (x: H.Categoria) => x.grupoId === g.id && x.tarjetaId !== tarjetaId;
  const igual = h.categorias.find(
    (x) => ajena(x) && x.nombre.toLowerCase() === nombre.toLowerCase(),
  );
  if (igual === undefined) return undefined;
  const otra = h.cuentas.find((k) => k.id === igual.tarjetaId);
  const datos = { nombre, grupo: g.nombre, ...(otra?.archivada && { tarjeta: otra.nombre }) };
  return { codigo: 'nombre_repetido', campo: 'nombre', datos };
}

/** Tabla del subtipo de cada tipo de cuenta. */
export const SUBTIPO = {
  tarjeta: 'tarjetas',
  prestamo: 'prestamos',
  inversion: 'inversiones',
} as const;

const siguienteOrden = (xs: readonly { readonly orden: number }[]) =>
  Math.max(0, ...xs.map((x) => x.orden)) + 1;
const NUEVA = { archivada: false, revision: null } as const;
const NULOS = { conciliacionId: null, comercio: null, nota: null, lineaCobradaId: null } as const;

export function op01(antes: H.Instantanea, x: H.ComandoOp01): Efecto | R {
  const { hechos: h, hoy } = antes;
  const { id, subtipo, ids, instante } = x;
  const { fechaApertura = hoy, ...atributos } = x.cuenta;
  if ((subtipo?.tipo ?? 'efectivo') !== atributos.tipo)
    throw new TypeError(`OP-01: subtipo ${String(subtipo?.tipo)} en una cuenta ${atributos.tipo}`);
  if (fechaApertura > hoy) return rechazo('fecha_posterior_a_hoy', { fecha: fechaApertura, hoy });
  const orden = siguienteOrden(h.cuentas);
  const cuenta: H.Cuenta = { id, ...atributos, fechaApertura, orden, ...NUEVA };
  const tarjeta = cuenta.tipo === 'tarjeta';
  const repetido =
    ultimos4Repetidos(h, cuenta) ?? (tarjeta ? nombreRepetido(h, id, cuenta.nombre) : undefined);
  if (repetido !== undefined) return repetido;

  const cambios: H.Cambio[] = [{ tipo: 'insertar', tabla: 'cuentas', fila: cuenta }];
  if (subtipo !== undefined) {
    const fila = { ...subtipo, cuentaId: id, revision: null };
    cambios.push({ tipo: 'insertar', tabla: SUBTIPO[subtipo.tipo], fila } as H.Cambio);
  }
  if (tarjeta) {
    const { id: grupoId } = grupoDePagos(h);
    const n = siguienteOrden(h.categorias.filter((c) => c.grupoId === grupoId));
    const pago = { id: ids.siguiente(), grupoId, nombre: cuenta.nombre, orden: n, tarjetaId: id };
    const fila = { ...pago, clase: 'pago', ...NUEVA } as const;
    cambios.push({ tipo: 'insertar', tabla: 'categorias', fila });
  }
  if (x.saldo === 0) return { cambios };
  // En una tarjeta la entrada es la deuda: el efecto es −deuda (o +saldo a favor), 01 §0.4.
  const monto = tarjeta ? Centavos.negar(x.saldo) : x.saldo;
  const [t, total] = [ids.siguiente(), Centavos.max(monto, Centavos.negar(monto))];
  const tx = { id: t, tipo: 'saldo_inicial', fecha: fechaApertura, total, ...NULOS } as const;
  const fila = { ...tx, horaRegistro: instante, claveOrden: instante, secuencia: null };
  const moneda = { monedaOriginal: null, montoOriginal: null } as const;
  const estado = { origen: 'manual', estadoBancario: 'pendiente', revision: null } as const;
  const efecto = { transaccionId: t, cuentaId: id, monto, interes: null, seguro: null };
  cambios.push(
    { tipo: 'insertar', tabla: 'transacciones', fila: { ...fila, ...moneda, ...estado } },
    {
      tipo: 'insertar',
      tabla: 'efectos',
      fila: { id: ids.siguiente(), ...efecto, revision: null },
    },
  );
  return { cambios };
}
