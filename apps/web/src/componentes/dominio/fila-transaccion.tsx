// Fila de transacción (05 §10.8; 06-identidad-visual 2.16). Cada marca es un icono con nombre accesible, nunca
// solo icono. El monto es `montoPresentado`: ya viene con signo del DTO.
import type { Centavos } from '@finn/dominio/valores';
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
}

const ICONO_MARCA: Readonly<Record<keyof TransaccionFilaDto['marcas'], NombreIcono>> = {
  porCobrar: 'ticket',
  conDevoluciones: 'undo',
  conciliada: 'reconcile',
  programada: 'repeat',
  periodoCerrado: 'lock',
};

export function FilaTransaccion({
  fila,
  hrefDetalle,
}: {
  readonly fila: TransaccionFilaDto;
  readonly hrefDetalle: string;
}) {
  const marcas = (Object.keys(ICONO_MARCA) as (keyof TransaccionFilaDto['marcas'])[]).filter(
    (m) => fila.marcas[m],
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
            <Icono key={m} nombre={ICONO_MARCA[m]} tamano={16} etiqueta={dominio.marcas[m]} />
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
