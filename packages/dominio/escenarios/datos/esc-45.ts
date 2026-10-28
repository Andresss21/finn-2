import type { Escenario } from '../tipos';
// 01 §8, ESC-45 Cambio de ciclo con período de transición [M5, Q5, B-2]. Hoy: 10 nov 2027 (período 21 oct – 20 nov). Sin enmiendas.
// Estado inicial de la tabla: Ef 1,000 (ingreso de hoy), LPA 900 y Super(fut) 100 en el período que empieza el 21 nov 2027 (`desde`,
// porque P1 a P6 son de 2027 ene a jun). Las categorías de las metas del paso 2 existen desde el inicio y no cambian ningún número.
// La columna Resultado va en `extra`: `diasPeriodo:AAAA-MM-DD` = días del período que contiene esa fecha (el ejecutor lo pasa ×100, como
// todo `extra`); R = 21 dic se prueba porque el 20 dic cae en un período de 30 días (21 nov – 20 dic) y el 21 dic en el de transición, de 11.
// Fila 1′ (contraste, regla 5): con asignación también en 21 dic – 20 ene (la tabla no da el monto: 100), R = 21 ene.
// Paso 2: las metas se evalúan en el período de transición, así que el paso corre con hoy = 25 dic 2027 (dentro de 21 – 31 dic).
export default {
  id: 'ESC-45',
  titulo: 'Cambio de ciclo con período de transición',
  refs: ['M5', 'Q5', 'B-2'],
  hoy: '2027-11-10',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro', apertura: '2027-10-21' },
    { op: 'OP-07', categoria: 'Super' },
    { op: 'OP-07', categoria: 'Semanal' },
    { op: 'OP-07', categoria: 'Mensual' },
    { op: 'OP-21', monto: 1000 },
    { op: 'OP-14', categoria: 'Super', monto: 100, desde: '2027-11-21' },
  ],
  pasos: [
    {
      n: '1',
      ops: [{ op: 'OP-19', diaInicio: 1 }],
      espera: {
        ef: 1000,
        lpa: 900,
        fut: 100,
        disp: {},
        avisos: ['AV-12'],
        extra: {
          'diasPeriodo:2027-12-20': 30,
          'diasPeriodo:2027-12-21': 11,
          'diasPeriodo:2028-01-01': 31,
        },
      },
    },
    {
      n: '1′',
      alternativaDe: '1',
      ops: [
        { op: 'OP-14', categoria: 'Super', monto: 100, desde: '2027-12-21' },
        { op: 'OP-19', diaInicio: 1 },
      ],
      espera: {
        ef: 1000,
        lpa: 800,
        fut: 200,
        disp: {},
        avisos: ['AV-12'],
        extra: { 'diasPeriodo:2027-12-21': 31, 'diasPeriodo:2028-01-21': 11 },
      },
    },
    {
      n: '2',
      hoy: '2027-12-25',
      ops: [
        { op: 'OP-18', categoria: 'Semanal', monto: 50, tipo: 'semanal' },
        { op: 'OP-18', categoria: 'Mensual', monto: 200 },
      ],
      espera: { extra: { 'metaPeriodo:Semanal': 78.57, 'metaPeriodo:Mensual': 200 } },
    },
  ],
} satisfies Escenario;
