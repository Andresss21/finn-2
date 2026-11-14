'use client';
// [CH-273] Grupos que se colapsan en `/presupuesto` (C-47; docs/anexos/finn-estructura/ESTRUCTURA-Y-COLAPSO.md §2 a §5).
// Lo colapsado es una preferencia del dispositivo: `finn.colapsados.presupuesto` en `localStorage` (con `cliente/almacen.ts`),
// aparte de la de Estructura. No suma montos (PF-3): el resumen dibuja `grupos[].totales` y cuenta filas, que no es dinero.
import type { PresupuestoDto } from '@finn/aplicacion/consultas/presupuesto';
import { createContext, use, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { almacen } from '../../../cliente/almacen';
import { Icono } from '../../../componentes/base/icono';
import { indicadores, type Indicador } from '../../../componentes/dominio/fila-categoria';
import {
  IndicadorEstado,
  type EstadoFinanciero,
} from '../../../componentes/dominio/indicador-estado';
import { Monto } from '../../../componentes/dominio/monto';
import { dominio } from '../../../textos/dominio';
import { presupuesto as t } from '../../../textos/presupuesto';

const CLAVE = 'finn.colapsados.presupuesto';
const FOCO = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const APARECE = 'animate-[fz-v-in_var(--duracion-rapida)_var(--curva-estandar)]';
const COLUMNAS = 'md:grid md:grid-cols-[minmax(0,1.6fr)_repeat(3,110px)] md:gap-x-3 md:gap-y-1';
type GrupoDto = PresupuestoDto['grupos'][number];
type FilaDto = GrupoDto['categorias'][number];
const CELDA = 'hidden text-right md:row-span-2 md:row-start-1 md:block md:self-center';
// L13: las clases se arman acá, fuera del JSX, como mapas de literales.
const TODOS = `inline-flex min-h-11 items-center px-1 text-etiqueta font-bold text-enlace ${FOCO}`;
const BASE_ENCABEZADO = `flex items-center justify-between gap-3 px-1 md:pt-3.5 md:pb-1 md:pl-3 ${COLUMNAS}`;
const ENCABEZADO = {
  abierto: `${BASE_ENCABEZADO} md:pr-17`,
  cerrado: `${BASE_ENCABEZADO} md:pr-3`,
};
const BOTON_GRUPO = `flex min-h-11 min-w-0 items-center gap-2 text-left uppercase ${FOCO}`;
const GIRO = 'transition-transform duration-(--duracion-normal) ease-(--curva-estandar)';
const FLECHA = { abierta: GIRO, colapsada: `${GIRO} -rotate-90` };
const COLUMNA = {
  asignado: `${CELDA} md:col-start-2`,
  gastado: `${CELDA} md:col-start-3`,
  disponible: `${CELDA} md:col-start-4`,
};
const TARJETA_RESUMEN = `rounded-contenedor bg-superficie shadow-elevacion-1 md:hidden ${APARECE}`;
const BOTON_RESUMEN = `flex min-h-15 w-full flex-col gap-2 rounded-contenedor px-4 py-3.5 text-left ${FOCO}`;

/** El texto guardado → los ids de grupo. Cualquier cosa que no sea una lista de textos cuenta como ninguno. */
export function leerColapsados(texto: string | null): string[] {
  try {
    const valor: unknown = JSON.parse(texto ?? '[]');
    return Array.isArray(valor) ? valor.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

const oyentes = new Set<() => void>();
const suscribir = (alCambiar: () => void): (() => void) => {
  oyentes.add(alCambiar);
  return () => oyentes.delete(alCambiar);
};

interface Colapso {
  /** Sin filtro (§2): con uno, los grupos se ven abiertos y sin flecha. */
  readonly activo: boolean;
  readonly colapsado: (id: string) => boolean;
  readonly alternar: (id: string, nombre: string) => void;
}
const Contexto = createContext<Colapso>({
  activo: false,
  colapsado: () => false,
  alternar: () => undefined,
});

export function ColapsoPresupuesto({
  ids,
  activo,
  children,
}: {
  readonly ids: readonly string[];
  readonly activo: boolean;
  readonly children: ReactNode;
}) {
  const crudo = useSyncExternalStore(
    suscribir,
    () => almacen.leerLocal(CLAVE),
    () => null,
  );
  const clave = ids.join(' ');
  // Un id que ya no existe se ignora; la primera vez, todo abierto.
  const guardados = useMemo(
    () => leerColapsados(crudo).filter((id) => clave.split(' ').includes(id)),
    [crudo, clave],
  );
  const [anuncio, setAnuncio] = useState('');
  const guardar = (lista: readonly string[], texto: string): void => {
    almacen.escribirLocal(CLAVE, JSON.stringify(ids.filter((id) => lista.includes(id))));
    for (const o of oyentes) o();
    setAnuncio(texto);
  };
  const colapso: Colapso = {
    activo,
    colapsado: (id) => activo && guardados.includes(id),
    alternar: (id, nombre) => {
      if (guardados.includes(id))
        guardar(
          guardados.filter((g) => g !== id),
          t.colapsar.expandiste(nombre),
        );
      else guardar([...guardados, id], t.colapsar.colapsaste(nombre));
    },
  };
  const todos = ids.length > 0 && ids.every((id) => guardados.includes(id));
  return (
    <Contexto value={colapso}>
      {activo ? (
        // Teléfono: debajo de los filtros, a la derecha; computadora: arriba de la tabla (`-order-1`).
        <div className="-order-1 -my-1.5 flex justify-end md:my-0 md:pr-3">
          <button
            type="button"
            onClick={() => {
              if (todos) guardar([], t.colapsar.expandisteTodos);
              else guardar(ids, t.colapsar.colapsasteTodos);
            }}
            className={TODOS}
          >
            {todos ? t.colapsar.expandirTodos : t.colapsar.todos}
          </button>
        </div>
      ) : null}
      {children}
      <p role="status" data-anuncio="presupuesto" className="sr-only">
        {anuncio}
      </p>
    </Contexto>
  );
}

/** Disponible del grupo (§2): mayor que 0 positivo; 0 sin color; negativo, deuda si todos sus sobregiros son de tarjeta. */
function estadoDelGrupo(
  disponible: GrupoDto['totales']['disponible'],
  filas: readonly FilaDto[],
): EstadoFinanciero | undefined {
  if (disponible > 0) return 'positivo';
  if (disponible === 0) return undefined;
  const sobregiros = filas.flatMap((f) => (f.sobregiro === null ? [] : [f.sobregiro.tipo]));
  return sobregiros.length > 0 && sobregiros.every((s) => s === 'tarjeta')
    ? 'deuda-sin-respaldo'
    : 'problema';
}

/** Los avisos de las filas con su etiqueta, agrupados y contados; «Meta cubierta» no se repite (§2). */
function avisosDelGrupo(filas: readonly FilaDto[]): (Indicador & { readonly n: number })[] {
  const lista: (Indicador & { n: number })[] = [];
  for (const i of filas.flatMap(indicadores)) {
    if (i.etiqueta === dominio.metaCubierta) continue;
    const ya = lista.find((a) => a.etiqueta === i.etiqueta);
    if (ya === undefined) lista.push({ ...i, n: 1 });
    else ya.n += 1;
  }
  return lista;
}

function Avisos({ lista }: { readonly lista: readonly (Indicador & { readonly n: number })[] }) {
  return lista.length === 0 ? null : (
    <span className="flex flex-wrap gap-x-3 gap-y-1 normal-case tracking-normal">
      {lista.map((a) => (
        <IndicadorEstado
          key={a.etiqueta}
          estado={a.estado}
          etiqueta={t.colapsar.aviso(a.etiqueta, a.n)}
        />
      ))}
    </span>
  );
}

export function GrupoPresupuesto({
  grupo,
  filas,
  totales,
  cerrado,
  children,
}: {
  readonly grupo: { readonly id: string; readonly nombre: string };
  readonly filas: readonly FilaDto[];
  readonly totales: GrupoDto['totales'];
  readonly cerrado: boolean;
  readonly children: ReactNode;
}) {
  const { activo, colapsado: esColapsado, alternar } = use(Contexto);
  const colapsado = esColapsado(grupo.id);
  const estado = estadoDelGrupo(totales.disponible, filas);
  const avisos = colapsado ? avisosDelGrupo(filas) : [];
  const conEstado = estado === undefined ? {} : { estado };
  const tocar = () => {
    alternar(grupo.id, grupo.nombre);
  };
  return (
    <section data-seccion={grupo.id} className="flex flex-col gap-2 md:gap-0">
      <div className={cerrado ? ENCABEZADO.cerrado : ENCABEZADO.abierto}>
        <h2 className="t-rotulo flex min-w-0 flex-1 items-center gap-2 text-texto-secundario md:col-start-1 md:row-start-1">
          {activo ? (
            <button
              type="button"
              aria-expanded={!colapsado}
              onClick={tocar}
              className={BOTON_GRUPO}
            >
              <span className="flex">
                <Icono
                  nombre="chevD"
                  tamano={18}
                  className={colapsado ? FLECHA.colapsada : FLECHA.abierta}
                />
              </span>
              <span>{grupo.nombre}</span>
            </button>
          ) : (
            <span>{grupo.nombre}</span>
          )}
          {activo ? (
            <span
              data-cantidad-grupo
              className="hidden text-cuerpo-pequeno normal-case tracking-normal md:inline"
            >
              · {t.colapsar.categorias(filas.length)}
            </span>
          ) : null}
        </h2>
        <span className="text-cuerpo-pequeno font-semibold md:hidden">
          <span className="sr-only">{t.grupoTotal(grupo.nombre)} </span>
          <Monto centavos={totales.disponible} />
        </span>
        {colapsado ? (
          <>
            <span data-avisos-grupo className="hidden md:col-start-1 md:row-start-2 md:flex">
              <Avisos lista={avisos} />
            </span>
            <span data-columnas-grupo className="contents">
              <span data-columna="asignado" className={COLUMNA.asignado}>
                <span className="sr-only">{dominio.asignado} </span>
                <Monto centavos={totales.asignado} />
              </span>
              <span data-columna="gastado" className={COLUMNA.gastado}>
                <span className="sr-only">{dominio.gastado} </span>
                <Monto centavos={totales.gastado} />
              </span>
              <span data-columna="disponible" className={COLUMNA.disponible}>
                <span className="sr-only">{dominio.disponible} </span>
                <Monto centavos={totales.disponible} rol="cifra" {...conEstado} />
              </span>
            </span>
          </>
        ) : null}
      </div>
      {colapsado ? (
        <div className={TARJETA_RESUMEN}>
          <button
            type="button"
            data-resumen-grupo
            aria-expanded={false}
            onClick={tocar}
            className={BOTON_RESUMEN}
          >
            <span className="flex w-full items-baseline justify-between gap-2.5">
              <span data-resumen-cantidad className="text-cuerpo font-semibold text-texto">
                {t.colapsar.categorias(filas.length)}
              </span>
              <span data-resumen-disponible>
                <span className="sr-only">{dominio.disponible} </span>
                <Monto centavos={totales.disponible} rol="cifra" {...conEstado} />
              </span>
            </span>
            <span data-resumen-montos className="text-cuerpo-pequeno text-texto-secundario">
              {dominio.asignado} <Monto centavos={totales.asignado} /> · {dominio.gastado}{' '}
              <Monto centavos={totales.gastado} />
            </span>
            {avisos.length === 0 ? null : (
              <span data-resumen-avisos className="flex">
                <Avisos lista={avisos} />
              </span>
            )}
          </button>
        </div>
      ) : (
        <div className={activo ? APARECE : ''}>{children}</div>
      )}
    </section>
  );
}
