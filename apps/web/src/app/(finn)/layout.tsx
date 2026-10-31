// Marco autenticado (05 §1.2, FE-02). No llama a ninguna consulta (FE-06): la sesión la exigen las consultas de cada
// página y `proxy.ts` (TA-214). Lanza la puesta al día con `after()` (BE-50, 6.6): corre después de pintar la página, así
// que no la demora. Renderiza `<Marco>` (cliente) con `{children}` y el slot `{superpuesto}` de los flujos cortos (FE-04).
import { relojDePrueba } from '@finn/aplicacion';
import { memoriaDeInstancia } from '@finn/aplicacion/memoria';
import { ponerAlDia } from '@finn/aplicacion/tareas/puesta-al-dia';
import { after } from 'next/server';
import type { ReactNode } from 'react';
import { Marco } from '../../componentes/marco/marco';

export default function LayoutFinn({
  children,
  superpuesto,
}: {
  readonly children: ReactNode;
  readonly superpuesto: ReactNode;
}) {
  after(() =>
    ponerAlDia({ memoria: memoriaDeInstancia, opciones: () => ({ reloj: relojDePrueba() }) }),
  );
  return <Marco superpuesto={superpuesto}>{children}</Marco>;
}
