// Textos de Inicio (FT-08; 05 §2.3, §12; 06-identidad-visual §4). Voseo (05 §12.2). Los montos llegan ya formateados (5.4). Los
// avisos de AV-09 y AV-20 son los del billete (`dominio.billete`); las propuestas son de FT-62 y de la segunda parte de FT-08.
import { glosario } from './glosario.ts';

export const inicio = {
  titulo: 'Inicio',
  quedan: (dias: number) =>
    dias === 0
      ? 'Hoy es el último día del período'
      : `${dias === 1 ? 'Queda' : 'Quedan'} ${dias} ${dias === 1 ? 'día' : 'días'} del período`,
  verDetalle: 'Ver cómo se compone',
  atencion: 'Necesita tu atención',
  bandeja: (n: number) => `${n} por revisar`,
  marcarLeido: 'Marcar como leído',
  marcando: 'Marcando…',
  sobregiro: 'Sobregiro',
  reducira: (monto: string) => `Reducirá ${glosario.listoParaAsignar} en ${monto} al cierre.`,
  deudaTarjeta: (monto: string) =>
    `Pagaste con tarjeta ${monto} más de lo asignado. Esa deuda todavía no está reservada.`,
  verCategoria: (categoria: string) => `Ver ${categoria}`,
  faltaReservar: (tarjeta: string) => `${tarjeta}: ${glosario.teFaltaReservar.toLowerCase()}`,
  pagoExcedente: (tarjeta: string) => `${tarjeta}: ${glosario.pagasteDeMas.toLowerCase()}`,
  metaVencida: (categoria: string) => `${categoria}: meta vencida`,
  hallazgo: {
    camino: (exceso: string, categoria: string, fin: string) =>
      `Vas camino a pasarte ${exceso} en ${categoria} antes del ${fin}.`,
    ya: (sobregiro: string, categoria: string, exceso: string, fin: string) =>
      `Ya te pasaste ${sobregiro} en ${categoria} y, a este ritmo, llegarías a ${exceso} el ${fin}.`,
    mover: (exceso: string, origen: string) => `Mover ${exceso} desde ${origen}`,
    asignar: (exceso: string) => `Asignar ${exceso}`,
    revisar: (categoria: string) => `Revisar ${categoria}`,
  },
  patrimonio: {
    titulo: glosario.patrimonio,
    activos: 'Activos',
    deudas: 'Deudas',
  },
} as const;
