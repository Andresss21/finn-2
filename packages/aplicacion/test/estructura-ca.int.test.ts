// Los CA de FT-18 que son un rechazo con su código (07 §17: nivel INT): OP-07 y OP-08 contra PostgreSQL como `finn_app`
// (TA-283; 06 FT-18; 01 OP-07, OP-08; 04 §3.2). Cada caso crea sus grupos y categorías (ids 900+) sobre la base de prueba.
import { beforeAll, describe, expect, it } from 'vitest';
import type { Hechos, Instante, Uuid } from '@finn/dominio';
import { cargarHechos, leer, Memoria } from '@finn/db';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import { confirmar, type DefinicionOperacion, type DepsMarco } from '../src/operaciones/marco.ts';
import { OP07, OP08 } from '../src/operaciones/categorias/index.ts';

const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const INSTANTE = `${HOY}T12:00:00.000Z` as Instante;
const texto = expect.any(String) as string;

describe('PRU-INT-CATEG', () => {
  const base = crearBasePrueba();
  const deps = (): DepsMarco => ({
    memoria: new Memoria(),
    opciones: () => RELOJ,
    instante: () => INSTANTE,
  });
  const hechos = (): Promise<Hechos> => leer((t) => cargarHechos(t), RELOJ);
  const ejecutar = <E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: unknown) =>
    confirmar(def, entrada, deps());
  const grupo = (n: number, nombre: string) => ({ tipo: 'grupo', id: uuid(n), nombre });
  const categoria = (n: number, nombre: string, grupoId: Uuid) => ({
    tipo: 'categoria',
    id: uuid(n),
    nombre,
    grupoId,
  });

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
  });

  it('PRU-INT-CATEG-104 [CA-18.1] "supermercado" en el grupo donde ya está "Supermercado" se rechaza con nombre_repetido y en otro grupo se acepta', async () => {
    await ejecutar(OP07, grupo(900, 'Vida diaria'));
    await ejecutar(OP07, grupo(901, 'Hogar'));
    expect(await ejecutar(OP07, categoria(902, 'Supermercado', uuid(900)))).toMatchObject({
      ok: true,
    });

    expect(await ejecutar(OP07, categoria(903, 'supermercado', uuid(900)))).toMatchObject({
      ok: false,
      error: { codigo: 'nombre_repetido', campos: { nombre: texto } },
    });
    expect((await hechos()).categorias.some((c) => c.id === uuid(903))).toBe(false);

    expect(await ejecutar(OP07, categoria(904, 'supermercado', uuid(901)))).toMatchObject({
      ok: true,
    });
    expect((await hechos()).categorias.find((c) => c.id === uuid(904))).toMatchObject({
      nombre: 'supermercado',
      grupoId: uuid(901),
    });
  });

  it('PRU-INT-CATEG-105 [CA-18.4] mover una categoría normal al grupo "Pagos de tarjeta" con OP-08 se rechaza con grupo_del_sistema y no cambia nada', async () => {
    await ejecutar(OP07, grupo(910, 'Ocio'));
    await ejecutar(OP07, categoria(911, 'Cine', uuid(910)));
    const sistema = (await hechos()).grupos.find((g) => g.claveSistema === 'pagos_tarjeta');

    expect(
      await ejecutar(OP08, {
        tipo: 'categoria',
        id: uuid(911),
        grupoId: sistema?.id,
        esperado: { grupoId: uuid(910) },
      }),
    ).toMatchObject({
      ok: false,
      error: {
        codigo: 'grupo_del_sistema',
        mensaje: 'El grupo Pagos de tarjeta lo administra Finn.',
      },
    });
    expect((await hechos()).categorias.find((c) => c.id === uuid(911))?.grupoId).toBe(uuid(910));
  });
});
