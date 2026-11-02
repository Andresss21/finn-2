// El CA de FT-19 que es un rechazo con su código (07 §17: nivel INT): OP-10 contra PostgreSQL como `finn_app` (06 FT-19; 01 OP-10;
// 04 §3.2). Crea su grupo y su categoría (ids 900+) sobre la base de prueba.
import { beforeAll, describe, expect, it } from 'vitest';
import type { Hechos, Instante, Uuid } from '@finn/dominio';
import { cargarHechos, leer, Memoria } from '@finn/db';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import { confirmar, type DefinicionOperacion, type DepsMarco } from '../src/operaciones/marco.ts';
import { OP07, OP09, OP10, OP13 } from '../src/operaciones/categorias/index.ts';

const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const INSTANTE = `${HOY}T12:00:00.000Z` as Instante;

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

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
  });

  it('PRU-INT-CATEG-113 [CA-19.7] desarchivar una categoría de un grupo archivado sin desarchivar el grupo se rechaza con grupo_archivado y, pidiéndolo, desarchiva las dos', async () => {
    await ejecutar(OP07, { tipo: 'grupo', id: uuid(930), nombre: 'Archivado' });
    await ejecutar(OP07, {
      tipo: 'categoria',
      id: uuid(931),
      nombre: 'Vieja',
      grupoId: uuid(930),
    });
    expect(await ejecutar(OP09, { categoriaId: uuid(931) })).toMatchObject({ ok: true });
    expect(await ejecutar(OP13, { accion: 'archivar_grupo', id: uuid(930) })).toMatchObject({
      ok: true,
    });

    expect(await ejecutar(OP10, { categoriaId: uuid(931) })).toMatchObject({
      ok: false,
      error: { codigo: 'grupo_archivado' },
    });
    const sinCambio = await hechos();
    expect(sinCambio.categorias.find((c) => c.id === uuid(931))?.archivada).toBe(true);
    expect(sinCambio.grupos.find((g) => g.id === uuid(930))?.archivado).toBe(true);

    expect(await ejecutar(OP10, { categoriaId: uuid(931), desarchivarGrupo: true })).toMatchObject({
      ok: true,
    });
    const despues = await hechos();
    expect(despues.categorias.find((c) => c.id === uuid(931))?.archivada).toBe(false);
    expect(despues.grupos.find((g) => g.id === uuid(930))?.archivado).toBe(false);
  });
});
