// Las líneas de la previsualización de una operación con AV-01 (FT-27, 01 §5.0.3): Δ Listo para asignar, Δ Disponible de
// cada categoría, Δ te falta reservar, Δ reserva excedente y Δ reducción proyectada. Da formato a lo que calculó el
// servidor (PF-3): ni suma ni compara montos. Los nombres llegan con la previsualización.
import { formatearMonto } from '../../formato';
import { impactoLineas as t } from '../../textos/formularios';
import { glosario } from '../../textos/glosario';

type Monto = Parameters<typeof formatearMonto>[0];

export interface VistaDeImpacto {
  readonly impacto?: {
    readonly deltaLpa: number;
    readonly deltaDisponible?: readonly { readonly categoriaId: string; readonly delta: number }[];
    readonly deltaTarjetas?: readonly {
      readonly tarjetaId: string;
      readonly deltaSaldo: number;
      readonly deltaReserva: number;
    }[];
    readonly deltaReduccionProyectadaLpaAlCierre?: number;
  } | null;
  readonly nombres?: Readonly<Record<string, string>>;
}

const conSigno = (c: number): string => `${c > 0 ? '+' : ''}${formatearMonto(c as Monto)}`;

export function lineasDeImpacto(vista: VistaDeImpacto): string[] {
  const i = vista.impacto;
  if (i === null || i === undefined) return [];
  const nombre = (id: string) => vista.nombres?.[id] ?? glosario.disponible;
  const reduccion = i.deltaReduccionProyectadaLpaAlCierre ?? 0;
  return [
    t.listoParaAsignar(conSigno(i.deltaLpa)),
    ...(i.deltaDisponible ?? []).map((x) => t.disponible(nombre(x.categoriaId), conSigno(x.delta))),
    ...(i.deltaTarjetas ?? []).flatMap((x) => [
      ...(x.deltaSaldo === 0
        ? []
        : [t.teFaltaReservar(nombre(x.tarjetaId), conSigno(x.deltaSaldo))]),
      ...(x.deltaReserva === 0
        ? []
        : [t.reservaExcedente(nombre(x.tarjetaId), conSigno(x.deltaReserva))]),
    ]),
    ...(reduccion === 0 ? [] : [t.reduccion(conSigno(reduccion))]),
  ];
}
