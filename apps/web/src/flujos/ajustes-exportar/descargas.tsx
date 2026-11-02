'use client';
// La página completa de `/ajustes/exportar` (FT-75, OPT-08; 05 §2.11): dos enlaces de descarga hacia `GET /api/exportar/{json|csv}`.
// Son enlaces nativos con `download` (no `EnlaceFinn`): la respuesta es un archivo, no una ruta de la app. No calcula nada (PF-3).
import { PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { buttonVariants } from '../../components/ui/button';
import { ajustesExportar as t } from '../../textos/ajustes-exportar';

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
      <a href={href} download className={buttonVariants({ variant: 'tonal' })}>
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
