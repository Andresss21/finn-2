// Fila de transacción (05 §10.8; 06-identidad-visual 2.16). Cada marca es un icono con nombre accesible, nunca
// solo icono. A14/B8: título y «Cuenta · Categoría» en una línea cada uno, y la línea de metadatos con glifo de 12 y su etiqueta. El monto es `montoPresentado`: ya viene con signo del DTO.
import type { Centavos } from '@finn/dominio/valores';
import { formatearMonto } from '../../formato';
import { dominio } from '../../textos/dominio';
import { Icono, type NombreIcono } from '../base/icono';
import { Monto } from './monto';

export interface TransaccionFilaDto {
  readonly id: string;
  readonly comercio: string | null;
  readonly montoPresentado: Centavos;
  readonly estadoBancario: 'pendiente' | 'confirmada' | 'conciliada';
  readonly marcas: {
    readonly porCobrar: boolean;
    readonly conDevoluciones: boolean;
    readonly conciliada: boolean;
    readonly programada: boolean;
    readonly periodoCerrado: boolean;
  };
  /** [CH-250] Lo abierto por cobrar de la fila: la marca dice «En camino $40.00». */
  readonly enCamino?: Centavos;
}

const textoDeMarca = (fila: TransaccionFilaDto, m: keyof TransaccionFilaDto['marcas']): string =>
  m === 'porCobrar' && fila.enCamino !== undefined
    ? dominio.enCamino(formatearMonto(fila.enCamino))
    : dominio.marcas[m];

const ICONO_MARCA: Readonly<Record<keyof TransaccionFilaDto['marcas'], NombreIcono>> = {
  porCobrar: 'ticket',
  conDevoluciones: 'undo',
  conciliada: 'reconcile',
  programada: 'repeat',
  periodoCerrado: 'lock',
};

/** La fila de la lista de Actividad (export 02): círculo con ícono, «cuenta · categoría» y cada marca con su texto. */
export interface DetalleDeFila {
  readonly subtitulo: string;
  readonly icono: NombreIcono;
}

const MARCA = 'inline-flex items-center gap-1 text-cuerpo-pequeno text-texto-secundario';
const PENDIENTE = `${MARCA} rounded-pastilla border border-dashed border-borde-control px-1.5`;

function FilaDetallada({
  fila,
  hrefDetalle,
  detalle,
  marcas,
}: {
  readonly fila: TransaccionFilaDto;
  readonly hrefDetalle: string;
  readonly detalle: DetalleDeFila;
  readonly marcas: readonly (keyof TransaccionFilaDto['marcas'])[];
}) {
  return (
    <a
      href={hrefDetalle}
      data-fila-transaccion={fila.id}
      className="grid min-h-16 grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-2.5 px-4 py-2"
    >
      <span className="flex size-9 items-center justify-center rounded-contenedor bg-superficie-hundida text-texto">
        <Icono nombre={detalle.icono} tamano={20} />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-cuerpo font-semibold text-texto">
          {fila.comercio ?? dominio.sinComercio}
        </span>
        <span className="truncate text-cuerpo-pequeno text-texto-secundario">
          {detalle.subtitulo}
        </span>
        <span data-metadatos className="flex flex-wrap gap-2">
          {fila.estadoBancario === 'pendiente' ? (
            <span className={PENDIENTE}>
              <Icono nombre="clock" tamano={12} />
              {dominio.estadoBancario.pendiente}
            </span>
          ) : null}
          {marcas.map((m) => (
            <span key={m} className={MARCA}>
              <Icono nombre={ICONO_MARCA[m]} tamano={12} />
              {textoDeMarca(fila, m)}
            </span>
          ))}
        </span>
      </span>
      <Monto
        centavos={fila.montoPresentado}
        rol="cifra"
        {...(fila.montoPresentado > 0 ? { estado: 'positivo' as const } : {})}
      />
    </a>
  );
}

export function FilaTransaccion({
  fila,
  hrefDetalle,
  detalle,
}: {
  readonly fila: TransaccionFilaDto;
  readonly hrefDetalle: string;
  /** Solo la lista de Actividad lo pasa; las demás pantallas dibujan la fila compacta. */
  readonly detalle?: DetalleDeFila;
}) {
  const marcas = (Object.keys(ICONO_MARCA) as (keyof TransaccionFilaDto['marcas'])[]).filter(
    (m) => fila.marcas[m],
  );
  if (detalle !== undefined)
    return (
      <FilaDetallada fila={fila} hrefDetalle={hrefDetalle} detalle={detalle} marcas={marcas} />
    );
  return (
    <a
      href={hrefDetalle}
      data-fila-transaccion={fila.id}
      className="flex min-h-15 items-center gap-3 px-3.5"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-cuerpo font-semibold text-texto">
          {fila.comercio ?? dominio.sinComercio}
        </span>
        <span className="flex items-center gap-2 text-cuerpo-pequeno text-texto-secundario">
          {dominio.estadoBancario[fila.estadoBancario]}
          {marcas.map((m) => (
            <Icono key={m} nombre={ICONO_MARCA[m]} tamano={16} etiqueta={textoDeMarca(fila, m)} />
          ))}
        </span>
      </span>
      <Monto
        centavos={fila.montoPresentado}
        rol="cifra"
        {...(fila.montoPresentado > 0 ? { estado: 'positivo' as const } : {})}
      />
    </a>
  );
}
