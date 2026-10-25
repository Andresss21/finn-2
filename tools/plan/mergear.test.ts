// Pruebas de tools/plan/mergear.ts (TA-010, TA-014) con `gh` y `git` simulados: ninguna toca la red ni el repositorio.
// La aprobación de DT-33 se lee de una carpeta temporal con entradas como las que escribe el hook.
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { puedePreguntar } from './aprobacion.ts';
import { mergear } from './mergear.ts';
import type { Opciones, Respuesta } from './mergear.ts';

const PLAN = [
  '#### TA-900 Obligatoria de prueba',
  '```tarea',
  'revision: obligatoria',
  'cubre: DT-01',
  '```',
  '#### TA-901 Normal de prueba',
  '```tarea',
  'revision: normal',
  'cubre: CA-01.1',
  '```',
  '**Archivos.** `tools/plan/x.ts`, `tools/plan/{y,z}.ts`.',
  '',
].join('\n');

interface Caso {
  tarea?: string;
  checks?: { name: string; bucket: string }[] | null; // null: "no checks reported"
  archivos?: [string, string, number][]; // estado de name-status, ruta, líneas agregadas
  featuresBase?: string;
  featuresCabeza?: string;
  body?: string;
  diffPruebas?: string; // salida de `git diff -U0` de los archivos de prueba
  contenidos?: Record<string, string>; // 'ref:ruta' → contenido para `git show`
}
const MIRAR = 'Qué mirar: tools/plan/x.ts:1-10 — el cálculo del exceso';
const COMMIT = '2026-10-20T10:00:00-06:00';

function simular(c: Caso) {
  const llamadas: string[] = [];
  const archivos = c.archivos ?? [['M', 'tools/plan/x.ts', 10]];
  const ok = (stdout: string): Respuesta => ({ status: 0, stdout, stderr: '' });
  const run = (cmd: string, args: string[]): Respuesta => {
    const l = `${cmd} ${args.join(' ')}`;
    llamadas.push(l);
    if (l.startsWith('gh pr view'))
      return ok(
        JSON.stringify({
          number: 7,
          title: `${c.tarea ?? 'TA-901'}: algo`,
          body: c.body ?? `Tarea: ${c.tarea ?? 'TA-901'}\n${MIRAR}\n`,
          state: 'OPEN',
          isDraft: false,
          headRefName: 'ta-901-algo',
          headRefOid: 'cabeza',
          baseRefName: 'main',
        }),
      );
    if (l.startsWith('gh pr checks')) {
      if (c.checks === null)
        return { status: 1, stdout: '', stderr: "no checks reported on the 'x' branch" };
      return ok(JSON.stringify(c.checks ?? [{ name: 'rapido', bucket: 'pass' }]));
    }
    if (l.startsWith('git diff --numstat'))
      return ok(archivos.map(([, r, n]) => `${n}\t0\t${r}`).join('\n'));
    if (l.startsWith('git diff --name-status'))
      return ok(archivos.map(([e, r]) => `${e}\t${r}`).join('\n'));
    if (l.startsWith('git log -1 --format=%cI cabeza')) return ok(COMMIT + '\n');
    if (l.startsWith('git diff -U0') && !l.endsWith('package.json')) return ok(c.diffPruebas ?? '');
    const guardado =
      cmd === 'git' && args[0] === 'show' ? c.contenidos?.[args[1] ?? ''] : undefined;
    if (guardado !== undefined) return ok(guardado);
    if (l.startsWith('git show origin/main:docs/08-tareas.md')) return ok(PLAN);
    if (l.startsWith('git show origin/main:pruebas/features.json'))
      return ok(c.featuresBase ?? '{}');
    if (l.startsWith('git show cabeza:pruebas/features.json')) return ok(c.featuresCabeza ?? '{}');
    if (l.startsWith('git show')) return { status: 128, stdout: '', stderr: 'no existe' };
    if (l.startsWith('gh api') && l.includes('/activity'))
      return ok('[{"activity_type":"branch_creation"},{"activity_type":"push"}]');
    if (l.startsWith('gh repo view')) return ok('{"nameWithOwner":"yo/finn-2"}');
    return ok('');
  };
  return { run, llamadas };
}

const correr = (c: Caso, op: Partial<Opciones> = {}) => {
  const s = simular(c);
  const r = mergear(
    { numero: 7, aprobado: false, dryRun: false, resumen: false, sinCi: false, ...op },
    s.run,
  );
  const merge = s.llamadas.find((l) => l.startsWith('gh pr merge'));
  return { ...r, texto: r.salida.join('\n') + '\n' + r.revision, merge };
};
const carpeta = (archivos: Record<string, object> = {}): string => {
  const dir = mkdtempSync(join(tmpdir(), 'finn-aprobacion-'));
  for (const [n, d] of Object.entries(archivos)) writeFileSync(join(dir, n), JSON.stringify(d));
  return dir;
};
// Lo que escribe .claude/hooks/aprobar.mjs: tarea, hora, sesión y sha256 del mensaje
const HUELLA = 'a'.repeat(64);
const aprobacion = (tarea: string, aprobadoEn = '2026-10-21T09:00:00.000Z') => ({
  tarea,
  aprobadoEn,
  sesion: 's-1',
  huella: HUELLA,
});
const aprobado = (tarea: string) => ({
  aprobado: true,
  aprobaciones: carpeta({ [`${tarea}.json`]: aprobacion(tarea) }),
});

describe('mergear: paso 1, checks', () => {
  it('un PR rojo no se mergea', () => {
    const r = correr({ checks: [{ name: 'rapido', bucket: 'fail' }] });
    expect(r.codigo).toBe(1);
    expect(r.texto).toContain('rapido: fail');
    expect(r.merge).toBeUndefined();
  });

  it('integracion y e2e cuentan si corrieron; omitidos no', () => {
    const rojo = correr({
      checks: [
        { name: 'rapido', bucket: 'pass' },
        { name: 'e2e', bucket: 'fail' },
      ],
    });
    expect(rojo.codigo).toBe(1);
    const omitido = correr({
      checks: [
        { name: 'rapido', bucket: 'pass' },
        { name: 'integracion', bucket: 'skipping' },
      ],
    });
    expect(omitido.codigo).toBe(0);
  });

  it('cierre es obligatorio cuando una ficha pasa a terminada', () => {
    const r = correr({ featuresCabeza: '{"FT-30":"terminada"}' });
    expect(r.codigo).toBe(1);
    expect(r.texto).toContain('cierre: no corrió');
    expect(r.texto).toContain('FT-30: pendiente → terminada');
  });

  it('sin checks falla salvo --sin-ci, que queda en el resumen', () => {
    expect(correr({ checks: null }).codigo).toBe(1);
    const r = correr({ checks: null }, { sinCi: true });
    expect(r.codigo).toBe(0);
    expect(r.texto).toContain('AVISO --sin-ci');
  });
});

describe('mergear: paso 2, archivos del usuario', () => {
  it.each(['pruebas/manuales/resultados.md', 'pruebas/firmantes-permitidos', 'plan/tu.md'])(
    'un PR que toca %s se rechaza',
    (ruta) => {
      const r = correr({ archivos: [['M', ruta, 1]] });
      expect(r.codigo).toBe(1);
      expect(r.texto).toContain(`toca ${ruta}`);
      expect(r.merge).toBeUndefined();
    },
  );
});

describe('mergear: paso 3, tamaño', () => {
  it('un diff de 401 líneas de producción no se mergea', () => {
    const r = correr({ archivos: [['A', 'tools/plan/x.ts', 401]] });
    expect(r.codigo).toBe(1);
    expect(r.texto).toContain('DT-01 producción 401 > 400 líneas');
  });
});

describe('mergear: paso 4, revisión obligatoria', () => {
  it('una obligatoria sin --aprobado no se mergea', () => {
    const r = correr({ tarea: 'TA-900' });
    expect(r.codigo).toBe(1);
    expect(r.texto).toContain('revisión obligatoria');
    expect(r.merge).toBeUndefined();
  });

  it('con --aprobado se mergea con Tarea y Aprobado-por', () => {
    const r = correr({ tarea: 'TA-900' }, aprobado('TA-900'));
    expect(r.codigo).toBe(0);
    expect(r.merge).toContain('--squash');
    expect(r.merge).toContain('Tarea: TA-900');
    expect(r.merge).toContain('Aprobado-por: usuario');
  });

  it('una normal con un archivo de .github/ se trata como obligatoria', () => {
    const r = correr({ archivos: [['A', '.github/workflows/ci.yml', 20]] });
    expect(r.codigo).toBe(1);
    expect(r.texto).toContain('.github/workflows/ci.yml');
    expect(r.merge).toBeUndefined();
  });

  it('una normal en verde se mergea sin Aprobado-por', () => {
    const r = correr({});
    expect(r.codigo).toBe(0);
    expect(r.merge).toContain('Tarea: TA-901');
    expect(r.merge).not.toContain('Aprobado-por');
  });
});

describe('mergear: paso 5 y 6, resumen y --dry-run', () => {
  it('--dry-run hace todo menos el merge', () => {
    const r = correr({}, { dryRun: true });
    expect(r.codigo).toBe(0);
    expect(r.merge).toBeUndefined();
    expect(r.texto).toContain('pushes: 2');
    expect(r.texto).toContain('despliegue de emergencia pendiente: ninguno');
  });

  it('el resumen lista las pruebas cuyo archivo de datos cambió (RS7-09)', () => {
    const r = correr(
      { archivos: [['M', 'packages/dominio/escenarios/datos/esc-01.ts', 3]] },
      { resumen: true },
    );
    expect(r.texto).toContain('packages/dominio/escenarios/datos/esc-01.ts');
    expect(r.merge).toBeUndefined();
  });
});

describe('mergear: "Qué mirar" del informe (TA-014)', () => {
  it.each([
    ['sin la línea', 'Tarea: TA-901\nHecho: algo\n'],
    ['vacía', 'Tarea: TA-901\nQué mirar:   \nHecho: algo\n'],
    ['con "nada"', 'Tarea: TA-901\nQué mirar: nada\n'],
  ])('un PR %s se rechaza', (_, body) => {
    const r = correr({ body });
    expect(r.codigo).toBe(1);
    expect(r.texto).toContain('Qué mirar');
    expect(r.merge).toBeUndefined();
  });

  it('acepta "Qué mirar" como lista en las líneas siguientes', () => {
    const r = correr({
      body: 'Tarea: TA-901\nQué mirar:\n- `tools/plan/x.ts:3` — el borde\nHecho: x\n',
    });
    expect(r.codigo).toBe(0);
  });
});

describe('mergear: revisión obligatoria por archivos de producción (DT-20)', () => {
  it('solo un archivo de escenarios en escenarios/datos/ queda normal', () => {
    const r = correr({ archivos: [['A', 'packages/dominio/escenarios/datos/esc-07.ts', 120]] });
    expect(r.texto).toContain('revisión normal');
    expect(r.codigo).toBe(0);
    expect(r.merge).not.toContain('Aprobado-por');
  });

  it('una prueba dentro de calculo/ no vuelve obligatoria una tarea normal', () => {
    const r = correr({ archivos: [['A', 'packages/dominio/src/calculo/saldo.test.ts', 40]] });
    expect(r.texto).toContain('revisión normal');
  });

  it('un archivo de calculo/ en una tarea normal se trata como obligatoria', () => {
    const r = correr({ archivos: [['M', 'packages/dominio/src/calculo/saldo.ts', 5]] });
    expect(r.codigo).toBe(1);
    expect(r.texto).toContain('revisión obligatoria');
    expect(r.texto).toContain('motor: packages/dominio/src/calculo/saldo.ts (+5 −0');
    expect(r.texto).toContain('Área crítica en una tarea `normal`: sí');
    expect(r.merge).toBeUndefined();
  });

  it('una migración pide el diff completo', () => {
    const ruta = 'packages/db/prisma/migrations/20270101_m_x/migration.sql';
    const r = correr({ archivos: [['A', ruta, 10]] }, { resumen: true });
    expect(r.texto).toMatch(/diff completo requerido.*20270101_m_x/i);
    expect(correr({}, { resumen: true }).texto).toContain('Diff completo: no requerido');
  });
});

describe('mergear: secciones del resumen-revision (08 §1.5)', () => {
  const prueba = 'tools/plan/x.test.ts';
  const contenido = [
    "describe('PRU-DOM-PRES', () => {",
    "  it('PRU-DOM-PRES-001 [CA-01.1, INV-02] asigna', () => {",
    '    expect(f()).toBe(10);',
    '  });',
    "  it('PRU-DOM-PRES-002 [CA-01.2] mueve', () => {",
    '    expect(g()).toBe(5);',
    '  });',
    '});',
  ].join('\n');

  it('marca un CA de cubre sin prueba', () => {
    const r = correr({}, { resumen: true });
    expect(r.texto).toContain('**Objetivos de `cubre` sin prueba:** `CA-01.1`');
  });

  it('lista las pruebas nuevas con lo que cubren y el CA queda cubierto', () => {
    const agregado = '+' + contenido.split('\n').join('\n+');
    const r = correr(
      {
        archivos: [
          ['A', prueba, 8],
          ['M', 'tools/plan/x.ts', 3],
        ],
        diffPruebas: `--- /dev/null\n+++ b/${prueba}\n@@ -0,0 +1,8 @@\n${agregado}\n`,
        contenidos: { [`cabeza:${prueba}`]: contenido },
      },
      { resumen: true },
    );
    expect(r.texto).toContain('- PRU-DOM-PRES-001 [CA-01.1, INV-02] asigna — nueva');
    expect(r.texto).toContain('- PRU-DOM-PRES-002 [CA-01.2] mueve — nueva');
    expect(r.texto).toContain('**Objetivos de `cubre` sin prueba:** ninguno');
  });

  it('marca la prueba cuyo número esperado cambió (RS7-09)', () => {
    const diff = [
      `--- a/${prueba}`,
      `+++ b/${prueba}`,
      '@@ -6 +6 @@',
      '-    expect(g()).toBe(4);',
      '+    expect(g()).toBe(5);',
      '',
    ].join('\n');
    const r = correr(
      {
        archivos: [['M', prueba, 1]],
        diffPruebas: diff,
        contenidos: { [`cabeza:${prueba}`]: contenido },
      },
      { resumen: true },
    );
    expect(r.texto).toContain('- PRU-DOM-PRES-002 [CA-01.2] mueve — cambiada');
    expect(r.texto).not.toContain('PRU-DOM-PRES-001 [');
    expect(r.texto).toContain('**Número esperado o título cambiado (RS7-09):** `PRU-DOM-PRES-002`');
  });

  it('desvíos: archivo fuera de `archivos` y dependencia npm nueva', () => {
    const r = correr(
      {
        archivos: [
          ['M', 'tools/plan/z.ts', 2],
          ['M', 'tools/plan/otro.ts', 2],
          ['M', 'package.json', 1],
        ],
        contenidos: {
          'origin/main:package.json': '{"devDependencies":{"vitest":"4.1.12"}}',
          'cabeza:package.json': '{"devDependencies":{"vitest":"4.1.12","left-pad":"1.3.0"}}',
        },
      },
      { resumen: true },
    );
    expect(r.texto).toContain(
      'Fuera del campo `archivos` de la ficha: `tools/plan/otro.ts`, `package.json`',
    );
    expect(r.texto).toContain('Dependencias npm nuevas: `left-pad`');
  });
});

describe('mergear: aprobación DT-33', () => {
  it('--aprobado sin el archivo no mergea', () => {
    const r = correr({ tarea: 'TA-900' }, { aprobado: true, aprobaciones: carpeta() });
    expect(r.codigo).toBe(1);
    expect(r.texto).toContain('mergeá TA-900');
    expect(r.merge).toBeUndefined();
  });

  it('con el archivo de otra tarea no mergea', () => {
    const solo = carpeta({ 'TA-999.json': aprobacion('TA-999') });
    expect(correr({ tarea: 'TA-900' }, { aprobado: true, aprobaciones: solo }).codigo).toBe(1);
    const otra = carpeta({ 'TA-900.json': aprobacion('TA-999') });
    const r = correr({ tarea: 'TA-900' }, { aprobado: true, aprobaciones: otra });
    expect(r.codigo).toBe(1);
    expect(r.texto).toContain('es de TA-999');
  });

  it('con uno anterior al último commit del PR no mergea', () => {
    const viejo = carpeta({ 'TA-900.json': aprobacion('TA-900', '2026-10-20T15:59:59.000Z') });
    const r = correr({ tarea: 'TA-900' }, { aprobado: true, aprobaciones: viejo });
    expect(r.codigo).toBe(1);
    expect(r.texto).toContain('no es posterior al último commit');
    expect(r.merge).toBeUndefined();
  });

  it('con el archivo válido mergea, copia la huella y lo borra', () => {
    const op = aprobado('TA-900');
    const r = correr({ tarea: 'TA-900' }, op);
    expect(r.codigo).toBe(0);
    expect(r.merge).toContain(`Aprobado-por: usuario (mensaje ${HUELLA})`);
    expect(existsSync(join(op.aprobaciones, 'TA-900.json'))).toBe(false);
  });

  it('--terminal: mergea si la tarea escrita es la del PR; si no, no', () => {
    const r = correr({ tarea: 'TA-900' }, { aprobado: true, terminal: 'ta-900' });
    expect(r.merge).toContain('Aprobado-por: usuario (terminal)');
    expect(correr({ tarea: 'TA-900' }, { aprobado: true, terminal: 'TA-901' }).codigo).toBe(1);
  });

  it('--terminal solo en una terminal interactiva y fuera de Claude Code', () => {
    expect(puedePreguntar({}, true)).toBe(true);
    expect(puedePreguntar({}, false)).toBe(false);
    expect(puedePreguntar({ CLAUDECODE: '1' }, true)).toBe(false);
  });
});

describe('mergear: excepción de tamaño (CH-15)', () => {
  const prod = (n: number): Caso => ({ archivos: [['M', 'tools/plan/x.ts', n]] });

  it('sin la opción, un exceso falla como antes', () => {
    expect(correr(prod(480)).codigo).toBe(1);
  });

  it('normal con 20 % y la opción mergea, con Excepción-tamaño en el mensaje', () => {
    const r = correr(prod(480), { excepcionTamano: 'parte inseparable' });
    expect(r.codigo).toBe(0);
    expect(r.merge).toContain('Excepción-tamaño: prod=480/400 — parte inseparable');
  });

  it('el --resumen muestra la excepción', () => {
    const r = correr(prod(480), { excepcionTamano: 'parte inseparable', resumen: true });
    expect(r.texto).toContain('- Excepción-tamaño: prod=480/400 — parte inseparable');
  });

  it('un motivo vacío no vale', () => {
    expect(correr(prod(480), { excepcionTamano: ' ' }).codigo).toBe(1);
  });

  it('normal con 40 % exige --aprobado', () => {
    const r = correr(prod(560), { excepcionTamano: 'grande' });
    expect(r.codigo).toBe(1);
    expect(r.texto).toContain('--aprobado');
    expect(r.merge).toBeUndefined();
    const ok = correr(prod(560), { excepcionTamano: 'grande', ...aprobado('TA-901') });
    expect(ok.codigo).toBe(0);
    expect(ok.merge).toContain('Excepción-tamaño: prod=560/400 — grande');
  });

  it('obligatoria con la opción y sin --aprobado falla', () => {
    const r = correr({ ...prod(480), tarea: 'TA-900' }, { excepcionTamano: 'x' });
    expect(r.codigo).toBe(1);
    expect(r.merge).toBeUndefined();
  });

  it('un exceso de migraciones con la opción falla siempre', () => {
    const r = correr(
      {
        tarea: 'TA-900',
        archivos: [
          ['A', 'packages/db/prisma/migrations/1_m_a/migration.sql', 1],
          ['A', 'packages/db/prisma/migrations/2_m_b/migration.sql', 1],
        ],
      },
      { excepcionTamano: 'x', ...aprobado('TA-900') },
    );
    expect(r.codigo).toBe(1);
    expect(r.texto).toContain('DT-01 migraciones nuevas 2 > 1');
    expect(r.merge).toBeUndefined();
  });
});
