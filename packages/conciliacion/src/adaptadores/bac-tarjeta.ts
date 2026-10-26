import { Centavos } from '@finn/dominio/valores';
import { ErrorFormato, type Adaptador, type EstadoNormalizado } from '../tipos';
import { buscar, conReferencia, exigirColumnas, fecha, importe, normalizar } from './comun';

// ⚠ (S6-1): sin muestras reales (TU-13). La estructura es SINTÉTICA y se rehace con PRU-MAN-CONC-001:
//   Pro000000000000duct,<producto>
//   Fecha de corte,DD/MM/AAAA
//   Saldo final,<deuda>        (deuda positiva en el archivo)
//   Date,Description,Reference,Amount
//   DD/MM/AAAA,<texto>,<referencia>,<importe>   (cargo positivo, pago negativo)
const COLUMNAS = ['Date', 'Description', 'Reference', 'Amount'];

const esEncabezado = (f: string[]): boolean => f[0]?.trim() === 'Date';

export const bacTarjeta: Adaptador = {
  id: 'bac_tarjeta',
  tipoCuenta: 'tarjeta',
  detectar: (texto, filas) => texto.includes('Pro000000000000duct') || filas.some(esEncabezado),
  extraer(filas) {
    const inicio = filas.findIndex(esEncabezado);
    if (inicio < 0) throw new ErrorFormato(1, 'falta la sección "Date,"');
    exigirColumnas(filas, inicio, COLUMNAS);
    const corte = buscar(filas, 'Fecha de corte', inicio);
    const saldo = buscar(filas, 'Saldo final', inicio);

    const movimientos: EstadoNormalizado['movimientos'] = [];
    for (let i = inicio + 1; i < filas.length; i++) {
      const f = filas[i] ?? [];
      const nFila = i + 1;
      if (f.length < COLUMNAS.length) throw new ErrorFormato(nFila, 'faltan columnas');
      movimientos.push(
        conReferencia(
          {
            indice: movimientos.length,
            fecha: fecha(f[0] ?? '', nFila),
            // Cargo positivo en el archivo = efecto negativo en la tarjeta (04 §9.4).
            monto: Centavos.negar(importe(f[3] ?? '', nFila)),
            descripcion: normalizar(f[1] ?? ''),
          },
          f[2],
        ),
      );
    }
    return {
      formato: 'bac_tarjeta',
      fechaEstado: fecha(corte.valor, corte.fila),
      saldoFinal: Centavos.negar(importe(saldo.valor, saldo.fila)),
      movimientos,
    };
  },
};
