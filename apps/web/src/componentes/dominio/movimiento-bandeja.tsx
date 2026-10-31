'use client';
// Fila compacta de la Bandeja (05 §10.8; 06-identidad-visual 2.12). Lo que falta se dice en texto; las acciones de un
// toque avisan a `alAccionar` y el `Resultado` lo pinta la pantalla en el lugar de la fila (4.14, 4.15).
import type { ReactNode } from 'react';
import type { Centavos } from '@finn/dominio/valores';
import { formatearFecha } from '../../formato';
import { cuentas } from '../../textos/cuentas';
import { Icono } from '../base/icono';
import { Boton } from '../base/boton';
import { EnlaceFinn } from '../navegacion/enlace-finn';
import { COLOR_TEXTO, type EstadoFinanciero } from './indicador-estado';
import { Monto } from './monto';

export interface MovimientoDto {
  readonly id: string;
  readonly estado:
    | 'pendiente'
    | 'con_coincidencia'
    | 'posible_duplicado'
    | 'no_reconocido'
    | 'error'
    | 'descartado'
    | 'autodescartado';
  readonly sms: { readonly texto: string };
  readonly cuenta: { readonly nombre: string } | null;
  readonly fecha: string | null;
  readonly monto: Centavos | null;
  readonly comercio: string | null;
  readonly categoriaSugerida: { readonly nombre: string; readonly porRegla: boolean } | null;
  readonly aprobacion: { readonly posible: boolean; readonly faltantes: readonly string[] };
}
export type AccionBandeja = 'aprobar' | 'es-otro-gasto' | 'descartar' | 'reintentar' | 'copiar';
type Vista = keyof typeof cuentas.bandeja.estados;

const t = cuentas.bandeja;
const ESTADO: Readonly<Record<Vista, EstadoFinanciero>> = {
  listo: 'positivo',
  falta: 'advertencia',
  faltaOtro: 'advertencia',
  coincidencia: 'informacion',
  duplicado: 'advertencia',
  noReconocido: 'cero',
  error: 'problema',
  descartado: 'cero',
};
const FONDO: Readonly<Record<EstadoFinanciero, string>> = {
  positivo: 'bg-positivo-fondo',
  cero: 'bg-cero-fondo',
  problema: 'bg-problema-fondo',
  advertencia: 'bg-advertencia-fondo',
  deuda: 'bg-deuda-fondo',
  'deuda-sin-respaldo': 'bg-deuda-sin-respaldo-fondo',
  informacion: 'bg-informacion-fondo',
};
const ACCIONES: Readonly<Partial<Record<Vista, readonly (readonly [AccionBandeja, string])[]>>> = {
  listo: [['aprobar', t.aprobar]],
  duplicado: [
    ['es-otro-gasto', t.esOtroGasto],
    ['descartar', t.descartar],
  ],
  error: [
    ['reintentar', t.intentarDeNuevo],
    ['copiar', t.copiarReferencia],
  ],
};

/** Los siete estados visibles de la fila; `pendiente` se parte según lo que pide la aprobación. */
export function vistaDe(m: MovimientoDto): Vista {
  switch (m.estado) {
    case 'pendiente':
      if (m.aprobacion.posible) return 'listo';
      return m.aprobacion.faltantes.length === 0 || m.aprobacion.faltantes.includes('destino')
        ? 'falta'
        : 'faltaOtro';
    case 'con_coincidencia':
      return 'coincidencia';
    case 'posible_duplicado':
      return 'duplicado';
    case 'no_reconocido':
      return 'noReconocido';
    case 'error':
      return 'error';
    default:
      return 'descartado';
  }
}

interface Props {
  readonly movimiento: MovimientoDto;
  readonly hrefRevisar: string;
  readonly alAccionar?: (accion: AccionBandeja, id: string) => void;
}

export function MovimientoBandeja({ movimiento: m, hrefRevisar, alAccionar }: Props) {
  const vista = vistaDe(m);
  const estado = ESTADO[vista];
  const comercio = m.comercio ?? t.sinComercio;
  const acciones = ACCIONES[vista] ?? [];
  const conAcciones = acciones.length > 0 || vista === 'noReconocido';
  const pista =
    m.categoriaSugerida === null
      ? null
      : `→ ${m.categoriaSugerida.nombre}${m.categoriaSugerida.porRegla ? ` (${t.porRegla})` : ''}`;
  const contenido: ReactNode = (
    <>
      <span
        aria-hidden="true"
        className={[
          'flex size-10 shrink-0 items-center justify-center rounded-full',
          FONDO[estado],
          COLOR_TEXTO[estado],
        ].join(' ')}
      >
        <Icono nombre={estado} tamano={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-cuerpo font-bold text-texto">{comercio}</span>
        <span className="block truncate text-cuerpo-pequeno text-texto-secundario">
          {[m.cuenta?.nombre, m.fecha === null ? undefined : formatearFecha(m.fecha)]
            .filter(Boolean)
            .join(' · ')}
        </span>
        <span className={['block text-cuerpo-pequeno font-bold', COLOR_TEXTO[estado]].join(' ')}>
          {t.estados[vista]}
          {pista === null ? null : (
            <span className="ml-1 font-normal text-texto-secundario">{pista}</span>
          )}
        </span>
      </span>
      {m.monto === null ? null : <Monto centavos={m.monto} rol="cifra" />}
      {conAcciones ? null : <Icono nombre="chevR" tamano={16} className="text-texto-terciario" />}
    </>
  );
  return (
    <article data-movimiento={m.id} data-vista={vista} className="px-4 py-3.5">
      {conAcciones ? (
        <div className="flex items-center gap-3">{contenido}</div>
      ) : (
        <EnlaceFinn href={hrefRevisar} className="flex min-h-11 items-center gap-3">
          {contenido}
        </EnlaceFinn>
      )}
      {vista === 'noReconocido' ? (
        <blockquote className="mt-2 ml-13 rounded-xl bg-superficie-hundida p-3 text-cuerpo-pequeno text-texto">
          {m.sms.texto}
        </blockquote>
      ) : null}
      {conAcciones ? (
        <div className="mt-2 ml-13 flex flex-wrap items-center gap-2">
          {acciones.map(([accion, texto], i) => (
            <Boton
              key={accion}
              variante={i === 0 ? 'pastilla' : 'secundaria'}
              aria-label={t.accionDe(texto, comercio)}
              onClick={() => alAccionar?.(accion, m.id)}
            >
              {texto}
            </Boton>
          ))}
          <EnlaceFinn
            href={hrefRevisar}
            className="inline-flex min-h-11 min-w-11 items-center px-2 text-enlace font-semibold underline"
          >
            {vista === 'noReconocido' ? t.registrarAMano : t.revisar}
          </EnlaceFinn>
        </div>
      ) : null}
    </article>
  );
}
