// `/ajustes/seguridad` (05 §2.11, §9.6, FT-74): los factores TOTP (CP-4) y las sesiones. La lista de factores va en su propio
// `Suspense`; las Server Actions llegan por props al componente de cliente para probarlo sin servidor.
// El resultado de agregar o quitar un factor (E2-7, E2-8) llega en la URL como el nombre. Agregar queda aquí, sin tiempo límite;
// [CH-281] quitar es la etiqueta de C-50: la fila del factor se queda con «Quitado» y se recoge (`FilaQueSeFue`).
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FilaQueSeFue } from '../../../../componentes/base/etiqueta-al-llegar';
import { Icono } from '../../../../componentes/base/icono';
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
  const resultado = nuevo === undefined ? undefined : seguridad.agregaste(nuevo);
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-5 py-4">
      <h1 className="text-titulo-pantalla">{seguridad.titulo}</h1>
      {fuera === undefined || nuevo !== undefined ? null : (
        <FilaQueSeFue
          id="factor-quitado"
          llegada={{ palabra: seguridad.quitado, frase: seguridad.quitaste(fuera) }}
        >
          <span
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-pastilla bg-superficie-hundida text-texto-secundario"
          >
            <Icono nombre="lock" tamano={20} />
          </span>
          {fuera}
        </FilaQueSeFue>
      )}
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
