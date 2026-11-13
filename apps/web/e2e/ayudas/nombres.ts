// `empiezaPor`: un nombre accesible que empieza por `texto` (las filas de un índice cuyo nombre es título y resumen, CH-251).
export const empiezaPor = (texto: string): RegExp =>
  new RegExp(`^${texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
