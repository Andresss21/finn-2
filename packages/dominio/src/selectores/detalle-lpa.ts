// Selector de Listo para asignar (detalle) (04 §6.4): la descomposición de §4.9 sale tal cual de
// `i.lpa`, la reducción proyectada de las celdas del activo y el historial de `i.historialLpa` (B-4).
// La suma de la descomposición es `lpa` (propiedad de la Fase 7). Sin fórmulas propias. El `Encabezado`
// lo arma la consulta.
import { reduccionDe } from '../calculo/disponible';
import type { Instantanea } from '../hechos';
import type { Centavos } from '../valores/centavos';
import { nombres, type PeriodoDto, periodoDto, type Ref } from './comunes';

/** Períodos del historial por defecto (04 §6.4); el máximo, 60, lo valida el contrato. */
export const PERIODOS_DE_HISTORIAL = 12;

export interface DetalleLpaSel {
  readonly lpa: Centavos;
  readonly lpaNegativo: boolean;
  readonly descomposicion: {
    readonly entradas: {
      readonly ingresos: Centavos;
      readonly otrasEntradas: Centavos;
      readonly restituciones: Centavos;
      readonly saldosIniciales: Centavos;
    };
    readonly asignadoPeriodosCerrados: Centavos;
    readonly asignadoPeriodoActivo: Centavos;
    readonly asignadoPeriodosFuturos: Centavos;
    readonly reduccionesSobregiroDebito: Centavos;
    readonly reduccionesPagoExcedente: Centavos;
    readonly enCamino: Centavos;
  };
  readonly reduccionProyectadaAlCierre: {
    readonly total: Centavos;
    readonly categorias: { categoria: Ref; monto: Centavos }[];
    readonly tarjetas: { tarjeta: Ref; monto: Centavos }[];
  };
  readonly historial: { periodo: PeriodoDto; lpaAlCierre: Centavos }[];
  readonly notaHistorial: 'sin_adelantos';
}

/** Los últimos `periodos` períodos cerrados del historial, del más antiguo al más reciente. */
export function detalleLpa(
  i: Instantanea,
  periodos: number = PERIODOS_DE_HISTORIAL,
): DetalleLpaSel {
  if (!Number.isInteger(periodos) || periodos < 1)
    throw new RangeError(`periodos inválido: ${periodos}`);
  const d = i.lpa;
  const nom = nombres(i);
  const activas = i.presupuesto.celdas
    .filter((x) => x.periodo.inicio === i.presupuesto.activo.inicio)
    .map((x) => ({ x, monto: reduccionDe(x) }))
    .filter((r) => r.monto > 0);
  return {
    lpa: d.total,
    lpaNegativo: d.total < 0,
    descomposicion: {
      entradas: {
        ingresos: d.entradas.ingreso,
        otrasEntradas: d.entradas.otras,
        restituciones: d.entradas.restitucion,
        saldosIniciales: d.entradas.saldoInicial,
      },
      asignadoPeriodosCerrados: d.asignadoCerrados,
      asignadoPeriodoActivo: d.asignadoActivo,
      asignadoPeriodosFuturos: d.asignadoFuturos,
      reduccionesSobregiroDebito: d.sobregirosDebito,
      reduccionesPagoExcedente: d.pagosExcedentes,
      enCamino: d.dineroEnCamino,
    },
    reduccionProyectadaAlCierre: {
      total: i.reduccionProyectada,
      categorias: activas
        .filter((r) => r.x.clase === 'normal')
        .map((r) => ({ categoria: nom.categoria(r.x.categoriaId), monto: r.monto })),
      tarjetas: activas.flatMap((r) =>
        r.x.clase === 'pago' && r.x.tarjetaId !== null
          ? [{ tarjeta: nom.cuenta(r.x.tarjetaId), monto: r.monto }]
          : [],
      ),
    },
    historial: i.historialLpa
      .slice(-periodos)
      .map((h) => ({ periodo: periodoDto(i, h.periodo), lpaAlCierre: h.lpa })),
    notaHistorial: 'sin_adelantos',
  };
}
