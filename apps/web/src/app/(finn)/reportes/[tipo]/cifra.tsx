// E5-5 (entrega 4): la cifra de un reporte, una sola y siempre un campo del DTO (PF-3): el monto grande con su frase. Nunca suma ni resta.
// [CH-251] Una cifra que no es un monto (Cumplimiento «2 de 8», Realidad «1») va como `texto`, con el mismo estilo.
import type { Centavos } from '@finn/dominio/valores';
import type { EstadoFinanciero } from '../../../../componentes/dominio/indicador-estado';
import { Monto } from '../../../../componentes/dominio/monto';
import { formatearFecha } from '../../../../formato';
import { reportes as t } from '../../../../textos/reportes';

/** [CH-251] El período de la cifra (E5-21): el actual, o el último cerrado con sus fechas (`dd/mm`). */
export const cuandoDe = (p: {
  readonly inicio: string;
  readonly fin: string;
  readonly estado: string;
}): string =>
  p.estado === 'cerrado'
    ? t.cifras.ultimoCerrado(
        formatearFecha(p.inicio).slice(0, 5),
        formatearFecha(p.fin).slice(0, 5),
      )
    : t.cifras.periodoActual;

export function CifraReporte({
  centavos,
  texto,
  frase,
  estado,
}: (
  | { readonly centavos: Centavos; readonly texto?: never }
  | { readonly texto: string; readonly centavos?: never }
) & {
  readonly frase: string;
  readonly estado?: EstadoFinanciero;
}) {
  return (
    <p data-cifra-reporte className="flex flex-col gap-0.5">
      {centavos === undefined ? (
        <span className="text-cifra-principal tabular-nums">{texto}</span>
      ) : (
        <Monto
          centavos={centavos}
          rol="cifra-principal"
          {...(estado === undefined ? {} : { estado })}
        />
      )}
      <span className="text-cuerpo-pequeno text-texto-secundario">{frase}</span>
    </p>
  );
}
