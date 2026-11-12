// `/ajustes/seguridad` (05 §2.11, §9.6, FT-74): los factores TOTP (CP-4) y las sesiones. La lista de factores va en su propio
// `Suspense`; las Server Actions llegan por props al componente de cliente para probarlo sin servidor.
// El resultado de agregar o quitar un factor (E2-7, E2-8) llega en la URL como el nombre y queda aquí, sin tiempo límite.
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Resultado } from '../../../../componentes/base/resultado';
import { LectorFactores } from './lector';
import { Sesiones } from './sesiones';
import { salir } from '../../../../servidor/acciones/autenticacion';
import { cerrarOtrasSesiones } from '../../../../servidor/acciones/seguridad';
import { seguridad } from '../../../../textos/seguridad';

export const metadata: Metadata = { title: seguridad.titulo };

const NOMBRE_MAXIMO = 60;
const nombreDe = (v: string | string[] | undefined): string | undefined => {
  const texto = (Array.isArray(v) ? v[0] : v)?.trim();
  return texto === undefined || texto === '' ? undefined : texto.slice(0, NOMBRE_MAXIMO);
};

export default async function PaginaAjustesSeguridad({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { agregado, quitado } = await searchParams;
  const nuevo = nombreDe(agregado);
  const fuera = nombreDe(quitado);
  const resultado =
    nuevo !== undefined
      ? seguridad.agregaste(nuevo)
      : fuera !== undefined
        ? seguridad.quitaste(fuera)
        : undefined;
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-5 py-4">
      <h1 className="text-titulo-pantalla">{seguridad.titulo}</h1>
      {resultado === undefined ? null : (
        <div className="rounded-contenedor bg-superficie shadow-elevacion-1">
          <Resultado texto={resultado} />
        </div>
      )}
      <Suspense fallback={<p className="text-texto-secundario">…</p>}>
        <LectorFactores />
      </Suspense>
      <Sesiones cerrarOtras={cerrarOtrasSesiones} salir={salir} />
    </main>
  );
}
