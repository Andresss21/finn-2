'use client';
// «Archivadas · N» al pie de Estructura (E4-6, E4-31; OP-10, 05 §4.14): las categorías archivadas, plegadas, con «Desarchivar» de un
// toque y, si su grupo también está archivado, «Desarchivar también {grupo}» (`desarchivarGrupo = true`). [CH-278] El resultado es
// la etiqueta «Desarchivada» con «Archivarla de nuevo» en la fila, ya en su grupo: la dibuja la lista (`alDesarchivar`, C-50).
// El error sigue como aviso en línea. No calcula nada (PF-3): lo que se dice sale de `estructura()`.
import type { GrupoDeEstructura } from '@finn/dominio/selectores';
import { useEffect, useRef } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Icono } from '../../componentes/base/icono';
import { formatearFecha } from '../../formato';
import { useUnToque } from '../../formularios/use-un-toque';
import { desarchivarCategoria } from '../../servidor/acciones/categorias';
import { estructuraEntrega4 as t } from '../../textos/estructura-entrega-4';

const RESUMEN =
  'flex min-h-11 cursor-pointer list-none items-center gap-2 text-rotulo text-texto-secundario focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco [&::-webkit-details-marker]:hidden';

export interface Desarchivada {
  readonly id: string;
  readonly nombre: string;
  readonly grupo: string;
  readonly conGrupo: boolean;
}

interface Archivada extends Desarchivada {
  readonly grupoArchivado: boolean;
  /** [CH-254] De `estructura()`; falta en las archivadas antes de que Finn la guardara. */
  readonly archivadaEl?: string;
}

/** Las categorías archivadas, con su grupo; las de un grupo archivado también cuentan (el grupo no se ve en la lista). */
export function archivadasDe(grupos: readonly GrupoDeEstructura[]): Archivada[] {
  return grupos.flatMap(({ grupo: g, categorias }) =>
    categorias
      .filter((c) => c.archivada || g.archivado)
      .map((c): Archivada => ({
        id: c.categoria.id,
        nombre: c.categoria.nombre,
        grupo: g.nombre,
        conGrupo: false,
        grupoArchivado: g.archivado,
        ...(c.archivadaEl === undefined ? {} : { archivadaEl: c.archivadaEl }),
      })),
  );
}

export function Archivadas({
  grupos,
  alDesarchivar,
}: {
  readonly grupos: readonly GrupoDeEstructura[];
  readonly alDesarchivar: (d: Desarchivada) => void;
}) {
  const lista = archivadasDe(grupos);
  const un = useUnToque({ accion: desarchivarCategoria });
  const pedido = useRef<Desarchivada | undefined>(undefined);
  const avisar = useRef(alDesarchivar);
  useEffect(() => {
    avisar.current = alDesarchivar;
  });
  const { exito } = un;
  useEffect(() => {
    if (exito !== undefined && pedido.current !== undefined) avisar.current(pedido.current);
  }, [exito]);
  const ocupado = un.estado === 'enviando';
  if (lista.length === 0) return null;
  const tocar = (p: Desarchivada) => {
    pedido.current = p;
    void un.tocar({ categoriaId: p.id, ...(p.conGrupo ? { desarchivarGrupo: true } : {}) });
  };
  return (
    <details className="group flex flex-col gap-2">
      <summary className={RESUMEN}>
        <span className="group-open:rotate-90">
          <Icono nombre="chevR" tamano={16} />
        </span>
        {t.archivadas(lista.length)}
      </summary>
      <div className="flex flex-col gap-2">
        {un.error === undefined ? null : (
          <AvisoEnLinea estado="problema" aparecioDespues>
            {un.error.mensaje}
          </AvisoEnLinea>
        )}
        <ul className="overflow-hidden rounded-contenedor bg-superficie shadow-elevacion-1">
          {lista.map((c) => (
            <li
              key={c.id}
              data-archivada={c.id}
              className="flex flex-col gap-2 border-b border-borde-sutil px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-col">
                  <span className="text-cuerpo font-semibold">{c.nombre}</span>
                  <span className="text-cuerpo-pequeno text-texto-secundario">
                    {c.grupoArchivado
                      ? t.deGrupoArchivado(c.grupo)
                      : c.archivadaEl === undefined
                        ? t.deGrupo(c.grupo)
                        : t.deGrupoEl(c.grupo, formatearFecha(c.archivadaEl))}
                  </span>
                </div>
                {c.grupoArchivado ? null : (
                  <Boton
                    variante="secundaria"
                    deshabilitado={ocupado}
                    onClick={() => {
                      tocar(c);
                    }}
                  >
                    {t.desarchivar}
                  </Boton>
                )}
              </div>
              {c.grupoArchivado ? (
                <div className="flex flex-col gap-2">
                  <p className="text-cuerpo-pequeno text-texto-secundario">
                    {t.grupoEstaArchivado(c.grupo)}
                  </p>
                  <Boton
                    variante="secundaria"
                    deshabilitado={ocupado}
                    onClick={() => {
                      tocar({ ...c, conGrupo: true });
                    }}
                  >
                    {t.desarchivarTambien(c.grupo)}
                  </Boton>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
