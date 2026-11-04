'use client';
// La página completa de `/ajustes/instituciones` (FT-73; 05 §2.11): las instituciones por nombre, con el enlace a renombrarlas y a crear
// una nueva. Los formatos de cada una se ven en Formatos bancarios.
import { Vacio } from '../../../../componentes/base/vacio';
import { EnlaceFinn } from '../../../../componentes/navegacion/enlace-finn';
import { PaginaFlujoDeRuta } from '../../../../componentes/navegacion/flujo-de-ruta';
import { ajustesInstituciones as t } from '../../../../textos/ajustes-formatos';

const ENLACE = 'inline-flex min-h-11 items-center font-semibold text-enlace underline';
const BOTON =
  'inline-flex min-h-12 w-full items-center justify-center rounded-control bg-accion-tonal px-5 text-base font-semibold text-accion hover:bg-superficie-hundida focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

export function ListaInstituciones({
  instituciones,
}: {
  readonly instituciones: readonly { readonly id: string; readonly nombre: string }[];
}) {
  return (
    <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre="/ajustes/formatos">
      <div className="flex flex-col gap-5">
        {instituciones.length === 0 ? (
          <Vacio titulo={t.vacio.titulo} texto={t.vacio.texto} icono="x" tono="neutro" />
        ) : (
          <ul className="overflow-hidden rounded-contenedor bg-superficie shadow-elevacion-1">
            {instituciones.map((i) => (
              <li key={i.id} data-institucion className="border-b border-borde-sutil last:border-b-0">
                <EnlaceFinn
                  href={`/ajustes/instituciones/${i.id}`}
                  className="flex min-h-14 items-center px-4 py-3 font-semibold"
                >
                  {i.nombre}
                </EnlaceFinn>
              </li>
            ))}
          </ul>
        )}
        <EnlaceFinn href="/ajustes/instituciones/nueva" className={BOTON}>
          {t.nueva}
        </EnlaceFinn>
        <EnlaceFinn href="/ajustes/formatos" className={ENLACE}>
          {t.formatos}
        </EnlaceFinn>
      </div>
    </PaginaFlujoDeRuta>
  );
}
