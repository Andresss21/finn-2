// `datos_base` (04 §6.9.4, CF-09; 06 §3.10): insumo de pruebas, sin ruta ni fórmulas nuevas. Cada
// campo sale de los mismos derivados que usan los selectores de 06 §3.5, para que la Fase 7 compruebe
// (07 §19.7) que coinciden donde se superponen. La ventana W y el filtro de cuentas K son los de
// `comunes.ts`; `asignado`, `arrastre` y `disponible` son de la celda y no admiten K.
import { saldoAl } from '../../calculo/saldos';
import type { Frecuencia, Instantanea, Uuid } from '../../hechos';
import { Centavos } from '../../valores/centavos';
import type { FechaLocal } from '../../valores/fecha-local';
import { nombres, type Ref } from '../comunes';
import { normalizar } from './agrupacion';
import {
  conjuntoDeCuentas,
  contexto,
  dentro,
  type FiltroDeReporte,
  medidor,
  periodosDeVentana,
  suma,
} from './comunes';
import { patrimonio } from './patrimonio';

export interface DatosBaseSel {
  readonly categoriasPorPeriodo: readonly {
    readonly categoria: Ref;
    readonly periodo: FechaLocal;
    readonly asignado: Centavos;
    readonly gastado: Centavos;
    readonly arrastre: Centavos;
    readonly disponible: Centavos;
    readonly sobregiroTarjeta: Centavos;
    readonly sobregiroDebito: Centavos;
    /** Solo en el período activo y con meta evaluada. */
    readonly pedidoMeta?: Centavos;
  }[];
  readonly consumos: readonly {
    readonly fecha: FechaLocal;
    readonly categoria: Ref;
    /** El comercio de la transacción normalizado (04 §4.17); `null` sin comercio o en una condonación. */
    readonly comercioNormalizado: string | null;
    readonly cuenta: Ref;
    readonly medio: 'tarjeta' | 'debito';
    readonly montoNeto: Centavos;
    readonly transaccionId?: Uuid;
  }[];
  readonly tarjetasPorPeriodo: readonly {
    readonly tarjeta: Ref;
    readonly periodo: FechaLocal;
    readonly cargos: Centavos;
    readonly pagos: Centavos;
    readonly deudaAlFin: Centavos;
    /** Disp(pago(t), p). */
    readonly disponiblePago: Centavos;
  }[];
  readonly programadas: readonly {
    readonly programada: Ref;
    readonly monto: Centavos;
    readonly frecuencia: Frecuencia;
    readonly frecuenciaDias?: number;
    readonly activa: boolean;
  }[];
  readonly lpaAlCierre: readonly { readonly periodo: FechaLocal; readonly lpa: Centavos }[];
  readonly patrimonioAlCierre: readonly { readonly periodo: FechaLocal; readonly neto: Centavos }[];
}

export function datosBase(i: Instantanea, filtro: FiltroDeReporte = {}): DatosBaseSel {
  const h = i.hechos;
  const nom = nombres(i);
  const k = conjuntoDeCuentas(filtro.cuentaIds);
  const w = periodosDeVentana(i, filtro.ventana);
  const inicios = new Set(w.map((p) => p.inicio));
  const m = medidor(i, filtro.cuentaIds);
  const transacciones = new Map(h.transacciones.map((t) => [t.id, t]));
  const txDeLinea = new Map(h.lineas.map((l) => [l.id, l.transaccionId]));
  const pedido = new Map(i.metas.map((x) => [x.categoriaId, x.evaluacion?.pedido]));

  const celdas = i.presupuesto.celdas.filter((c) => inicios.has(c.periodo.inicio));
  const categoriasPorPeriodo = celdas
    .filter((c) => c.clase === 'normal')
    .map((c) => {
      const p = pedido.get(c.categoriaId);
      return {
        categoria: nom.categoria(c.categoriaId),
        periodo: c.periodo.inicio,
        asignado: c.asignado,
        gastado: m.gastado(c.categoriaId, c.periodo),
        arrastre: c.arrastre,
        disponible: c.disponible,
        sobregiroTarjeta: c.sobT,
        sobregiroDebito: c.sobD,
        ...(p === undefined || c.periodo.inicio !== i.presupuesto.activo.inicio
          ? {}
          : { pedidoMeta: p }),
      };
    });

  const consumos = contexto(i)
    .consumos.filter(
      (x) => (k === undefined || k.has(x.cuentaId)) && w.some((p) => dentro(p, x.fecha)),
    )
    .map((x) => {
      const transaccionId = x.fuente === 'linea' ? txDeLinea.get(x.id) : undefined;
      const comercio =
        transaccionId === undefined
          ? ''
          : normalizar(transacciones.get(transaccionId)?.comercio ?? '');
      return {
        fecha: x.fecha,
        categoria: nom.categoria(x.categoriaId),
        comercioNormalizado: comercio === '' ? null : comercio,
        cuenta: nom.cuenta(x.cuentaId),
        medio: x.tarjetaId === null ? ('debito' as const) : ('tarjeta' as const),
        montoNeto: x.neto,
        ...(transaccionId === undefined ? {} : { transaccionId }),
      };
    });

  const tarjetasPorPeriodo = h.tarjetas
    .filter((t) => k === undefined || k.has(t.cuentaId))
    .flatMap((t) => {
      const efectos = h.efectos.filter((e) => e.cuentaId === t.cuentaId);
      return w.map((p) => {
        const enP = efectos.filter((e) => {
          const f = transacciones.get(e.transaccionId)?.fecha;
          return f !== undefined && dentro(p, f);
        });
        const hasta = p.fin < i.hoy ? p.fin : i.hoy;
        const pago = celdas.find(
          (c) => c.clase === 'pago' && c.tarjetaId === t.cuentaId && c.periodo.inicio === p.inicio,
        );
        return {
          tarjeta: nom.cuenta(t.cuentaId),
          periodo: p.inicio,
          cargos: Centavos.negar(suma(enP.filter((e) => e.monto < 0).map((e) => e.monto))),
          pagos: suma(enP.filter((e) => e.monto > 0).map((e) => e.monto)),
          deudaAlFin: Centavos.max(Centavos.cero, Centavos.negar(saldoAl(h, t.cuentaId, hasta))),
          disponiblePago: pago?.disponible ?? Centavos.cero,
        };
      });
    });

  return {
    categoriasPorPeriodo,
    consumos,
    tarjetasPorPeriodo,
    programadas: h.programadas
      .filter((x) => k === undefined || k.has(x.cuentaId))
      .map((x) => ({
        programada: { id: x.id, nombre: x.comercio },
        monto: x.monto,
        frecuencia: x.frecuencia,
        ...(x.frecuenciaDias === null ? {} : { frecuenciaDias: x.frecuenciaDias }),
        activa: x.activa,
      })),
    lpaAlCierre: i.historialLpa
      .filter((x) => inicios.has(x.periodo.inicio))
      .map((x) => ({ periodo: x.periodo.inicio, lpa: x.lpa })),
    patrimonioAlCierre: patrimonio(i, filtro).serie.map((x) => ({
      periodo: x.periodo,
      neto: x.neto,
    })),
  };
}
