// OP-01 Crear cuenta (04 §3.1): creación, clave `cuentas.id`. El dominio escribe la cuenta, su subtipo, la
// categoría de pago de una tarjeta y el saldo inicial (BE-35); aquí viven el contrato, los ids derivados del
// principal (BE-31) y la comparación de 4.6.1 contra la cuenta que ya exista con ese id.
import type { SubtipoCuenta } from '@finn/dominio';
import { Centavos } from '@finn/dominio/valores';
import { op01, type EntradaOp01, type SalidaCuenta } from '../../contratos/cuentas.ts';
import type { DefinicionOperacion } from '../marco.ts';
import { coincide, hechosDe } from './comunes.ts';

const TABLA = { tarjeta: 'tarjetas', prestamo: 'prestamos', inversion: 'inversiones' } as const;

/** Los atributos del subtipo, con todas las columnas (lo opcional sin valor es `null`). */
function subtipoDe(e: EntradaOp01): SubtipoCuenta | undefined {
  switch (e.tipo) {
    case 'efectivo':
      return undefined;
    case 'tarjeta':
      return {
        tipo: 'tarjeta',
        limiteCredito: e.limiteCredito,
        tasaAnualMillonesimas: e.tasaAnual ?? null,
        diaCorte: e.diaCorte,
        diaPago: e.diaPago,
        red: e.red ?? null,
        color: e.color ?? null,
      };
    case 'prestamo':
      return {
        tipo: 'prestamo',
        contraparte: e.contraparte,
        montoOriginal: e.montoOriginal,
        tasaNominalAnualMillonesimas: e.tasaNominalAnual ?? null,
        tipoTasa: e.tipoTasa,
        seguroPrimerMes: e.seguroPrimerMes ?? null,
        comision: e.comision ?? null,
        frecuencia: e.frecuencia,
        frecuenciaDias: e.frecuenciaDias ?? null,
        cuotaPactada: e.cuotaPactada,
        plazoCuotas: e.plazoCuotas,
        modeloCalculo: e.modeloCalculo ?? null,
        cuotasPagadasAlCrear: e.cuotasPagadasAlCrear,
      };
    case 'inversion':
      return {
        tipo: 'inversion',
        rendimientoAnualEsperadoMillonesimas: e.rendimientoAnualEsperado ?? null,
      };
  }
}

/** Lo que la solicitud determina de la fila principal (4.6.1); la apertura solo si el cliente la dio. */
const cuentaDe = (e: EntradaOp01) => ({
  tipo: e.tipo,
  nombre: e.nombre,
  institucionId: e.institucionId ?? null,
  ultimos4: e.ultimos4 ?? null,
  ...(e.fechaApertura === undefined ? {} : { fechaApertura: e.fechaApertura }),
});

/** El efecto del saldo inicial: en una tarjeta la entrada es la deuda (01 §0.4). */
const efectoInicial = (e: EntradaOp01) =>
  e.tipo === 'tarjeta' ? Centavos.negar(e.saldo) : e.saldo;

export const OP01: DefinicionOperacion<EntradaOp01, EntradaOp01, SalidaCuenta> = {
  id: 'OP-01',
  contrato: op01,
  idempotencia: 'creacion',
  idPrincipal: (e) => e.id,
  async comprobarIdempotencia(tx, e) {
    const h = await hechosDe(tx);
    const cuenta = h.cuentas.find((c) => c.id === e.id);
    if (cuenta === undefined) return { tipo: 'aplicar' };
    const sub = subtipoDe(e);
    const filaSub =
      e.tipo === 'efectivo' ? undefined : h[TABLA[e.tipo]].find((s) => s.cuentaId === e.id);
    const propios = h.efectos.filter((f) => f.cuentaId === e.id);
    const inicial = h.transacciones.find(
      (t) => t.tipo === 'saldo_inicial' && propios.some((f) => f.transaccionId === t.id),
    );
    const monto = propios.find((f) => f.transaccionId === inicial?.id)?.monto ?? 0;
    const igual =
      coincide(cuenta, cuentaDe(e)) &&
      (sub === undefined || (filaSub !== undefined && coincide(filaSub, sub))) &&
      monto === efectoInicial(e);
    return igual ? { tipo: 'ya_aplicada', salida: { id: e.id } } : { tipo: 'conflicto_id' };
  },
  resolver: (_tx, e) => Promise.resolve(e),
  comando: (e, instante, ids) => {
    const subtipo = subtipoDe(e);
    return {
      operacion: 'OP-01',
      id: e.id,
      instante,
      ids,
      cuenta: cuentaDe(e),
      ...(subtipo === undefined ? {} : { subtipo }),
      saldo: e.saldo,
    };
  },
  salida: (_r, e) => ({ id: e.id }),
};
