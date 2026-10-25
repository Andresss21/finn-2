// Pruebas de tools/plan/mergear.ts (TA-010) con `gh` y `git` simulados: ninguna toca la red ni el repositorio.
import { describe, expect, it } from 'vitest';
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
  '',
].join('\n');

interface Caso {
  tarea?: string;
  checks?: { name: string; bucket: string }[] | null; // null: "no checks reported"
  archivos?: [string, string, number][]; // estado de name-status, ruta, líneas agregadas
  featuresBase?: string;
  featuresCabeza?: string;
}

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
          body: '',
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
  return { ...r, texto: r.salida.join('\n'), merge };
};

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
    const r = correr({ tarea: 'TA-900' }, { aprobado: true });
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
