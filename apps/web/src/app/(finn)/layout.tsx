// Marco autenticado (05 §1.2, FE-02). No llama a ninguna consulta (FE-06): la sesión la exigen las consultas de cada
// página y `proxy.ts` (TA-214). Renderiza `{children}` y el slot `{superpuesto}` de los flujos cortos (FE-04).
// `<Marco>` y la puesta al día con `after()` los suma la tarea del marco; aquí no hay nada de eso todavía.
import type { ReactNode } from 'react';

export default function LayoutFinn({
  children,
  superpuesto,
}: {
  readonly children: ReactNode;
  readonly superpuesto: ReactNode;
}) {
  return (
    <>
      {children}
      {superpuesto}
    </>
  );
}
