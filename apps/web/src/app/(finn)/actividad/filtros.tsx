'use client';
// Filtros de `/actividad` (FT-24; 05 §2.2): un formulario GET con los parámetros del catálogo. Las listas son `SeleccionNativa`
// (el `<select>` del sistema con el dibujo del export, sin Radix) con `name`; las de fecha y monto son entradas de la base. La
// búsqueda por texto vive en `Buscador` y viaja como campo oculto. El resumen es la pastilla «Filtros · n» del export.
import { useState } from 'react';
import { EntradaTexto } from '../../../componentes/base/campo';
import { Icono } from '../../../componentes/base/icono';
import { SeleccionNativa, type OpcionNativa } from '../../../componentes/base/seleccion-nativa';
import { EnlaceFinn } from '../../../componentes/navegacion/enlace-finn';
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
const RESUMEN = `inline-flex min-h-12 cursor-pointer list-none items-center gap-2 rounded-pastilla bg-superficie-hundida px-4 font-semibold text-texto [&::-webkit-details-marker]:hidden ${FOCO}`;
const BOTON = `inline-flex min-h-11 items-center justify-center rounded-control bg-accion px-4 font-semibold text-texto-sobre-accion ${FOCO}`;
const ENLACE = `inline-flex min-h-11 items-center rounded-control px-2 font-semibold text-texto underline ${FOCO}`;

type Filtros = Readonly<Record<string, string | undefined>>;

const marcada = (r: RefDeFiltro): string =>
  r.archivada === true ? t.archivada(r.nombre) : r.nombre;

export function FormularioFiltros({
  filtros,
  cuentas,
  grupos,
}: {
  /** Los parámetros de la URL, sin `cursor`. */
  readonly filtros: Filtros;
  readonly cuentas: readonly RefDeFiltro[];
  readonly grupos: readonly GrupoDeFiltro[];
}) {
  const { texto, ...avanzados } = filtros;
  const activos = Object.values(avanzados).filter((v) => v !== undefined).length;
  const [valores, setValores] = useState({
    cuenta: filtros['cuenta'] ?? '',
    categoria: filtros['categoria'] ?? '',
    tipo: filtros['tipo'] ?? '',
    estado: filtros['estado'] ?? '',
    origen: filtros['origen'] ?? '',
  });
  const lista = (
    nombre: keyof typeof valores,
    etiqueta: string,
    todas: string,
    opciones: readonly OpcionNativa[],
  ) => (
    <SeleccionNativa
      nombre={nombre}
      etiqueta={etiqueta}
      marcador={todas}
      valor={valores[nombre]}
      alCambiar={(valor) => {
        setValores((v) => ({ ...v, [nombre]: valor }));
      }}
      opciones={[{ valor: '', etiqueta: todas }, ...opciones]}
    />
  );
  const fijas = (mapa: Readonly<Record<string, string>>, guion = false): OpcionNativa[] =>
    Object.entries(mapa).map(([valor, etiqueta]) => ({
      valor: guion ? valor.replaceAll('_', '-') : valor,
      etiqueta,
    }));
  return (
    <details open={activos > 0} className="group flex flex-col gap-3">
      <summary className={RESUMEN} aria-label={activos > 0 ? t.filtrosActivos(activos) : t.filtros}>
        <Icono nombre="filter" tamano={20} />
        {activos > 0 ? `${t.filtros} · ${activos}` : t.filtros}
      </summary>
      <form
        method="get"
        action="/actividad"
        className="mt-3 flex flex-col gap-3 rounded-contenedor bg-superficie p-3.5"
      >
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
        {lista('tipo', t.tipo, t.todos, fijas(t.tipos, true))}
        {lista('estado', t.estado, t.todos, fijas(t.estados))}
        {lista('origen', t.origen, t.todos, fijas(t.origenes))}
        <div className="grid grid-cols-2 gap-3">
          <EntradaTexto
            etiqueta={t.desde}
            type="date"
            name="desde"
            defaultValue={filtros['desde'] ?? ''}
          />
          <EntradaTexto
            etiqueta={t.hasta}
            type="date"
            name="hasta"
            defaultValue={filtros['hasta'] ?? ''}
          />
          <EntradaTexto
            etiqueta={t.montoDesde}
            inputMode="decimal"
            name="monto-desde"
            defaultValue={filtros['monto-desde'] ?? ''}
          />
          <EntradaTexto
            etiqueta={t.montoHasta}
            inputMode="decimal"
            name="monto-hasta"
            defaultValue={filtros['monto-hasta'] ?? ''}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" className={BOTON}>
            {t.aplicar}
          </button>
          {activos > 0 ? (
            <EnlaceFinn
              href={
                texto === undefined ? '/actividad' : `/actividad?texto=${encodeURIComponent(texto)}`
              }
              className={ENLACE}
            >
              {t.quitarFiltros}
            </EnlaceFinn>
          ) : null}
        </div>
      </form>
    </details>
  );
}
