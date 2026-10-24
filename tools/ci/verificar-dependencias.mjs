// Control (a) de 04 §1.5 (BE-03): compara los package.json del workspace con la matriz de 04 §1.3
// y rechaza los `eslint-disable` que desactivan reglas de frontera.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

// Qué paquetes @finn/* puede declarar cada uno (04 §1.3). @finn/config es siempre válido (devDependency).
const PERMITIDAS = {
  '@finn/web': ['@finn/dominio', '@finn/aplicacion'],
  '@finn/aplicacion': ['@finn/dominio', '@finn/db', '@finn/sms', '@finn/conciliacion'],
  '@finn/db': ['@finn/dominio'],
  '@finn/sms': ['@finn/dominio'],
  '@finn/conciliacion': ['@finn/dominio'],
  '@finn/dominio': [],
};
const SOLO_DB = ['@prisma/client', '@prisma/adapter-pg', 'pg'];
const FRONTERA = /finn\/|no-restricted-|restricted-imports|dependency-cruiser/;

const paquetesDe = (raiz) => {
  const yaml = readFileSync(join(raiz, 'pnpm-workspace.yaml'), 'utf8');
  return [...yaml.matchAll(/^\s*-\s*(\S+)\s*$/gm)]
    .map((m) => m[1])
    .filter((p) => existsSync(join(raiz, p, 'package.json')));
};

function* fuentes(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'generado', '.next', 'dist'].includes(e.name)) continue;
    const ruta = join(dir, e.name);
    if (e.isDirectory()) yield* fuentes(ruta);
    else if (/\.(ts|tsx|mjs|cjs|js)$/.test(e.name)) yield ruta;
  }
}

export function verificar(raiz) {
  const fallos = [];
  const falla = (archivo, mensaje) => fallos.push({ control: 'a', archivo, mensaje });
  for (const carpeta of paquetesDe(raiz)) {
    const manifiesto = JSON.parse(readFileSync(join(raiz, carpeta, 'package.json'), 'utf8'));
    const { name } = manifiesto;
    const declaradas = Object.keys({
      ...manifiesto.dependencies,
      ...manifiesto.devDependencies,
      ...manifiesto.peerDependencies,
    });
    for (const d of declaradas) {
      if (d.startsWith('@finn/') && d !== '@finn/config' && !PERMITIDAS[name]?.includes(d))
        falla(
          `${carpeta}/package.json`,
          `${name} declara ${d}, prohibido por la matriz de 04 §1.3`,
        );
      if (name !== '@finn/db' && SOLO_DB.includes(d))
        falla(`${carpeta}/package.json`, `${name} declara ${d}: solo @finn/db lo importa (ADR-21)`);
      if (d.startsWith('@prisma/orm-'))
        falla(`${carpeta}/package.json`, `${name} declara ${d}: Prisma 8 está prohibido (ADR-21)`);
    }
    if (carpeta === 'apps/web' || carpeta.startsWith('packages/')) {
      for (const archivo of fuentes(join(raiz, carpeta))) {
        const lineas = readFileSync(archivo, 'utf8').split('\n');
        lineas.forEach((l, i) => {
          const m = /eslint-disable(?:-next-line|-line)?(.*)$/.exec(l);
          if (m && (m[1].trim() === '' || FRONTERA.test(m[1])))
            falla(
              `${relative(raiz, archivo).replaceAll('\\', '/')}:${i + 1}`,
              'eslint-disable sobre una regla de frontera (BE-03)',
            );
        });
      }
    }
  }
  return fallos;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const fallos = verificar(process.argv[2] ?? process.cwd());
  for (const f of fallos) console.error(`[control a] ${f.archivo}: ${f.mensaje}`);
  if (fallos.length > 0) process.exit(1);
  console.log('verificar-dependencias: matriz de 04 §1.3 respetada');
}
