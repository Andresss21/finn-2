// Pruebas del ejecutor `motor` y de las 11 reglas de 07 §12.3, con escenarios sintéticos (no son de 01 §8).
import { describe, expect, it } from 'vitest';
import { comparar, correr } from './ejecutar';
import { ejecutorMotor } from './motor';
import { type Escenario, type Observado, type Op, type Paso } from './tipos';
import { ESCENARIOS, FUENTES } from './todos';

const BASE: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-07', categoria: 'Gas' },
];
const ingreso = (monto: number): Op => ({ op: 'OP-21', monto });
const asignar = (categoria: string, monto: number, periodo?: 'P1' | 'P2'): Op => ({
  op: 'OP-14',
  categoria,
  monto,
  ...(periodo && { periodo }),
});
const esc = (id: string, pasos: Paso[], resto: Partial<Escenario> = {}): Escenario => ({
  id,
  titulo: id,
  refs: [],
  hoy: '2027-02-10',
  estadoInicial: BASE,
  pasos,
  ...resto,
});
const correrTodos = (...es: Escenario[]) => {
  const todos = new Map(es.map((e) => [e.id, e]));
  return correr((es.at(-1) as Escenario).id, todos, ejecutorMotor);
};
const fallos = (filas: { fallos: string[] }[]) => filas.flatMap((f) => f.fallos);
const idem = (ef: number, lpa: number): Observado => ({
  ef,
  lpa,
  disp: {},
  fut: 0,
  sobta: 0,
  tarjetas: {},
  avisos: [],
  extra: {},
});

describe('PRU-ESC-MOTOR', () => {
  it('PRU-ESC-MOTOR-001 [ESC-01] regla 1: Ef, LPA, SobTA y Tarjeta se comparan siempre que la fila los trae', async () => {
    const ok = esc('T-01', [
      {
        n: '1',
        ops: [ingreso(1000)],
        espera: { ef: 1000, lpa: 1000, sobta: 0, tarjetas: { T: [0, 0, 0] } },
      },
    ]);
    expect(fallos(await correrTodos(ok))).toEqual([]);
    const mal = esc('T-01', [
      {
        n: '1',
        ops: [ingreso(1000)],
        espera: { ef: 999, lpa: 1, sobta: 5, tarjetas: { T: [1, 2, 3] } },
      },
    ]);
    const f = fallos(await correrTodos(mal)).join('|');
    for (const x of ['Ef:', 'LPA:', 'SobTA:', 'deuda(T)', 'S(T)', 'RE(T)']) expect(f).toContain(x);
  });

  it('PRU-ESC-MOTOR-002 [ESC-01] regla 2: las categorías de Disponibles no listadas deben valer 0', async () => {
    const pasos = (disp: Record<string, number>): Paso[] => [
      {
        n: '1',
        ops: [ingreso(1000), asignar('Super', 300), asignar('Gas', 100)],
        espera: { disp },
      },
    ];
    expect(fallos(await correrTodos(esc('T-02', pasos({ Super: 300, Gas: 100 }))))).toEqual([]);
    expect(fallos(await correrTodos(esc('T-02', pasos({ Super: 300 }))))).toEqual([
      'Disp(Gas): se esperaba 0, se obtuvo 100',
    ]);
    expect(
      fallos(await correrTodos(esc('T-02', pasos({ Fantasma: 0, Super: 300, Gas: 100 })))),
    ).toEqual(['Disp(Fantasma): la categoría no existe']);
  });

  it('PRU-ESC-MOTOR-003 [ESC-01] regla 3: la identidad de saldo se comprueba en cada fila', () => {
    expect(comparar({}, idem(1000, 1000)).fallos).toEqual([]);
    const roto = { ...idem(1000, 900), disp: { Super: 50 } };
    expect(comparar({}, roto).fallos).toEqual(['identidad: 900 + 50 + 0 + 0 ≠ 1000']);
  });

  it('PRU-ESC-MOTOR-004 [ESC-01] regla 4: la base de "continúa" se corre hasta el paso y se compara', async () => {
    const base = (lpa: number) =>
      esc('B-04', [
        { n: '1', ops: [ingreso(1000)], espera: { lpa } },
        { n: '2', ops: [asignar('Super', 300)], espera: {} },
      ]);
    const sigue = esc(
      'T-04',
      [{ n: '2', ops: [asignar('Gas', 100)], espera: { lpa: 900, disp: { Gas: 100 } } }],
      { continua: { escenario: 'B-04', hastaPaso: '1' } },
    );
    expect(fallos(await correrTodos(base(1000), sigue))).toEqual([]);
    // Una base rota falla con el identificador de la base y del paso.
    await expect(correrTodos(base(999), sigue)).rejects.toThrow(/la base B-04 paso 1 no coincide/);
    const sinPaso = esc('T-04', sigue.pasos, { continua: { escenario: 'B-04', hastaPaso: '9' } });
    await expect(correrTodos(base(1000), sinPaso)).rejects.toThrow(/no tiene el paso 9/);
  });

  it('PRU-ESC-MOTOR-005 [ESC-01] regla 5: una alternativa corre en una rama y no contamina la línea principal', async () => {
    const e = esc('T-05', [
      { n: '1', ops: [ingreso(1000)], espera: { lpa: 1000 } },
      { n: '2', ops: [asignar('Super', 300)], espera: { lpa: 700, disp: { Super: 300 } } },
      {
        n: '2x',
        alternativaDe: '2',
        ops: [asignar('Gas', 100)],
        espera: { lpa: 900, disp: { Gas: 100 } },
      },
      { n: '2y', rama: '2x', ops: [asignar('Gas', 50)], espera: { lpa: 850, disp: { Gas: 150 } } },
      { n: '3', ops: [asignar('Super', 100)], espera: { lpa: 600, disp: { Super: 400 } } },
    ]);
    const filas = await correrTodos(e);
    expect(fallos(filas)).toEqual([]);
    expect(filas.map((f) => f.paso)).toEqual(['1', '2', '2x', '2y', '3']);
    // Una rama que no existe es un error del dato.
    const huerfana = esc('T-05', [{ n: '2y', rama: '2x', ops: [], espera: {} }]);
    await expect(correrTodos(huerfana)).rejects.toThrow(/no existe la rama 2x/);
  });

  it('PRU-ESC-MOTOR-006 [ESC-01] regla 6: el estado inicial es un paso con sus operaciones y aserciones', async () => {
    const e = esc('T-06', [
      {
        n: '0',
        ops: [ingreso(500), asignar('Gas', 200)],
        espera: { ef: 500, lpa: 300, disp: { Gas: 200 } },
      },
      { n: '1', ops: [], espera: { ef: 500, lpa: 300 } },
    ]);
    expect(fallos(await correrTodos(e))).toEqual([]);
    // Las cuentas y categorías de `estadoInicial` existen desde el paso 0; una que falta es un error del dato.
    const sinBase = esc('T-06', e.pasos, { estadoInicial: [] });
    await expect(correrTodos(sinBase)).rejects.toThrow(/cuenta que no existe: Ahorro/);
  });

  it('PRU-ESC-MOTOR-007 [ESC-03] regla 7: el rechazo trae su código y deja la instantánea completa igual', async () => {
    const e = (espera: Paso['espera']) =>
      esc('T-07', [
        { n: '1', ops: [ingreso(1000)], espera: { lpa: 1000 } },
        // La primera operación es válida: el rechazo de la segunda la descarta (01 §5.0.1).
        { n: '2', ops: [asignar('Super', 300), asignar('Gas', 1200, 'P2')], espera },
        { n: '3', ops: [], espera: { lpa: 1000, disp: {} } },
      ]);
    const bien = await correrTodos(
      e({ rechazo: 'lpa_negativo_en_futuro', ef: 1000, lpa: 1000, disp: {} }),
    );
    expect(fallos(bien)).toEqual([]);
    expect(fallos(await correrTodos(e({ rechazo: 'periodo_cerrado' })))).toEqual([
      'rechazo: se esperaba periodo_cerrado, se obtuvo lpa_negativo_en_futuro',
    ]);
    expect(fallos(await correrTodos(e({ lpa: 1000 })))).toEqual([
      'rechazo inesperado: lpa_negativo_en_futuro',
    ]);
    const sinRechazo = esc('T-07', [{ n: '1', ops: [ingreso(1)], espera: { rechazo: 'x' } }]);
    expect(fallos(await correrTodos(sinRechazo))).toEqual([
      'rechazo: se esperaba x, se obtuvo ninguno',
    ]);
    expect(
      comparar({ rechazo: 'x' }, { ...idem(0, 0), rechazo: 'x', intacto: false }).fallos,
    ).toEqual(['rechazo: la instantánea cambió']);
  });

  it('PRU-ESC-MOTOR-008 [ESC-05] regla 8: los avisos de Notas son un mínimo', async () => {
    const e = (avisos: string[]) =>
      esc('T-08', [
        { n: '1', ops: [ingreso(1000), asignar('Super', 1200)], espera: { lpa: -200, avisos } },
      ]);
    // AV-20 y AV-11 se cumplen; la fila lista solo uno y pasa.
    expect(fallos(await correrTodos(e(['AV-20'])))).toEqual([]);
    expect(fallos(await correrTodos(e(['AV-11'])))).toEqual([]);
    expect(fallos(await correrTodos(e(['AV-20', 'AV-99'])))).toEqual(['aviso AV-99 ausente']);
  });

  it('PRU-ESC-MOTOR-009 [ESC-01] regla 9: las columnas fuera de la instantánea van en extra', async () => {
    const e = (patrimonio: number) =>
      esc('T-09', [{ n: '1', ops: [ingreso(1000)], espera: { extra: { patrimonio } } }]);
    expect(fallos(await correrTodos(e(1000)))).toEqual([]);
    expect(fallos(await correrTodos(e(999)))).toEqual([
      'patrimonio: se esperaba 999, se obtuvo 1000',
    ]);
    // Con hoy en P2, P1 está cerrado: 500 de saldo inicial con apertura en P1 dan LPA_P1 = Ef(20 feb) = 500.
    const historial = esc(
      'T-09',
      [
        {
          n: '1',
          ops: [],
          espera: { extra: { 'lpaCierre:P1': 500, 'efAl:2027-02-20': 500, 'arrastre:P2': 0 } },
        },
      ],
      {
        hoy: '2027-03-05',
        estadoInicial: [{ op: 'OP-01', cuenta: 'Ahorro', saldo: 500, apertura: '2027-01-25' }],
      },
    );
    expect(fallos(await correrTodos(historial))).toEqual([]);
  });

  it('PRU-ESC-MOTOR-010 [ESC-10] regla 10: nada se omite en silencio; si ningún ejecutor evalúa, el escenario falla', async () => {
    const esp = { extra: { 'historial:3': 1 } };
    const c = comparar(esp, idem(0, 0), new Set(['historial']));
    expect(c).toEqual({ fallos: [], omitidos: ['historial:3: la evalúa el otro ejecutor'] });
    expect(comparar(esp, idem(0, 0), new Set()).fallos).toEqual([
      'historial:3: ningún ejecutor la evalúa',
    ]);
    // `int` no evalúa nada todavía: la consulta desconocida hace fallar el escenario.
    const e = esc('T-10', [{ n: '1', ops: [], espera: esp }]);
    expect(fallos(await correrTodos(e))).toEqual(['historial:3: ningún ejecutor la evalúa']);
  });

  it('PRU-ESC-MOTOR-011 [ESC-01] regla 11: cada archivo de datos dice qué versión de 01 sigue', () => {
    const textos = FUENTES;
    expect(Object.keys(textos).length).toBeGreaterThanOrEqual(2);
    for (const [ruta, texto] of Object.entries(textos)) {
      const n = /esc-(\d+)\.ts$/.exec(ruta)?.[1];
      expect(texto, ruta).toMatch(new RegExp(`^// 01 §8, ESC-${n} `, 'm'));
      expect(texto, ruta).toMatch(/^\/\/.*enmienda|^\/\/.*PR-\d/im);
    }
    for (const [id] of ESCENARIOS) expect(id).toMatch(/^ESC-\d{2}$/);
  });

  it('PRU-ESC-MOTOR-012 [ESC-01] control: un dato alterado se detecta con el identificador de la fila', async () => {
    const original = ESCENARIOS.get('ESC-01') as Escenario;
    const alterado = JSON.parse(JSON.stringify(original)) as Escenario;
    (alterado.pasos.find((p) => p.n === '3') as Paso).espera.lpa = 701;
    const filas = await correr('ESC-01', new Map([['ESC-01', alterado]]), ejecutorMotor);
    const rotas = filas.filter((f) => f.fallos.length);
    expect(rotas.map((f) => `${f.escenario} paso ${f.paso}`)).toEqual(['ESC-01 paso 3']);
    expect(rotas[0]?.fallos).toEqual(['LPA: se esperaba 701, se obtuvo 700']);
  });
});
