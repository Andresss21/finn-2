// Los CA de FT-20 que son un rechazo con su código o lo que queda guardado (07 §17: nivel INT): OP-12 contra PostgreSQL como
// `finn_app` (06 FT-20; 01 CB-20; 04 §3.2). El número de ESC-42 (CA-20.1) lo recorre la E2E del flujo y el escenario del
// ejecutor `int` (`esc.int.test.ts`); acá, el rechazo de las categorías de pago y que el destino conserve su meta.
import { beforeAll, describe, expect, it } from 'vitest';
import type { Cambio, Hechos, Instante, Uuid } from '@finn/dominio';
import { cargarHechos, escribir, leer, Memoria } from '@finn/db';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import {
  confirmar,
  previsualizar,
  type DefinicionOperacion,
  type DepsMarco,
} from '../src/operaciones/marco.ts';
import { OP07, OP12 } from '../src/operaciones/categorias/index.ts';

const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const G1 = uuid(10); // Gastos
const INSTANTE = `${HOY}T12:00:00.000Z` as Instante;
const c = (n: number) => n as never; // Centavos de la prueba

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
  const preparar = <E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: unknown) =>
    previsualizar(def, entrada, deps());
  const escribirCambios = (cambios: Cambio[]) =>
    escribir((tx) => tx.aplicarCambios(cambios), RELOJ);
  const categoria = (n: number, nombre: string) => ({
    tipo: 'categoria',
    id: uuid(n),
    nombre,
    grupoId: G1,
  });
  const meta = (id: number, categoriaId: Uuid, monto: number): Cambio => ({
    tipo: 'insertar',
    tabla: 'metas',
    fila: {
      id: uuid(id),
      categoriaId,
      tipo: 'mensual',
      modo: 'acumular',
      monto: c(monto),
      fechaObjetivo: null,
      fechaCreacion: HOY,
      revision: null,
    } as never,
  });

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
  });

  it('PRU-INT-CATEG-120 [CA-20.4] fusionar una categoría de pago, como origen o como destino, se rechaza con fusion_categoria_de_pago y no cambia nada', async () => {
    await ejecutar(OP07, categoria(950, 'Café'));
    const pago = (await hechos()).categorias.find((x) => x.clase === 'pago');
    if (pago === undefined) throw new Error('los hechos de prueba traen una categoría de pago');
    const antes = (await hechos()).categorias.length;

    for (const entrada of [
      { origenId: pago.id, destinoId: uuid(950) },
      { origenId: uuid(950), destinoId: pago.id },
    ]) {
      expect(await preparar(OP12, entrada)).toMatchObject({
        ok: true,
        valor: { rechazos: [{ codigo: 'fusion_categoria_de_pago' }] },
      });
      expect(await ejecutar(OP12, entrada)).toMatchObject({
        ok: false,
        error: { codigo: 'fusion_categoria_de_pago' },
      });
    }
    expect((await hechos()).categorias).toHaveLength(antes);
  });

  it('PRU-INT-CATEG-121 [CA-20.5, CB-20] si el destino tiene meta conserva la suya y la del origen se descarta con él', async () => {
    await ejecutar(OP07, categoria(960, 'Origen con meta'));
    await ejecutar(OP07, categoria(961, 'Destino con meta'));
    await escribirCambios([meta(962, uuid(960), 5000), meta(963, uuid(961), 8000)]);
    const entrada = { origenId: uuid(960), destinoId: uuid(961) };

    const vista = await preparar(OP12, entrada);
    if (!vista.ok) throw new Error(JSON.stringify(vista.error));
    expect(
      await ejecutar(OP12, {
        ...entrada,
        revisionVista: vista.valor.revisionVista,
        huellaImpacto: vista.valor.huellaImpacto,
      }),
    ).toMatchObject({ ok: true, yaAplicada: false });

    const h = await hechos();
    expect(h.categorias.some((x) => x.id === uuid(960))).toBe(false);
    expect(h.metas.some((m) => m.id === uuid(962))).toBe(false);
    expect(h.metas.find((m) => m.categoriaId === uuid(961))).toMatchObject({
      id: uuid(963),
      monto: 8000,
    });
  });
});
