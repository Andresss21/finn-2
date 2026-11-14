// [CH-268] Máscaras de los campos v3 (C-45, C-41; CAMPOS-V3 §5): solo texto, sin aritmética ni flotantes (PF-3). El valor
// del formulario va sin comas («1236.40»); las comas de miles son de la vista. Lo que se envía lo sigue normalizando
// `normalizarMontoEscrito` (05 §5.2) y el servidor valida igual.

/** Dígitos y un punto; hasta `enteros` cifras enteras sin ceros a la izquierda y hasta 2 decimales. */
function mascara(texto: string, enteros: number): string {
  const t = texto.replace(/[^\d.]/g, '');
  const punto = t.indexOf('.');
  const entera = (punto < 0 ? t : t.slice(0, punto)).replace(/^0+(?=\d)/, '').slice(0, enteros);
  if (punto < 0) return entera;
  return `${entera === '' ? '0' : entera}.${t
    .slice(punto + 1)
    .replace(/\./g, '')
    .slice(0, 2)}`;
}

/** Monto escrito → valor sin comas: «1,236.456» → «1236.45»; máximo 9 cifras enteras (el exceso se marca, no se corta). */
export const enmascararMonto = (texto: string): string => mascara(texto, 9);

/** Porcentaje escrito → hasta 3 enteros sin separador y 2 decimales: «1005» → «100». */
export const enmascararPorcentaje = (texto: string): string => mascara(texto, 3);

/** Las comas de miles de la vista: «1236.4» → «1,236.4». */
export function conMiles(valor: string): string {
  const [entera = '', ...resto] = valor.split('.');
  const conComas = entera.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return resto.length === 0 ? conComas : `${conComas}.${resto.join('')}`;
}

/** Al salir del campo, el monto se completa a dos decimales: «1236.4» → «1236.40»; vacío queda vacío. */
export function completarDecimales(valor: string): string {
  if (valor === '') return valor;
  const [entera = '', decimales = ''] = valor.split('.');
  return `${entera === '' ? '0' : entera}.${decimales.padEnd(2, '0')}`;
}

/** Fecha escrita → «dd/mm/aaaa» con las barras puestas; un «AAAA-MM-DD» pegado completo también se acepta. */
export function enmascararFecha(texto: string): string {
  const iso = /^(\d{4})-(\d\d)-(\d\d)$/.exec(texto);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return texto
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/^(\d\d)(\d)/, '$1/$2')
    .replace(/^(\d\d\/\d\d)(\d)/, '$1/$2');
}
