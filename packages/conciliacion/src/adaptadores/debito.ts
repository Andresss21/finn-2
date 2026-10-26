import { Centavos } from '@finn/dominio/valores';
import { ErrorFormato, type EstadoNormalizado, type IdFormatoCsv } from '../tipos';
import {
  buscar,
  conReferencia,
  exigirColumnas,
  fecha,
  importe,
  importeOpcional,
  normalizar,
} from './comun';

/**
 * Cuerpo común de los dos débitos (BAC y Agrícola), ⚠ sintético (S6-1): preámbulo `Fecha de corte`
 * y `Saldo Final` (positivo = fondos), luego encabezado y filas con débito y crédito en columnas
 * separadas. El efecto en la cuenta es crédito − débito (04 §9.4).
 */
export function extraerDebito(
  filas: string[][],
  formato: IdFormatoCsv,
  columnas: string[],
): EstadoNormalizado {
  const inicio = filas.findIndex((f) => f[0]?.trim() === columnas[0]);
  if (inicio < 0) throw new ErrorFormato(1, `falta la sección "${columnas[0] ?? ''},"`);
  exigirColumnas(filas, inicio, columnas);
  const corte = buscar(filas, 'Fecha de corte', inicio);
  const saldo = buscar(filas, 'Saldo Final', inicio);

  const movimientos: EstadoNormalizado['movimientos'] = [];
  for (let i = inicio + 1; i < filas.length; i++) {
    const f = filas[i] ?? [];
    const nFila = i + 1;
    if (f.length < columnas.length) throw new ErrorFormato(nFila, 'faltan columnas');
    movimientos.push(
      conReferencia(
        {
          indice: movimientos.length,
          fecha: fecha(f[0] ?? '', nFila),
          monto: Centavos.restar(importeOpcional(f[4], nFila), importeOpcional(f[3], nFila)),
          descripcion: normalizar(f[1] ?? ''),
        },
        f[2],
      ),
    );
  }
  return {
    formato,
    fechaEstado: fecha(corte.valor, corte.fila),
    saldoFinal: importe(saldo.valor, saldo.fila),
    movimientos,
  };
}
