'use client';
// Filtros de `/actividad` (FT-24; 05 §2.2; ACT-02, ACT-05, ACT-06): un formulario GET con los parámetros del catálogo. En computadora es
// la columna fija «Filtros» de 320 px (`FormularioFiltros`); en teléfono, un botón «Filtros · n» junto al buscador abre una hoja
// inferior con el mismo formulario (`BotonFiltros`), con «Quitar filtros» y «Ver resultados» en el pie. Todas las listas son `SeleccionNativa`;
// Desde y Hasta usan `EntradaFecha` (dd/mm/aaaa) y viajan como `AAAA-MM-DD` en campos ocultos. La búsqueda vive en `Buscador` y viaja como campo oculto.
import type { FechaLocal } from '@finn/dominio/valores';
import { useId, useState, type ReactNode } from 'react';
import { EntradaTexto } from '../../../componentes/base/campo';
import { Icono } from '../../../componentes/base/icono';
import { SeleccionNativa, type OpcionNativa } from '../../../componentes/base/seleccion-nativa';
import { EntradaFecha } from '../../../componentes/formularios/entrada-fecha';
import { EnlaceFinn } from '../../../componentes/navegacion/enlace-finn';
import { SuperpuestoDiferido } from '../../../componentes/navegacion/hoja-diferida';
import { actividad as t } from '../../../textos/actividad';

export interface RefDeFiltro {
  readonly id: string;
  readonly nombre: string;
  readonly archivada?: true;
}
export interface GrupoDeFiltro {
  readonly nombre: string;
  readonly categorias: readonly RefDeFiltro[];
}

const FOCO = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const BOTON = `inline-flex min-h-11 items-center justify-center rounded-control bg-accion px-4 font-bold text-texto-sobre-accion ${FOCO}`;
const TONAL = `inline-flex min-h-11 items-center justify-center rounded-control bg-accion-tonal px-4 font-bold text-accion ${FOCO}`;
const TONAL_PIE = `${TONAL} flex-1`;
const BOTON_PIE = `${BOTON} flex-1`;
const DISPARADOR = `inline-flex min-h-12 shrink-0 cursor-pointer items-center gap-1.5 rounded-pastilla px-4 text-etiqueta font-bold @[996px]:hidden ${FOCO}`;
const ID_HOJA = 'formulario-filtros-hoja';

type Filtros = Readonly<Record<string, string | undefined>>;

const marcada = (r: RefDeFiltro): string =>
  r.archivada === true ? t.archivada(r.nombre) : r.nombre;

interface PropsFiltros {
  /** Los parámetros de la URL, sin `cursor`. */
  readonly filtros: Filtros;
  readonly cuentas: readonly RefDeFiltro[];
  readonly grupos: readonly GrupoDeFiltro[];
  /** [CH-250] `conteo` de `actividad()`: cuántas coinciden con los filtros de la URL («Ver N resultados»). */
  readonly conteo?: number;
}

const contar = (filtros: Filtros): number =>
  Object.entries(filtros).filter(([k, v]) => k !== 'texto' && v !== undefined).length;

const sinFiltros = (texto: string | undefined): string =>
  texto === undefined ? '/actividad' : `/actividad?texto=${encodeURIComponent(texto)}`;

/** El formulario GET con todos los campos; el pie lo pone quien lo usa (la columna o la hoja). */
function Campos({
  id,
  filtros,
  cuentas,
  grupos,
  pie,
}: PropsFiltros & { readonly id: string; readonly pie: ReactNode }) {
  const { texto } = filtros;
  const [valores, setValores] = useState({
    cuenta: filtros['cuenta'] ?? '',
    categoria: filtros['categoria'] ?? '',
    tipo: filtros['tipo'] ?? '',
    estado: filtros['estado'] ?? '',
    origen: filtros['origen'] ?? '',
    desde: filtros['desde'] ?? '',
    hasta: filtros['hasta'] ?? '',
  });
  const poner = (nombre: keyof typeof valores) => (valor: string) => {
    setValores((v) => ({ ...v, [nombre]: valor }));
  };
  const lista = (
    nombre: 'cuenta' | 'categoria' | 'tipo' | 'estado' | 'origen',
    etiqueta: string,
    todas: string,
    opciones: readonly OpcionNativa[],
  ) => (
    <SeleccionNativa
      nombre={nombre}
      etiqueta={etiqueta}
      marcador={todas}
      valor={valores[nombre]}
      alCambiar={poner(nombre)}
      opciones={[{ valor: '', etiqueta: todas }, ...opciones]}
    />
  );
  const rotulos = (mapa: Readonly<Record<string, string>>): readonly OpcionNativa[] =>
    Object.entries(mapa).map(([valor, etiqueta]) => ({ valor, etiqueta }));
  const fecha = (nombre: 'desde' | 'hasta', etiqueta: string) => (
    <>
      <input type="hidden" name={nombre} value={valores[nombre]} />
      <EntradaFecha
        nombre=""
        etiqueta={etiqueta}
        valor={valores[nombre] as FechaLocal}
        alCambiar={poner(nombre)}
        sinVistaPrevia
        sinOpcional
        avisarVacio
      />
    </>
  );
  return (
    <form id={id} method="get" action="/actividad" className="flex flex-col gap-3">
      {texto === undefined ? null : <input type="hidden" name="texto" value={texto} />}
      {lista(
        'cuenta',
        t.cuenta,
        t.todas,
        cuentas.map((c) => ({ valor: c.id, etiqueta: marcada(c), icono: 'wallet' as const })),
      )}
      {lista(
        'categoria',
        t.categoria,
        t.todas,
        grupos.flatMap((g) =>
          g.categorias.map((c) => ({ valor: c.id, etiqueta: marcada(c), grupo: g.nombre })),
        ),
      )}
      {lista(
        'tipo',
        t.tipo,
        t.todos,
        Object.entries(t.tipos).map(([valor, etiqueta]) => ({
          valor: valor.replaceAll('_', '-'),
          etiqueta,
        })),
      )}
      {lista('estado', t.estadoBancario, t.todos, rotulos(t.estados))}
      {lista('origen', t.origen, t.todos, rotulos(t.origenes))}
      <div className="flex flex-col gap-3">
        {fecha('desde', t.desde)}
        {fecha('hasta', t.hasta)}
        <EntradaTexto
          etiqueta={t.montoDesde}
          sinOpcional
          inputMode="decimal"
          name="monto-desde"
          prefijo="$"
          defaultValue={filtros['monto-desde'] ?? ''}
        />
        <EntradaTexto
          etiqueta={t.montoHasta}
          sinOpcional
          inputMode="decimal"
          name="monto-hasta"
          prefijo="$"
          defaultValue={filtros['monto-hasta'] ?? ''}
        />
      </div>
      {pie}
    </form>
  );
}

/** La columna fija de computadora (320 px, D-8): el panel «Filtros» siempre a la vista. Oculta en teléfono, donde va la hoja. */
export function FormularioFiltros(p: PropsFiltros) {
  const activos = contar(p.filtros);
  const id = useId();
  return (
    <section
      data-filtros
      aria-label={t.filtros}
      className="hidden flex-col gap-3 rounded-contenedor bg-superficie p-3.5 @[996px]:flex"
    >
      <h2 className="text-titulo-seccion">
        {activos > 0 ? `${t.filtros} · ${String(activos)}` : t.filtros}
      </h2>
      <Campos
        id={id}
        {...p}
        pie={
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" className={BOTON}>
              {t.aplicar}
            </button>
            {activos > 0 ? (
              <EnlaceFinn href={sinFiltros(p.filtros.texto)} className={TONAL}>
                {t.quitarFiltros}
              </EnlaceFinn>
            ) : null}
          </div>
        }
      />
    </section>
  );
}

/** El botón «Filtros · n» junto al buscador (teléfono) y la hoja inferior que abre con el mismo formulario. */
export function BotonFiltros(p: PropsFiltros) {
  const [abierta, setAbierta] = useState(false);
  const activos = contar(p.filtros);
  return (
    <>
      <button
        type="button"
        data-boton-filtros
        aria-haspopup="dialog"
        aria-label={activos > 0 ? t.filtrosActivos(activos) : t.filtros}
        onClick={() => {
          setAbierta(true);
        }}
        className={[
          DISPARADOR,
          activos > 0 ? 'bg-texto text-fondo' : 'bg-superficie-hundida text-texto',
        ].join(' ')}
      >
        <Icono nombre="filter" tamano={18} />
        {activos > 0 ? `${t.filtros} · ${String(activos)}` : t.filtros}
      </button>
      {abierta ? (
        <SuperpuestoDiferido
          titulo={t.filtros}
          desde="abajo"
          alCerrar={() => {
            setAbierta(false);
          }}
          acciones={
            <>
              {activos > 0 ? (
                <EnlaceFinn href={sinFiltros(p.filtros.texto)} className={TONAL_PIE}>
                  {t.quitarFiltros}
                </EnlaceFinn>
              ) : null}
              <button type="submit" form={ID_HOJA} className={BOTON_PIE}>
                {p.conteo === undefined ? t.verResultados : t.verNResultados(p.conteo)}
              </button>
            </>
          }
        >
          <Campos id={ID_HOJA} {...p} pie={null} />
        </SuperpuestoDiferido>
      ) : null}
    </>
  );
}
