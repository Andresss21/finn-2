'use client';
// `/presupuesto/estructura` (FT-18; 05 §2.3, §4.14): la lista de grupos y categorías con sus enlaces de alta y edición y, de un
// toque, "Subir" y "Bajar" (OP-08 `orden`) con "Deshacer" (OP-08 con los valores intercambiados). El orden nunca depende de
// arrastrar (WCAG 2.5.7). No calcula nada: la posición es la del árbol que entrega `estructura()`.
import type { GrupoDeEstructura } from '@finn/dominio/selectores';
import { useRef } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { useUnToque } from '../../formularios/use-un-toque';
import { editarEnEstructura } from '../../servidor/acciones/categorias';
import { estructura as t } from '../../textos/estructura';

const RAIZ = '/presupuesto/estructura';
const ENLACE = 'inline-flex min-h-11 items-center px-3 font-semibold text-enlace underline';
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

export function ListaEstructura({ grupos }: { readonly grupos: readonly GrupoDeEstructura[] }) {
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
          deshabilitado={ocupado}
          aria-label={(d < 0 ? t.subirA : t.bajarA)(nombre)}
          onClick={() => {
            movido.current = nombre;
            void un.tocar({ tipo, id, orden: pos + d, esperado: { orden: pos } });
          }}
        >
          {d < 0 ? t.subir : t.bajar}
        </Boton>
      ),
    );
  const sinNormales = !grupos.some((g) => g.categorias.some((c) => c.clase === 'normal'));

  return (
    <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre="/presupuesto">
      <div className="flex flex-col gap-4">
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
        <div className="flex flex-wrap gap-2">
          <EnlaceFinn href={`${RAIZ}/grupos/nuevo`} className={PRINCIPAL}>
            {t.nuevoGrupo}
          </EnlaceFinn>
          <EnlaceFinn href={`${RAIZ}/categorias/nueva`} className={ENLACE}>
            {t.nuevaCategoria}
          </EnlaceFinn>
          {sinNormales ? (
            <EnlaceFinn href={`${RAIZ}/plantilla`} className={ENLACE}>
              {t.usarPlantilla}
            </EnlaceFinn>
          ) : null}
        </div>
        {grupos.map(({ grupo: g, categorias }, i) => (
          <section key={g.id} aria-labelledby={`g-${g.id}`}>
            <div className="flex flex-wrap items-center gap-x-2">
              <h2 id={`g-${g.id}`} className="text-titulo-seccion min-w-0 flex-1 py-2">
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
                    pos: i + 1,
                    de: grupos.length,
                  })}
                </>
              )}
            </div>
            <ul>
              {categorias.map(({ categoria: c, clase, archivada }, j) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center gap-x-2 border-t border-borde-sutil"
                >
                  {clase === 'normal' ? (
                    <EnlaceFinn
                      href={`${RAIZ}/categorias/${c.id}`}
                      className="inline-flex min-h-11 min-w-0 flex-1 items-center text-enlace"
                      aria-label={t.editar(c.nombre)}
                    >
                      {c.nombre}
                    </EnlaceFinn>
                  ) : (
                    <span className="min-h-11 min-w-0 flex-1 py-2.5">{c.nombre}</span>
                  )}
                  {archivada ? <span className="text-etiqueta">{t.archivada}</span> : null}
                  {g.sistema
                    ? null
                    : botones({
                        tipo: 'categoria',
                        id: c.id,
                        nombre: c.nombre,
                        pos: j + 1,
                        de: categorias.length,
                      })}
                </li>
              ))}
            </ul>
            {categorias.length === 0 ? (
              <p className="text-cuerpo-pequeno text-texto-secundario">{t.sinCategorias}</p>
            ) : null}
            {g.sistema || g.archivado ? null : (
              <EnlaceFinn href={`${RAIZ}/categorias/nueva?grupo=${g.id}`} className={ENLACE}>
                {t.agregarCategoria(g.nombre)}
              </EnlaceFinn>
            )}
          </section>
        ))}
      </div>
    </PaginaFlujoDeRuta>
  );
}
