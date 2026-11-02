// `/metas` (FT-17; 05 §2.3, §7.2): las metas evaluadas en el período activo, las vencidas primero con AV-17. Dibuja lo que trae el
// DTO: no calcula montos (PF-3). El «pide» de cada meta se ve acá y en el detalle de la categoría; la fila de Presupuesto solo
// muestra lo que falta y su indicador. Sin metas: enlace a crear una con `categoriasSinMeta`.
import type { MetasDto } from '@finn/aplicacion/consultas/metas';
import { AvisoEnLinea } from '../../../componentes/base/aviso';
import { Vacio } from '../../../componentes/base/vacio';
import { Monto } from '../../../componentes/dominio/monto';
import { ResumenMeta } from '../../../componentes/dominio/resumen-meta';
import { PublicarEncabezado } from '../../../componentes/marco/proveedor-encabezado';
import { EnlaceFinn } from '../../../componentes/navegacion/enlace-finn';
import { formatearFecha } from '../../../formato';
import { metas as t } from '../../../textos/metas';

const FOCO = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const BOTON = `inline-flex min-h-11 items-center justify-center rounded-control bg-accion px-4 font-semibold text-texto-sobre-accion ${FOCO}`;
const ENLACE = `inline-flex min-h-11 items-center rounded-control px-2 font-semibold text-texto underline ${FOCO}`;

export function PantallaMetas({ dto }: { readonly dto: MetasDto }) {
  const { metas, categoriasSinMeta } = dto;
  const nueva = categoriasSinMeta[0];
  const crear = nueva === undefined ? undefined : `/metas/nueva?categoria=${nueva.id}`;
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-5 px-5 py-4">
      <PublicarEncabezado encabezado={dto} />
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-titulo-pantalla">{t.titulo}</h1>
        {crear === undefined || metas.length === 0 ? null : (
          <EnlaceFinn href={crear} className={BOTON}>
            {t.nuevaMeta}
          </EnlaceFinn>
        )}
      </div>
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
      ) : (
        <ul className="flex flex-col gap-4">
          {metas.map((m) => (
            <li
              key={m.id}
              data-meta={m.id}
              data-vencida={m.vencida ? 'si' : 'no'}
              className="flex flex-col gap-3 rounded-contenedor bg-superficie p-3.5"
            >
              {m.vencida ? (
                <AvisoEnLinea
                  estado="advertencia"
                  titulo={t.vencida.titulo}
                  accion={
                    <span className="flex flex-wrap">
                      <EnlaceFinn href={`/metas/${m.id}`} className={ENLACE}>
                        {t.vencida.extender}
                      </EnlaceFinn>
                      <EnlaceFinn href={`/metas/${m.id}`} className={ENLACE}>
                        {t.vencida.ajustar}
                      </EnlaceFinn>
                    </span>
                  }
                >
                  {t.vencida.texto(
                    m.categoria.nombre,
                    m.fechaObjetivoVigente === undefined
                      ? ''
                      : formatearFecha(m.fechaObjetivoVigente),
                  )}
                </AvisoEnLinea>
              ) : null}
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col">
                  <p className="text-rotulo text-texto-secundario">{m.grupo.nombre}</p>
                  <h2 className="text-titulo-seccion">{m.categoria.nombre}</h2>
                  <p className="text-cuerpo-pequeno text-texto-secundario">
                    {t.tipos[m.tipo]}
                    {m.modoMeta === undefined ? '' : ` · ${t.modos[m.modoMeta]}`}
                    {m.fechaObjetivoVigente === undefined
                      ? ''
                      : ` · ${t.fila.para(formatearFecha(m.fechaObjetivoVigente))}`}
                  </p>
                </div>
                <span data-objetivo className="font-semibold">
                  <Monto centavos={m.monto} />
                </span>
              </div>
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
          ))}
        </ul>
      )}
    </main>
  );
}
