// Selector de período (05 §3.4, FE-31; 06-identidad-visual 2.15). Son enlaces a la misma ruta con otro `?periodo=`;
// el período activo no lleva parámetro. No calcula períodos: si no hay `anterior`, el enlace no aparece.
import { formatearPeriodoCorto } from '../../formato';
import { dominio } from '../../textos/dominio';
import { Icono, type NombreIcono } from '../base/icono';

export interface PeriodoSelectorDto {
  readonly inicio: string;
  readonly fin: string;
  readonly estado: 'cerrado' | 'activo' | 'futuro';
  readonly transicion: boolean;
  readonly diasTranscurridos: number;
  readonly diasRestantes: number;
}

interface PropsSelectorPeriodo {
  readonly periodo: PeriodoSelectorDto;
  readonly periodoActivo: PeriodoSelectorDto;
  readonly anterior?: string;
  readonly siguiente?: string;
  readonly ruta: string;
  readonly parametros: Readonly<Record<string, string>>;
}

const ICONO: Record<'activo' | 'cerrado' | 'futuro' | 'transicion', NombreIcono> = {
  activo: 'clock',
  cerrado: 'lock',
  futuro: 'cal',
  transicion: 'swap',
};

function destino(
  ruta: string,
  parametros: Readonly<Record<string, string>>,
  inicio: string | null,
): string {
  const q = new URLSearchParams(parametros);
  q.delete('periodo');
  if (inicio !== null) q.set('periodo', inicio);
  const texto = q.toString();
  return texto === '' ? ruta : `${ruta}?${texto}`;
}

const ENLACE =
  'inline-flex size-11 shrink-0 items-center justify-center rounded-pastilla bg-superficie-hundida text-texto';

export function SelectorPeriodo({
  periodo,
  periodoActivo,
  anterior,
  siguiente,
  ruta,
  parametros,
}: PropsSelectorPeriodo) {
  const clave = periodo.transicion
    ? 'transicion'
    : periodo.estado === 'activo'
      ? 'activo'
      : periodo.estado;
  const esActivo = periodo.inicio === periodoActivo.inicio;
  const dias = `${dominio.diasTranscurridos(String(periodo.diasTranscurridos))} · ${dominio.diasRestantes(String(periodo.diasRestantes))}`;
  const detalle =
    periodo.estado === 'activo'
      ? `${dominio.estadoPeriodo[clave]} · ${dias}`
      : dominio.estadoPeriodo[clave];
  return (
    <nav data-estado-periodo={clave} aria-label={dominio.periodo} className="px-3 py-2.5">
      <div className="flex items-center gap-3">
        {anterior === undefined ? (
          <span className="size-11 shrink-0" />
        ) : (
          <a
            href={destino(ruta, parametros, anterior)}
            aria-label={dominio.periodoAnterior}
            className={ENLACE}
          >
            <Icono nombre="arrowL" />
          </a>
        )}
        <div className="min-w-0 flex-1 text-center">
          <p className="text-cuerpo font-bold text-texto">{formatearPeriodoCorto(periodo)}</p>
          <p className="inline-flex items-center gap-1.5 text-cuerpo-pequeno text-texto-secundario">
            <Icono nombre={ICONO[clave]} tamano={16} />
            {detalle}
          </p>
        </div>
        {siguiente === undefined ? (
          <span className="size-11 shrink-0" />
        ) : (
          <a
            href={destino(ruta, parametros, siguiente)}
            aria-label={dominio.periodoSiguiente}
            className={ENLACE}
          >
            <Icono nombre="arrowR" />
          </a>
        )}
      </div>
      {esActivo ? null : (
        <p className="mt-1 text-center">
          <a
            href={destino(ruta, parametros, null)}
            className="text-cuerpo-pequeno text-enlace underline"
          >
            {dominio.irAlPeriodoActual}
          </a>
        </p>
      )}
    </nav>
  );
}
