// PRU-SEG-ACCESO-001 (07 §19.1, DP-22; 04 §2.2.5, §12.3; 05 §9, CP-3; CH-50, CH-56). Por comportamiento, no por texto: descubre
// las Server Actions por AST y las rutas por el árbol, y llama a cada exportación sin sesión, con AAL1, con otro usuario y (si
// escribe) con la sesión revocada. Solo se simulan `next/headers` y `@supabase/ssr`, como en `exportar/[formato]/route.rh.test.ts`.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExcepcionFinn } from '@finn/aplicacion/errores';
import { crearBasePrueba } from '../../../../tools/pruebas/rh.ts';
import { accion } from './accion.ts';
import { ACCIONES_DE_ACCESO, RUTAS_PUBLICAS } from './acciones/indice.ts';
import { exigirSesionAal2Lectura } from './sesion.ts';

const SRC = fileURLToPath(new URL('..', import.meta.url));
const USUARIO = '00000000-0000-4000-8000-000000000999';
const OTRO = '00000000-0000-4000-8000-000000000998';
const SECRETO = 'c'.repeat(32);
const METODOS = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

const h = vi.hoisted((): { aal: string | null; usuarioVigente: boolean; usuarioId: string } => ({
  aal: null,
  usuarioVigente: false,
  usuarioId: '00000000-0000-4000-8000-000000000999',
}));
vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve({ getAll: () => [], set: () => undefined }),
}));
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      getClaims: () =>
        Promise.resolve({
          data: h.aal === null ? null : { claims: { sub: h.usuarioId, aal: h.aal } },
          error: null,
        }),
      getUser: () =>
        Promise.resolve({
          data: { user: h.usuarioVigente ? { id: h.usuarioId } : null },
          error: null,
        }),
    },
  }),
}));

type Caso = readonly [nombre: string, aal: string | null, vigente: boolean, id: string];
const SIN_AUTORIZACION: readonly Caso[] = [
  ['sin sesión', null, false, USUARIO],
  ['con AAL1', 'aal1', true, USUARIO],
  ['con otro usuario', 'aal2', true, OTRO],
];
const REVOCADA: Caso = ['con la sesión revocada', 'aal2', false, USUARIO];
const entrarEn = ([, aal, vigente, id]: Caso): void => {
  h.aal = aal;
  h.usuarioVigente = vigente;
  h.usuarioId = id;
};

/** Directivas `'use server'` reales: un comentario o un texto cualquiera no cuentan. */
function directivas(nombre: string, texto: string): { archivo: boolean; enLinea: number } {
  const tipo = nombre.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const raiz = ts.createSourceFile(nombre, texto, ts.ScriptTarget.Latest, true, tipo);
  const tiene = (sentencias: readonly ts.Statement[]): boolean => {
    for (const s of sentencias) {
      if (!ts.isExpressionStatement(s) || !ts.isStringLiteral(s.expression)) return false;
      if (s.expression.text === 'use server') return true;
    }
    return false;
  };
  let enLinea = 0;
  const visitar = (n: ts.Node): void => {
    if (ts.isBlock(n) && ts.isFunctionLike(n.parent) && tiene(n.statements)) enLinea += 1;
    ts.forEachChild(n, visitar);
  };
  visitar(raiz);
  return { archivo: tiene(raiz.statements), enLinea };
}

const archivosDe = (dir: string): string[] =>
  readdirSync(join(SRC, dir), { recursive: true, encoding: 'utf8' })
    .map((f) => join(dir, f).replaceAll('\\', '/'))
    .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f));

const importar = async (relativa: string): Promise<Record<string, unknown>> =>
  (await import(/* @vite-ignore */ join(SRC, relativa))) as Record<string, unknown>;

/** Lanza si la acción toca la entrada: nada de ella se lee antes de autorizar. */
const trampa: unknown = new Proxy(
  {},
  Object.fromEntries(
    ['get', 'has', 'ownKeys', 'getOwnPropertyDescriptor', 'getPrototypeOf'].map((t) => [
      t,
      () => {
        throw new Error('leyó la entrada antes de autorizar');
      },
    ]),
  ),
);

type Resultado = { ok?: boolean; error?: { categoria?: string } } | null | undefined;

/** Las fallas de una exportación de Server Action; vacío si responde `NO_AUTORIZADO` en todos los casos. */
async function fallasDeAccion(
  nombre: string,
  exportada: unknown,
  casos: readonly Caso[],
): Promise<string[]> {
  if (typeof exportada !== 'function') return [`${nombre}: no es una función`];
  const f = exportada as (...a: unknown[]) => Promise<Resultado>;
  const fallas: string[] = [];
  for (const caso of casos) {
    entrarEn(caso);
    try {
      const r = await f(trampa, trampa);
      if (r?.ok !== false || r.error?.categoria !== 'NO_AUTORIZADO')
        fallas.push(`${nombre} ${caso[0]}: no exigió la sesión`);
    } catch (e) {
      if (!(e instanceof ExcepcionFinn && e.error.categoria === 'NO_AUTORIZADO'))
        fallas.push(`${nombre} ${caso[0]}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return fallas;
}

interface Lista {
  readonly archivo: string;
  readonly nombres: readonly string[];
}

/** Fallas de un módulo con `'use server'`, salvo la lista cerrada de 05 §9 (solo en su archivo). */
async function fallasDeModulo(
  relativa: string,
  modulo: Record<string, unknown>,
  lista: Lista = ACCIONES_DE_ACCESO,
): Promise<string[]> {
  const exentas = relativa === lista.archivo ? lista.nombres : [];
  // CP-3: las lecturas interactivas usan `getClaims()` y no ven una sesión revocada; las acciones, `getUser()`
  const lectura = relativa === 'servidor/lecturas/interactivas.ts';
  const casos = lectura ? SIN_AUTORIZACION : [...SIN_AUTORIZACION, REVOCADA];
  const fallas: string[] = [];
  for (const [n, f] of Object.entries(modulo))
    if (!exentas.includes(n)) fallas.push(...(await fallasDeAccion(`${relativa}#${n}`, f, casos)));
  return fallas;
}

/** Una entrada de la lista que no exista. Sin el archivo no hay nada que exceptuar: hasta TA-280, se anuncia. */
function faltantesDeLista(
  modulos: ReadonlyMap<string, Record<string, unknown>>,
  lista: Lista = ACCIONES_DE_ACCESO,
): string[] {
  const modulo = modulos.get(lista.archivo);
  if (modulo === undefined) return [];
  return lista.nombres
    .filter((n) => typeof modulo[n] !== 'function')
    .map((n) => `${lista.archivo}#${n}: en la lista, pero no existe`);
}

/** Cada método HTTP sin credenciales: 401, o 404 solo bajo `/api/pruebas/` con `relojPermitido` apagado. */
async function fallasDeRuta(relativa: string, modulo: Record<string, unknown>): Promise<string[]> {
  const segmentos = relativa.split('/').slice(1, -1);
  const ruta = `/${segmentos.map((s) => (s.startsWith('[') ? 'x' : s)).join('/')}`;
  const parametros = Object.fromEntries(
    segmentos
      .filter((s) => s.startsWith('['))
      .map((s) => [s.replace(/[[\].]/g, ''), s.includes('...') ? ['x'] : 'x']),
  );
  const aceptados = ruta.startsWith('/api/pruebas/') ? [401, 404] : [401];
  const fallas: string[] = [];
  for (const metodo of METODOS.filter((m) => m in modulo)) {
    const f = modulo[metodo] as (p: Request, c: unknown) => Promise<Response> | Response;
    for (const caso of SIN_AUTORIZACION) {
      entrarEn(caso);
      // `Origin` y `X-Finn-Accion` no son credenciales: sin ellas, la acción de notificación corta antes con 403 (BE-54)
      const peticion = new Request(`http://finn.test${ruta}`, {
        method: metodo,
        headers: { origin: 'http://finn.test', 'x-finn-accion': '1' },
      });
      const { status } = await f(peticion, { params: Promise.resolve(parametros) });
      if (!aceptados.includes(status)) fallas.push(`${metodo} ${ruta} ${caso[0]}: ${status}`);
    }
  }
  return fallas;
}

describe('PRU-SEG-ACCESO', () => {
  const base = crearBasePrueba();

  beforeAll(() => {
    process.env['DATABASE_URL'] = base.url;
  });
  beforeEach(() => {
    vi.stubEnv('FINN_USUARIO_ID', USUARIO);
    vi.stubEnv('CRON_SECRET', SECRETO);
    vi.stubEnv('RESPALDO_SECRET', SECRETO);
    for (const v of ['FINN_ENTORNO', 'FINN_RELOJ_ARCHIVO', 'FINN_HOY_SIMULADO', 'VERCEL_ENV'])
      vi.stubEnv(v, undefined);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('PRU-SEG-ACCESO-001 toda Server Action exige AAL2 antes de leer su entrada, salvo la lista cerrada de 05 §9', async () => {
    const encontradas = archivosDe('.').map((f) => ({
      f,
      ...directivas(f, readFileSync(join(SRC, f), 'utf8')),
    }));
    // 04 §2.2.2, 05 CP-3: solo módulos de `servidor/`, ninguna acción en línea dentro de una página
    expect(encontradas.filter((d) => d.enLinea > 0).map((d) => d.f)).toEqual([]);
    const registro = encontradas.filter((d) => d.archivo).map((d) => d.f);
    expect(
      registro.filter(
        (f) => !f.startsWith('servidor/acciones/') && f !== 'servidor/lecturas/interactivas.ts',
      ),
    ).toEqual([]);
    if (registro.length === 0)
      console.warn('PRU-SEG-ACCESO-001: registro vacío, ninguna Server Action todavía');

    const modulos = new Map<string, Record<string, unknown>>();
    for (const f of registro) modulos.set(f, await importar(f));
    if (!modulos.has(ACCIONES_DE_ACCESO.archivo))
      console.warn(`PRU-SEG-ACCESO-001: ${ACCIONES_DE_ACCESO.archivo} no existe todavía (TA-280)`);

    const fallas: string[] = faltantesDeLista(modulos);
    for (const [f, m] of modulos) fallas.push(...(await fallasDeModulo(f, m)));
    expect(fallas).toEqual([]);
  });

  it('PRU-SEG-ACCESO-001 todo Route Handler responde 401 sin credenciales, salvo la ruta pública declarada', async () => {
    const rutas = archivosDe('app').filter(
      (f) => /\/route\.tsx?$/.test(f) && !RUTAS_PUBLICAS.includes(f),
    );
    // Las seis de CH-50: si el recorrido dejara de verlas, la prueba no diría nada
    expect(rutas.filter((f) => f.startsWith('app/api/')).length).toBeGreaterThanOrEqual(6);

    const fallas: string[] = [];
    for (const f of rutas) fallas.push(...(await fallasDeRuta(f, await importar(f))));
    expect(fallas).toEqual([]);
  });

  it('PRU-SEG-ACCESO-001 control: una acción sin autorizar(), una ruta abierta o una lista mal declarada hacen fallar la comprobación', async () => {
    const CONTROL = 'servidor/acciones/control.ts';
    const sinAutorizar = {
      accionDePrueba: (entrada: { id: string }) => Promise.resolve({ ok: true, valor: entrada.id }),
      noLee: () => Promise.resolve({ ok: true }),
    };
    const fallas = await fallasDeModulo(CONTROL, sinAutorizar);
    expect(fallas).toContain(
      `${CONTROL}#accionDePrueba sin sesión: leyó la entrada antes de autorizar`,
    );
    expect(fallas).toContain(`${CONTROL}#noLee con AAL1: no exigió la sesión`);

    // Las exigencias reales pasan: si no, la comprobación rechazaría todo y el control no diría nada
    const noLlegar = (): never => {
      throw new Error('accion() no autorizó antes de seguir');
    };
    const conAccion = { x: accion({ previsualizar: noLlegar, confirmar: noLlegar }) };
    expect(await fallasDeModulo(CONTROL, conAccion)).toEqual([]);
    const lectura = {
      x: async (e: { a: string }) => {
        const r = await exigirSesionAal2Lectura();
        return r.ok ? { ok: true, valor: e.a } : r;
      },
    };
    expect(await fallasDeModulo('servidor/lecturas/interactivas.ts', lectura)).toEqual([]);
    // Una exigencia de lectura en una acción: la sesión revocada la delata (04 §12.3)
    expect(await fallasDeModulo(CONTROL, lectura)).toEqual([
      `${CONTROL}#x con la sesión revocada: leyó la entrada antes de autorizar`,
    ]);

    // Lista cerrada: fuera de ella se exige AAL2; una entrada inexistente falla
    const lista = { archivo: CONTROL, nombres: ['noLee'] };
    expect(await fallasDeModulo(CONTROL, { noLee: sinAutorizar.noLee }, lista)).toEqual([]);
    expect(await fallasDeModulo(CONTROL, { otra: sinAutorizar.noLee }, lista)).not.toEqual([]);
    expect(await fallasDeModulo('servidor/acciones/otra.ts', sinAutorizar, lista)).not.toEqual([]);
    expect(faltantesDeLista(new Map([[CONTROL, {}]]), lista)).toEqual([
      `${CONTROL}#noLee: en la lista, pero no existe`,
    ]);

    // Rutas: un 200, o un 404 fuera de /api/pruebas/, fallan
    const responde = (status: number) => ({ GET: () => new Response(null, { status }) });
    expect(await fallasDeRuta('app/api/x/route.ts', responde(200))).not.toEqual([]);
    expect(await fallasDeRuta('app/api/x/route.ts', responde(404))).not.toEqual([]);
    expect(await fallasDeRuta('app/api/x/[y]/route.ts', responde(401))).toEqual([]);
    expect(await fallasDeRuta('app/api/pruebas/x/route.ts', responde(404))).toEqual([]);

    // El descubrimiento: el comentario de `accion.ts` no cuenta; la directiva y la acción en línea, sí
    const accionTs = readFileSync(join(SRC, 'servidor/accion.ts'), 'utf8');
    expect(accionTs).toContain("'use server'");
    expect(directivas('a.ts', accionTs)).toEqual({ archivo: false, enLinea: 0 });
    expect(directivas('a.ts', "'use server';\nexport const a = 1;").archivo).toBe(true);
    const enPagina =
      "export default function P() { async function a() { 'use server'; } return <p />; }";
    expect(directivas('a.tsx', enPagina).enLinea).toBe(1);
  });
});
