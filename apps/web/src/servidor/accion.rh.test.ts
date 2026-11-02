// `accion()` (04 §2.2.2) con una operación real contra la base de prueba como `finn_app` (TA-305, CH-80). `modo` es el modo
// de envío de toda Server Action, así que el modo de una meta viaja como `modoMeta` en la entrada de OP-18 y en su `esperado`.
// Solo se reemplazan Supabase (la sesión), las cookies y `revalidatePath`, que fuera de Next no tiene dónde invalidar.
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { OP18 } from '@finn/aplicacion/operaciones/presupuesto';
import {
  consultar,
  crearBasePrueba,
  escribirHechosDePrueba,
  HOY,
} from '../../../../tools/pruebas/rh.ts';
import { accion } from './accion.ts';
import { operacion } from './operaciones.ts';

const USUARIO = '00000000-0000-4000-8000-000000000999';
const AHORA_MS = 1_900_000_000_000;
const uuid = (n: number): string => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
// De `escribirHechosDePrueba`: la categoría Préstamo y su meta para una fecha
const C2 = uuid(12);
const META_C2 = uuid(51);
const NUEVA = uuid(3051);

vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve({ getAll: () => [], set: () => undefined }),
}));
vi.mock('next/cache', () => ({ revalidatePath: () => undefined }));
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      getClaims: () =>
        Promise.resolve({
          data: { claims: { sub: '00000000-0000-4000-8000-000000000999', aal: 'aal2' } },
          error: null,
        }),
      getUser: () =>
        Promise.resolve({
          data: { user: { id: '00000000-0000-4000-8000-000000000999' } },
          error: null,
        }),
    },
  }),
}));

type Resultado = {
  ok: boolean;
  valor?: { revisionVista?: string; huellaImpacto?: string | null; rechazos?: unknown[] };
  error?: { categoria?: string; campos?: unknown };
};

describe('PRU-RH-META', () => {
  const base = crearBasePrueba();
  const metas = accion(operacion(OP18)) as (cruda: unknown) => Promise<Resultado>;
  const modoDe = async (id: string) =>
    (await consultar(base.urlAdmin, `SELECT modo FROM finn.metas WHERE id = '${id}'`))[0];
  /** Lo que hace `useOperacion` (05 §4.3): previsualizar y confirmar con lo que devolvió la vista previa. */
  const enviar = async (entrada: Record<string, unknown>): Promise<Resultado> => {
    const vista = await metas({ ...entrada, modo: 'previsualizar' });
    expect(vista).toMatchObject({ ok: true, valor: { rechazos: [] } });
    const { revisionVista, huellaImpacto } = vista.valor ?? {};
    return metas({ ...entrada, modo: 'confirmar', revisionVista, huellaImpacto });
  };

  beforeAll(async () => {
    process.env['DATABASE_URL'] = base.url;
    await escribirHechosDePrueba(base);
  });
  beforeEach(() => {
    vi.stubEnv('FINN_USUARIO_ID', USUARIO);
    vi.stubEnv('FINN_ENTORNO', 'pruebas');
    vi.stubEnv('VERCEL_ENV', undefined);
    const archivo = join(mkdtempSync(join(tmpdir(), 'finn-rh-')), 'reloj.json');
    writeFileSync(
      archivo,
      JSON.stringify({ instante: `${HOY}T18:00:00.000Z`, fijadoEn: AHORA_MS }),
    );
    vi.stubEnv('FINN_RELOJ_ARCHIVO', archivo);
    vi.spyOn(Date, 'now').mockReturnValue(AHORA_MS);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('PRU-RH-META-101 OP-18 por accion(): con modoMeta en la entrada y en esperado, la vista previa y la confirmación crean y editan una meta mensual con su modo, y sin modoMeta el contrato la rechaza', async () => {
    expect(await enviar({ accion: 'eliminar', metaId: META_C2 })).toMatchObject({ ok: true });

    const crear = {
      accion: 'crear',
      id: NUEVA,
      categoriaId: C2,
      tipo: 'mensual',
      monto: '40.00',
    };
    // el modo de envío no se confunde con el de la meta
    expect(await metas({ ...crear, modo: 'confirmar' })).toMatchObject({
      ok: false,
      error: { categoria: 'VALIDACION' },
    });
    expect(await modoDe(NUEVA)).toBeUndefined();

    expect(await enviar({ ...crear, modoMeta: 'rellenar_hasta' })).toMatchObject({
      ok: true,
      valor: { id: NUEVA },
    });
    expect(await modoDe(NUEVA)).toBe('rellenar_hasta');

    const editar = {
      accion: 'editar',
      metaId: NUEVA,
      modoMeta: 'acumular',
      esperado: { modoMeta: 'rellenar_hasta' },
    };
    expect(await enviar(editar)).toMatchObject({ ok: true });
    expect(await modoDe(NUEVA)).toBe('acumular');
  });
});
