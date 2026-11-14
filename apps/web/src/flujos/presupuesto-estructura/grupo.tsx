'use client';
// [CH-272] Un grupo de la estructura (C-46; ESTRUCTURA-Y-COLAPSO §1.1 a §1.3): encabezado con el asa, la flecha y el nombre (que
// colapsan) y «Editar grupo»; abierto, sus categorías con su asa y, al pie, «Nueva categoría»; colapsado, la fila de resumen.
// Pagos de tarjeta va aparte, fijo, sin asa ni flecha. La barra y el resultado los dibuja la lista (`enLugar`), debajo de lo suyo.
// `Asa` es el punto donde el arrastre (el PR siguiente) se engancha: hoy solo abre la barra «Mover».
import type { ReactNode } from 'react';
import { cn } from '../../components/ui/utils';
import { Icono } from '../../componentes/base/icono';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { estructura as t } from '../../textos/estructura';
import type { GrupoVista } from './lugares';

const RAIZ = '/presupuesto/estructura';
const TARJETA = 'overflow-hidden rounded-contenedor bg-superficie shadow-elevacion-1';

export function Asa({
  etiqueta,
  abierta,
  id,
  alTocar,
}: {
  readonly etiqueta: string;
  readonly abierta: boolean;
  readonly id: string;
  readonly alTocar: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      aria-expanded={abierta}
      data-foco={`asa-${id}`}
      onClick={alTocar}
      className="inline-flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-control text-texto-secundario hover:bg-superficie-hundida hover:text-texto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-foco"
    >
      <Icono nombre="grip" />
    </button>
  );
}

export interface PropsGrupo {
  readonly grupo: GrupoVista;
  readonly colapsado: boolean;
  /** Las categorías que no son normales (las de pago) no se editan desde la lista. */
  readonly editable: (categoriaId: string) => boolean;
  readonly abierta: (id: string) => boolean;
  /** La barra y el resultado de una categoría o del grupo; `vacio-{grupoId}` es el lugar del resultado de un grupo recién creado. */
  readonly enLugar: (id: string) => ReactNode;
  readonly alternar: () => void;
  readonly tocarAsa: (tipo: 'grupo' | 'categoria', id: string) => void;
}

export function GrupoEstructura({
  grupo: g,
  colapsado,
  editable,
  abierta,
  enLugar,
  alternar,
  tocarAsa,
}: PropsGrupo) {
  const cats = g.categorias.filter((c) => !c.archivada);
  const vacio = enLugar(`vacio-${g.id}`);
  return (
    <section aria-labelledby={`g-${g.id}`} className="flex flex-col gap-2">
      <div className="flex min-h-11 items-center">
        <Asa
          etiqueta={t.moverGrupo(g.nombre)}
          abierta={abierta(g.id)}
          id={g.id}
          alTocar={() => {
            tocarAsa('grupo', g.id);
          }}
        />
        <h2 id={`g-${g.id}`} className="min-w-0 flex-1">
          <button
            type="button"
            aria-expanded={!colapsado}
            onClick={alternar}
            className="flex min-h-11 w-full items-center gap-2 rounded-control px-1.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco"
          >
            <Icono
              nombre="chevD"
              tamano={18}
              className={cn('fz-chev shrink-0 text-texto-secundario', colapsado && '-rotate-90')}
            />
            <span className="text-rotulo min-w-0 text-texto-secundario">{g.nombre}</span>
          </button>
        </h2>
        <EnlaceFinn
          href={`${RAIZ}/grupos/${g.id}`}
          className="inline-flex min-h-11 items-center px-1.5 text-cuerpo-pequeno font-bold text-enlace"
          aria-label={t.editarGrupoDe(g.nombre)}
        >
          {t.editarGrupo}
        </EnlaceFinn>
      </div>
      {enLugar(g.id)}
      <div className={TARJETA}>
        {colapsado ? (
          <button
            type="button"
            data-resumen
            aria-expanded={false}
            onClick={alternar}
            className="fz-aparece flex min-h-15 w-full flex-col justify-center gap-0.5 px-4 py-2 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-foco"
          >
            <span className="text-cuerpo font-semibold">{t.categorias(cats.length)}</span>
            <span className="text-cuerpo-pequeno text-texto-secundario">
              {t.resumen(cats.map((c) => c.nombre))}
            </span>
          </button>
        ) : (
          <div className="fz-aparece">
            <ul>
              {cats.map((c) => (
                <li key={c.id} data-fila-cat={c.id} className="border-b border-borde-sutil">
                  <div
                    className={cn(
                      'flex min-h-14 items-center gap-0.5 py-1 pr-1.5 pl-1',
                      abierta(c.id) && 'bg-accion-tonal',
                    )}
                  >
                    <Asa
                      etiqueta={t.moverCategoria(c.nombre)}
                      abierta={abierta(c.id)}
                      id={c.id}
                      alTocar={() => {
                        tocarAsa('categoria', c.id);
                      }}
                    />
                    {editable(c.id) ? (
                      <EnlaceFinn
                        href={`${RAIZ}/categorias/${c.id}`}
                        className="text-cuerpo inline-flex min-h-12 min-w-0 flex-1 items-center rounded-lg font-semibold"
                        aria-label={t.editar(c.nombre)}
                      >
                        {c.nombre}
                      </EnlaceFinn>
                    ) : (
                      <span className="text-cuerpo min-w-0 flex-1 py-2.5 font-semibold">
                        {c.nombre}
                      </span>
                    )}
                  </div>
                  {enLugar(c.id)}
                </li>
              ))}
              {cats.length === 0 && vacio === null ? (
                <li className="text-cuerpo-pequeno border-b border-borde-sutil px-4 py-3 text-texto-secundario">
                  {t.sinCategorias}
                </li>
              ) : null}
            </ul>
            {cats.length === 0 ? vacio : null}
            <EnlaceFinn
              href={`${RAIZ}/categorias/nueva?grupo=${g.id}`}
              className="inline-flex min-h-12 w-full items-center gap-2 px-4 text-cuerpo-pequeno font-bold text-enlace"
            >
              <Icono nombre="plus" tamano={18} />
              {t.nuevaCategoria}
              <span className="sr-only"> {t.agregarCategoria(g.nombre)}</span>
            </EnlaceFinn>
          </div>
        )}
      </div>
    </section>
  );
}

/** Pagos de tarjeta (§1.3): fijo, sin asa ni flecha, no se colapsa y no recibe nada; «Lo administra Finn» con el candado. */
export function GrupoSistema({ grupo: g }: { readonly grupo: GrupoVista }) {
  return (
    <section aria-labelledby={`g-${g.id}`} className="flex flex-col gap-2 xl:pt-8">
      <div className="flex min-h-11 items-center gap-2 px-1.5">
        <h2 id={`g-${g.id}`} className="text-rotulo min-w-0 flex-1 text-texto-secundario">
          {g.nombre}
        </h2>
        <span className="text-etiqueta flex items-center gap-1.5 text-texto-terciario">
          <Icono nombre="lock" tamano={16} />
          {t.delSistema}
        </span>
      </div>
      <ul className={TARJETA}>
        {g.categorias
          .filter((c) => !c.archivada)
          .map((c) => (
            <li
              key={c.id}
              className="text-cuerpo flex min-h-14 items-center border-b border-borde-sutil px-4 font-semibold"
            >
              {c.nombre}
            </li>
          ))}
      </ul>
    </section>
  );
}
