// Selector de período (05 §3.4, FE-31; 06-identidad-visual 2.15). Son enlaces, no botones con estado: cada período
// tiene su URL. El período activo no lleva `?periodo=`. Nunca calcula un período: lo que no viene, no aparece.
import { formatearPeriodoCorto } from '../../formato';
import { dominio } from '../../textos/dominio';
import { Icono, type NombreIcono } from '../base/icono';
import { EnlaceFinn } from './enlace-finn';

export interface PeriodoDto {
  readonly inicio: string;
  readonly fin: string;
  readonly dias: number;
  readonly estado: 'cerrado' | 'activo' | 'futuro';
  readonly transicion: boolean;
  /** Solo en el activo (04 §6.0). */
  readonly diasTranscurridos?: number;
  readonly diasRestantes?: number;
}

export interface SelectorPeriodoProps {
  readonly periodo: PeriodoDto;
  readonly periodoActivo: PeriodoDto;
  readonly anterior?: string;
  readonly siguiente?: string;
  readonly ruta: string;
  readonly parametros: Readonly<Record<string, string>>;
}

const CIRCULO =
  'inline-flex size-11 shrink-0 items-center justify-center rounded-pastilla bg-superficie-hundida text-texto hover:bg-borde-sutil focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

function estadoVisible(p: PeriodoDto): { icono: NombreIcono; texto: string } {
  if (p.transicion) return { icono: 'swap', texto: dominio.periodo.transicion(p.dias) };
  if (p.estado === 'cerrado') return { icono: 'lock', texto: dominio.periodo.cerrado };
  if (p.estado === 'futuro') return { icono: 'cal', texto: dominio.periodo.futuro };
  return { icono: 'clock', texto: dominio.periodo.activo };
}

export function SelectorPeriodo({
  periodo,
  periodoActivo,
  anterior,
  siguiente,
  ruta,
  parametros,
}: SelectorPeriodoProps) {
  const hrefDe = (inicio?: string): string => {
    const q = new URLSearchParams(Object.entries(parametros).filter(([k]) => k !== 'periodo'));
    if (inicio !== undefined && inicio !== periodoActivo.inicio) q.set('periodo', inicio);
    const s = q.toString();
    return s === '' ? ruta : `${ruta}?${s}`;
  };
  const { icono, texto } = estadoVisible(periodo);
  const detalle =
    periodo.estado === 'activo' &&
    periodo.diasTranscurridos !== undefined &&
    periodo.diasRestantes !== undefined
      ? [
          texto,
          dominio.periodo.transcurridos(periodo.diasTranscurridos),
          dominio.periodo.quedan(periodo.diasRestantes),
        ].join(' · ')
      : texto;
  const esActivo = periodo.inicio === periodoActivo.inicio;
  return (
    <nav
      aria-label={dominio.periodo.navegacion}
      data-selector-periodo={periodo.transicion ? 'transicion' : periodo.estado}
      className="flex flex-col gap-1 rounded-contenedor bg-superficie px-3 py-2.5"
    >
      <div className="flex items-center justify-between gap-3">
        {anterior === undefined ? (
          <span aria-hidden="true" className="size-11 shrink-0" />
        ) : (
          <EnlaceFinn
            href={hrefDe(anterior)}
            className={CIRCULO}
            aria-label={dominio.periodo.anterior}
          >
            <Icono nombre="arrowL" />
          </EnlaceFinn>
        )}
        <div className="flex min-w-0 flex-col items-center text-center">
          <p className="text-cuerpo font-bold">{formatearPeriodoCorto(periodo)}</p>
          <p className="flex items-center gap-1.5 text-cuerpo-pequeno text-texto-secundario">
            <Icono nombre={icono} tamano={16} />
            <span>{detalle}</span>
          </p>
        </div>
        {siguiente === undefined ? (
          <span aria-hidden="true" className="size-11 shrink-0" />
        ) : (
          <EnlaceFinn
            href={hrefDe(siguiente)}
            className={CIRCULO}
            aria-label={dominio.periodo.siguiente}
          >
            <Icono nombre="arrowR" />
          </EnlaceFinn>
        )}
      </div>
      {esActivo ? null : (
        <EnlaceFinn
          href={hrefDe()}
          className="inline-flex min-h-11 items-center justify-center text-cuerpo-pequeno text-enlace hover:underline"
        >
          {dominio.periodo.irAlActual}
        </EnlaceFinn>
      )}
    </nav>
  );
}
