// `/ajustes/seguridad` (05 §2.11, §9.6, FT-74): los factores TOTP (CP-4) y las sesiones. La lista de factores va en su propio
// `Suspense`; las Server Actions llegan por props al componente de cliente para probarlo sin servidor.
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LectorFactores } from './lector';
import { Sesiones } from './sesiones';
import { salir } from '../../../../servidor/acciones/autenticacion';
import { cerrarOtrasSesiones } from '../../../../servidor/acciones/seguridad';
import { seguridad } from '../../../../textos/seguridad';

export const metadata: Metadata = { title: seguridad.titulo };

export default function PaginaAjustesSeguridad() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-5 py-4">
      <h1 className="text-titulo-pantalla">{seguridad.titulo}</h1>
      <Suspense fallback={<p className="text-texto-secundario">…</p>}>
        <LectorFactores />
      </Suspense>
      <Sesiones cerrarOtras={cerrarOtrasSesiones} salir={salir} />
    </main>
  );
}
