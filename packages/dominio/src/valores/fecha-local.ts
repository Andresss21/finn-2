// Fechas de negocio (02 ADR-16, RT-08): fecha local de America/El_Salvador sin hora, como texto
// 'AAAA-MM-DD'. Por dentro, días desde 1970-01-01 con los algoritmos civiles del calendario
// gregoriano proléptico (de fecha a días y de días a fecha). Sin `Date` ni zona horaria.

/** Fecha local 'AAAA-MM-DD'. La comparación de texto es cronológica. */
export type FechaLocal = string & { readonly __marca: 'FechaLocal' };

export interface PartesDeFecha {
  readonly anio: number;
  readonly mes: number;
  readonly dia: number;
}

const FORMATO = /^(\d{4})-(\d{2})-(\d{2})$/;
const ANIO_MAX = 9999;
const DIAS_POR_ERA = 146_097; // 400 años gregorianos
const DE_0000_03_01_A_EPOCA = 719_468;

const piso = (x: number, y: number): number => Math.floor(x / y);

function entero(n: number, que: string): number {
  if (!Number.isSafeInteger(n)) throw new RangeError(`${que}: ${n} no es un entero`);
  return n;
}

const esBisiesto = (anio: number): boolean =>
  anio % 4 === 0 && (anio % 100 !== 0 || anio % 400 === 0);

function diasDelMesDe(anio: number, mes: number): number {
  if (mes === 2) return esBisiesto(anio) ? 29 : 28;
  return mes === 4 || mes === 6 || mes === 9 || mes === 11 ? 30 : 31;
}

const dos = (n: number) => String(n).padStart(2, '0');

/** Construye la fecha si existe y está entre 0000-01-01 y 9999-12-31. */
function desdePartes(anio: number, mes: number, dia: number): FechaLocal {
  const valida =
    Number.isInteger(anio) &&
    anio >= 0 &&
    anio <= ANIO_MAX &&
    Number.isInteger(mes) &&
    mes >= 1 &&
    mes <= 12 &&
    Number.isInteger(dia) &&
    dia >= 1 &&
    dia <= diasDelMesDe(anio, mes);
  if (!valida) throw new RangeError(`fecha inexistente o fuera de rango: ${anio}-${mes}-${dia}`);
  return `${String(anio).padStart(4, '0')}-${dos(mes)}-${dos(dia)}` as FechaLocal;
}

/** Valida el formato estricto 'AAAA-MM-DD' y que el día exista (04 §13.2). */
function desdeTexto(texto: string): FechaLocal {
  const m = FORMATO.exec(texto);
  if (m === null) throw new RangeError(`fecha con formato inválido: "${texto}"`);
  return desdePartes(Number(m[1]), Number(m[2]), Number(m[3]));
}

function partes(f: FechaLocal): PartesDeFecha {
  return { anio: Number(f.slice(0, 4)), mes: Number(f.slice(5, 7)), dia: Number(f.slice(8, 10)) };
}

/** Días desde 1970-01-01 (algoritmo `days_from_civil`; el año empieza el 1 de marzo). */
function aDias(f: FechaLocal): number {
  const { anio, mes, dia } = partes(f);
  const a = mes <= 2 ? anio - 1 : anio;
  const era = piso(a, 400);
  const anioDeEra = a - era * 400;
  const diaDelAnio = piso(153 * (mes > 2 ? mes - 3 : mes + 9) + 2, 5) + dia - 1;
  const diaDeEra = anioDeEra * 365 + piso(anioDeEra, 4) - piso(anioDeEra, 100) + diaDelAnio;
  return era * DIAS_POR_ERA + diaDeEra - DE_0000_03_01_A_EPOCA;
}

/** Fecha de un número de días desde 1970-01-01 (algoritmo `civil_from_days`). */
function desdeDias(dias: number): FechaLocal {
  const z = dias + DE_0000_03_01_A_EPOCA;
  const era = piso(z, DIAS_POR_ERA);
  const diaDeEra = z - era * DIAS_POR_ERA;
  const anioDeEra = piso(
    diaDeEra - piso(diaDeEra, 1460) + piso(diaDeEra, 36_524) - piso(diaDeEra, 146_096),
    365,
  );
  const diaDelAnio = diaDeEra - (365 * anioDeEra + piso(anioDeEra, 4) - piso(anioDeEra, 100));
  const mp = piso(5 * diaDelAnio + 2, 153);
  const dia = diaDelAnio - piso(153 * mp + 2, 5) + 1;
  const mes = mp < 10 ? mp + 3 : mp - 9;
  return desdePartes(anioDeEra + era * 400 + (mes <= 2 ? 1 : 0), mes, dia);
}

const comparar = (a: FechaLocal, b: FechaLocal): -1 | 0 | 1 => (a < b ? -1 : a > b ? 1 : 0);

const sumarDias = (f: FechaLocal, n: number): FechaLocal => desdeDias(aDias(f) + entero(n, 'días'));

/** Días de `desde` a `hasta` (negativo si `hasta` es anterior). */
const diasEntre = (desde: FechaLocal, hasta: FechaLocal): number => aDias(hasta) - aDias(desde);

function diasDelMes(f: FechaLocal): number {
  const { anio, mes } = partes(f);
  return diasDelMesDe(anio, mes);
}

/** IM(m, d) de 01 §4.2.1: el día `dia` del mes de `f`, recortado a los días de ese mes. */
function inicioDeMes(f: FechaLocal, dia: number): FechaLocal {
  if (entero(dia, 'día de inicio') < 1 || dia > 31) throw new RangeError(`día de inicio: ${dia}`);
  const { anio, mes } = partes(f);
  return desdePartes(anio, mes, Math.min(dia, diasDelMesDe(anio, mes)));
}

/** Suma meses conservando el día, recortado al último del mes de llegada (31 ene + 1 → 28 feb). */
function sumarMeses(f: FechaLocal, n: number): FechaLocal {
  const { anio, mes, dia } = partes(f);
  const total = anio * 12 + (mes - 1) + entero(n, 'meses');
  const anioNuevo = piso(total, 12);
  const mesNuevo = total - anioNuevo * 12 + 1;
  return desdePartes(anioNuevo, mesNuevo, Math.min(dia, diasDelMesDe(anioNuevo, mesNuevo)));
}

/** Suma años con el mismo recorte (01 §4.12: 29 de febrero → 28 de febrero). */
const sumarAnios = (f: FechaLocal, n: number): FechaLocal => sumarMeses(f, entero(n, 'años') * 12);

export const FechaLocal = {
  desdeTexto,
  desdePartes,
  partes,
  comparar,
  sumarDias,
  diasEntre,
  diasDelMes,
  inicioDeMes,
  sumarMeses,
  sumarAnios,
} as const;
