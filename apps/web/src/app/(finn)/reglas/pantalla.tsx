// `/reglas` (FT-39; 05 §2, §7.2; diseño 09d-reglas): las reglas de comercio con su categoría. La que apunta a una categoría
// archivada lleva «No se aplica…» (B-10, §4.17). Dibuja lo que trae el DTO: no calcula nada (PF-3).
import type { ReglasDto } from '@finn/aplicacion/consultas/reglas';
import { Icono } from '../../../componentes/base/icono';
import { Vacio } from '../../../componentes/base/vacio';
import { IndicadorEstado } from '../../../componentes/dominio/indicador-estado';
import { PublicarEncabezado } from '../../../componentes/marco/proveedor-encabezado';
import { EnlaceFinn } from '../../../componentes/navegacion/enlace-finn';
import { reglas as t } from '../../../textos/reglas';

const FOCO = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const FILA = `grid min-h-15 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 ${FOCO}`;
const BOTON = `inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-accion-tonal px-5 font-semibold text-accion ${FOCO}`;

const BUSCADOR = `min-h-12 w-full rounded-t-control rounded-b-sm bg-superficie pr-3 pl-10 text-base text-texto border-b-2 border-borde-control placeholder:text-texto-terciario ${FOCO}`;

export function PantallaReglas({
  dto,
  q = '',
  total = dto.reglas.length,
}: {
  readonly dto: ReglasDto;
  /** [CH-227 b] El texto buscado (`?q=`); `dto.reglas` ya viene filtrada por el lector. */
  readonly q?: string;
  /** Cuántas reglas hay sin filtrar: sin ninguna, el vacío explica cómo se crean. */
  readonly total?: number;
}) {
  const nueva = (
    <EnlaceFinn href="/reglas/nueva" className={BOTON}>
      <Icono nombre="plus" tamano={18} />
      {t.nuevaRegla}
    </EnlaceFinn>
  );
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-4">
      <PublicarEncabezado encabezado={dto} />
      <h1 className="text-titulo-pantalla">{t.titulo}</h1>
      {total === 0 ? (
        <Vacio titulo={t.vacioTitulo} texto={t.vacioTexto} icono="cero" accion={nueva} />
      ) : (
        <>
          <form method="get" action="/reglas" role="search" className="relative">
            <label htmlFor="buscar-reglas" className="sr-only">
              {t.buscar}
            </label>
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-texto-secundario">
              <Icono nombre="search" tamano={18} />
            </span>
            <input
              id="buscar-reglas"
              type="search"
              name="q"
              defaultValue={q}
              placeholder={t.buscarMarcador}
              autoComplete="off"
              className={BUSCADOR}
            />
          </form>
          {dto.reglas.length === 0 ? (
            <p data-sin-coincidencias className="text-cuerpo text-texto-secundario">
              {t.sinCoincidencias}
            </p>
          ) : (
            <>
              <ul className="overflow-hidden rounded-contenedor bg-superficie">
                {dto.reglas.map((r) => (
                  <li
                    key={r.id}
                    data-regla={r.id}
                    data-archivada={r.categoriaArchivada ? 'si' : 'no'}
                    className="border-b border-borde-sutil last:border-b-0"
                  >
                    <EnlaceFinn href={`/reglas/${r.id}`} className={FILA}>
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate font-semibold">{r.patron}</span>
                        <span className="text-cuerpo-pequeno text-texto-secundario">
                          {t.hacia(r.categoria.nombre)}
                        </span>
                        {r.categoriaArchivada ? (
                          <IndicadorEstado estado="cero" etiqueta={t.noSeAplica} />
                        ) : null}
                      </span>
                      <Icono nombre="chevR" tamano={16} />
                    </EnlaceFinn>
                  </li>
                ))}
              </ul>
            </>
          )}
          {nueva}
        </>
      )}
    </main>
  );
}
