// Tokens y movimiento de la entrega 4 (D-10, E4-32, C-18; CH-240, CH-241): lo que dicen `tokens.css` y `tokens-decorativos.css`
// y que el resto de `apps/web/src` no repita. Lee archivos, no estilos calculados; ninguna prueba espera el reloj.
import { describe, expect, it } from 'vitest';

type Fuentes = Record<string, string>;
const crudas = (o: Fuentes): Fuentes => o;
// Toda la producción de `apps/web/src` (sin pruebas) como texto, y los archivos del anexo.
const PRODUCCION = crudas(
  import.meta.glob<string>(['../../**/*.{ts,tsx,css}', '!../../**/*.test.{ts,tsx}'], {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
);
const ANEXO = crudas(
  import.meta.glob<string>(
    '../../../../../docs/anexos/finn-diseno-entrega-4/estilos/{tokens,tokens-propuesta}.css',
    { query: '?raw', import: 'default', eager: true },
  ),
);
const TOKENS = '../../app/tokens.css';
const DECORATIVOS = '../../app/tokens-decorativos.css';
const GLOBALS = '../../app/globals.css';
const TOKENS_JSON = import.meta.glob<string>('../../app/tokens.json', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const anexo = (nombre: string): string =>
  Object.entries(ANEXO).find(([r]) => r.endsWith(`/${nombre}`))?.[1] ?? '';
const produccion = (): string[] => Object.keys(PRODUCCION);
const leer = (ruta: string): string => PRODUCCION[ruta] ?? '';
const relative = (_base: string, ruta: string): string => ruta.replace('../../', '');

/** Sin comentarios: lo que queda es lo que el navegador o el compilador ven. */
function sinComentarios(texto: string): string {
  return texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[\s;{}(,])\/\/.*$/gm, '$1');
}

/** Las variables `--prefijo-*` que declara un CSS. */
function declaradas(css: string, prefijos: readonly string[]): string[] {
  const re = new RegExp(`^\\s*(--(?:${prefijos.join('|')})-[a-z0-9-]*):`, 'gm');
  return [...sinComentarios(css).matchAll(re)].map((m) => m[1] as string);
}

const PREFIJOS_MOVIMIENTO = ['duracion', 'escalonado', 'retraso', 'espera'] as const;
const PREFIJOS_TIEMPO = [...PREFIJOS_MOVIMIENTO, 'retardo'] as const;

/** Filas `--viejo NNNms → --nuevo (…)` de `tokens-propuesta.css`. */
function tabla(): { viejo: string; nuevo: string; propuesto: boolean }[] {
  const comentario = anexo('tokens-propuesta.css').match(
    /Variables propias de la app → token\n([\s\S]*?)\*\//,
  );
  const filas = [
    ...(comentario?.[1] ?? '').matchAll(/^\s*(--[a-z-]+) +\S+ +→ +(--[a-z-]+)(.*)$/gm),
  ];
  return filas.map((m) => ({
    viejo: m[1] as string,
    nuevo: m[2] as string,
    propuesto: (m[3] as string).includes('propuesto'),
  }));
}

describe('PRU-CMP-PWA', () => {
  it('PRU-CMP-PWA-701 [D-10] las variables de movimiento de tokens.css son las del anexo aprobado, y las 17 propias de la app resuelven al token de su fila', () => {
    const aprobadas = new Set(declaradas(anexo('tokens.css'), PREFIJOS_TIEMPO));
    const css = leer(TOKENS);
    const propias = declaradas(css, PREFIJOS_TIEMPO);
    expect(propias.filter((v) => !aprobadas.has(v))).toEqual([]);
    // Las tres de la entrega 3 que el anexo aprobó entran con su valor.
    expect(css).toMatch(/--duracion-temblor: 380ms;/);
    expect(css).toMatch(/--retardo-cascada: 40ms;/);
    expect(css).toMatch(/--duracion-confirmacion: 650ms;/);
    expect(css).not.toMatch(/--retardo-(bloque|grafico):/); // propuestos, sin aprobar
    expect(Object.values(TOKENS_JSON)[0] ?? '').not.toMatch(
      /"(tope-escalonado|escalonado-|retraso-)/,
    );

    const filas = tabla();
    expect(filas.length).toBe(17);
    const globals = sinComentarios(leer(GLOBALS));
    const usos = produccion()
      .filter((r) => r !== TOKENS)
      .map((r) => sinComentarios(leer(r)))
      .join('\n');
    for (const f of filas) {
      expect(propias, `${f.viejo} sigue declarada`).not.toContain(f.viejo);
      expect(usos, `${f.viejo} sigue en uso`).not.toContain(`var(${f.viejo})`);
      expect(usos, `${f.viejo} sigue como cadena`).not.toContain(`'${f.viejo}'`);
      if (!f.propuesto) expect(aprobadas, `${f.nuevo} no está aprobado`).toContain(f.nuevo);
    }
    // Los dos retardos propuestos no se agregan: lo que dependía de ellos queda con su valor y la marca.
    const marcadas = leer(GLOBALS)
      .split('\n')
      .filter((l) => l.includes('pendiente: tokens-propuesta (entrega 4)'));
    expect(marcadas.length).toBeGreaterThanOrEqual(5);
    expect(globals).not.toMatch(/--retardo-(bloque|grafico)/);
    expect(globals).not.toContain('--tope-escalonado');
  });

  it('PRU-CMP-PWA-702 [CA-E4-2, D-10] en apps/web/src no hay un hex ni una duración en ms o s fuera de tokens.css y tokens-decorativos.css', () => {
    const permitidos = new Set([TOKENS, DECORATIVOS]);
    const hex = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/g;
    // `500ms` o `1.4s` pegados: los textos para el usuario llevan un espacio ("30 s") y no cuentan.
    const duracion = /(?<![A-Za-z0-9.#-])\d*\.?\d+(?:ms|s)(?![A-Za-z0-9-])/g;
    const sueltos: string[] = [];
    for (const ruta of produccion()) {
      if (permitidos.has(ruta)) continue;
      const lineas = leer(ruta).split('\n');
      lineas.forEach((linea, i) => {
        const marca = 'pendiente: tokens-propuesta (entrega 4)';
        if (linea.includes(marca) || (lineas[i + 1] ?? '').includes(marca)) return; // Prettier puede partir la línea
        const codigo = sinComentarios(linea);
        for (const m of [...codigo.matchAll(hex), ...codigo.matchAll(duracion)]) {
          sueltos.push(`${relative('', ruta)}:${i + 1} ${m[0]}`);
        }
      });
    }
    expect(sueltos).toEqual([]);
  });

  it('PRU-CMP-PWA-703 [CA-C-4, C-18] los --decorativo-* se declaran solo en tokens-decorativos.css y ningún texto los usa como fondo de su contraste', () => {
    const declarados = declaradas(leer(DECORATIVOS), ['decorativo']);
    expect(declarados.length).toBeGreaterThanOrEqual(6);
    const fuera: string[] = [];
    const comoFondo: string[] = [];
    for (const ruta of produccion()) {
      if (ruta === DECORATIVOS) continue;
      const codigo = sinComentarios(leer(ruta));
      if (/^\s*--decorativo-[a-z0-9-]*:/m.test(codigo)) fuera.push(relative('', ruta));
      // Fondo liso o color de texto (lo que decide el contraste): nunca un --decorativo. Los motivos van en
      // `backgroundImage`, `maskImage`, `boxShadow` y `animation`, encima del fondo que sí se mide (`--tarjeta-*`).
      for (const m of codigo.matchAll(
        /(background-color|backgroundColor|\bcolor|\bbg-\[?)[^;\n]*var\(--decorativo-/g,
      )) {
        comoFondo.push(`${relative('', ruta)} ${m[0]}`);
      }
    }
    expect(fuera).toEqual([]);
    expect(comoFondo).toEqual([]);
    // Los fondos de contraste de la cara siguen siendo los de la tarjeta: el tokens.json que mide el contraste no los lleva.
    expect(Object.values(TOKENS_JSON)[0] ?? '').not.toContain('decorativo');
    expect(leer(GLOBALS)).toContain("@import './tokens-decorativos.css';");
  });
});
