'use client';
// `/presupuesto/estructura` (FT-18; 05 §2.3, §4.14): la lista de grupos y categorías con sus enlaces de alta y edición y, de un
// toque, "Subir" y "Bajar" (OP-08 `orden`) con "Deshacer" (OP-08 con los valores intercambiados). El orden nunca depende de
// arrastrar (WCAG 2.5.7). No calcula nada: la posición es la del árbol que entrega `estructura()`.
import type { GrupoDeEstructura } from '@finn/dominio/selectores';
import { useRef } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Icono } from '../../componentes/base/icono';
import { Vacio } from '../../componentes/base/vacio';
import { PaginaFlujoDeRuta, useCerrarFlujo } from '../../componentes/navegacion/flujo-de-ruta';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { useUnToque } from '../../formularios/use-un-toque';
import { editarEnEstructura } from '../../servidor/acciones/categorias';
import { estructura as t } from '../../textos/estructura';
import { Archivadas } from './archivadas';

const RAIZ = '/presupuesto/estructura';
const ENLACE = 'inline-flex min-h-11 items-center px-3 font-semibold text-enlace';
const ENLACE_ANCHO =
  'inline-flex min-h-11 w-full items-center gap-2 px-4 font-semibold text-enlace';
const PRINCIPAL =
  'inline-flex min-h-12 items-center rounded-control bg-accion px-5 font-semibold text-texto-sobre-accion focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

type Tipo = 'grupo' | 'categoria';
interface Hermano {
  readonly tipo: Tipo;
  readonly id: string;
  readonly nombre: string;
  /** Posición desde 1 entre sus hermanos, y cuántos son. */
  readonly pos: number;
  readonly de: number;
}

export function ListaEstructura({
  grupos: todos,
}: {
  readonly grupos: readonly GrupoDeEstructura[];
}) {
  // E4-6: las archivadas (y las de un grupo archivado) salen de la lista y viven en «Archivadas · N» al pie.
  const grupos = todos
    .map((x, i) => ({
      ...x,
      posGrupo: i + 1,
      deCategorias: x.categorias.length,
      categorias: x.categorias.map((c, k) => ({ ...c, pos: k + 1 })).filter((c) => !c.archivada),
    }))
    .filter((x) => !x.grupo.archivado);
  const movido = useRef('');
  const un = useUnToque({
    accion: editarEnEstructura,
    accionInversa: editarEnEstructura,
    inversa: (entrada) => {
      const e = entrada as { tipo: Tipo; id: string; orden: number; esperado: { orden: number } };
      const orden = e.esperado.orden;
      return {
        descripcion: t.movido(movido.current),
        etiqueta: t.deshacer,
        entrada: { tipo: e.tipo, id: e.id, orden, esperado: { orden: e.orden } },
      };
    },
  });
  const ocupado = un.estado === 'enviando' || un.revertir.estado === 'enviando';
  const fallo = un.error ?? un.revertir.error;

  const botones = ({ tipo, id, nombre, pos, de }: Hermano) =>
    ([-1, 1] as const).map((d) =>
      pos + d < 1 || pos + d > de ? null : (
        <Boton
          key={d}
          variante="discreta"
          className="min-w-11 px-0"
          deshabilitado={ocupado}
          aria-label={(d < 0 ? t.subirA : t.bajarA)(nombre)}
          onClick={() => {
            movido.current = nombre;
            void un.tocar({ tipo, id, orden: pos + d, esperado: { orden: pos } });
          }}
        >
          <Icono nombre="chevD" tamano={18} className={d < 0 ? 'rotate-180' : ''} />
        </Boton>
      ),
    );
  const sinNormales = !grupos.some((g) => g.categorias.some((c) => c.clase === 'normal'));
  const cerrar = useCerrarFlujo('/presupuesto', false);

  return (
    <PaginaFlujoDeRuta
      titulo={t.titulo}
      rutaPadre="/presupuesto"
      acciones={
        <Boton onClick={cerrar} className="min-h-12 flex-1">
          {t.listo}
        </Boton>
      }
    >
      <div className="flex flex-col gap-5">
        {un.salida === null ? null : (
          <AvisoEnLinea
            estado="informacion"
            aparecioDespues
            accion={
              <Boton variante="discreta" deshabilitado={ocupado} onClick={() => void un.deshacer()}>
                {un.salida.etiqueta}
              </Boton>
            }
          >
            {un.salida.descripcion}
          </AvisoEnLinea>
        )}
        {fallo === undefined ? null : (
          <AvisoEnLinea estado="problema" aparecioDespues>
            {fallo.mensaje}
          </AvisoEnLinea>
        )}
        {sinNormales ? (
          <Vacio
            titulo={t.vacioTitulo}
            texto={t.vacioTexto}
            icono="grid"
            tono="neutro"
            accion={
              <EnlaceFinn href={`${RAIZ}/plantilla`} className={PRINCIPAL}>
                {t.usarPlantilla}
              </EnlaceFinn>
            }
          />
        ) : null}
        {grupos.map(({ grupo: g, categorias, posGrupo, deCategorias }) => (
          <section key={g.id} aria-labelledby={`g-${g.id}`} className="flex flex-col gap-2">
            <div className="flex items-center gap-x-2">
              <h2
                id={`g-${g.id}`}
                className="text-rotulo min-w-0 flex-1 py-2 text-texto-secundario"
              >
                {g.nombre}
              </h2>
              {g.archivado ? <span className="text-etiqueta">{t.archivado}</span> : null}
              {g.sistema ? (
                <span className="text-etiqueta">{t.delSistema}</span>
              ) : (
                <>
                  <EnlaceFinn
                    href={`${RAIZ}/grupos/${g.id}`}
                    className={ENLACE}
                    aria-label={t.editar(g.nombre)}
                  >
                    {t.editarGrupo}
                  </EnlaceFinn>
                  {botones({
                    tipo: 'grupo',
                    id: g.id,
                    nombre: g.nombre,
                    pos: posGrupo,
                    de: todos.length,
                  })}
                </>
              )}
            </div>
            <div className="overflow-hidden rounded-contenedor bg-superficie shadow-elevacion-1">
              <ul>
                {categorias.map(({ categoria: c, clase, archivada, pos }) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-x-2 border-b border-borde-sutil px-4"
                  >
                    <div className="flex min-h-14 min-w-0 flex-1 flex-col justify-center">
                      {clase === 'normal' ? (
                        <EnlaceFinn
                          href={`${RAIZ}/categorias/${c.id}`}
                          className="text-cuerpo inline-flex min-h-11 min-w-0 items-center font-semibold"
                          aria-label={t.editar(c.nombre)}
                        >
                          {c.nombre}
                        </EnlaceFinn>
                      ) : (
                        <span className="text-cuerpo py-2.5 font-semibold">{c.nombre}</span>
                      )}
                    </div>
                    {archivada ? <span className="text-etiqueta">{t.archivada}</span> : null}
                    {g.sistema
                      ? null
                      : botones({
                          tipo: 'categoria',
                          id: c.id,
                          nombre: c.nombre,
                          pos,
                          de: deCategorias,
                        })}
                  </li>
                ))}
                {categorias.length === 0 ? (
                  <li className="text-cuerpo-pequeno border-b border-borde-sutil px-4 py-3 text-texto-secundario">
                    {t.sinCategorias}
                  </li>
                ) : null}
              </ul>
              {g.sistema || g.archivado ? null : (
                <div>
                  <EnlaceFinn
                    href={`${RAIZ}/categorias/nueva?grupo=${g.id}`}
                    className={ENLACE_ANCHO}
                  >
                    <Icono nombre="plus" tamano={18} />
                    {t.nuevaCategoria}
                    <span className="sr-only"> {t.agregarCategoria(g.nombre)}</span>
                  </EnlaceFinn>
                </div>
              )}
            </div>
          </section>
        ))}
        <Archivadas grupos={todos} />
        <EnlaceFinn
          href={`${RAIZ}/grupos/nuevo`}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-accion-tonal font-semibold text-accion focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco"
        >
          <Icono nombre="plus" tamano={18} />
          {t.nuevoGrupo}
        </EnlaceFinn>
      </div>
    </PaginaFlujoDeRuta>
  );
}
