'use client';
// «Archivadas · N» al pie de Estructura (E4-6, E4-31; OP-10, 05 §4.14): las categorías archivadas, plegadas, con «Desarchivar» de un
// toque y, si su grupo también está archivado, «Desarchivar también {grupo}» (`desarchivarGrupo = true`). El resultado queda en el
// lugar con «Archivarla de nuevo», que abre el flujo largo de Archivar. No calcula nada (PF-3): lo que se dice sale de `estructura()`.
import type { GrupoDeEstructura } from '@finn/dominio/selectores';
import { useEffect, useRef, useState } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Icono } from '../../componentes/base/icono';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { useUnToque } from '../../formularios/use-un-toque';
import { desarchivarCategoria } from '../../servidor/acciones/categorias';
import { estructuraEntrega4 as t } from '../../textos/estructura-entrega-4';

const FOCO = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

interface Pedido {
  readonly id: string;
  readonly nombre: string;
  readonly grupo: string;
  readonly conGrupo: boolean;
}

interface Archivada extends Pedido {
  readonly grupoArchivado: boolean;
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
      })),
  );
}

export function Archivadas({ grupos }: { readonly grupos: readonly GrupoDeEstructura[] }) {
  const lista = archivadasDe(grupos);
  const un = useUnToque({ accion: desarchivarCategoria });
  const pedido = useRef<Pedido | undefined>(undefined);
  const [resultado, setResultado] = useState<Pedido | undefined>();
  const { exito } = un;
  useEffect(() => {
    if (exito !== undefined) setResultado(pedido.current);
  }, [exito]);
  const ocupado = un.estado === 'enviando';
  if (lista.length === 0 && resultado === undefined) return null;
  const tocar = (p: Pedido) => {
    pedido.current = p;
    setResultado(undefined);
    void un.tocar({ categoriaId: p.id, ...(p.conGrupo ? { desarchivarGrupo: true } : {}) });
  };
  return (
    <details open={resultado !== undefined || undefined} className="group flex flex-col gap-2">
      <summary
        className={`flex min-h-11 cursor-pointer list-none items-center gap-2 text-rotulo text-texto-secundario [&::-webkit-details-marker]:hidden ${FOCO}`}
      >
        <span className="group-open:rotate-90">
          <Icono nombre="chevR" tamano={16} />
        </span>
        {t.archivadas(lista.length)}
      </summary>
      <div className="flex flex-col gap-2">
        {resultado === undefined ? null : (
          <AvisoEnLinea
            estado="informacion"
            aparecioDespues
            accion={
              <EnlaceFinn
                href={`/presupuesto/categorias/${resultado.id}/archivar`}
                className="inline-flex min-h-11 items-center font-bold text-enlace"
              >
                {t.archivarDeNuevo}
              </EnlaceFinn>
            }
          >
            {resultado.conGrupo
              ? t.desarchivasteConGrupo(resultado.nombre, resultado.grupo)
              : t.desarchivaste(resultado.nombre, resultado.grupo)}
          </AvisoEnLinea>
        )}
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
                    {c.grupoArchivado ? t.deGrupoArchivado(c.grupo) : t.deGrupo(c.grupo)}
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
