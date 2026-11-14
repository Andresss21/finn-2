// Control de `pnpm probar` (TA-597): opciones, entorno del servidor y del que siembra, archivo temporal y texto de acceso.
// La pila, la siembra y el servidor se prueban a mano con Docker (informe del PR): aquí, sin Docker.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  AVISO_CANDADO,
  archivoProbar,
  borrarEstado,
  entornoServidor,
  guardarEstado,
  leerEstado,
  leerOpciones,
  sinSoloServidor,
  SOLO_SERVIDOR,
  textoAcceso,
} from './local.ts';

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'finn-probar-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('probar: la app local con la pila de la E2E', () => {
  it('probar: compila por defecto; --sin-compilar reutiliza la compilación; --bajar baja', () => {
    expect(leerOpciones([])).toEqual({ bajar: false, compilar: true });
    expect(leerOpciones(['--sin-compilar'])).toEqual({ bajar: false, compilar: false });
    expect(leerOpciones(['--bajar']).bajar).toBe(true);
  });

  it('probar: una opción desconocida falla en vez de ignorarse', () => {
    expect(() => leerOpciones(['--compilar'])).toThrow(/opción desconocida --compilar/);
    expect(() => leerOpciones(['--dev'])).toThrow(/opción desconocida --dev/);
  });

  it('probar: el servidor corre en modo de pruebas con el reloj de archivo; el que siembra no los ve', () => {
    const pila = { DATABASE_URL: 'postgresql://finn_app@127.0.0.1:54322/finn_e2e', E2E_EMAIL: 'u' };
    const servidor = entornoServidor(pila, 'C:/tmp/reloj.json');
    expect(servidor).toMatchObject({
      ...pila,
      FINN_ENTORNO: 'pruebas',
      FINN_RELOJ_ARCHIVO: 'C:/tmp/reloj.json',
    });
    for (const v of SOLO_SERVIDOR) expect(servidor[v]).toBeTruthy();
    const siembra = sinSoloServidor({ ...servidor, PATH: 'x' });
    for (const v of SOLO_SERVIDOR) expect(siembra).not.toHaveProperty(v);
    expect(siembra).toMatchObject({ ...pila, PATH: 'x' });
  });

  it('probar: el estado queda en el directorio temporal, se lee igual y se borra', () => {
    const ruta = archivoProbar(dir);
    expect(ruta.startsWith(dir)).toBe(true);
    expect(leerEstado(ruta)).toBeNull();
    const estado = { pid: 123, entorno: { E2E_TOTP_SECRETO: 'ABC' } };
    guardarEstado(estado, ruta);
    expect(leerEstado(ruta)).toEqual(estado);
    borrarEstado(ruta);
    expect(leerEstado(ruta)).toBeNull();
  });

  it('probar: el texto de acceso trae URL, correo, clave y código, y el aviso nombra el candado', () => {
    const texto = textoAcceso({ E2E_EMAIL: 'usuario-e2e@finn.test', E2E_CLAVE: 'k-1' }, '123456');
    expect(texto).toContain('http://localhost:3100');
    expect(texto).toContain('usuario-e2e@finn.test');
    expect(texto).toContain('k-1');
    expect(texto).toContain('123456');
    expect(texto).toContain('pnpm probar:codigo');
    expect(AVISO_CANDADO).toContain('pnpm test:e2e');
    expect(AVISO_CANDADO).toContain('pnpm probar --bajar');
  });
});
