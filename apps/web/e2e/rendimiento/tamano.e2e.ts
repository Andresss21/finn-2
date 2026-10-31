// Presupuestos de bytes (05 §13.1 y §13.4, FE-48; 07 §6.6): en `e2e` de `main` bloquean siempre. Se mide en el navegador,
// cada ruta en un contexto nuevo y con el service worker bloqueado. Las rutas salen del manifiesto de la compilación: una
// pantalla nueva entra sola. Sin sesión (hasta que `configuracion` sea dependencia, DT-23) ninguna ruta de `(finn)` es
// medible: se mide `/`, que redirige, como piso del compartido. Con sesión, una ruta que no se pueda medir hace fallar.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { expect, test, type Browser } from '@playwright/test';
import {
  cargaBibliotecaDeFormularios,
  clasificar,
  rutasDeFinn,
  tabla,
  urlDe,
  type Clasificacion,
  type MedidaRuta,
  type Presupuestos,
} from '../../../../tools/pruebas/rendimiento/clasificar.ts';

const leer = (f: string): unknown => JSON.parse(readFileSync(f, 'utf8'));
const P = leer('presupuestos.json') as Presupuestos;
const SESION = 'test-results/sesion.json'; // ARCHIVO_SESION de configuracion/inicio-sesion.setup.ts
const SALIDA = 'test-results/rendimiento/tamanos.json';
const BASE_MAIN = '../../test-results/tamanos-main/tamanos.json'; // la caché de ci.yml; fuera de lo que Playwright limpia

async function medir(browser: Browser, origen: string, url: string, conSesion: boolean) {
  const contexto = await browser.newContext({
    baseURL: origen,
    serviceWorkers: 'block',
    ...(conSesion ? { storageState: SESION } : {}),
  });
  const page = await contexto.newPage();
  const respuestas: {
    path: string;
    origen: string;
    bytes: Promise<number>;
    cuerpo: Promise<string>;
  }[] = [];
  page.on('response', (r) => {
    if (r.request().resourceType() !== 'script') return;
    const u = new URL(r.url());
    const bytes = r
      .request()
      .sizes()
      .then((s) => s.responseBodySize);
    const cuerpo = r.text().catch(() => '');
    respuestas.push({ path: u.pathname, origen: u.origin, bytes, cuerpo });
  });
  const principal = await page.goto(url, { waitUntil: 'load' });
  const scripts: Record<string, number> = {};
  for (const r of respuestas) scripts[r.path] = await r.bytes;
  const formulario = cargaBibliotecaDeFormularios(
    await Promise.all(respuestas.map((r) => r.cuerpo)),
  );
  const final = new URL(page.url()).pathname;
  const ajenos = respuestas.filter((r) => r.origen !== origen).map((r) => r.origen);
  const estado = principal?.status() ?? 0;
  await contexto.close();
  return { scripts, final, ajenos, estado, formulario };
}

interface Recorrido {
  c: Clasificacion;
  conFormulario: number;
  flujos: number;
  sinMedir: string[];
  ajenos: string[];
  nota: string;
}

async function recorrer(browser: Browser, origen: string): Promise<Recorrido> {
  const manifiesto = leer('.next/app-path-routes-manifest.json') as Record<string, string>;
  const rutas = rutasDeFinn(manifiesto);
  const medidas: MedidaRuta[] = [];
  const sinMedir: string[] = [];
  const ajenos: string[] = [];
  let flujos = 0;
  const conSesion = existsSync(SESION);
  if (!conSesion) {
    const m = await medir(browser, origen, '/', false);
    medidas.push({ ruta: `piso:${m.final}`, formulario: false, scripts: m.scripts });
    ajenos.push(...m.ajenos);
  } else {
    for (const { clave, ruta } of rutas) {
      const url = urlDe(ruta, P.ejemplosDeRuta);
      if (url === null) {
        sinMedir.push(`${ruta}: falta su ejemplo en presupuestos.json (ejemplosDeRuta)`);
        continue;
      }
      const m = await medir(browser, origen, url, true);
      ajenos.push(...m.ajenos);
      if (m.final.startsWith('/ingresar') || m.estado !== 200) {
        sinMedir.push(`${ruta}: respondió ${m.estado} y terminó en ${m.final}`);
      } else if (m.final === new URL(url, origen).pathname) {
        const fuente = readFileSync(`src/app${clave}.tsx`, 'utf8');
        // 05 §1.4: las de `flujos/`. Las de /pruebas/ no cuentan: su flujo corto no tiene formulario
        if (!ruta.startsWith('/pruebas/') && /\bflujos\b|PaginaFlujo/.test(fuente)) flujos++;
        medidas.push({ ruta, formulario: m.formulario, scripts: m.scripts });
      } // si no, redirige a otra pantalla (reportes/page.tsx, 1.3): no tiene JS propio
    }
  }
  const nota = conSesion
    ? `${medidas.length} rutas medidas con sesión.`
    : `Sin sesión: piso del compartido medido en \`/\`; ${rutas.length} rutas de (finn) sin medir.`;
  return {
    c: clasificar(medidas, P),
    conFormulario: medidas.filter((m) => m.formulario).length,
    flujos,
    sinMedir,
    ajenos,
    nota,
  };
}

function publicar(r: Recorrido): void {
  const escribir = (f: string): void => {
    mkdirSync(dirname(f), { recursive: true });
    writeFileSync(f, JSON.stringify(r.c, null, 2) + '\n');
  };
  const base = existsSync(BASE_MAIN) ? (leer(BASE_MAIN) as Clasificacion) : null;
  escribir(SALIDA);
  if (process.env['FINN_EVENTO'] === 'push') escribir(BASE_MAIN);
  const texto = tabla(r.c, base, r.nota);
  console.log(texto);
  const resumen = process.env['GITHUB_STEP_SUMMARY'];
  if (resumen) appendFileSync(resumen, texto);
}

test.describe('PRU-REN-PWA tamaño', () => {
  test.describe.configure({ timeout: 600_000 });
  let r: Recorrido;

  test.beforeAll(async ({ browser }, info) => {
    r = await recorrer(browser, String(info.project.use.baseURL));
    publicar(r);
  });

  test('PRU-REN-PWA-001 [V5-13, V5-35] la biblioteca de formularios no supera su presupuesto de 05 §13.1', () => {
    expect(r.sinMedir).toEqual([]);
    // Si React Hook Form perdiera la firma, ninguna ruta tendría formulario: con flujos reales, eso falla
    expect(r.conFormulario > 0 || r.flujos === 0, 'hay flujos y ninguno carga la biblioteca').toBe(
      true,
    );
    test.skip(r.conFormulario === 0, 'Ninguna ruta con formulario todavía (flujos/, 05 §1.4)');
    expect(r.c.formulariosKb).toBeGreaterThan(0);
    expect(r.c.formulariosKb).toBeLessThanOrEqual(P.formulariosKb);
  });

  test('PRU-REN-PWA-002 [V5-20, V5-34] el JS compartido y el de cada ruta no superan 05 §13.1, sin scripts de terceros', () => {
    expect(r.sinMedir).toEqual([]);
    expect(r.ajenos, 'FE-49: sin scripts de terceros').toEqual([]);
    expect(r.c.compartidoKb, 'una medida vacía no prueba nada').toBeGreaterThan(0);
    expect(r.c.excesos).toEqual([]);
  });
});
