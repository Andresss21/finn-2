// minutos (TA-013; 07 §6.5 M4, §6.6, §32.2, §32.3; DP-12, DP-36, P7-14, CH-02): el cálculo de tools/ci/minutos.ts con
// los datos fijos de minutos.fixture.json, sin red ni reloj, y los workflows que guardan y restauran el modo.
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  correrNocturno,
  decidir,
  e2eDePr,
  minutosCobrados,
  recortesAplicables,
  recortesVigentes,
  renRojo,
  reservaPendiente,
  sumarMes,
  type Estado,
  type Job,
} from './minutos.ts';

const raiz = fileURLToPath(new URL('../..', import.meta.url));
const { load } = createRequire(import.meta.url)('js-yaml') as { load: (s: string) => unknown };
type Caso = { hoy: string; usados: number; proyeccion: number; modo: string };
type Fixture = {
  v7_07: { hoy: string; runs: { id: number; name: string; jobs: Job[] }[]; minutos: number };
  proyeccion: Caso;
  normal: Caso;
  reserva: {
    hoy: string;
    cron_restauracion: string;
    pendiente: number;
    amenazada: { usados: number };
    agotada: { usados: number };
  };
};
const fx = JSON.parse(
  readFileSync(join(raiz, 'tools', 'ci', 'minutos.fixture.json'), 'utf8'),
) as Fixture;
const workflow = (n: string): string | null => {
  const f = join(raiz, '.github', 'workflows', `${n}.yml`);
  return existsSync(f) ? readFileSync(f, 'utf8') : null;
};
type Paso = { id?: string; uses?: string; run?: string; with?: Record<string, unknown> };
type Wf = {
  on: Record<string, unknown>;
  jobs: Record<string, { needs?: string; if?: string; steps: Paso[] }>;
};
const nocturno = load(workflow('nocturno') ?? '') as Wf;

describe('PRU-SEG-OPER', () => {
  it('PRU-SEG-OPER-002 [M4] reserva fija (DP-36, DP-12, M4-ahorro, WF-nocturno; 07 §32.3, CH-46): la reserva se sigue midiendo, con cualquier uso no hay recortes ni aviso, y respaldo y restauracion no leen el modo', () => {
    const r = fx.reserva;
    const hoy = new Date(r.hoy);
    expect(reservaPendiente(hoy, true, r.cron_restauracion)).toBe(r.pendiente);
    // CH-46: los usos que antes amenazaban o agotaban la reserva, y uno sobre la vieja cuota, no recortan nada
    for (const usados of [r.amenazada.usados, r.agotada.usados, 5000])
      expect(decidir(usados, hoy, r.pendiente, null)).toMatchObject({
        modo: 'normal',
        recortes: [],
        amenazada: false,
        aviso_reserva: null,
        usados,
        reserva_pendiente: r.pendiente,
      });
    // respaldo.yml y restauracion.yml (B5) no restauran ni leen el modo de M4
    for (const n of ['respaldo', 'restauracion'])
      expect(workflow(n) ?? '', n).not.toMatch(/ci-modo|ahorro|minutos\.ts|recortes/);
    // El nocturno calcula primero, sin depender de que main haya cambiado, y guarda el modo en la caché
    const pasos = nocturno.jobs['minutos']?.steps ?? [];
    expect(nocturno.jobs['minutos']?.needs).toBeUndefined();
    expect(nocturno.jobs['minutos']?.if).toBeUndefined();
    const i = pasos.findIndex((p) => p.run === 'node tools/ci/minutos.ts calcular');
    const guardar = pasos.findIndex((p) => p.uses?.startsWith('actions/cache/save@'));
    expect(i).toBeGreaterThanOrEqual(0);
    expect(guardar).toBeGreaterThan(i);
    expect(pasos[guardar]?.with?.['key']).toBe(
      'ci-modo-${{ steps.minutos.outputs.mes }}-${{ github.run_id }}',
    );
  });
});

describe('minutos: suma, proyección y modo (07 §6.5)', () => {
  it('minutos: V7-07 — 4 jobs de 2:31, 3:20, 11:00 y 20:01 cuentan 39 (cada job hacia arriba)', () => {
    const jobs = fx.v7_07.runs.flatMap((r) => r.jobs);
    expect(minutosCobrados(jobs)).toBe(fx.v7_07.minutos);
    expect(minutosCobrados(jobs.map((j) => ({ ...j, labels: ['self-hosted'] })))).toBe(0);
  });

  it('minutos: un estado viejo no recorta mientras la cuota no recorte; si vuelve a recortar, vale (CH-60)', () => {
    const viejo = decidir(0, new Date('2026-10-30T15:00:00Z'), 0, null);
    viejo.recortes = ['e2e-pr-al-pasar-a-listo', 'nocturno-semanal'];
    const hoy = new Date('2026-10-31T13:00:00Z');
    expect(recortesAplicables(viejo, hoy)).toEqual([]);
    expect(recortesAplicables(viejo, hoy, true)).toEqual(viejo.recortes);
  });

  it('minutos: 700 minutos al día 12 proyectan 1.808 y 500 proyectan 1.292; los dos quedan en normal (CH-46)', () => {
    for (const c of [fx.proyeccion, fx.normal]) {
      const e = decidir(c.usados, new Date(c.hoy), 0, null);
      expect(e).toMatchObject({ mes: '202610', proyeccion: c.proyeccion, modo: c.modo });
      expect(e.proyeccion_sin_m5).toEqual([c.proyeccion + 60, c.proyeccion + 90]);
    }
    expect(decidir(500, new Date(fx.normal.hoy), 0, null).recortes).toEqual([]);
  });

  it('minutos: el estado del mes en curso pisa los recortes de la caché y conserva lo demás (CH-46)', () => {
    const lunes = new Date('2026-10-19T08:15:00Z');
    const anterior: Estado = {
      ...decidir(700, new Date(fx.proyeccion.hoy), 0, null),
      modo: 'ahorro',
      recortes: ['e2e-pr-al-pasar-a-listo', 'nocturno-semanal', 'nocturno-suspendido'],
      amenazada: true,
      aviso_reserva: 167,
      nocturno_ultimo: '2026-10-16T08:15:00Z',
      ren_rojo_desde: '2026-10-14T08:15:00Z',
    };
    const e = decidir(1954, lunes, 0, anterior);
    expect(e).toMatchObject({
      modo: 'normal',
      recortes: [],
      amenazada: false,
      aviso_reserva: null,
      nocturno_ultimo: anterior.nocturno_ultimo,
      ren_rojo_desde: anterior.ren_rojo_desde,
    });
    expect(recortesVigentes(e, lunes)).toEqual([]);
    expect(correrNocturno(e, lunes, false, true)).toBe(true);
  });

  it('minutos: sumarMes recorre las corridas del mes con la API y deja el uso por job (CH-02)', async () => {
    const pedidas: string[] = [];
    const api = (ruta: string): Promise<unknown> => {
      pedidas.push(ruta);
      const run = /\/runs\/(\d+)\/jobs/.exec(ruta);
      if (run)
        return Promise.resolve({
          jobs: fx.v7_07.runs.find((r) => r.id === Number(run[1]))?.jobs ?? [],
        });
      return Promise.resolve({
        workflow_runs: fx.v7_07.runs.map(({ id, name }) => ({ id, name })),
      });
    };
    const s = await sumarMes(api, 'yo/finn', new Date(fx.v7_07.hoy));
    expect(s.usados).toBe(39);
    expect(s.jobs).toContainEqual({ run: 3, workflow: 'nocturno', job: '', minutos: 21 });
    expect(pedidas[0]).toBe(
      '/repos/yo/finn/actions/runs?created=%3E%3D2027-03-01&per_page=100&page=1',
    );
  });

  it('minutos: sin producción la reserva es 0; restauración mensual cuenta solo si su día no pasó', () => {
    const hoy = new Date(fx.reserva.hoy);
    expect(reservaPendiente(hoy, false, '0 9 * * 0')).toBe(0);
    expect(reservaPendiente(hoy, true, '0 9 28 * *')).toBe(11 * 3 + 5);
    expect(reservaPendiente(hoy, true, '0 9 1 * *')).toBe(11 * 3);
  });
});

describe('minutos: qué lee cada workflow del modo', () => {
  // CH-46: decidir ya no produce recortes; estas funciones siguen respetándolos si vienen en el estado
  const estado = (e: Partial<Estado>): Estado => ({
    ...decidir(700, new Date('2026-10-12T08:15:00Z'), 0, null),
    modo: 'ahorro',
    recortes: ['e2e-pr-al-pasar-a-listo', 'nocturno-semanal'],
    ...e,
  });
  const lunes = new Date('2026-10-19T08:15:00Z');

  it('minutos: el modo vale solo en su mes; sin entrada, normal', () => {
    expect(recortesVigentes(estado({}), lunes)).toContain('nocturno-semanal');
    expect(recortesVigentes(estado({}), new Date('2026-11-02T08:15:00Z'))).toEqual([]);
    expect(recortesVigentes(null, lunes)).toEqual([]);
  });

  it('minutos: en ahorro, e2e de PR solo al pasar a listo; suspendido, nunca', () => {
    const ahorro = recortesVigentes(estado({}), lunes);
    expect(e2eDePr([], 'synchronize')).toBe(true);
    expect(e2eDePr(ahorro, 'synchronize')).toBe(false);
    expect(e2eDePr(ahorro, 'ready_for_review')).toBe(true);
    expect(e2eDePr(ahorro, 'opened')).toBe(true);
    expect(e2eDePr([...ahorro, 'e2e-pr-suspendido'], 'ready_for_review')).toBe(false);
  });

  it('minutos: el nocturno corre si main cambió; en ahorro, 1 vez por semana; a mano, siempre', () => {
    const normal = estado({ recortes: [], nocturno_ultimo: '2026-10-16T08:15:00Z' });
    expect(correrNocturno(normal, lunes, false, true)).toBe(true);
    expect(correrNocturno(normal, lunes, false, false)).toBe(false);
    expect(correrNocturno(normal, lunes, true, false)).toBe(true);
    const ahorro = estado({ nocturno_ultimo: '2026-10-16T08:15:00Z' });
    expect(correrNocturno(ahorro, lunes, false, true)).toBe(false);
    expect(
      correrNocturno(estado({ nocturno_ultimo: '2026-10-12T08:16:00Z' }), lunes, false, true),
    ).toBe(true);
    const suspendido = estado({ recortes: ['nocturno-suspendido'], nocturno_ultimo: null });
    expect(correrNocturno(suspendido, lunes, false, true)).toBe(false);
  });

  it('minutos: FINN_REN_ROJO hace fallar rapido solo con más de 7 días activo (07 §6.6)', () => {
    expect(renRojo(null, lunes)).toBeNull();
    expect(renRojo('2026-10-12T08:15:00Z', lunes)).toBeNull();
    expect(renRojo('2026-10-12T08:14:00Z', lunes)).toMatch(/FINN_REN_ROJO.*más de 7 días/);
  });
});
