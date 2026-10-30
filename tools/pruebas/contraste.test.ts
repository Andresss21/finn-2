// Tokens de la identidad (TA-201; 05 §10; 07 V5-23): contraste de los dos temas con `contraste.py`, y el puente de
// Tailwind generado desde `tokens.json` sin desvíos.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { generar, type TokensJson } from './tokens-tailwind.mjs';

const TOKENS = 'apps/web/src/app/tokens.json';
const correr = (ruta: string) =>
  spawnSync('python', ['-I', 'tools/pruebas/contraste.py', ruta], { encoding: 'utf8' });

describe('PRU-DOM-PWA-001', () => {
  it('PRU-DOM-PWA-001 [V5-23, CF-11] contraste.py pasa sobre tokens.json en los temas claro y oscuro con los pares de 06-identidad-visual', () => {
    const r = correr(TOKENS);
    expect(r.stdout).toMatch(/pares verificados, 0 fallos/);
    expect(r.status).toBe(0);
  });

  it('PRU-DOM-PWA-001 [V5-23] contraste.py falla y nombra el par si un token baja del mínimo', () => {
    const t = JSON.parse(readFileSync(TOKENS, 'utf8')) as {
      color: Record<string, Record<string, string>>;
    };
    const color = t.color;
    color['texto-terciario'] = {
      ...color['texto-terciario'],
      oscuro: color['fondo']?.['oscuro'] ?? '',
    };
    const carpeta = mkdtempSync(join(tmpdir(), 'contraste-'));
    const ruta = join(carpeta, 'tokens.json');
    writeFileSync(ruta, JSON.stringify(t));
    const r = correr(ruta);
    expect(r.status).toBe(1);
    expect(r.stdout).toMatch(/FALLA oscuro: texto-terciario sobre fondo = 1\.00 < 4\.5/);
  });

  it('PRU-DOM-PWA-001 [CF-11, CF-12] tailwind.css es el generado desde tokens.json: colores sin prefijo, los ocho roles tipográficos y el rol rotulo', () => {
    const actual = readFileSync('apps/web/tailwind.css', 'utf8');
    const tokens = JSON.parse(readFileSync(TOKENS, 'utf8')) as TokensJson;
    expect(actual).toBe(generar(tokens));
    expect(actual).toContain('--color-superficie: var(--superficie);');
    expect(actual).toContain('--spacing: var(--espacio-1);');
    expect(actual).not.toContain('--finn-');
    expect(actual).toContain('@utility text-rotulo {');
    expect(Object.keys(tokens.tipografia)).toHaveLength(8);
    expect(actual.match(/@utility text-/g)).toHaveLength(8);
  });
});
