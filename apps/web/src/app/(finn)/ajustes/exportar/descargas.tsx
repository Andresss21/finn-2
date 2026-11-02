'use client';
// La página completa de `/ajustes/exportar` (FT-75, OPT-08; 05 §2.11): dos enlaces de descarga hacia `GET /api/exportar/{json|csv}`.
// Son enlaces nativos con `download` (no `EnlaceFinn`): la respuesta es un archivo, no una ruta de la app. No calcula nada (PF-3).
import { PaginaFlujoDeRuta } from '../../../../componentes/navegacion/flujo-de-ruta';
import { ajustesExportar as t } from '../../../../textos/ajustes-exportar';

// El aspecto de «secundaria» de `Boton` (05 §10.7) para un enlace: un `<a download>` no es un botón.
const ENLACE =
  'inline-flex min-h-12 min-w-11 items-center justify-center rounded-control bg-accion-tonal px-5 text-base font-semibold text-accion hover:bg-superficie-hundida focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

export interface PropsDescargas {
  /** `AjustesDto.exportaciones`: las rutas de descarga que fija el servidor. */
  readonly exportaciones: { readonly json: string; readonly csv: string };
}

function Descarga({
  id,
  texto,
  href,
}: {
  id: string;
  texto: { titulo: string; detalle: string; descargar: string };
  href: string;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <h2 id={id} className="text-titulo-seccion">
        {texto.titulo}
      </h2>
      <p className="text-cuerpo-pequeno text-texto">{texto.detalle}</p>
      <a href={href} download className={ENLACE}>
        {texto.descargar}
      </a>
    </section>
  );
}

export function DescargasExportar({ exportaciones }: PropsDescargas) {
  return (
    <PaginaFlujoDeRuta titulo={t.titulo} descripcion={t.descripcion} rutaPadre="/ajustes">
      <div className="flex flex-col gap-6">
        <Descarga id="exportar-json" texto={t.json} href={exportaciones.json} />
        <Descarga id="exportar-csv" texto={t.csv} href={exportaciones.csv} />
        <p className="text-cuerpo-pequeno text-texto-secundario">{t.privacidad}</p>
      </div>
    </PaginaFlujoDeRuta>
  );
}
