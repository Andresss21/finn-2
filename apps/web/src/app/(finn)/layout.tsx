// Marco autenticado (05 §1.2, FE-02). No llama a ninguna consulta (FE-06): la sesión la exigen las consultas de cada
// página y `proxy.ts` (TA-214). Lanza la puesta al día con `after()` (BE-50, 6.6): corre después de pintar la página, así
// que no la demora. Renderiza `<Marco>` (cliente) con `{children}` y el slot `{superpuesto}` de los flujos cortos (FE-04).
// [CH-66] `force-dynamic` aquí alcanza a toda página y slot del grupo, aunque declare `force-static`: nada se prerenderiza
// y `next build` nunca ejecuta `ponerAlDia` contra la base. `await connection()` no sirve: con esa página, el layout corre
// igual al compilar (comprobado en Next 16.4.1). Lo vigilan `tools/pruebas/e2e/compilar.mjs` y PRU-E2E-PWA-104.
import { relojDePrueba } from '@finn/aplicacion';
import { memoriaDeInstancia } from '@finn/aplicacion/memoria';
import { ponerAlDia } from '@finn/aplicacion/tareas/puesta-al-dia';
import { after } from 'next/server';
import type { ReactNode } from 'react';
import { Marco } from '../../componentes/marco/marco';

export const dynamic = 'force-dynamic';

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
