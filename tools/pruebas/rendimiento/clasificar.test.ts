import { describe, expect, it } from 'vitest';
import {
  cargaBibliotecaDeFormularios,
  clasificar,
  mediana,
  prerenderizadasDeFinn,
  rutasDeFinn,
  tabla,
  urlDe,
  type Presupuestos,
} from './clasificar.ts';

const P: Presupuestos = {
  compartidoKb: 170,
  formulariosKb: 50,
  precacheKb: 1500,
  porRutaKb: 50,
  reportesKb: 120,
  lcpMs: 2500,
  cls: 0.1,
  inpMs: 200,
  ejemplosDeRuta: { '/metas/[metaId]': '/metas/1' },
};
const base = 139_000;
const medidas = [
  { ruta: '/', formulario: false, scripts: { 'marco.js': base, 'inicio.js': 3000 } },
  { ruta: '/reportes/[tipo]', formulario: false, scripts: { 'marco.js': base, 'r.js': 100_000 } },
  {
    ruta: '/registrar/gasto',
    formulario: true,
    scripts: { 'marco.js': base, 'rhf.js': 44_600, 'gasto.js': 8000, 'parcial.js': 2000 },
  },
  {
    ruta: '/cuentas/nueva',
    formulario: true,
    scripts: { 'marco.js': base, 'rhf.js': 44_600, 'parcial.js': 2000 },
  },
  { ruta: '/metas/nueva', formulario: true, scripts: { 'marco.js': base, 'rhf.js': 44_600 } },
];

describe('rendimiento: clasificar (05 §13.4)', () => {
  it('una ruta tiene formulario si carga la biblioteca, no por cómo se llama (CH-61)', () => {
    expect(cargaBibliotecaDeFormularios(['a', 'x={shouldUnregister:!1}'])).toBe(true);
    expect(cargaBibliotecaDeFormularios(['PaginaFlujo', 'flujos'])).toBe(false);
    // Como en #227: la biblioteca es de la ruta con formulario y no entra en el compartido
    const c = clasificar(
      [
        { ruta: '/', formulario: false, scripts: { 'marco.js': base } },
        { ruta: '/flujo', formulario: false, scripts: { 'marco.js': base, 'corto.js': 680 } },
        { ruta: '/eco', formulario: true, scripts: { 'marco.js': base, 'rhf.js': 46_920 } },
      ],
      P,
    );
    expect([c.compartidoKb, c.formulariosKb]).toEqual([139, 46.92]);
    expect(c.rutas.map((r) => r.kb)).toEqual([0, 0.68, 0]);
  });

  it('separa compartido, biblioteca de formularios y por ruta; lo parcial cuenta en cada ruta', () => {
    const c = clasificar(medidas, P);
    expect(c.compartidoKb).toBe(139);
    expect(c.formulariosKb).toBe(44.6);
    expect(c.rutas.map((r) => [r.ruta, r.kb])).toEqual([
      ['/', 3],
      ['/reportes/[tipo]', 100],
      ['/registrar/gasto', 10],
      ['/cuentas/nueva', 2],
      ['/metas/nueva', 0],
    ]);
    expect(c.excesos).toEqual([]);
  });

  it('un archivo de formularios que también carga una ruta sin formulario no es biblioteca', () => {
    const c = clasificar(
      [
        { ruta: '/', formulario: false, scripts: { 'm.js': 1000, 'z.js': 500 } },
        { ruta: '/x', formulario: false, scripts: { 'm.js': 1000 } },
        { ruta: '/f', formulario: true, scripts: { 'm.js': 1000, 'z.js': 500 } },
      ],
      P,
    );
    expect(c.formulariosKb).toBe(0);
    expect(c.rutas.find((r) => r.ruta === '/f')?.kb).toBe(0.5);
  });

  it('informa cada presupuesto superado, en el límite exacto no', () => {
    const justo = clasificar([{ ruta: '/', formulario: false, scripts: { 'm.js': 170_000 } }], P);
    expect(justo.excesos).toEqual([]);
    const c = clasificar(
      [
        { ruta: '/', formulario: false, scripts: { 'm.js': 170_010, 'a.js': 50_010 } },
        { ruta: '/reportes/x', formulario: false, scripts: { 'm.js': 170_010, 'b.js': 120_010 } },
        { ruta: '/f', formulario: true, scripts: { 'm.js': 170_010, 'f.js': 50_010 } },
      ],
      P,
    );
    expect(c.excesos).toEqual([
      'JS compartido: 170.01 KB > 170 KB',
      'biblioteca de formularios: 50.01 KB > 50 KB',
      '/: 50.01 KB > 50 KB',
      '/reportes/x: 120.01 KB > 120 KB',
    ]);
  });

  it('una ruta de reportes tiene su tope y las demás el general', () => {
    const c = clasificar(medidas, P);
    expect(c.rutas.find((r) => r.ruta === '/reportes/[tipo]')?.topeKb).toBe(120);
    expect(c.rutas.find((r) => r.ruta === '/')?.topeKb).toBe(50);
  });

  it('toma del manifiesto solo las páginas de (finn), sin slots ni interceptaciones', () => {
    expect(
      rutasDeFinn({
        '/(finn)/page': '/',
        '/(finn)/metas/[metaId]/page': '/metas/[metaId]',
        '/(finn)/@superpuesto/default': '/',
        '/(finn)/@superpuesto/(.)metas/nueva/page': '/metas/nueva',
        '/_not-found/page': '/_not-found',
        '/api/pruebas/reloj/route': '/api/pruebas/reloj',
      }),
    ).toEqual([
      { clave: '/(finn)/page', ruta: '/' },
      { clave: '/(finn)/metas/[metaId]/page', ruta: '/metas/[metaId]' },
    ]);
  });

  it('una ruta con parámetros necesita su ejemplo', () => {
    expect(urlDe('/', P.ejemplosDeRuta)).toBe('/');
    expect(urlDe('/metas/[metaId]', P.ejemplosDeRuta)).toBe('/metas/1');
    expect(urlDe('/metas/[otra]', P.ejemplosDeRuta)).toBeNull();
  });

  it('mediana de 3 y de 4', () => {
    expect(mediana([3, 1, 2])).toBe(2);
    expect(mediana([4, 1, 2, 3])).toBe(2.5);
  });

  it('la tabla compara con main si hay una medida anterior', () => {
    const c = clasificar(medidas, P);
    expect(tabla(c, null, 'n')).toContain('| Compartido | 139 | — |');
    const antes = { ...c, compartidoKb: 138.5 };
    expect(tabla(c, antes, 'n')).toContain('| Compartido | 139 | +0.5 |');
  });
});

describe('prerenderizadasDeFinn (CH-66)', () => {
  const rutas = {
    '/(finn)/page': '/',
    '/(finn)/ajustes/page': '/ajustes',
    '/(finn)/metas/[metaId]/page': '/metas/[metaId]',
    '/(finn)/temas/[tema]/page': '/temas/[tema]',
    '/(finn)/@superpuesto/(.)flujo/page': '/(.)flujo',
    '/(finn)/layout': '/layout-no-es-ruta',
    '/manifest.webmanifest/route': '/manifest.webmanifest',
    '/ingresar/page': '/ingresar',
  };

  it('nombra las estáticas, los slots y las de parámetros de (finn), y solo esas', () => {
    expect(
      prerenderizadasDeFinn(rutas, {
        routes: {
          '/ajustes': {},
          '/(.)flujo': { srcRoute: '/(.)flujo' },
          '/temas/uno': { srcRoute: '/temas/[tema]' },
          '/manifest.webmanifest': { srcRoute: null },
          '/ingresar': {},
          '/layout-no-es-ruta': {},
        },
        dynamicRoutes: { '/metas/[metaId]': {} },
      }).sort(),
    ).toEqual(['/(.)flujo', '/ajustes', '/metas/[metaId]', '/temas/[tema]']);
  });

  it('sin rutas de (finn) en el manifiesto de prerender, ninguna', () => {
    expect(
      prerenderizadasDeFinn(rutas, {
        routes: { '/manifest.webmanifest': {} },
        dynamicRoutes: {},
      }),
    ).toEqual([]);
  });
});
