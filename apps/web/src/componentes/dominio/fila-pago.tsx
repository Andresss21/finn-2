// Fila de pago de tarjeta (05 §10.8; 06-identidad-visual 2.7). El número principal es `faltaReservar` (F4).
import type { Centavos } from '@finn/dominio/valores';
import { dominio } from '../../textos/dominio';
import { IndicadorEstado, type EstadoFinanciero } from './indicador-estado';
import { Monto } from './monto';

export interface FilaPagoTarjetaDto {
  readonly tarjeta: { readonly id: string; readonly nombre: string };
  readonly disponible: Centavos;
  readonly faltaReservar: Centavos;
  readonly reservaExcedente: Centavos;
  readonly pagoExcedente: { readonly total: Centavos } | null;
}

interface Principal {
  readonly estado: EstadoFinanciero;
  readonly etiqueta: string;
  readonly centavos: Centavos;
  readonly conColor: boolean;
}

// Qué aviso manda: falta reservar, pago excedente, reserva excedente, al día (06 2.7).
function principal(f: FilaPagoTarjetaDto): Principal {
  if (f.faltaReservar > 0) {
    return {
      estado: 'deuda-sin-respaldo',
      etiqueta: dominio.teFaltaReservar,
      centavos: f.faltaReservar,
      conColor: true,
    };
  }
  if (f.pagoExcedente !== null) {
    return {
      estado: 'problema',
      etiqueta: dominio.pagoExcedente,
      centavos: f.pagoExcedente.total,
      conColor: true,
    };
  }
  if (f.reservaExcedente > 0) {
    return {
      estado: 'informacion',
      etiqueta: dominio.reservadoDeMas,
      centavos: f.reservaExcedente,
      conColor: true,
    };
  }
  return { estado: 'deuda', etiqueta: dominio.alDia, centavos: f.faltaReservar, conColor: false };
}

export function FilaPagoTarjeta({
  fila,
  hrefDetalle,
}: {
  readonly fila: FilaPagoTarjetaDto;
  readonly hrefDetalle: string;
}) {
  const p = principal(fila);
  return (
    <a
      href={hrefDetalle}
      data-fila-pago={fila.tarjeta.id}
      className="flex flex-col gap-1 px-4 py-3.5"
    >
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-cuerpo font-semibold text-texto">{fila.tarjeta.nombre}</span>
        <Monto
          centavos={p.centavos}
          rol="cifra"
          presentacion="absoluto"
          {...(p.conColor ? { estado: p.estado } : {})}
        />
      </span>
      <span className="text-cuerpo-pequeno text-texto-secundario">
        {dominio.disponibleParaPagar} <Monto centavos={fila.disponible} />
      </span>
      <span>
        <IndicadorEstado estado={p.estado} etiqueta={p.etiqueta} />
      </span>
    </a>
  );
}
