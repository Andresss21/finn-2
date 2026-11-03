// FT-24 Actividad con búsqueda y paginación (TA-308; 04 §6.7.1; PRU-INT-TX-400). La consulta `actividad()` sobre la base de prueba de
// @finn/db (TA-152), con las transacciones escritas por las operaciones reales (OP-20): la búsqueda por texto mira comercio y nota,
// el texto se escapa y el cursor no repite ni salta filas aunque se registre otra entre cargas.
import { beforeAll, describe, expect, it } from 'vitest';
import type { Instante, Uuid } from '@finn/dominio';
import { Memoria } from '@finn/db';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import { confirmar, type DefinicionOperacion } from '../src/operaciones/marco.ts';
import { actividad } from '../src/consultas/actividad.ts';
import { OP20 } from '../src/operaciones/transacciones/index.ts';

const USUARIO = 'usuario-unico';
const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const E1 = uuid(1); // efectivo
const C1 = uuid(11); // Comida
const INSTANTE = `${HOY}T12:00:00.000Z` as Instante;

describe('PRU-INT-TX actividad', () => {
  const base = crearBasePrueba();
  const consulta = (parametros: unknown = {}) =>
    actividad(
      {
        memoria: new Memoria(),
        sesion: {
          obtenerClaims: () => Promise.resolve({ sub: USUARIO, aal: 'aal2' }),
          obtenerUsuario: () => Promise.resolve({ id: USUARIO }),
        },
        usuarioPermitido: USUARIO,
        opciones: () => RELOJ,
      },
      parametros,
    );
  const ejecutar = <E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: unknown) =>
    confirmar(def, entrada, {
      memoria: new Memoria(),
      opciones: () => RELOJ,
      instante: () => INSTANTE,
    });
  /** Un gasto de $1.00 en Comida, con `n` como id; `extra` pisa cualquier campo (fecha, comercio, nota). */
  const gasto = (n: number, extra: Record<string, unknown> = {}) =>
    ejecutar(OP20, {
      id: uuid(n),
      cuentaId: E1,
      fecha: '2027-02-04',
      total: '1.00',
      lineas: [{ monto: '1.00', destino: { categoriaId: C1 } }],
      ...extra,
    });
  const ids = async (parametros: unknown = {}) =>
    (await consulta(parametros)).dias.flatMap((d) => d.transacciones.map((t) => t.id));

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
  });

  it('PRU-INT-TX-400 [CA-24.1] buscar «selectos» encuentra la compra en «SUPER SELECTOS» y la otra con la nota «selectos de la colonia»', async () => {
    await gasto(2000, { comercio: 'SUPER SELECTOS' });
    await gasto(2001, { comercio: 'Tienda', nota: 'selectos de la colonia' });
    await gasto(2002, { comercio: 'Panadería', nota: 'pan' });
    expect((await ids({ texto: 'selectos' })).sort()).toEqual([uuid(2000), uuid(2001)]);
  });

  it('PRU-INT-TX-400 [CA-24.2] buscar «50%» trata el % como texto: encuentra «Oferta 50% off» y no «Oferta 500»', async () => {
    await gasto(2010, { comercio: 'Oferta 50% off' });
    await gasto(2011, { comercio: 'Oferta 500' });
    await gasto(2012, { comercio: 'Oferta 5_0' });
    expect(await ids({ texto: '50%' })).toEqual([uuid(2010)]);
    expect(await ids({ texto: '5_0' })).toEqual([uuid(2012)]);
  });

  it('PRU-INT-TX-400 [CA-24.4] con 120 transacciones, cargar más dos veces da las 120 sin repetidas ni faltantes, aunque se registre una nueva entre cargas', async () => {
    const filtro = { desde: '2027-02-03', hasta: '2027-02-03' };
    for (let n = 0; n < 120; n++) await gasto(3000 + n, { fecha: '2027-02-03' });
    const primera = await consulta(filtro);
    const a = primera.dias.flatMap((d) => d.transacciones.map((t) => t.id));
    expect(a).toHaveLength(50);
    expect(primera.siguienteCursor).toBeDefined();

    // Una nueva, más reciente que el cursor, entre la primera carga y la segunda: no entra en las páginas siguientes
    await gasto(3999, { fecha: '2027-02-03' });
    const segunda = await consulta({ ...filtro, cursor: primera.siguienteCursor });
    const b = segunda.dias.flatMap((d) => d.transacciones.map((t) => t.id));
    expect(b).toHaveLength(50);
    expect(segunda.siguienteCursor).toBeDefined();

    const tercera = await consulta({ ...filtro, cursor: segunda.siguienteCursor });
    const c = tercera.dias.flatMap((d) => d.transacciones.map((t) => t.id));
    expect(tercera.siguienteCursor).toBeUndefined();

    const todas = [...a, ...b, ...c];
    expect(new Set(todas).size).toBe(todas.length);
    const esperadas = Array.from({ length: 120 }, (_, n) => uuid(3000 + n));
    expect(esperadas.filter((id) => !todas.includes(id))).toEqual([]);
  });
});
