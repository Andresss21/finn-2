// `/metas` (FT-17; 05 §2.3, §7.2; export de diseño 09a): las metas vigentes en una tarjeta con su resumen, las vencidas
// como filas en «Otras metas», y arriba AV-17 de las vencidas. Dibuja lo que trae el DTO: no calcula montos (PF-3).
// Sin metas: la lista de `categoriasSinMeta`, cada una con su enlace a crear la meta.
import type { MetasDto } from '@finn/aplicacion/consultas/metas';
import { AvisoEnLinea } from '../../../componentes/base/aviso';
import { Icono } from '../../../componentes/base/icono';
import { Vacio } from '../../../componentes/base/vacio';
import { IndicadorEstado } from '../../../componentes/dominio/indicador-estado';
import { Monto } from '../../../componentes/dominio/monto';
import { indicadorDeMeta, ResumenMeta } from '../../../componentes/dominio/resumen-meta';
import { PublicarEncabezado } from '../../../componentes/marco/proveedor-encabezado';
import { EnlaceFinn } from '../../../componentes/navegacion/enlace-finn';
import { formatearFecha } from '../../../formato';
import { metas as t } from '../../../textos/metas';

const BOTON =
  'inline-flex min-h-11 items-center justify-center rounded-control bg-accion px-4 font-semibold text-texto-sobre-accion focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const ENLACE =
  'inline-flex min-h-11 items-center rounded-control px-2 font-semibold text-texto underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const FILA =
  'grid min-h-14 grid-cols-[minmax(0,1fr)_auto_1rem] items-center gap-3 px-4 py-3 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const LISTA = 'overflow-hidden rounded-contenedor bg-superficie shadow-elevacion-1';
const ITEM = 'border-b border-borde-sutil last:border-b-0';
const ITEM_TARJETA = 'flex flex-col gap-3 border-b border-borde-sutil p-4 last:border-b-0';

type Meta = MetasDto['metas'][number];

function Subtitulo({ m }: { readonly m: Meta }) {
  return (
    <>
      {t.tipos[m.tipo]}
      {m.modoMeta === undefined ? '' : ` · ${t.modos[m.modoMeta]}`}
      {m.fechaObjetivoVigente === undefined
        ? ''
        : ` · ${t.fila.para(formatearFecha(m.fechaObjetivoVigente))}`}
    </>
  );
}

function Tarjeta({ m }: { readonly m: Meta }) {
  return (
    <li data-meta={m.id} data-vencida="no" className={ITEM_TARJETA}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-cuerpo min-w-0 font-semibold">{m.categoria.nombre}</h2>
        <span data-objetivo className="text-cuerpo-pequeno text-texto-secundario">
          <Monto centavos={m.monto} />
        </span>
      </div>
      <p className="text-cuerpo-pequeno text-texto-secundario">
        <Subtitulo m={m} />
      </p>
      <ResumenMeta meta={{ ...m, progresoBp: m.progreso }} conseguido={m.disponible} />
      {m.montoPeriodo === undefined ? null : (
        <p className="text-cuerpo-pequeno text-texto-secundario">
          {t.fila.porPeriodo}{' '}
          <span data-monto-periodo>
            <Monto centavos={m.montoPeriodo} />
          </span>
        </p>
      )}
      <div className="flex flex-wrap">
        <EnlaceFinn href={`/metas/${m.id}`} className={ENLACE}>
          {t.fila.editar}
        </EnlaceFinn>
        <EnlaceFinn href={`/presupuesto/categorias/${m.categoria.id}`} className={ENLACE}>
          {t.fila.detalle}
        </EnlaceFinn>
      </div>
    </li>
  );
}

function FilaOtra({ m }: { readonly m: Meta }) {
  const { estado, etiqueta } = indicadorDeMeta({ ...m, progresoBp: m.progreso });
  return (
    <li data-meta={m.id} data-vencida={m.vencida ? 'si' : 'no'} className={ITEM}>
      <EnlaceFinn href={`/metas/${m.id}`} className={FILA}>
        <span className="flex min-w-0 flex-col">
          <span className="text-cuerpo font-semibold">{m.categoria.nombre}</span>
          <span className="text-cuerpo-pequeno text-texto-secundario">
            <Subtitulo m={m} /> · <Monto centavos={m.monto} />
          </span>
        </span>
        <IndicadorEstado estado={estado} etiqueta={etiqueta} />
        <Icono nombre="chevR" tamano={16} />
      </EnlaceFinn>
    </li>
  );
}

function SinMeta({ categorias }: { readonly categorias: MetasDto['categoriasSinMeta'] }) {
  if (categorias.length === 0) return null;
  return (
    <section aria-labelledby="sin-meta" className="flex flex-col gap-2.5">
      <h2 id="sin-meta" className="text-titulo-seccion">
        {t.sinMetaTitulo}
      </h2>
      <ul className={LISTA}>
        {categorias.map((c) => (
          <li key={c.id} data-sin-meta={c.id} className={ITEM}>
            <EnlaceFinn href={`/metas/nueva?categoria=${c.id}`} className={FILA}>
              <span className="flex min-w-0 flex-col">
                <span className="text-cuerpo font-semibold">{c.nombre}</span>
                <span className="text-cuerpo-pequeno text-texto-secundario">{t.sinMeta}</span>
              </span>
              <span />
              <Icono nombre="chevR" tamano={16} />
            </EnlaceFinn>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PantallaMetas({ dto }: { readonly dto: MetasDto }) {
  const { metas, categoriasSinMeta } = dto;
  const nueva = categoriasSinMeta[0];
  const crear = nueva === undefined ? undefined : `/metas/nueva?categoria=${nueva.id}`;
  const pide = metas.filter((m) => !m.vencida);
  const otras = metas.filter((m) => m.vencida);
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-4 lg:mx-0">
      <PublicarEncabezado encabezado={dto} />
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-titulo-pantalla">{t.titulo}</h1>
        {crear === undefined || metas.length === 0 ? null : (
          <EnlaceFinn href={crear} className={BOTON}>
            {t.nuevaMeta}
          </EnlaceFinn>
        )}
      </div>
      {metas
        .filter((m) => m.vencida)
        .map((m) => (
          <div key={m.id} data-aviso-meta={m.id}>
            <AvisoEnLinea
              estado="advertencia"
              titulo={t.vencida.titulo}
              accion={
                <span className="flex flex-wrap">
                  <EnlaceFinn href={`/metas/${m.id}?enfocar=fecha`} className={ENLACE}>
                    {t.vencida.extender}
                  </EnlaceFinn>
                  <EnlaceFinn href={`/metas/${m.id}?enfocar=monto`} className={ENLACE}>
                    {t.vencida.ajustar}
                  </EnlaceFinn>
                </span>
              }
            >
              {t.vencida.texto(
                m.categoria.nombre,
                m.fechaObjetivoVigente === undefined ? '' : formatearFecha(m.fechaObjetivoVigente),
              )}
            </AvisoEnLinea>
          </div>
        ))}
      {metas.length === 0 ? (
        <Vacio
          titulo={t.vacioTitulo}
          texto={crear === undefined ? t.sinCategorias : t.vacioTexto}
          icono="cero"
          accion={
            crear === undefined ? undefined : (
              <EnlaceFinn href={crear} className={BOTON}>
                {t.crearUna}
              </EnlaceFinn>
            )
          }
        />
      ) : null}
      {pide.length === 0 ? null : (
        <ul className={LISTA}>
          {pide.map((m) => (
            <Tarjeta key={m.id} m={m} />
          ))}
        </ul>
      )}
      {otras.length === 0 ? null : (
        <section aria-labelledby="otras" className="flex flex-col gap-2.5">
          <h2 id="otras" className="text-titulo-seccion">
            {t.otras}
          </h2>
          <ul className={LISTA}>
            {otras.map((m) => (
              <FilaOtra key={m.id} m={m} />
            ))}
          </ul>
        </section>
      )}
      {metas.length === 0 ? <SinMeta categorias={categoriasSinMeta} /> : null}
    </main>
  );
}
