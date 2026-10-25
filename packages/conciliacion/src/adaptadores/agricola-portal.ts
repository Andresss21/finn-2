import { Centavos } from '@finn/dominio/valores';
import { ErrorFormato, type Adaptador, type EstadoNormalizado } from '../tipos';
import {
  buscar,
  conReferencia,
  exigirColumnas,
  fecha,
  importe,
  importeOpcional,
  normalizar,
} from './comun';

// ⚠ (S6-1): sin muestras reales (TU-14). Estructura SINTÉTICA:
//   Fecha de corte,DD/MM/AAAA
//   Saldo al corte,<deuda>     (positiva en el archivo)
//   Autorizacion,Fecha Transaccion,Fecha Aplicada,Concepto,Cargos ($),Abonos ($)
const ENCABEZADO = 'Autorizacion,Fecha Transaccion,Fecha Aplicada,Concepto,Cargos ($),Abonos ($)';
const COLUMNAS = ENCABEZADO.split(',');
const esEncabezado = (f: string[]): boolean => f[0]?.trim() === 'Autorizacion';

export const agricolaPortal: Adaptador = {
  id: 'ba_tarjeta_portal',
  tipoCuenta: 'tarjeta',
  detectar: (texto) => texto.includes(ENCABEZADO),
  extraer(filas) {
    const inicio = filas.findIndex(esEncabezado);
    if (inicio < 0) throw new ErrorFormato(1, 'falta el encabezado "Autorizacion,"');
    exigirColumnas(filas, inicio, COLUMNAS);
    const corte = buscar(filas, 'Fecha de corte', inicio);
    const saldo = buscar(filas, 'Saldo al corte', inicio);

    const movimientos: EstadoNormalizado['movimientos'] = [];
    for (let i = inicio + 1; i < filas.length; i++) {
      const f = filas[i] ?? [];
      const nFila = i + 1;
      if (f.length < COLUMNAS.length) throw new ErrorFormato(nFila, 'faltan columnas');
      const cargo = importeOpcional(f[4], nFila);
      const abono = importeOpcional(f[5], nFila);
      movimientos.push(
        conReferencia(
          {
            indice: movimientos.length,
            fecha: fecha(f[1] ?? '', nFila),
            // Cargo = compra = efecto negativo; abono = pago = positivo (04 §9.4).
            monto: Centavos.restar(abono, cargo),
            descripcion: normalizar(f[3] ?? ''),
          },
          f[0],
        ),
      );
    }
    return {
      formato: 'ba_tarjeta_portal',
      fechaEstado: fecha(corte.valor, corte.fila),
      saldoFinal: Centavos.negar(importe(saldo.valor, saldo.fila)),
      movimientos,
    };
  },
};
