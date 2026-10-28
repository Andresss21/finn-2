import type { Escenario } from '../tipos';
// 01 §8, ESC-47 Conciliación con diferencia y edición posterior [P12, N6, supuesto 11 modificado]. Hoy: 16 feb (DP-16). Enmienda: corrección de 01 (signo de la diferencia actual, +5 en el paso 3).
// T en Finn: A 40 (3 feb), B 25 (6 feb) y C 12 (10 feb), todas en Super con 100 asignados; ingreso 100 (1 feb). La tabla no da las fechas:
// se usan estas, dentro de P1 (DP-16). El estado de cuenta al 15 feb trae A 40 (3 feb), B 25 (6 feb) y D 10 (12 feb), con saldo −75.
// Montos del estado con signo de efecto en la tarjeta (compra = negativo). Columna Conciliación en `extra`: `difAceptada:T` y `difActual:T`.
export default {
  id: 'ESC-47',
  titulo: 'Conciliación con diferencia y edición posterior',
  refs: ['P12', 'N6', 'supuesto 11'],
  hoy: '2027-02-16',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
    { op: 'OP-07', categoria: 'Super' },
  ],
  pasos: [
    {
      n: '0',
      ops: [
        { op: 'OP-21', monto: 100, fecha: '2027-02-01', hoy: '2027-02-01' },
        { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1', hoy: '2027-02-01' },
        {
          ...{ op: 'OP-20', cuenta: 'T', monto: 40, categoria: 'Super', etiqueta: 'A' },
          ...{ fecha: '2027-02-03', hoy: '2027-02-03' },
        },
        {
          ...{ op: 'OP-20', cuenta: 'T', monto: 25, categoria: 'Super', etiqueta: 'B' },
          ...{ fecha: '2027-02-06', hoy: '2027-02-06' },
        },
        {
          ...{ op: 'OP-20', cuenta: 'T', monto: 12, categoria: 'Super', etiqueta: 'C' },
          ...{ fecha: '2027-02-10', hoy: '2027-02-10' },
        },
      ],
      espera: {
        ef: 100,
        lpa: 0,
        disp: { Super: 23, 'Pago T': 77 },
        sobta: 0,
        tarjetas: { T: [77, 0, 0] },
      },
    },
    {
      n: '1',
      ops: [
        {
          op: 'OP-47',
          cuenta: 'T',
          fecha: '2027-02-15',
          saldo: -75,
          movimientos: [
            { indice: 1, fecha: '2027-02-03', monto: -40 },
            { indice: 2, fecha: '2027-02-06', monto: -25 },
            { indice: 3, fecha: '2027-02-12', monto: -10 },
          ],
          coincidencias: [
            { etiqueta: 'A', indice: 1 },
            { etiqueta: 'B', indice: 2 },
          ],
        },
      ],
      espera: {
        ef: 100,
        lpa: 0,
        disp: { Super: 23, 'Pago T': 77 },
        sobta: 0,
        avisos: ['AV-21'],
        extra: { 'difAceptada:T': 2 },
      },
    },
    {
      n: '2',
      ops: [{ op: 'OP-28', etiqueta: 'C', monto: 10 }],
      espera: {
        ef: 100,
        lpa: 0,
        disp: { Super: 25, 'Pago T': 75 },
        sobta: 0,
        extra: { 'difAceptada:T': 2, 'difActual:T': 0 },
      },
    },
    {
      n: '3',
      ops: [{ op: 'OP-28', etiqueta: 'A', monto: 45 }],
      espera: {
        ef: 100,
        lpa: 0,
        disp: { Super: 20, 'Pago T': 80 },
        sobta: 0,
        avisos: ['AV-16'],
        extra: { 'difAceptada:T': 2, 'difActual:T': 5 },
      },
    },
  ],
} satisfies Escenario;
