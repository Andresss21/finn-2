// Los filtros activos de `/actividad` como fichas con su «x» (export 02, estado «filtrado»). Cada ficha es un enlace a la misma
// lista sin esos parámetros: no hay estado de cliente. Los nombres salen de las listas que ya trae la página.
import { Icono } from '../../../componentes/base/icono';
import { EnlaceFinn } from '../../../componentes/navegacion/enlace-finn';
import { actividad as t } from '../../../textos/actividad';
import type { GrupoDeFiltro, RefDeFiltro } from './filtros';

type Filtros = Readonly<Record<string, string | undefined>>;

const FICHA =
  'inline-flex min-h-11 items-center gap-1 rounded-pastilla bg-superficie-hundida pr-2 pl-3.5 text-cuerpo-pequeno font-semibold text-texto focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

const corta = (f: string): string => f.split('-').reverse().slice(0, 2).join('/');

/** Las fichas, en el orden de los campos; `quitar` son los parámetros que borra cada una. */
function fichasDe(f: Filtros, cuentas: readonly RefDeFiltro[], grupos: readonly GrupoDeFiltro[]) {
  const fichas: { etiqueta: string; quitar: readonly string[] }[] = [];
  const nombre = (lista: readonly RefDeFiltro[], id: string) =>
    lista.find((r) => r.id === id)?.nombre ?? id;
  const clave = (mapa: Readonly<Record<string, string>>, v: string) =>
    Object.entries(mapa).find(([k]) => k.replaceAll('_', '-') === v)?.[1] ?? v;
  if (f['cuenta'] !== undefined)
    fichas.push({ etiqueta: nombre(cuentas, f['cuenta']), quitar: ['cuenta'] });
  if (f['categoria'] !== undefined)
    fichas.push({
      etiqueta: nombre(
        grupos.flatMap((g) => g.categorias),
        f['categoria'],
      ),
      quitar: ['categoria'],
    });
  if (f['tipo'] !== undefined)
    fichas.push({ etiqueta: clave(t.tipos, f['tipo']), quitar: ['tipo'] });
  if (f['estado'] !== undefined)
    fichas.push({ etiqueta: clave(t.estados, f['estado']), quitar: ['estado'] });
  if (f['origen'] !== undefined)
    fichas.push({ etiqueta: clave(t.origenes, f['origen']), quitar: ['origen'] });
  if (f['desde'] !== undefined || f['hasta'] !== undefined)
    fichas.push({
      etiqueta: `${f['desde'] === undefined ? '…' : corta(f['desde'])} – ${f['hasta'] === undefined ? '…' : corta(f['hasta'])}`,
      quitar: ['desde', 'hasta'],
    });
  if (f['monto-desde'] !== undefined || f['monto-hasta'] !== undefined)
    fichas.push({
      etiqueta: `$${f['monto-desde'] ?? '…'} – $${f['monto-hasta'] ?? '…'}`,
      quitar: ['monto-desde', 'monto-hasta'],
    });
  return fichas;
}

export function FichasDeFiltros({
  filtros,
  cuentas,
  grupos,
  hrefSin,
}: {
  /** Los filtros de la URL, sin `cursor`. */
  readonly filtros: Filtros;
  readonly cuentas: readonly RefDeFiltro[];
  readonly grupos: readonly GrupoDeFiltro[];
  /** La lista sin esos parámetros (y sin cursor). */
  readonly hrefSin: (claves: readonly string[]) => string;
}) {
  const fichas = fichasDe(filtros, cuentas, grupos);
  if (fichas.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2" data-filtros-activos>
      {fichas.map((x) => (
        <li key={x.quitar.join()}>
          <EnlaceFinn
            href={hrefSin(x.quitar)}
            aria-label={t.quitarFiltro(x.etiqueta)}
            className={FICHA}
          >
            {x.etiqueta}
            <Icono nombre="x" tamano={16} />
          </EnlaceFinn>
        </li>
      ))}
    </ul>
  );
}
