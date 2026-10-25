// Los tres formatos de 03 §9.5 tal como quedan guardados (literal SQL estándar: las barras tal cual).
// ⚠ Sintéticos: no prueban que los patrones reconozcan los SMS reales de los bancos (P4-3).
import type { FormatoSms } from '../../src/index';

export const F1_BAC = 'f1000000-0000-4000-8000-000000000001';
export const F2_AGRICOLA = 'f2000000-0000-4000-8000-000000000002';
export const F3_CUSCATLAN = 'f3000000-0000-4000-8000-000000000003';

const comun = {
  tipoMovimiento: 'compra',
  banderas: 'i',
  montoSeparadorMiles: ',',
  montoSeparadorDecimal: '.',
  activo: true,
} as const;

export const FORMATOS: readonly FormatoSms[] = [
  {
    ...comun,
    id: F1_BAC,
    institucionId: 'a1000000-0000-4000-8000-000000000001',
    nombre: 'BAC compra',
    formatosFecha: ['AAAA/MM/DD', 'AAAAMMDD'],
    patron: String.raw`(?:MASTERCARD|VISA)\s+(?<ultimos4>\d{4}):\s+has realizado una compra por USD\s*(?<monto>[\d,]+\.?\d*)\s+en el comercio:?\s+(?<comercio>.+?)\s+(?<fecha>\d{4}\/\d{2}\/\d{2}|\d{8})`,
  },
  {
    ...comun,
    id: F2_AGRICOLA,
    institucionId: 'a2000000-0000-4000-8000-000000000002',
    nombre: 'Banco Agrícola compra',
    formatosFecha: ['AAAA/MM/DD', 'AAAAMMDD'],
    patron: String.raw`\((?<ultimos4>\d{4})\).*?USD\s*(?<monto>[\d,]+\.?\d*)\s+en el comercio:?\s+(?<comercio>.+?)\s+(?<fecha>\d{4}\/\d{2}\/\d{2}|\d{8})`,
  },
  {
    ...comun,
    id: F3_CUSCATLAN,
    institucionId: 'a3000000-0000-4000-8000-000000000003',
    nombre: 'Cuscatlán compra',
    formatosFecha: ['AAAA-MM-DD'],
    patron: String.raw`Titular\s+(?<ultimos4>\d{4})\s+por\s+USD(?<monto>[\d,]+\.?\d*)\s+en\s+(?<comercio>.+?)\s+el\s+(?<fecha>\d{4}-\d{2}-\d{2})`,
  },
];
