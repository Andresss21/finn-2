import type { Escenario, Paso } from '../tipos';
// Semilla de Restaurantes de A.7 (05 A.7 [F7], detalle de categoría; 07 §12.4, V7-10). Hoy 15/10/2026; período activo
// 21/09 a 20/10/2026. Los seis períodos anteriores llevan la historia ya corregida por CT-07 (abril $102.00, agosto
// $99.95), de modo que el arrastre de septiembre es $0.00. No es todo A.7: `estado-a7.ts` espera a P7-19.
const gasto = (cuenta: string, monto: number, fecha: string) =>
  ({ op: 'OP-20', cuenta, monto, categoria: 'Restaurantes', fecha }) as const;
const paso = (n: string, hoy: string, ops: Paso['ops']): Paso => ({ n, hoy, ops, espera: {} });

/** Historia: [inicio del período, asignado, gastado]; el gasto cae el día 28 del primer mes. */
const HISTORIA = [
  ['2026-03-21', 100, 88.2],
  ['2026-04-21', 102, 101.5],
  ['2026-05-21', 100, 96.4],
  ['2026-06-21', 100, 112.2],
  ['2026-07-21', 120, 104.75],
  ['2026-08-21', 99.95, 118.9],
] as const;

export default {
  id: 'SEM-A7-RESTAURANTES',
  titulo: 'Semilla de Restaurantes de A.7',
  refs: ['REC-4.2'],
  hoy: '2026-03-21',
  pasos: [
    paso('0', '2026-03-21', [
      { op: 'OP-01', cuenta: 'Cuenta corriente', saldo: 3000, apertura: '2026-03-21' },
      { op: 'OP-01', cuenta: 'Visa Oro', tipo: 'tarjeta', apertura: '2026-03-21', diaCorte: 25 },
      { op: 'OP-07', categoria: 'Restaurantes' },
    ]),
    ...HISTORIA.flatMap(([inicio, asignado, gastado], k) => [
      paso(`h${k + 1}.1`, inicio, [{ op: 'OP-14', categoria: 'Restaurantes', monto: asignado }]),
      paso(`h${k + 1}.2`, `${inicio.slice(0, 8)}28`, [
        gasto('Cuenta corriente', gastado, `${inicio.slice(0, 8)}28`),
      ]),
    ]),
    paso('1', '2026-09-21', [{ op: 'OP-14', categoria: 'Restaurantes', monto: 120 }]),
    paso('2', '2026-09-23', [gasto('Cuenta corriente', 42.1, '2026-09-23')]),
    paso('3', '2026-09-30', [gasto('Visa Oro', 25.6, '2026-09-30')]),
    paso('4', '2026-10-05', [gasto('Cuenta corriente', 8.75, '2026-10-05')]),
    paso('5', '2026-10-08', [gasto('Cuenta corriente', 23.05, '2026-10-08')]),
    paso('6', '2026-10-11', [gasto('Cuenta corriente', 28.3, '2026-10-11')]),
    paso('7', '2026-10-13', [gasto('Cuenta corriente', 18.5, '2026-10-13')]),
    paso('8', '2026-10-15', []),
  ],
} satisfies Escenario;
