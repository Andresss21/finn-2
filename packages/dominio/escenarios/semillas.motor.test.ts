// PRU-DOM-MOTOR-901, 902 y 904 (07 §12.4, DP-17): cada semilla de los recorridos da, en el motor, los números de su fuente
// (`recorridos.py`, 06 §4.3 y §4.6, 05 A.7) antes de que la E2E la use. Los esperados salen de esos documentos, no del motor.
import { expect, it } from 'vitest';
import { calcular } from '../src/index';
import { realidad } from '../src/selectores/reportes/realidad';
import { ritmo } from '../src/selectores/reportes/ritmo';
import { comparar } from './ejecutar';
import { ejecutorMotor, type Estado } from './motor';
import estado43 from './semillas/estado-4-3';
import estado46 from './semillas/estado-4-6';
import estadoA7 from './semillas/estado-a7-restaurantes';
import { type Escenario, type Paso, usd } from './tipos';

/** Siembra: las operaciones iniciales y los pasos de la semilla; cada paso debe cumplir la identidad de saldo (regla 3). */
async function sembrar(sem: Escenario): Promise<Estado> {
  const s = await ejecutorMotor.iniciar(sem, sem.hoy ?? '2027-02-10');
  for (const p of sem.pasos) {
    const obs = await ejecutorMotor.paso(s, p);
    expect(obs.rechazo, `${sem.id} paso ${p.n}`).toBeUndefined();
    expect.soft(comparar({}, obs).fallos, `${sem.id} paso ${p.n}`).toEqual([]);
  }
  return s;
}

/** Corre los pasos del recorrido sobre el estado sembrado y compara cada fila con lo que dice la fuente. */
async function recorrer(s: Estado, pasos: Paso[]) {
  for (const p of pasos) {
    const obs = await ejecutorMotor.paso(s, p);
    expect.soft(comparar(p.espera, obs).fallos, `paso ${p.n}`).toEqual([]);
  }
}

const instantanea = (s: Estado) => calcular(s.hechos, s.hoy);
const categoria = (nombre: string) => `categoria-${nombre}`;
const tarjeta = (deuda: number, sinRespaldo: number, reserva: number) =>
  ({ T: [deuda, sinRespaldo, reserva] }) as Record<string, [number, number, number]>;

it('PRU-DOM-MOTOR-901 [V7-10] SEM-4.6: la semilla de 4.6 da los números de recorridos.py en los pasos 1 a 6', async () => {
  const s = await sembrar(estado46);
  await recorrer(s, [
    {
      n: '1', // Inicio
      ops: [],
      espera: {
        ef: 770,
        lpa: 720,
        disp: { Super: -50, Salidas: -50, Ropa: 80, 'Pago T': 40 },
        sobta: 30,
        tarjetas: tarjeta(70, 30, 0),
        extra: { reduccionProyectada: 70 },
      },
    },
  ]);
  // Paso 2: reparto D2 de Super (SobT $30.00, SobD $20.00).
  const celda = instantanea(s).presupuesto.celdas.find((x) => x.categoriaId === categoria('Super'));
  expect([celda?.sobT, celda?.sobD]).toEqual([usd(30), usd(20)]);
  await recorrer(s, [
    {
      n: '3', // mover $50.00 de Ropa a Salidas
      ops: [{ op: 'OP-15', origen: 'Ropa', destino: 'Salidas', monto: 50 }],
      espera: {
        ef: 770,
        lpa: 720,
        disp: { Super: -50, Salidas: 0, Ropa: 30, 'Pago T': 40 },
        sobta: 30,
        tarjetas: tarjeta(70, 30, 0),
        extra: { reduccionProyectada: 20 },
      },
    },
    {
      n: '4', // llega el cierre (hoy 21/02, A = P2)
      hoy: '2027-02-21',
      ops: [],
      espera: {
        ef: 770,
        lpa: 700,
        disp: { Ropa: 30, 'Pago T': 40 },
        sobta: 0,
        tarjetas: tarjeta(70, 30, 0),
      },
    },
    {
      n: '5', // asigna $30.00 a Pago T en P2
      ops: [{ op: 'OP-14', categoria: 'Pago T', monto: 30 }],
      espera: {
        ef: 770,
        lpa: 670,
        disp: { Ropa: 30, 'Pago T': 70 },
        sobta: 0,
        tarjetas: tarjeta(70, 0, 0),
      },
    },
    {
      n: '6', // detalle de LPA: reducción de P1 $20.00
      ops: [],
      espera: { lpa: 670, extra: { reduccionesDebito: 20 } },
    },
  ]);
});

it('PRU-DOM-MOTOR-902 [CA-62.1, CA-62.3] SEM-A7-RESTAURANTES: Restaurantes da −$26.30 con débito y el ritmo llega a $175.56 el 20/10', async () => {
  const s = await sembrar(estadoA7);
  const i = instantanea(s);
  const id = categoria('Restaurantes');
  const activo = i.presupuesto.activo.inicio;
  const celda = i.presupuesto.celdas.find(
    (x) => x.categoriaId === id && x.periodo.inicio === activo,
  );
  expect(celda?.disponible).toBe(usd(-26.3));
  expect([celda?.sobT, celda?.sobD]).toEqual([0, usd(26.3)]); // todo sobregiro con débito
  // Historial corregido por CT-07: el Disponible de cada período cerrado, y arrastre $0.00 a septiembre.
  const cerrados = i.presupuesto.celdas
    .filter((x) => x.categoriaId === id && x.periodo.inicio < activo)
    .map((x) => x.disponible);
  expect(cerrados).toEqual([11.8, 12.3, 15.9, 3.7, 18.95, 0].map(usd));
  expect(celda?.arrastre).toBe(0);
  // Ritmo (CA-62.1, CA-62.3): $55.56 proyectados sobre lo asignado, es decir $175.56 el 20/10.
  expect(ritmo(i).categorias.find((x) => x.categoria.id === id)?.disponibleProyectado).toBe(
    usd(-55.56),
  );
  expect(realidad(i).categorias.find((x) => x.categoria.id === id)?.gastoComparado).toBe(
    usd(175.56),
  );
});

it('PRU-DOM-MOTOR-904 [V6-13] SEM-4.3: la semilla de 4.3 da los números de recorridos.py en los pasos 0 a 7', async () => {
  const s = await sembrar(estado43);
  const base = { Super: 20, Farmacia: 4.5, Restaurantes: 0, Netflix: 0, Fondo: 400 };
  const meta = (nombre: string) =>
    instantanea(s).metas.find((m) => m.categoriaId === categoria(nombre))?.evaluacion;
  // Paso 0: antes de la tarea diaria.
  await recorrer(s, [
    {
      n: '0',
      ops: [],
      espera: { ef: 1288.03, lpa: 863.53, disp: base, extra: { reduccionesDebito: 135 } },
    },
  ]);
  expect(meta('Fondo')?.estado).toBe('vencida');
  expect(instantanea(s).historialLpa.length).toBe(3); // P1, P2 y P3 cerrados
  await recorrer(s, [
    {
      n: '1', // tarea diaria: Netflix del 21/04
      ops: [{ op: 'OP-20', cuenta: 'Ahorro', monto: 15.49, categoria: 'Netflix' }],
      espera: { ef: 1272.54, lpa: 863.53, disp: { ...base, Netflix: -15.49 } },
    },
    {
      n: '4', // extender la meta Fondo al 20/06/2027
      ops: [{ op: 'OP-18', categoria: 'Fondo', editar: true, fecha: '2027-06-20' }],
      espera: { ef: 1272.54, lpa: 863.53 },
    },
  ]);
  expect(meta('Fondo')?.estado).toBe('en_curso');
  expect(meta('Fondo')?.periodosRestantes).toBe(2);
  expect(meta('Fondo')?.pedido).toBe(usd(100));
  await recorrer(s, [
    {
      n: '5', // auto-asignar: Super, Netflix y Fondo (sin AV-18)
      ops: [{ op: 'OP-17' }],
      espera: {
        lpa: 448.04,
        disp: { Super: 320, Farmacia: 4.5, Restaurantes: 0, Netflix: 0, Fondo: 500 },
      },
    },
    {
      n: '6', // "Tu promedio de gasto": ($20.00 + $30.50) / 2 = $25.25
      ops: [{ op: 'OP-14', categoria: 'Farmacia', monto: 25.25 }],
      espera: {
        lpa: 422.79,
        disp: { Super: 320, Farmacia: 29.75, Restaurantes: 0, Netflix: 0, Fondo: 500 },
      },
    },
  ]);
  // Paso 7: Presupuesto contra la realidad: "se pasa", sugerido $145.00.
  const real = realidad(instantanea(s)).hallazgos.find(
    (h) => h.tipo === 'realidad' && h.categoria.id === categoria('Restaurantes'),
  );
  expect(real?.tipo === 'realidad' && [real.causa, real.sugerido]).toEqual(['pasas', usd(145)]);
  await recorrer(s, [
    {
      n: '7',
      ops: [{ op: 'OP-14', categoria: 'Restaurantes', monto: 145 }],
      espera: {
        ef: 1272.54,
        lpa: 277.79,
        disp: { Super: 320, Farmacia: 29.75, Restaurantes: 145, Netflix: 0, Fondo: 500 },
      },
    },
  ]);
});
