// Lista de consumos del detalle de categoría (C-52 §4): orden, filtros, semanas y plegado. Portado sin cambios de
// `docs/anexos/finn-detalle-de-categoria/logica/consumos.js`; solo se le pusieron tipos. Ordena, filtra y agrupa lo que manda
// el servidor (04 §6.3 `consumos`): no suma ni resta montos (PF-3), los grupos solo cuentan filas. `Date` vive acá, en
// `src/formato/` (L7), y solo nombra días.

const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** Lo que la lógica lee de un consumo del DTO. */
export interface ConsumoDeLista {
  readonly fecha: string;
  readonly medio: 'debito' | 'tarjeta';
  readonly noCubierto: number;
}
export type FiltroConsumos = 'todos' | 'nocubiertos' | 'debito' | 'tarjeta';
export interface FiltroVisible {
  readonly clave: FiltroConsumos;
  readonly texto: string;
}
export interface Semana<T> {
  /** El lunes de la semana, `AAAA-MM-DD`: la clave de lo que se abrió o cerró. */
  readonly lunes: string;
  readonly filas: T[];
  titulo: string;
  cuenta: string;
}

function fecha(s: string): Date {
  const [a = 0, m = 1, d = 1] = s.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d));
}
const iso = (d: Date): string => d.toISOString().slice(0, 10);

export function lunesDe(s: string): string {
  const d = fecha(s);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return iso(d);
}

/** filtro: 'todos' | 'nocubiertos' | 'debito' | 'tarjeta'; dia: 'AAAA-MM-DD' o null */
export function filtrar<T extends ConsumoDeLista>(
  consumos: readonly T[],
  filtro: FiltroConsumos,
  dia: string | null,
): T[] {
  return consumos.filter((c) => {
    if (dia !== null && c.fecha !== dia) return false;
    if (filtro === 'nocubiertos') return c.noCubierto > 0;
    if (filtro === 'debito') return c.medio === 'debito';
    if (filtro === 'tarjeta') return c.medio === 'tarjeta';
    return true;
  });
}

/** «Todos · n» siempre; «No cubiertos · k» si k > 0; Débito y Tarjeta solo si hay de los dos. Con uno solo, ninguno. */
export function filtrosVisibles(consumos: readonly ConsumoDeLista[]): FiltroVisible[] {
  const k = consumos.filter((c) => c.noCubierto > 0).length;
  const t = consumos.filter((c) => c.medio === 'tarjeta').length;
  const r: FiltroVisible[] = [{ clave: 'todos', texto: `Todos · ${String(consumos.length)}` }];
  if (k > 0) r.push({ clave: 'nocubiertos', texto: `No cubiertos · ${String(k)}` });
  if (t > 0 && t < consumos.length)
    r.push({ clave: 'debito', texto: 'Débito' }, { clave: 'tarjeta', texto: 'Tarjeta' });
  return r.length > 1 ? r : [];
}

/**
 * Semanas de lunes a domingo, recortadas al período; de la más reciente a la más antigua, y dentro de cada una del consumo más
 * reciente al más antiguo (el servidor los manda al revés: en el orden en que se cubren, D2).
 */
export function agrupar<T extends ConsumoDeLista>(
  consumos: readonly T[],
  periodo: { readonly inicio: string; readonly fin: string },
): Semana<T>[] {
  const grupos: Semana<T>[] = [];
  const porLunes = new Map<string, Semana<T>>();
  for (const c of [...consumos].reverse()) {
    const l = lunesDe(c.fecha);
    let g = porLunes.get(l);
    if (g === undefined) {
      g = { lunes: l, filas: [], titulo: '', cuenta: '' };
      porLunes.set(l, g);
      grupos.push(g);
    }
    g.filas.push(c);
  }
  for (const g of grupos) {
    let a = fecha(g.lunes);
    let b = fecha(g.lunes);
    b.setUTCDate(b.getUTCDate() + 6);
    const ini = fecha(periodo.inicio);
    const fin = fecha(periodo.fin);
    if (a < ini) a = ini;
    if (b > fin) b = fin;
    g.titulo =
      a.getUTCMonth() === b.getUTCMonth()
        ? `${String(a.getUTCDate())}–${String(b.getUTCDate())} ${MES[b.getUTCMonth()] ?? ''}`
        : `${String(a.getUTCDate())} ${MES[a.getUTCMonth()] ?? ''} – ${String(b.getUTCDate())} ${MES[b.getUTCMonth()] ?? ''}`;
    g.cuenta = `${String(g.filas.length)}${g.filas.length === 1 ? ' consumo' : ' consumos'}`;
  }
  return grupos;
}

/**
 * Plegado: con más de 10 consumos y sin filtro ni día, solo la primera semana (la más reciente) arranca abierta. Lo que el
 * usuario abre o cierra se respeta mientras no salga de la pantalla.
 */
export function abierta(
  grupo: { readonly lunes: string },
  indice: number,
  total: number,
  filtro: FiltroConsumos,
  dia: string | null,
  elegidas: Readonly<Record<string, boolean>> | null,
): boolean {
  if (total <= 10 || dia !== null || filtro !== 'todos') return true;
  const elegida = elegidas?.[grupo.lunes];
  if (elegida !== undefined) return elegida;
  return indice === 0;
}

/** La línea que explica el orden de cobertura aparece si hay algún consumo sin cubrir. */
export function explicarOrden(consumos: readonly ConsumoDeLista[]): boolean {
  return consumos.some((c) => c.noCubierto > 0);
}

/** `2026-10-09` → `9 de oct` (C-52 §9: «Consumos del 9 de oct»). */
export function diaDeMes(s: string): string {
  const d = fecha(s);
  return `${String(d.getUTCDate())} de ${MES[d.getUTCMonth()] ?? ''}`;
}

/** `2026-10-09` → `viernes 9 de oct` (el nombre del día en el calendario, C-52 §7). */
export function nombreDelDia(s: string): string {
  return `${DIA[fecha(s).getUTCDay()] ?? ''} ${diaDeMes(s)}`;
}
