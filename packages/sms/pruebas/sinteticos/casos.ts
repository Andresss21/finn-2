// Los 13 SMS sintéticos de V-23 (04 §8.3). Textos construidos para coincidir con los patrones.
import { F1_BAC, F2_AGRICOLA, F3_CUSCATLAN } from './formatos';

export type Esperado =
  | {
      reconocido: string;
      ultimos4?: string;
      monto: number;
      comercio: string;
      fecha: string;
      coincidentes?: readonly string[];
    }
  | { noReconocido: 'ninguno' | 'varios'; coincidentes: readonly string[] };

export interface CasoSintetico {
  id: string;
  caso: string;
  texto: string;
  esperado: Esperado;
}

export const CASOS: readonly CasoSintetico[] = [
  {
    id: 'S-01',
    caso: 'BAC con dos puntos y fecha AAAA/MM/DD',
    texto:
      'BAC Credomatic: VISA 1234: has realizado una compra por USD 1,234.50 en el comercio: SUPER SELECTOS ESCALON 2026/10/12 14:32',
    esperado: {
      reconocido: F1_BAC,
      ultimos4: '1234',
      monto: 123_450,
      comercio: 'SUPER SELECTOS ESCALON',
      fecha: '2026-10-12',
    },
  },
  {
    id: 'S-02',
    caso: 'BAC sin dos puntos, fecha AAAAMMDD, espacios repetidos en el comercio',
    texto:
      'MASTERCARD 4321: has realizado una compra por USD12.3 en el comercio PIZZA  HUT   STA ELENA 20261012',
    esperado: {
      reconocido: F1_BAC,
      monto: 1230,
      comercio: 'PIZZA HUT STA ELENA',
      fecha: '2026-10-12',
    },
  },
  {
    id: 'S-03',
    caso: 'Banco Agrícola',
    texto:
      'Banco Agricola: Tu tarjeta (5678) registro compra por USD 45.00 en el comercio GASOLINERA UNO 2026/10/01',
    esperado: {
      reconocido: F2_AGRICOLA,
      monto: 4500,
      comercio: 'GASOLINERA UNO',
      fecha: '2026-10-01',
    },
  },
  {
    id: 'S-04',
    caso: 'Cuscatlán',
    texto:
      'Cuscatlan: Compra con tarjeta Titular 9012 por USD7.99 en STARBUCKS MULTIPLAZA el 2026-10-12',
    esperado: {
      reconocido: F3_CUSCATLAN,
      monto: 799,
      comercio: 'STARBUCKS MULTIPLAZA',
      fecha: '2026-10-12',
    },
  },
  {
    id: 'S-05',
    caso: 'Monto "12." (punto final): el normalizador rechaza',
    texto: 'VISA 1234: has realizado una compra por USD 12. en el comercio X 2026/10/12',
    esperado: { noReconocido: 'ninguno', coincidentes: [] },
  },
  {
    id: 'S-06',
    caso: 'Monto "12.345" (tres decimales): el normalizador rechaza',
    texto: 'VISA 1234: has realizado una compra por USD 12.345 en el comercio X 2026/10/12',
    esperado: { noReconocido: 'ninguno', coincidentes: [] },
  },
  {
    id: 'S-07',
    caso: 'Monto "0.00": no es > 0',
    texto: 'VISA 1234: has realizado una compra por USD 0.00 en el comercio X 2026/10/12',
    esperado: { noReconocido: 'ninguno', coincidentes: [] },
  },
  {
    id: 'S-08',
    caso: 'Fecha inexistente 2026/02/30',
    texto: 'VISA 1234: has realizado una compra por USD 10.00 en el comercio X 2026/02/30',
    esperado: { noReconocido: 'ninguno', coincidentes: [] },
  },
  {
    id: 'S-09',
    caso: 'Comercio con 8 dígitos: riesgo conocido de 03 §9.5 (fecha incorrecta, QC-3)',
    texto:
      'VISA 1234: has realizado una compra por USD 10.00 en el comercio TIENDA 20261001 CENTRO 2026/10/12',
    esperado: { reconocido: F1_BAC, monto: 1000, comercio: 'TIENDA', fecha: '2026-10-01' },
  },
  {
    id: 'S-10',
    caso: 'Texto con (1234) antes del mensaje de BAC: coinciden F-1 y F-2 (P3-8)',
    texto:
      'Aviso (1234) VISA 1234: has realizado una compra por USD 10.00 en el comercio X 2026/10/12',
    esperado: { noReconocido: 'varios', coincidentes: [F1_BAC, F2_AGRICOLA] },
  },
  {
    id: 'S-11',
    caso: 'Mensaje sin movimiento (código de verificación)',
    texto: 'BAC: Tu codigo de verificacion es 123456',
    esperado: { noReconocido: 'ninguno', coincidentes: [] },
  },
  {
    id: 'S-12',
    caso: 'Todo en minúsculas (bandera i)',
    texto: 'visa 1234: has realizado una compra por usd 5.00 en el comercio x 2026/10/12',
    esperado: { reconocido: F1_BAC, monto: 500, comercio: 'x', fecha: '2026-10-12' },
  },
  {
    id: 'S-13',
    caso: 'Comercio "CAJA (5555)": solo F-1',
    texto:
      'VISA 1234: has realizado una compra por USD 10.00 en el comercio CAJA (5555) 2026/10/12',
    esperado: { reconocido: F1_BAC, monto: 1000, comercio: 'CAJA (5555)', fecha: '2026-10-12' },
  },
];
