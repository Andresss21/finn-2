import { Centavos, FechaLocal } from '@finn/dominio/valores';
import { ErrorFormato, type Adaptador, type EstadoNormalizado } from '../tipos';

// ⚠ (S6-1): sin muestras reales (TU-13). La estructura es SINTÉTICA y se rehace con PRU-MAN-CONC-001:
//   Pro000000000000duct,<producto>
//   Fecha de corte,DD/MM/AAAA
//   Saldo final,<deuda>        (deuda positiva en el archivo)
//   Date,Description,Reference,Amount
//   DD/MM/AAAA,<texto>,<referencia>,<importe>   (cargo positivo, pago negativo)
const COLUMNAS = ['Date', 'Description', 'Reference', 'Amount'];

function fecha(texto: string, nFila: number): FechaLocal {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (m === null) throw new ErrorFormato(nFila, `fecha inválida: "${texto}"`);
  try {
    return FechaLocal.desdePartes(Number(m[3]), Number(m[2]), Number(m[1]));
  } catch {
    throw new ErrorFormato(nFila, `la fecha no existe: "${texto}"`);
  }
}

function importe(texto: string, nFila: number): Centavos {
  const limpio = texto.trim().replace(/,/g, '');
  try {
    return Centavos.desdeTexto(limpio);
  } catch {
    throw new ErrorFormato(nFila, `monto inválido: "${texto}"`);
  }
}

const esEncabezado = (f: string[]): boolean => f[0]?.trim() === 'Date';

export const bacTarjeta: Adaptador = {
  id: 'bac_tarjeta',
  tipoCuenta: 'tarjeta',
  detectar: (texto, filas) => texto.includes('Pro000000000000duct') || filas.some(esEncabezado),
  extraer(filas) {
    const inicio = filas.findIndex(esEncabezado);
    if (inicio < 0) throw new ErrorFormato(1, 'falta la sección "Date,"');
    const encabezado = (filas[inicio] ?? []).map((c) => c.trim());
    if (COLUMNAS.some((c, i) => encabezado[i] !== c))
      throw new ErrorFormato(inicio + 1, `columnas inesperadas: ${encabezado.join(',')}`);

    const buscar = (etiqueta: string): { valor: string; fila: number } => {
      const i = filas.findIndex((f, k) => k < inicio && f[0]?.trim() === etiqueta);
      const valor = filas[i]?.[1];
      if (valor === undefined) throw new ErrorFormato(1, `falta "${etiqueta}"`);
      return { valor, fila: i + 1 };
    };
    const corte = buscar('Fecha de corte');
    const saldo = buscar('Saldo final');

    const movimientos: EstadoNormalizado['movimientos'] = [];
    for (let i = inicio + 1; i < filas.length; i++) {
      const f = filas[i] ?? [];
      const nFila = i + 1;
      if (f.length < COLUMNAS.length) throw new ErrorFormato(nFila, 'faltan columnas');
      const referencia = (f[2] ?? '').trim();
      movimientos.push({
        indice: movimientos.length,
        fecha: fecha(f[0] ?? '', nFila),
        // Cargo positivo en el archivo = efecto negativo en la tarjeta (04 §9.4).
        monto: Centavos.negar(importe(f[3] ?? '', nFila)),
        descripcion: (f[1] ?? '').trim().replace(/\s+/g, ' '),
        ...(referencia === '' ? {} : { referencia }),
      });
    }
    return {
      formato: 'bac_tarjeta',
      fechaEstado: fecha(corte.valor, corte.fila),
      saldoFinal: Centavos.negar(importe(saldo.valor, saldo.fila)),
      movimientos,
    };
  },
};
