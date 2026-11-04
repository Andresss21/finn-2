// `/ajustes/ciclo` (05 §2.11, FT-72, OP-19): cambiar el día de inicio de los períodos, con AV-12 antes de confirmar.
import type { Metadata } from 'next';
import { LectorCiclo } from '../../../../flujos/ajustes-ciclo/lector';
import { ajustesCiclo } from '../../../../textos/ajustes-ciclo';

export const metadata: Metadata = { title: ajustesCiclo.titulo };

export default function PaginaAjustesCiclo() {
  return <LectorCiclo />;
}
