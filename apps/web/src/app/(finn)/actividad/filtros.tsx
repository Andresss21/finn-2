// Filtros de `/actividad` (FT-24; 05 §2.2): un formulario GET con los parámetros del catálogo, sin estado de cliente. Cada filtro
// es un campo nativo con su etiqueta; los de fecha y monto son entradas de texto de la base. La búsqueda por texto vive en
// `Buscador` y viaja como campo oculto.
import { EntradaTexto } from '../../../componentes/base/campo';
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
const CAMPO = `min-h-12 rounded-control border border-borde-control bg-superficie px-2 text-texto ${FOCO}`;
const RESUMEN = `min-h-11 cursor-pointer font-semibold ${FOCO}`;
const BOTON = `inline-flex min-h-11 items-center justify-center rounded-control bg-accion px-4 font-semibold text-texto-sobre-accion ${FOCO}`;
const ENLACE = `inline-flex min-h-11 items-center rounded-control px-2 font-semibold text-texto underline ${FOCO}`;

type Filtros = Readonly<Record<string, string | undefined>>;

function Lista({
  nombre,
  etiqueta,
  vacio,
  valor,
  children,
}: {
  readonly nombre: string;
  readonly etiqueta: string;
  readonly vacio: string;
  readonly valor: string | undefined;
  readonly children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-cuerpo-pequeno">
      {etiqueta}
      <select name={nombre} defaultValue={valor ?? ''} className={CAMPO}>
        <option value="">{vacio}</option>
        {children}
      </select>
    </label>
  );
}

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
  const hay = Object.values(avanzados).some((v) => v !== undefined);
  return (
    <details open={hay} className="rounded-contenedor bg-superficie p-3.5">
      <summary className={RESUMEN}>{t.filtros}</summary>
      <form method="get" action="/actividad" className="mt-3 flex flex-col gap-3">
        {texto === undefined ? null : <input type="hidden" name="texto" value={texto} />}
        <Lista nombre="cuenta" etiqueta={t.cuenta} vacio={t.todas} valor={filtros['cuenta']}>
          {cuentas.map((c) => (
            <option key={c.id} value={c.id}>
              {marcada(c)}
            </option>
          ))}
        </Lista>
        <Lista
          nombre="categoria"
          etiqueta={t.categoria}
          vacio={t.todas}
          valor={filtros['categoria']}
        >
          {grupos.map((g) => (
            <optgroup key={g.nombre} label={g.nombre}>
              {g.categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {marcada(c)}
                </option>
              ))}
            </optgroup>
          ))}
        </Lista>
        <Lista nombre="tipo" etiqueta={t.tipo} vacio={t.todos} valor={filtros['tipo']}>
          {Object.entries(t.tipos).map(([valor, nombre]) => (
            <option key={valor} value={valor.replaceAll('_', '-')}>
              {nombre}
            </option>
          ))}
        </Lista>
        <Lista nombre="estado" etiqueta={t.estado} vacio={t.todos} valor={filtros['estado']}>
          {Object.entries(t.estados).map(([valor, nombre]) => (
            <option key={valor} value={valor}>
              {nombre}
            </option>
          ))}
        </Lista>
        <Lista nombre="origen" etiqueta={t.origen} vacio={t.todos} valor={filtros['origen']}>
          {Object.entries(t.origenes).map(([valor, nombre]) => (
            <option key={valor} value={valor}>
              {nombre}
            </option>
          ))}
        </Lista>
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
          {hay ? (
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
