// [CH-272] C-46: los lugares de la estructura, sin React (ESTRUCTURA-Y-COLAPSO §1.4, §1.5 y §5; la especificación es
// `docs/anexos/finn-estructura/logica/estructura.js`). Un lugar es la posición en pantalla (sin archivadas ni grupos archivados ni
// Pagos de tarjeta); OP-08 recibe la posición desde 1 en la lista completa, que sí los cuenta (04 §3.2). Lo usan la barra
// «Mover» y, en el PR siguiente, el arrastre: los dos producen el mismo `Movimiento`.
import { estructura as t } from '../../textos/estructura';

export interface CatVista {
  readonly id: string;
  readonly nombre: string;
  readonly archivada: boolean;
}
export interface GrupoVista {
  readonly id: string;
  readonly nombre: string;
  readonly archivado: boolean;
  readonly sistema: boolean;
  readonly categorias: readonly CatVista[];
}
export type Arbol = readonly GrupoVista[];
/** Un lugar en pantalla: el grupo y la posición desde 0 sin la categoría que se mueve. */
export interface Lugar {
  readonly grupoId: string;
  readonly idx: number;
}
interface Valores {
  readonly grupoId?: string;
  readonly orden: number;
}
export type EntradaMover = Valores & {
  readonly tipo: 'grupo' | 'categoria';
  readonly id: string;
  readonly esperado: Valores;
};
export interface Movimiento {
  readonly despues: Arbol;
  readonly entrada: EntradaMover;
  /** OP-08 con los valores intercambiados: «Deshacer». */
  readonly inversa: EntradaMover;
  readonly texto: string;
  readonly volvio: string;
  readonly estadoBarra: string;
}

export function ordinal(i: number, n: number, fem: boolean): string {
  if (n === 1) return fem ? 'la única' : 'el único';
  if (i === n - 1 && n > 2) return fem ? 'la última' : 'el último';
  const o = (fem ? t.ordinalesF : t.ordinalesM)[i] ?? `${String(i + 1)}.${fem ? 'ª' : 'º'}`;
  return `${fem ? 'la' : 'el'} ${o}`;
}

/** [CH-275] El ordinal de «→ segunda en Comida fuera»: sin artículo. */
export const sinArticulo = (o: string): string => o.replace(/^(la|el) /, '');

export const usuarios = (a: Arbol): GrupoVista[] => a.filter((g) => !g.archivado && !g.sistema);
const visibles = (g: GrupoVista): CatVista[] => g.categorias.filter((c) => !c.archivada);
const grupoDe = (a: Arbol, cid: string): GrupoVista | undefined =>
  a.find((g) => g.categorias.some((c) => c.id === cid));

/** La posición desde 1 en la lista completa que deja `id` en el lugar `idx` de las visibles. */
function ordenEn(
  todos: readonly { id: string }[],
  vis: readonly { id: string }[],
  id: string,
  idx: number,
) {
  const resto = todos.filter((x) => x.id !== id).map((x) => x.id);
  const otros = vis.filter((x) => x.id !== id).map((x) => x.id);
  const ancla = otros[idx];
  if (ancla !== undefined) return resto.indexOf(ancla) + 1;
  const ultimo = otros.at(-1);
  return ultimo === undefined ? resto.length + 1 : resto.indexOf(ultimo) + 2;
}
function insertar<T extends { id: string }>(xs: readonly T[], x: T, orden: number): T[] {
  const r = xs.filter((y) => y.id !== x.id);
  r.splice(orden - 1, 0, x);
  return r;
}

export function lugarDeCategoria(a: Arbol, cid: string) {
  const g = grupoDe(a, cid);
  if (g === undefined) return undefined;
  const vis = visibles(g);
  return { grupo: g, idx: vis.findIndex((c) => c.id === cid), n: vis.length };
}
const describir = (a: Arbol, cid: string): [string, string, string] => {
  const l = lugarDeCategoria(a, cid);
  const c = l?.grupo.categorias.find((x) => x.id === cid);
  return [c?.nombre ?? '', ordinal(l?.idx ?? 0, l?.n ?? 1, true), l?.grupo.nombre ?? ''];
};
/** «{categoría} es {la ordinal} de {grupo}.» y el anuncio al abrir la barra. */
export const estadoCategoria = (a: Arbol, cid: string) => t.esDe(...describir(a, cid));
export const anuncioCategoria = (a: Arbol, cid: string) => t.anuncioMover(...describir(a, cid));

/** Los lugares posibles de una categoría, en el orden de la pantalla. */
function lugares(a: Arbol, cid: string): Lugar[] {
  return usuarios(a).flatMap((g) =>
    Array.from({ length: visibles(g).filter((c) => c.id !== cid).length + 1 }, (_, idx) => ({
      grupoId: g.id,
      idx,
    })),
  );
}
/** «Subir» (−1) o «Bajar» (+1): cruzan de grupo; `undefined` en el primer o el último lugar. */
export function vecino(a: Arbol, cid: string, paso: -1 | 1): Lugar | undefined {
  const l = lugarDeCategoria(a, cid);
  const ls = lugares(a, cid);
  const i = ls.findIndex((x) => x.grupoId === l?.grupo.id && x.idx === l.idx);
  return i < 0 ? undefined : ls[i + paso];
}

export function moverCategoria(a: Arbol, cid: string, destino: Lugar): Movimiento | undefined {
  const origen = grupoDe(a, cid);
  const d = a.find((g) => g.id === destino.grupoId);
  const c = origen?.categorias.find((x) => x.id === cid);
  if (origen === undefined || d === undefined || c === undefined) return undefined;
  const antes = { orden: origen.categorias.indexOf(c) + 1, grupoId: origen.id };
  const ahora = { orden: ordenEn(d.categorias, visibles(d), cid, destino.idx), grupoId: d.id };
  const cruza = origen.id !== d.id;
  if (!cruza && antes.orden === ahora.orden) return undefined;
  const despues = a.map((g) =>
    g.id === d.id
      ? { ...g, categorias: insertar(g.categorias, c, ahora.orden) }
      : g.id === origen.id
        ? { ...g, categorias: g.categorias.filter((x) => x.id !== cid) }
        : g,
  );
  const valores = (v: typeof antes): Valores =>
    cruza ? { grupoId: v.grupoId, orden: v.orden } : { orden: v.orden };
  const [nombre, ord, grupo] = describir(despues, cid);
  return {
    despues,
    entrada: { tipo: 'categoria', id: cid, ...valores(ahora), esperado: valores(antes) },
    inversa: { tipo: 'categoria', id: cid, ...valores(antes), esperado: valores(ahora) },
    texto: cruza ? t.movidaAGrupo(nombre, grupo, ord) : t.movidaEnGrupo(nombre, ord, grupo),
    volvio: t.volvio(...describir(a, cid)),
    estadoBarra: t.esDe(nombre, ord, grupo),
  };
}

export function lugarDeGrupo(a: Arbol, gid: string) {
  const us = usuarios(a);
  return { idx: us.findIndex((g) => g.id === gid), n: us.length };
}
export const estadoGrupo = (a: Arbol, gid: string): string => {
  const { idx, n } = lugarDeGrupo(a, gid);
  return t.esGrupo(a.find((g) => g.id === gid)?.nombre ?? '', ordinal(idx, n, false));
};
/** El lugar de «Subir» o «Bajar» de un grupo entre los de usuario; `undefined` en los extremos. */
export function vecinoDeGrupo(a: Arbol, gid: string, paso: -1 | 1): number | undefined {
  const { idx, n } = lugarDeGrupo(a, gid);
  const r = idx + paso;
  return idx < 0 || r < 0 || r > n - 1 ? undefined : r;
}

export function moverGrupo(a: Arbol, gid: string, idx: number): Movimiento | undefined {
  const g = a.find((x) => x.id === gid);
  if (g === undefined) return undefined;
  const antes = a.indexOf(g) + 1;
  const ahora = ordenEn(a, usuarios(a), gid, idx);
  if (antes === ahora) return undefined;
  const despues = insertar(a, g, ahora);
  const { idx: i, n } = lugarDeGrupo(despues, gid);
  return {
    despues,
    entrada: { tipo: 'grupo', id: gid, orden: ahora, esperado: { orden: antes } },
    inversa: { tipo: 'grupo', id: gid, orden: antes, esperado: { orden: ahora } },
    texto: t.grupoMovido(g.nombre, ordinal(i, n, false)),
    volvio: t.grupoVolvio(g.nombre),
    estadoBarra: t.esGrupo(g.nombre, ordinal(i, n, false)),
  };
}
