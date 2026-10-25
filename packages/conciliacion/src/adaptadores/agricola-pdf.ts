import { Centavos } from '@finn/dominio/valores';
import { ErrorFormato, type Adaptador, type EstadoNormalizado } from '../tipos';
import { buscar, conReferencia, fecha, importe, normalizar } from './comun';

// ⚠ (S6-1): sin muestras reales (TU-14). CSV convertido desde PDF, estructura SINTÉTICA:
//   Fecha de corte,DD/MM/AAAA
//   Saldo final,<deuda>        (positiva en el archivo)
//   VT<n>,DD/MM/AAAA,<descripcion>,<importe>      (sufijo CR = abono; sin sufijo = cargo)
// Solo las filas cuya primera celda empieza con `VT` son movimientos; el resto es ruido del PDF.
const esMovimiento = (f: string[]): boolean => f[0]?.trim().startsWith('VT') === true;

function monto(texto: string, nFila: number): Centavos {
  const m = /^(.*?)\s*(CR)?$/i.exec(texto.trim());
  const valor = importe(m?.[1] ?? texto, nFila);
  return m?.[2] === undefined ? Centavos.negar(valor) : valor;
}

export const agricolaPdf: Adaptador = {
  id: 'ba_tarjeta_pdf_csv',
  tipoCuenta: 'tarjeta',
  detectar: (_texto, filas) => filas.some(esMovimiento),
  extraer(filas) {
    const primera = filas.findIndex(esMovimiento);
    if (primera < 0) throw new ErrorFormato(1, 'no hay movimientos "VT"');
    const corte = buscar(filas, 'Fecha de corte', filas.length);
    const saldo = buscar(filas, 'Saldo final', filas.length);

    const movimientos: EstadoNormalizado['movimientos'] = [];
    filas.forEach((f, i) => {
      if (!esMovimiento(f)) return;
      const nFila = i + 1;
      if (f.length < 4) throw new ErrorFormato(nFila, 'faltan columnas');
      movimientos.push(
        conReferencia(
          {
            indice: movimientos.length,
            fecha: fecha(f[1] ?? '', nFila),
            monto: monto(f[3] ?? '', nFila),
            descripcion: normalizar(f[2] ?? ''),
          },
          f[0],
        ),
      );
    });
    return {
      formato: 'ba_tarjeta_pdf_csv',
      fechaEstado: fecha(corte.valor, corte.fila),
      saldoFinal: Centavos.negar(importe(saldo.valor, saldo.fila)),
      movimientos,
    };
  },
};
