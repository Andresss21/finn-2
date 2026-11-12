// E5-5 (entrega 4): la cifra de un reporte, una sola y siempre un campo del DTO (PF-3): el monto grande con su frase. Nunca suma ni resta.
import type { Centavos } from '@finn/dominio/valores';
import type { EstadoFinanciero } from '../../../../componentes/dominio/indicador-estado';
import { Monto } from '../../../../componentes/dominio/monto';

export function CifraReporte({
  centavos,
  frase,
  estado,
}: {
  readonly centavos: Centavos;
  readonly frase: string;
  readonly estado?: EstadoFinanciero;
}) {
  return (
    <p data-cifra-reporte className="flex flex-col gap-0.5">
      <Monto
        centavos={centavos}
        rol="cifra-principal"
        {...(estado === undefined ? {} : { estado })}
      />
      <span className="text-cuerpo-pequeno text-texto-secundario">{frase}</span>
    </p>
  );
}
