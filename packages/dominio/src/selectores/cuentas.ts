// Cuentas (04 §6.5): saldos por tipo, tarjetas con su próximo corte y pago, préstamos y la posición
// neta (01 §4.14). Todo sale de la instantánea; lo informativo de la tarjeta usa `desgloseAlPagar`.
import { desgloseAlPagar, fechaDeCorte } from '../calculo/patrimonio';
import type { Instantanea, Uuid } from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { type Auxiliares, diferenciaActual, institucionDe, proximaCuotaDe } from './detalle-cuenta';
import { nombres } from './comunes';
import { puntosBasicos } from './reportes/comunes';

const TOPE = 10_000;
const suma = (xs: readonly Centavos[]) => xs.reduce(Centavos.sumar, Centavos.cero);

/** Primera fecha ≥ hoy con ese día del mes, recortado al fin de mes (§4.14, supuesto 19). */
export function proxima(dia: number, hoy: FechaLocal): FechaLocal {
  const este = fechaDeCorte(dia, hoy);
  return este >= hoy ? este : fechaDeCorte(dia, FechaLocal.sumarMeses(hoy, 1));
}

/** Barra de cada lado de la posición neta: el mayor = 10.000, el otro en proporción (≥ 1 si > 0). */
function barras(activos: Centavos, deudas: Centavos) {
  const mayor = Centavos.max(activos, deudas);
  const bp = (x: Centavos) =>
    x <= 0 || mayor <= 0 ? 0 : x === mayor ? TOPE : Math.max(1, puntosBasicos(x, mayor));
  return { activosBp: bp(activos), deudasBp: bp(deudas) };
}

/** `consultas.cuentas` (6.5). Las cuentas archivadas solo van en `archivadas`, y si se pidieron. */
export function cuentas(
  i: Instantanea,
  o: Auxiliares & { readonly incluirArchivadas?: boolean } = {},
) {
  const h = i.hechos;
  const n = nombres(i);
  // En el orden de OP-03 (`orden`, y el id si empatan), que es el de «Ordenar» (04 §6.14.2).
  const activas = h.cuentas
    .filter((k) => !k.archivada)
    .sort((a, b) => a.orden - b.orden || (a.id < b.id ? -1 : 1));
  const saldoDe = (id: Uuid) => i.cuentas.find((s) => s.cuentaId === id);
  const comun = (k: (typeof h.cuentas)[number]) => ({
    cuenta: n.cuenta(k.id),
    ...institucionDe(o, k),
    ...(k.ultimos4 === null ? {} : { ultimos4: k.ultimos4 }),
  });
  const p = i.patrimonio;
  const activos = suma([p.efectivo, p.saldosAFavor, p.inversiones, p.porCobrar]);
  const deudas = Centavos.sumar(p.deudasDeTarjeta, p.prestamos);

  return {
    efectivo: activas
      .filter((k) => k.tipo === 'efectivo')
      .map((k) => {
        const c = h.conciliaciones
          .filter((x) => x.cuentaId === k.id)
          .sort((a, b) =>
            a.fechaEstado + a.terminadaEn < b.fechaEstado + b.terminadaEn ? 1 : -1,
          )[0];
        return {
          ...comun(k),
          subtipoEfectivo: k.subtipoEfectivo ?? ('corriente' as const), // [CH-224]
          saldo: saldoDe(k.id)?.saldo ?? Centavos.cero,
          saldoConfirmado: saldoDe(k.id)?.confirmado ?? Centavos.cero,
          ...(c === undefined
            ? {}
            : {
                ultimaConciliacion: {
                  fechaEstado: c.fechaEstado,
                  diferenciaActual: diferenciaActual(i, c),
                },
              }),
        };
      }),
    tarjetas: activas
      .filter((k) => k.tipo === 'tarjeta')
      .flatMap((k) => {
        const t = h.tarjetas.find((x) => x.cuentaId === k.id);
        const e = i.tarjetas.find((x) => x.tarjetaId === k.id);
        if (t === undefined || e === undefined) return [];
        const pago = proxima(t.diaPago, i.hoy);
        return [
          {
            ...comun(k),
            ...(t.red === null ? {} : { red: t.red }),
            ...(t.color === null ? {} : { color: t.color }),
            deuda: e.deuda,
            saldoAFavor: Centavos.max(Centavos.cero, saldoDe(k.id)?.saldo ?? Centavos.cero),
            limite: t.limiteCredito,
            usoLimite: t.limiteCredito > 0 ? puntosBasicos(e.deuda, t.limiteCredito) : 0,
            faltaReservar: e.sinRespaldo,
            reservaExcedente: e.reservaExcedente,
            proximoCorte: proxima(t.diaCorte, i.hoy),
            proximoPago: pago,
            paraNoGenerarIntereses: desgloseAlPagar(h, t, pago).paraNoGenerarIntereses,
            saldoConfirmado: saldoDe(k.id)?.confirmado ?? Centavos.cero,
            usoSinReservarBp:
              t.limiteCredito > 0
                ? Math.min(TOPE, puntosBasicos(e.sinRespaldo, t.limiteCredito))
                : null,
          },
        ];
      }),
    prestamos: activas
      .filter((k) => k.tipo === 'prestamo')
      .flatMap((k) => {
        const pr = h.prestamos.find((x) => x.cuentaId === k.id);
        if (pr === undefined) return [];
        const cuota = proximaCuotaDe(i, pr); // [CH-252] con modelo o sin él (E2-11)
        return [
          {
            cuenta: n.cuenta(k.id),
            contraparte: pr.contraparte,
            capitalPendiente: saldoDe(k.id)?.saldo ?? Centavos.cero,
            ...(cuota === undefined ? {} : { proximaCuota: cuota }),
          },
        ];
      }),
    inversiones: activas
      .filter((k) => k.tipo === 'inversion')
      .map((k) => ({ cuenta: n.cuenta(k.id), valor: saldoDe(k.id)?.saldo ?? Centavos.cero })),
    ...(o.incluirArchivadas === true
      ? {
          // [CH-252] con su institución, para «Archivada · {banco}»; [CH-254] y su fecha de archivo, si la tiene
          archivadas: h.cuentas
            .filter((k) => k.archivada)
            .map((k) => ({
              ...n.cuenta(k.id),
              ...institucionDe(o, k),
              ...(k.archivadaEl != null ? { archivadaEl: k.archivadaEl } : {}),
            })),
        }
      : {}),
    posicionNeta: {
      activos: {
        efectivo: p.efectivo,
        saldosAFavor: p.saldosAFavor,
        inversiones: p.inversiones,
        porCobrar: p.porCobrar,
        total: activos,
      },
      deudas: { tarjetas: p.deudasDeTarjeta, prestamos: p.prestamos, total: deudas },
      neto: p.total,
      barras: barras(activos, deudas),
    },
    enCamino: i.lpa.dineroEnCamino,
  };
}

/**
 * [CH-252] Lo que «Devolverlas» (OP-04) vuelve a LPA (E2-15): las asignaciones de pago(t) en períodos posteriores al
 * activo, con su suma y el rango de esos períodos (inicio del primero, fin del último). `undefined` si no hay.
 */
export function asignacionesFuturasDeTarjeta(i: Instantanea, cuentaId: Uuid) {
  const pago = i.hechos.categorias.find((g) => g.clase === 'pago' && g.tarjetaId === cuentaId);
  const activo = i.presupuesto.activo.inicio;
  const futuras = i.hechos.asignaciones
    .filter((a) => a.categoriaId === pago?.id && a.periodoInicio > activo && a.monto !== 0)
    .sort((a, b) => (a.periodoInicio < b.periodoInicio ? -1 : 1));
  const [primera, ultima] = [futuras[0], futuras.at(-1)];
  if (primera === undefined || ultima === undefined) return undefined;
  const fin = i.presupuesto.periodos.find((p) => p.inicio === ultima.periodoInicio)?.fin;
  return {
    monto: suma(futuras.map((a) => a.monto)),
    desde: primera.periodoInicio,
    hasta: fin ?? ultima.periodoInicio,
  };
}
