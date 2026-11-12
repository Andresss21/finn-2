'use client';
// La página completa de `/ajustes/instituciones` (FT-73; 05 §2.11; E5-14): las instituciones por nombre con «N formatos»; tocar una
// abre «Renombrar» y «Nueva institución», las dos en hoja (panel de 440 px en computadora). No se ofrece eliminar una institución.
import { Vacio } from '../../../../componentes/base/vacio';
import { EnlaceFinn } from '../../../../componentes/navegacion/enlace-finn';
import { VolverEnTitulo } from '../../../../componentes/navegacion/volver-en-titulo';
import { navegacion } from '../../../../textos/navegacion';
import { ajustesInstituciones as t } from '../../../../textos/ajustes-instituciones';

const ENLACE = 'inline-flex min-h-11 items-center font-semibold text-enlace underline';
const BOTON =
  'inline-flex min-h-12 w-full items-center justify-center rounded-control bg-accion-tonal px-5 text-base font-semibold text-accion hover:bg-superficie-hundida focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

export function ListaInstituciones({
  instituciones,
}: {
  readonly instituciones: readonly {
    readonly id: string;
    readonly nombre: string;
    readonly formatos: number;
  }[];
}) {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-5 px-5 py-4">
      <div className="-ml-2 flex items-center gap-1">
        <VolverEnTitulo
          href="/ajustes"
          etiqueta={navegacion.volverA(navegacion.secciones.ajustes)}
        />
        <h1 className="min-w-0 flex-1 text-titulo-pantalla">{t.titulo}</h1>
      </div>
      <div className="flex flex-col gap-5">
        {instituciones.length === 0 ? (
          <Vacio titulo={t.vacio.titulo} texto={t.vacio.texto} icono="x" tono="neutro" />
        ) : (
          <ul className="overflow-hidden rounded-contenedor bg-superficie shadow-elevacion-1">
            {instituciones.map((i) => (
              <li
                key={i.id}
                data-institucion
                className="border-b border-borde-sutil last:border-b-0"
              >
                <EnlaceFinn
                  href={`/ajustes/instituciones/${i.id}`}
                  className="flex min-h-14 flex-col justify-center gap-0.5 px-4 py-3"
                >
                  <span className="font-semibold">{i.nombre}</span>
                  <span className="text-cuerpo-pequeno text-texto-secundario">
                    {t.formatosDe(i.formatos)}
                  </span>
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
    </main>
  );
}
