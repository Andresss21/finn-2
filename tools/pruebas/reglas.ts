// tools/pruebas/reglas.ts — reglas de cobertura de la matriz (07 §13.3, TA-007): M1 a M6, M9, M10, M11 y M14 (TA-007),
// M15 y M16 (TA-009), y los patrones compartidos con `afectadas.ts`. Portado del prototipo de V7-09/V7-11. Node 24 lo ejecuta sin compilar.
import { fichas, objetivos } from './documentos.ts';
import type { Ficha, Objetivo } from './documentos.ts';
import type { EstadoFt, Entradas, Prueba } from './matriz.ts';

export interface Manual {
  id: string;
  refs: string[];
  completo: boolean;
}
export interface Previa {
  id: string;
  destino?: string;
  motivo?: string;
}
export interface Cuarentena {
  id: string;
  motivo: string;
  desde: string;
  vence: string;
}

// Referencias válidas entre corchetes (07 §13.1; Q-<consulta> CH-34); las decisiones de 00 y 01 (P1, H3, C1, Q2a…) son contexto
export const REF =
  /^(CA-\d{2}\.\d{1,2}|ESC-\d{2}|AV-\d{2}|INV-\d{2}|CB-\d{2}|REC-4\.[1-6]|V-\d{2}|V5-\d{2}|V6-\d{2}|H-\d{2}|CF-\d{2}|FT-\d{2}|Q-[a-z][A-Za-z]*)$/;
// Dónde vive el código que se resuelve por las Piezas de 06 (07 §13.6 punto 1, CH-01)
export const PATRON_OP = /^packages\/aplicacion\/src\/operaciones\/(?:.*\/)?OP-(\d{2})-[^/]*\.ts$/;
export const PATRON_CONSULTA = /^packages\/aplicacion\/src\/consultas\/([^/]+)\.ts$/;

export function globARegex(g: string): RegExp {
  const re = g
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*\//g, '\u0001')
    .replace(/\*\*/g, '\u0002')
    .replace(/\*/g, '[^/]*')
    .replace(/\u0001/g, '(.*/)?')
    .replace(/\u0002/g, '.*');
  return new RegExp(`^${re}$`);
}

/** Los procedimientos `### PRU-MAN-… [refs] título` de `pruebas/manuales.md` (07 §13.2, DP-20). */
export function manuales(texto: string): Manual[] {
  const campo = (b: string, n: string): boolean => new RegExp(`\\*\\*${n}:\\*\\*\\s*\\S`).test(b);
  return texto
    .split(/^### /m)
    .slice(1)
    .filter((b) => b.startsWith('PRU-MAN'))
    .map((b) => {
      const m = b.match(/^(PRU-MAN-[A-Z0-9]+-\d{3})\s+\[([^\]]*)\]/);
      return {
        id: m?.[1] ?? b.split(/\s/)[0] ?? '',
        refs: (m?.[2] ?? '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        completo:
          m !== null &&
          campo(b, 'Disparador') &&
          campo(b, 'Resultado esperado') &&
          /\*\*Pasos:\*\*\s*\n\s*1\. \S/.test(b),
      };
    });
}

/** DP-15: una ficha se exige terminada, o en modo puerta si es [I] o [M] y no está diferida. */
export const exigida = (f: Ficha | undefined, estado: EstadoFt, puerta: boolean): boolean =>
  estado === 'terminada' || (puerta && f !== undefined && f.prioridad !== 'P' && !f.diferida);

export function cobertura(e: Entradas, lista: Prueba[], ids: Set<string>) {
  const errores: string[] = [];
  const avisos: string[] = [];
  const obj: Objetivo[] = objetivos(e);
  const fs = fichas(e.d06);
  // M9 cuarentena: no cuenta como cobertura; una entrada vencida hace fallar `rapido` (07 §7.3)
  const enCuarentena = new Set<string>();
  for (const q of e.cuarentena) {
    enCuarentena.add(q.id);
    if (q.vence < e.hoy)
      errores.push(`M9 cuarentena vencida: ${q.id} (venció el ${q.vence}; ${q.motivo})`);
    if (!lista.some((p) => p.id === q.id))
      errores.push(`M9 la cuarentena cita una prueba que no existe: ${q.id}`);
  }
  const activas = lista.filter((p) => !enCuarentena.has(p.id));
  // M10 + M7 de los manuales
  const man = manuales(e.manuales);
  for (const m of man) {
    if (!m.completo)
      errores.push(
        `M10 ${m.id} sin procedimiento completo (Disparador, Pasos numerados y Resultado esperado)`,
      );
    for (const x of m.refs)
      if (REF.test(x) && !ids.has(x)) errores.push(`M7 ${m.id} cita ${x}, que no existe`);
  }
  const cubre = new Map<string, string[]>();
  const anotar = (ref: string, quien: string): void =>
    void cubre.set(ref, [...(cubre.get(ref) ?? []), quien]);
  for (const p of activas) for (const x of p.refs) anotar(x, p.id);
  for (const m of man)
    if (m.completo) for (const x of m.refs.filter((r) => REF.test(r))) anotar(x, m.id);

  // Las claves CA-nn.m de features.json (pendiente_e2e, M18) no son estados de ficha
  const estado = (ft: string): EstadoFt => {
    const v = e.features[ft] ?? 'pendiente';
    return v === 'pendiente_e2e' ? 'pendiente' : v;
  };
  const ex = (ft: string): boolean =>
    exigida(
      fs.find((f) => f.ft === ft),
      estado(ft),
      e.puerta,
    );
  const algunaTerminada = e.puerta || Object.values(e.features).includes('terminada');
  const falta = (exigir: boolean, msg: string): void => void (exigir ? errores : avisos).push(msg);
  const citan = (t: 'esc' | 'av', id: string): boolean =>
    fs.some((f) => f[t].includes(id) && ex(f.ft));
  for (const o of obj) {
    const q = cubre.get(o.id) ?? [];
    const auto = q.filter((x) => !x.startsWith('PRU-MAN-'));
    const manu = q.length - auto.length;
    if (o.tipo === 'CA') {
      const exigido = ex(o.ft ?? '');
      if (!q.length) {
        if (exigido || estado(o.ft ?? '') === 'en_curso')
          falta(
            exigido,
            `M1 ${o.id} (${o.ft} [${o.prioridad}]) sin prueba activa ni procedimiento manual`,
          );
      } else if (o.manual && !manu && exigido)
        errores.push(`M1 ${o.id} está marcado (manual) en 06 y no tiene PRU-MAN`);
      if (o.s61 && !manu && exigido)
        errores.push(
          `M11 ${o.id} ⚠ (S6-1): falta la PRU-MAN que lo rehace con las muestras reales`,
        );
      if (o.advertencia && !o.s61 && !manu && exigido)
        avisos.push(`M11 ${o.id} ⚠: validar contra el dato real (sin PRU-MAN)`);
    }
    if (o.tipo === 'ESC' && citan('esc', o.id)) {
      const sin = ['motor', 'int']
        .map((j) => `PRU-${o.id}@${j}`)
        .filter((id) => !activas.some((p) => p.id === id));
      if (sin.length) errores.push(`M2 ${o.id} sin ${sin.join(' ni ')}`);
    }
    if (o.tipo === 'AV' && citan('av', o.id) && !auto.length)
      errores.push(`M3 ${o.id} sin prueba automática`);
    if (
      o.tipo === 'INV' &&
      algunaTerminada &&
      !auto.some((x) => /^PRU-(PROP|DOM|INT|ESQ)-/.test(x))
    )
      errores.push(`M4 ${o.id} sin prueba PROP, DOM, INT o ESQ`);
    if (o.tipo === 'CB' && algunaTerminada && !auto.length)
      errores.push(`M14 ${o.id} sin prueba automática`);
    if (o.tipo === 'REC' && (o.fts ?? []).every(ex) && !auto.some((x) => x.startsWith('PRU-E2E-')))
      errores.push(`M5 ${o.id} sin prueba E2E`);
    if (o.tipo === 'VER') errores.push(...verificacionPrevia(e, o.id, activas, falta));
  }
  if (e.previas)
    for (const v of e.previas)
      if (!ids.has(v.id))
        errores.push(`M6 verificaciones-previas.json cita ${v.id}, que no existe`);
  // M15 (P7-18): una ficha terminada tiene todas las pruebas automáticas de sus CA fuera de cuarentena y, con los
  // resultados de la corrida (`--resultados`, job `cierre`), en verde
  const casDe = (ft: string): Set<string> =>
    new Set(obj.filter((o) => o.tipo === 'CA' && o.ft === ft).map((o) => o.id));
  for (const f of fs) {
    if (estado(f.ft) !== 'terminada') continue;
    const cas = casDe(f.ft);
    for (const p of lista.filter((x) => x.refs.some((r) => cas.has(r))))
      if (enCuarentena.has(p.id))
        errores.push(`M15 ${f.ft} está terminada y ${p.id} está en cuarentena`);
      else if (e.resultados && e.resultados[p.id] !== 'pasada')
        errores.push(
          `M15 ${f.ft} está terminada y ${p.id} no pasó en esta corrida (${e.resultados[p.id] ?? 'sin resultado'})`,
        );
  }
  // M16 (P7-18): cada PRU-MAN de una ficha exigida tiene como último resultado "pasa"; si no, "manual pendiente"
  const rm = resultadosManuales(e.resultadosManuales);
  errores.push(...rm.errores);
  const ult = ultimoResultado(rm.filas);
  for (const x of ult.keys())
    if (!man.some((m) => m.id === x))
      errores.push(`M16 resultados.md registra ${x}, que no está en pruebas/manuales.md`);
  const manualesPendientes = new Map<string, string[]>();
  for (const f of fs) {
    if (!ex(f.ft)) continue;
    const cas = casDe(f.ft);
    const pend = man
      .filter((m) => m.refs.some((r) => cas.has(r)) && ult.get(m.id)?.resultado !== 'pasa')
      .map((m) => {
        const u = ult.get(m.id);
        return `${m.id} (${u ? `falló el ${u.fecha}` : 'sin resultado'})`;
      });
    if (pend.length) {
      manualesPendientes.set(f.ft, pend);
      falta(e.puerta, `M16 ${f.ft} con manual pendiente: ${pend.join(', ')}`);
    }
  }
  return { errores, avisos, cubre, obj, activas, man, manualesPendientes };
}

export interface ResultadoManual {
  id: string;
  fecha: string;
  resultado: 'pasa' | 'falla';
}
/** Filas de `pruebas/manuales/resultados.md` (07 §22.2): | Manual | Fecha | Dispositivo | Resultado | Quién | Versión | Nota | */
export function resultadosManuales(texto: string): { filas: ResultadoManual[]; errores: string[] } {
  const filas: ResultadoManual[] = [];
  const errores: string[] = [];
  for (const l of texto.split('\n')) {
    const c = l.split('|').map((x) => x.trim());
    if (!/^PRU-MAN-/.test(c[1] ?? '')) continue;
    const [, id = '', fecha = '', dispositivo, resultado = '', quien, version] = c;
    if (
      !/^PRU-MAN-[A-Z0-9]+-\d{3}$/.test(id) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(fecha) ||
      !dispositivo ||
      (resultado !== 'pasa' && resultado !== 'falla') ||
      !quien ||
      !version
    ) {
      errores.push(`M16 fila de resultado incompleta: ${l.trim()}`);
      continue;
    }
    filas.push({ id, fecha, resultado });
  }
  return { filas, errores };
}
/** Vale el último resultado de cada manual: el de fecha mayor y, a igual fecha, la fila posterior. */
export function ultimoResultado(filas: ResultadoManual[]): Map<string, ResultadoManual> {
  const m = new Map<string, ResultadoManual>();
  for (const f of filas) {
    const a = m.get(f.id);
    if (!a || f.fecha >= a.fecha) m.set(f.id, f);
  }
  return m;
}

/** M6: sin el JSON (lo trae TA-008) solo falla el modo puerta; con el JSON, falta cada una de las 92 que no figure. */
function verificacionPrevia(
  e: Entradas,
  id: string,
  activas: Prueba[],
  falta: (exigir: boolean, msg: string) => void,
): string[] {
  const v = e.previas?.find((x) => x.id === id);
  if (!v)
    return e.previas || e.puerta ? [`M6 ${id} no está en pruebas/verificaciones-previas.json`] : [];
  if (v.destino) {
    if (!activas.some((p) => p.id === v.destino))
      falta(e.puerta, `M6 ${id} → ${v.destino}, que todavía no existe o está en cuarentena`);
    return [];
  }
  return (v.motivo?.length ?? 0) >= 20 ? [] : [`M6 ${id} sin prueba permanente y sin motivo`];
}
