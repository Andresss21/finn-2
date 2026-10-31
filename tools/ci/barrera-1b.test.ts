// PRU-SEG-RELOJ-006 y el orden de tools/ci/desplegar.mjs (TA-260; 07 §4.3, 03 §11.7, CH-64). Sin red, sin base y sin la
// CLI: `vercel env ls` llega por un archivo con la forma de su salida y los pasos reales reciben `correr` y `pedir`.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ENTORNOS, comprobar, enmascarar, listarConVercel, variablesEn } from './barrera-1b.mjs';
import { principal, nombreEtiqueta, pasosReales, REQUERIDAS, type Pasos } from './desplegar.mjs';

const salida = (n: 'con' | 'sin' | 'vacia'): string =>
  readFileSync(new URL(`./barrera-1b.${n}.fixture.txt`, import.meta.url), 'utf8');
const ok = (s: string) => () => ({ status: 0, salida: s });

const ENV = Object.fromEntries(REQUERIDAS.map((v) => [v, `valor-${v}`]));

/** Pasos que registran su orden; `cambios` reemplaza los que deben fallar. */
function simulados(cambios: Partial<Pasos> = {}): { pasos: Pasos; orden: string[] } {
  const orden: string[] = [];
  const paso =
    <T>(n: string, r: T) =>
    (): T => {
      orden.push(n);
      return r;
    };
  return {
    orden,
    pasos: {
      migrar: paso('migrar', undefined),
      c5: paso<string[]>('c5', []),
      c6: paso<string[]>('c6', []),
      barrera: paso<string[]>('barrera', []),
      vercelDeploy: paso('vercelDeploy', undefined),
      etiquetar: paso('etiquetar', undefined),
      ...cambios,
    },
  };
}
const correr = async (p: Pasos, env: Record<string, string> = ENV) => {
  const lineas: string[] = [];
  const codigo = await principal(env, p, (l) => lineas.push(l));
  return { codigo, texto: lineas.join('\n') };
};

describe('barrera 1b (07 §4.3)', () => {
  it('PRU-SEG-RELOJ-006 WF-desplegar, CT-01-barrera1b (07 §4.3): con una variable del reloj en Vercel falla y no despliega; sin ella pasa y despliega después de la barrera', async () => {
    const con = comprobar((e) => ok(e === 'preview' ? salida('con') : salida('sin'))());
    expect(con).toEqual(['FINN_HOY_SIMULADO existe en preview']);
    expect(comprobar(ok(salida('sin')))).toEqual([]);
    expect(comprobar(ok(salida('vacia')))).toEqual([]);

    const mal = simulados({ barrera: () => con });
    expect((await correr(mal.pasos)).codigo).toBe(1);
    expect(mal.orden).not.toContain('vercelDeploy');

    const bien = simulados();
    const conBarrera: Pasos = {
      ...bien.pasos,
      barrera: () => {
        bien.orden.push('barrera');
        return comprobar(ok(salida('sin')));
      },
    };
    expect((await correr(conBarrera)).codigo).toBe(0);
    expect(bien.orden).toEqual(['migrar', 'c5', 'c6', 'barrera', 'vercelDeploy', 'etiquetar']);
  });

  it('barrera 1b: reconoce cada variable por su nombre entero, no por un prefijo', () => {
    for (const v of ['FINN_ENTORNO', 'FINN_RELOJ_ARCHIVO', 'FINN_HOY_SIMULADO'])
      expect(variablesEn(` ${v}   Hidden  encrypted  Production`)).toEqual([v]);
    expect(variablesEn(' FINN_ENTORNO_X  MI_FINN_ENTORNO  ')).toEqual([]);
  });

  it('barrera 1b: lista producción, vista previa y desarrollo', () => {
    const vistos: string[][] = [];
    comprobar(
      listarConVercel({ VERCEL_TOKEN: 't' }, (a) => {
        vistos.push(a);
        return { status: 0, salida: salida('sin') };
      }),
    );
    expect(ENTORNOS).toEqual(['production', 'preview', 'development']);
    expect(vistos).toEqual(ENTORNOS.map((e) => ['env', 'ls', e, '--token', 't']));
  });

  it('barrera 1b: falla cerrada si la CLI falla o la salida no se reconoce', () => {
    expect(comprobar(() => ({ status: 1, salida: 'Error: token' }))).toHaveLength(3);
    expect(comprobar(() => ({ status: null, salida: '' }))).toHaveLength(3);
    expect(comprobar(ok(''))).toHaveLength(3);
    expect(comprobar(ok('otro formato'))).toEqual(
      ENTORNOS.map((e) => `vercel env ls ${e}: salida no reconocida`),
    );
  });

  it('barrera 1b: nunca publica el listado, que trae valores', () => {
    const fallos = comprobar(ok(salida('con')));
    expect(fallos.join('\n')).not.toContain('ficticio');
    expect(fallos).toHaveLength(3);
  });
});

describe('desplegar (03 §11.7, CH-02, CH-64)', () => {
  it.each<[string, Partial<Pasos>]>([
    ['C5', { c5: () => ['R3 sin RLS'] }],
    ['C6', { c6: () => ['- trigger'] }],
  ])(
    'desplegar: si %s falla después de migrar, no despliega ni etiqueta y sale con 1',
    async (_n, c) => {
      const s = simulados(c);
      const r = await correr(s.pasos);
      expect(r.codigo).toBe(1);
      expect(s.orden).toContain('migrar');
      expect(s.orden).not.toContain('barrera');
      expect(s.orden).not.toContain('vercelDeploy');
      expect(s.orden).not.toContain('etiquetar');
      // De C5 y C6 sale solo el número de filas
      expect(r.texto).not.toMatch(/R3 sin RLS|- trigger/);
      expect(r.texto).toMatch(/1 filas/);
    },
  );

  it('desplegar: si migrar falla, no corre nada más y el error sale sin el host', async () => {
    const env = {
      ...ENV,
      DIRECT_URL: 'postgresql://finn_migraciones.abc:clave@pooler.ejemplo:5432/postgres',
    };
    const s = simulados({
      migrar: () => {
        throw new Error('C3: Datasource at "pooler.ejemplo:5432" finn_migraciones.abc clave');
      },
    });
    const r = await correr(s.pasos, env);
    expect(r.codigo).toBe(1);
    expect(s.orden).toEqual([]);
    expect(r.texto).not.toMatch(/pooler\.ejemplo|\babc\b|clave/);
  });

  it('desplegar: sin un secreto el job falla y no corre nada; no hay guardia que lo deje verde', async () => {
    for (const v of REQUERIDAS) {
      const s = simulados();
      const r = await correr(s.pasos, { ...ENV, [v]: '' });
      expect(r.codigo, v).toBe(1);
      expect(r.texto, v).toContain(v);
      expect(s.orden, v).toEqual([]);
    }
  });

  it('desplegar: si vercel deploy falla no etiqueta, y su salida se publica sin la URL ni el token', async () => {
    const lineas: string[] = [];
    const log = (l: string): void => void lineas.push(l);
    const args: string[][] = [];
    const reales = pasosReales(
      ENV,
      (a) => {
        args.push(a);
        return { status: 1, salida: 'Inspect: https://vercel.com/x/y valor-VERCEL_TOKEN' };
      },
      () => Promise.reject(new Error('no debe llamarse')),
      log,
    );
    const s = simulados({ vercelDeploy: reales.vercelDeploy });
    expect(await principal(ENV, s.pasos, log)).toBe(1);
    expect(args).toEqual([['deploy', '--prod', '--yes', '--token', 'valor-VERCEL_TOKEN']]);
    expect(s.orden).not.toContain('etiquetar');
    expect(lineas.join('\n')).not.toMatch(/vercel\.com|valor-VERCEL_TOKEN/);
  });

  it('desplegar: etiqueta el commit por la API, con un nombre que no se repite al reintentar la corrida', async () => {
    const env = {
      ...ENV,
      GITHUB_REPOSITORY: 'd/r',
      GITHUB_SHA: 'abc',
      GITHUB_RUN_NUMBER: '7',
      GITHUB_RUN_ATTEMPT: '2',
    };
    const pedidos: [string, RequestInit][] = [];
    const conRespuesta = (exito: boolean) =>
      pasosReales(
        env,
        () => ({ status: 0, salida: '' }),
        (u, i) => {
          pedidos.push([u, i]);
          return Promise.resolve({ ok: exito, status: exito ? 201 : 422 });
        },
        () => undefined,
      );
    await conRespuesta(true).etiquetar();
    expect(nombreEtiqueta(env)).toBe('desplegado-7-2');
    expect(pedidos[0]?.[0]).toBe('https://api.github.com/repos/d/r/git/refs');
    expect(JSON.parse(pedidos[0]?.[1].body as string)).toEqual({
      ref: 'refs/tags/desplegado-7-2',
      sha: 'abc',
    });
    await expect(conRespuesta(false).etiquetar()).rejects.toThrow('422');
  });

  it('desplegar: enmascarar tapa URL, host, usuario, clave e IP, y deja el resto', () => {
    const env = {
      RESPALDO_DB_URL:
        'postgresql://finn_respaldo.ref1:cl4ve@db.ejemplo:5432/postgres?sslmode=require',
    };
    const t = enmascarar(
      [
        'at "db.ejemplo:5432" postgresql://otra:x@h/y cl4ve ref1',
        'connect ECONNREFUSED 10.1.2.3:5432 y 2600:1f18:2e13::1',
        'https://finn-2.vercel.app aws-0.pooler.supabase.com:5432',
        'Applying migration a las 12:30:45',
      ].join('\n'),
      env,
    );
    expect(t).not.toMatch(/db\.ejemplo|otra|cl4ve|ref1|10\.1\.2\.3|2600:|vercel\.app|supabase/);
    expect(t).toContain('Applying migration a las 12:30:45');
  });
});
