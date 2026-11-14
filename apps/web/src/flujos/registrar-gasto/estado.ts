// [CH-276, CH-277] El estado de «¿Quién paga?» y «¿En qué categorías?» de `/registrar/gasto` (C-45 §5 y §10, C-49 §3 y §4): los
// montos que se ven en cada fila, los mensajes según cuándo se marca cada error, el motivo de «Guardar» y las líneas que viajan.
// Los montos los propone `formularios/reparto` (PF-3 ampliado por CH-276); el servidor sigue validando Σ líneas = total.
import type { Centavos } from '@finn/dominio/valores';
import { formatearMonto } from '../../formato';
import {
  centavosEscritos,
  centesimasEscritas,
  diferencia,
  partesIguales,
  porcentajesIguales,
  repartir,
  textoDeCentavos,
  textoDeCentesimas,
  type ModoReparto,
  type Reparto,
} from '../../formularios/reparto';
import { base } from '../../textos/base';
import { registrarGasto as t } from '../../textos/registrar-gasto';
import {
  DEUDOR_NUEVO,
  MAXIMO_PARTES,
  parteVacia,
  type CamposDeRegistro as Campos,
  type Parte,
} from './campos';

export const NUEVA = 'nueva:';
const CIEN = 10000;

/** Cuándo se marca: lo que falta, al salir del campo (`personas`, `categorias`); todo, al tocar Guardar (`enviado`). */
export interface Marcas {
  readonly personas: boolean;
  readonly categorias: boolean;
  readonly enviado: boolean;
}

export interface Resumen {
  readonly texto: string;
  /** Cierra: «Repartido …» en positivo. */
  readonly ok: boolean;
  /** Es un error marcado (en problema); si no, una ayuda. */
  readonly error: boolean;
}

export interface EstadoDelGasto {
  readonly total: Centavos;
  readonly errorTotal: string | undefined;
  /** Lo que reparten las categorías: el total o la parte de Vos. */
  readonly mia: Centavos;
  readonly personas: Reparto;
  readonly errorConQuien: string | undefined;
  readonly resumenPersonas: Resumen | undefined;
  readonly categorias: Reparto;
  readonly errorFilas: readonly (string | undefined)[];
  readonly resumenCategorias: Resumen | undefined;
  readonly lineas: number;
  readonly enElMaximo: boolean;
  readonly motivo: string | undefined;
  readonly listo: boolean;
}

const fmt = (c: Centavos): string => formatearMonto(c);

/**
 * Con alguien y la parte de Vos en $0.00 el gasto entero va a Por cobrar: no hay línea de Vos ni de categorías (OP-20: cada
 * línea > 0, CB-28) y «¿En qué categorías?» no pide nada. C-45 y C-49 no lo dicen; se sigue de OP-20.
 */
const sinParteMia = (c: Campos, mia: Centavos): boolean =>
  c.conAlguien && c.personas.length > 0 && mia <= 0;

/** El error de un reparto según su modo (C-45 §5): en el momento lo que sobra; al salir o al guardar, lo que falta. */
function errorDe(
  r: Reparto,
  modo: Campos['modoPersonas'],
  total: Centavos,
  falta: boolean,
  sobra: (monto: string) => string,
  noCierra: (suma: string) => string,
): string | undefined {
  if (modo === 'iguales') return undefined;
  if (modo === 'porcentaje') {
    if (r.pasaDe100) return t.cadaParte;
    if (r.pctSuma > CIEN)
      return t.sobranPct(textoDeCentesimas(r.pctSuma), textoDeCentesimas(r.pctSuma - CIEN));
    return r.pctSuma < CIEN && falta
      ? t.faltaPct(
          textoDeCentesimas(r.pctSuma),
          textoDeCentesimas(CIEN - r.pctSuma),
          fmt(diferencia(total, r.suma)),
        )
      : undefined;
  }
  if (r.suma > total) return sobra(fmt(diferencia(r.suma, total)));
  return r.suma !== total && falta ? noCierra(fmt(r.suma)) : undefined;
}

const cierra = (r: Reparto, modo: Campos['modoPersonas'], total: Centavos): boolean =>
  r.suma === total && !r.pasaDe100 && (modo !== 'porcentaje' || r.pctSuma === CIEN);

function resumen(error: string | undefined, ok: boolean, suma: Centavos, de: Centavos): Resumen {
  if (error !== undefined) return { texto: error, ok: false, error: true };
  return ok
    ? { texto: t.repartido(fmt(suma), fmt(de)), ok: true, error: false }
    : { texto: t.faltaRepartirV3(fmt(diferencia(de, suma))), ok: false, error: false };
}

export function estadoDelGasto(c: Campos, m: Marcas): EstadoDelGasto {
  const total = centavosEscritos(c.total);
  const conPersonas = c.conAlguien && c.personas.length > 0;
  const personas = repartir(total, conPersonas ? c.modoPersonas : 'montos', [
    c.vos,
    ...(conPersonas ? c.personas : []),
  ]);
  const mia = conPersonas ? (personas.montos[0] ?? total) : total;
  const errorPersonas = conPersonas
    ? errorDe(personas, c.modoPersonas, total, m.personas || m.enviado, t.pasanElTotal, (s) =>
        t.partesSuman(s, fmt(total)),
      )
    : undefined;
  const personasCierran = !c.conAlguien || (conPersonas && cierra(personas, c.modoPersonas, total));

  const varias = c.varias && c.filas.length > 1;
  const filas = varias ? c.filas : c.filas.slice(0, 1);
  // Todo va a Por cobrar: sin parte de Vos no hay líneas de categoría (OP-20, cada línea > 0) ni categoría que pedir
  const sinParte = sinParteMia(c, mia);
  const categorias = varias
    ? repartir(mia, c.modoCategorias, filas)
    : repartir(mia, 'montos', [{ monto: '', pct: '', auto: true }]);
  const sinElegir = c.conAlguien && !varias ? t.elegiCategoriaTuParte : t.elegiCategoria;
  const errorFilas = filas.map((f) =>
    sinParte
      ? undefined
      : f.categoriaId === '' && m.enviado
        ? sinElegir
        : varias && c.modoCategorias === 'porcentaje' && centesimasEscritas(f.pct) > CIEN
          ? t.cadaParte
          : undefined,
  );
  const errorCategorias =
    varias && !sinParte
      ? errorDe(
          categorias,
          c.modoCategorias,
          mia,
          m.categorias || m.enviado,
          (s) => t.categoriasPasan(c.conAlguien, s),
          () => t.faltaRepartirV3(fmt(diferencia(mia, categorias.suma))),
        )
      : undefined;
  const categoriasCierran = !varias || sinParte || cierra(categorias, c.modoCategorias, mia);

  const errorTotal = total <= 0 && m.enviado ? base.montoMayorQueCero : undefined;
  const errorConQuien =
    c.conAlguien && c.personas.length === 0 && m.enviado ? t.elegiConQuien : undefined;
  const lineas = (sinParte ? 0 : filas.length) + (c.conAlguien ? c.personas.length : 0);
  const marcados = [errorTotal, errorConQuien, ...errorFilas].filter(Boolean).length;
  const sinCategoria = !sinParte && filas.some((f) => f.categoriaId === '');
  // C-49 §3: el primer motivo que aplique; con dos errores marcados o más, cuántos campos corregir (C-45 §5)
  const motivo =
    marcados >= 2
      ? base.corregirCampos(marcados)
      : total <= 0
        ? t.motivoMonto
        : c.conAlguien && c.personas.length === 0
          ? t.elegiConQuien
          : !personasCierran
            ? t.motivoPartes
            : sinCategoria
              ? varias
                ? t.motivoFilas
                : t.motivoCategoria
              : !categoriasCierran
                ? t.motivoCategorias(c.conAlguien)
                : undefined;
  return {
    total,
    errorTotal,
    mia,
    personas,
    errorConQuien,
    resumenPersonas: conPersonas
      ? resumen(errorPersonas, personasCierran, personas.suma, total)
      : undefined,
    categorias,
    errorFilas,
    resumenCategorias:
      varias && !sinParte
        ? resumen(errorCategorias, categoriasCierran, categorias.suma, mia)
        : undefined,
    lineas,
    enElMaximo: lineas >= MAXIMO_PARTES,
    motivo,
    listo: motivo === undefined && lineas <= MAXIMO_PARTES,
  };
}

/**
 * Al cambiar de modo o de cantidad (C-45 §10, C-49 §2): en Porcentaje, lo mismo para cada fila; en Montos, partes iguales ya
 * escritas; el resto, a la primera. En partes iguales no hay nada que escribir.
 */
export function propuesta<F extends { readonly monto: string; readonly pct: string }>(
  modo: ModoReparto,
  total: Centavos,
  filas: readonly F[],
): F[] {
  if (modo === 'porcentaje') {
    const pcts = porcentajesIguales(filas.length);
    return filas.map((f, i) => ({ ...f, pct: pcts[i] ?? '' }));
  }
  if (modo === 'iguales' || total <= 0) return [...filas];
  const montos = partesIguales(total, filas.length);
  return filas.map((f, i) => ({ ...f, monto: textoDeCentavos(montos[i] ?? total) }));
}

/** Al editar (C-49 §5) cada parte conserva su línea, así OP-28 la reconoce (CB-03). */
const conLinea = (x: { readonly lineaId?: string | undefined }) =>
  x.lineaId === undefined ? {} : { lineaId: x.lineaId };

/** Las líneas de OP-20: una por categoría y una por cada persona (por cobrar); una persona nueva se crea con la transacción. */
export function lineasDe(c: Campos, e: EstadoDelGasto): Parte[] {
  const filas = sinParteMia(c, e.mia)
    ? []
    : c.varias && c.filas.length > 1
      ? c.filas
      : c.filas.slice(0, 1);
  return [
    ...filas.map((f, i) => ({
      ...parteVacia(),
      monto: textoDeCentavos(e.categorias.montos[i] ?? e.mia),
      categoriaId: f.categoriaId,
      ...conLinea(f),
    })),
    ...(c.conAlguien ? c.personas : []).map((p, i) => ({
      ...parteVacia(),
      monto: textoDeCentavos(e.personas.montos[i + 1] ?? e.mia),
      destino: 'por_cobrar' as const,
      ...conLinea(p),
      ...(p.clave.startsWith(NUEVA)
        ? { deudorId: DEUDOR_NUEVO, deudorNuevo: p.clave.slice(NUEVA.length) }
        : { deudorId: p.clave }),
    })),
  ];
}
