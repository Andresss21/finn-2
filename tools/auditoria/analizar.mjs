// Cruza lo medido en la app (medidas/) con los tokens y con lo medido en la referencia (medidas-ref/).
//   node tools/auditoria/analizar.mjs [filtro-de-id]
// Salida: docs/auditoria-diseno/analisis/<id>.md (un bloque por variante) y analisis/_resumen.tsv.
// No decide severidades: lista diferencias medidas para que quien audita las confirme contra la captura y el PNG.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SAL = join(raiz, 'docs', 'auditoria-diseno');
const DIS = join(raiz, 'docs', 'diseno');
mkdirSync(join(SAL, 'analisis'), { recursive: true });
const filtro = process.argv[2] ?? '';

// ── Tokens: valor → nombres, por tema ───────────────────────────────────────────────────────────────────────────────
const tokens = JSON.parse(readFileSync(join(DIS, 'entrega-3', 'estilos', 'tokens.json'), 'utf8'));
const aHex = (v) => {
  const s = String(v).trim().toLowerCase();
  let m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/.exec(s);
  if (m) return '#' + m[1] + (m[2] && m[2] !== 'ff' ? m[2] : '');
  m = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(s);
  if (m) return '#' + m[1] + m[1] + m[2] + m[2] + m[3] + m[3];
  m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)$/.exec(s);
  if (m) {
    const a =
      m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    const h = (n) => Math.round(Number(n)).toString(16).padStart(2, '0');
    return '#' + h(m[1]) + h(m[2]) + h(m[3]) + (a < 0.995 ? h(a * 255) : '');
  }
  return null;
};
const paleta = { claro: new Map(), oscuro: new Map() };
for (const [nombre, v] of Object.entries(tokens.color))
  for (const tema of ['claro', 'oscuro']) {
    const h = aHex(v[tema]);
    if (!h) continue;
    if (!paleta[tema].has(h)) paleta[tema].set(h, []);
    paleta[tema].get(h).push(nombre);
  }
// colores sueltos dentro de degradados y sombras de tokens (tarjetas, elevaciones): también son "de token"
const deTexto = (txt, tema) => {
  for (const m of String(txt).matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g)) {
    const h = aHex(m[0]);
    if (h && !paleta[tema].has(h)) paleta[tema].set(h, ['(dentro de un token compuesto)']);
  }
};
for (const grupo of [tokens.elevacion, tokens.otros])
  for (const v of Object.values(grupo))
    if (typeof v === 'object') for (const tema of ['claro', 'oscuro']) deTexto(v[tema], tema);
    else for (const tema of ['claro', 'oscuro']) deTexto(v, tema);
const nombreToken = (hex, tema) => {
  const base = hex.length > 7 ? hex.slice(0, 7) : hex;
  const n =
    paleta[tema].get(hex) ??
    (hex.length > 7
      ? paleta[tema]
          .get(base)
          ?.map((x) => `${x}@${Math.round((parseInt(hex.slice(7), 16) / 255) * 100)}%`)
      : undefined);
  return n ? n.join('|') : null;
};
const roles = tokens.tipografia;

// ── Reglas de marco por tipo de pantalla (DECISIONES · Marco) ───────────────────────────────────────────────────────
const PESTANAS = ['/', '/presupuesto', '/bandeja', '/actividad', '/cuentas'];
const MAS = [
  '/reportes',
  '/reportes/[tipo]',
  '/metas',
  '/programadas',
  '/por-cobrar',
  '/reglas',
  '/notificaciones',
  '/ajustes',
];
const esFlujo = (ruta) =>
  /\/(nueva|nuevo|editar|eliminar|devolver|estado|archivar|conciliar|condiciones|cuota|pagar|verificar-saldo|ordenar|fusionar|sacar|asignar|auto-asignar|mover|cobrar|condonar|renombrar|quitar|plantilla|inscribir|verificar)(\/|$)/.test(
    ruta,
  ) ||
  /^\/registrar/.test(ruta) ||
  /^\/bandeja\/\[/.test(ruta) ||
  /ocurrencias/.test(ruta) ||
  ruta === '/presupuesto/estructura' ||
  ruta === '/ajustes/ciclo' ||
  ruta === '/ajustes/webhook';
const tipoDe = (ruta) =>
  ruta.startsWith('/ingresar')
    ? 'acceso'
    : ruta === '/sin-conexion'
      ? 'estatica'
      : PESTANAS.includes(ruta)
        ? 'pestana'
        : esFlujo(ruta)
          ? 'flujo'
          : MAS.includes(ruta)
            ? 'mas-secciones'
            : 'hija';

const familia = (ff) =>
  /big|titul|shoulder/i.test(ff)
    ? 'Big Shoulders Display'
    : /archivo|cuerpo/i.test(ff)
      ? 'Archivo'
      : ff;
const sinDatos = (t) => !/\d/.test(t) && t.length >= 3;
const norm = (t) => t.replace(/\s+/g, ' ').trim();

const archivos = readdirSync(join(SAL, 'medidas')).filter(
  (f) => f.endsWith('.json') && f.includes(filtro),
);
const porId = new Map();
for (const f of archivos) {
  const m = JSON.parse(readFileSync(join(SAL, 'medidas', f), 'utf8'));
  if (!porId.has(m.id)) porId.set(m.id, []);
  porId.get(m.id).push(m);
}

const resumen = [
  [
    'id',
    'variante',
    'tipo',
    'desborde',
    'tocables<44',
    'sinNombre',
    'sinEtiqueta',
    'contraste',
    'fueraToken',
    'fuenteAjena',
    'montoSinTnum',
    'guionAscii',
    'marco',
    'margen',
    'difTipo',
    'faltan',
    'sobran',
  ].join('\t'),
];

for (const [id, medidas] of [...porId].sort()) {
  const out = [`# ${id}`, ''];
  const m0 = medidas[0];
  out.push(
    `- Ruta: \`${m0.ruta}\` · componente: \`${m0.comp}\` · tipo de pantalla: **${tipoDe(m0.ruta)}**`,
  );
  out.push(`- Referencia: \`${m0.ref}\`${m0.nota ? ` · nota: ${m0.nota}` : ''}`, '');
  for (const m of medidas.sort((a, b) => a.variante.localeCompare(b.variante))) {
    const tema = m.variante.includes('oscuro') ? 'oscuro' : 'claro';
    const telefono = m.vw < 700;
    const tipo = tipoDe(m.ruta);
    const L = [];
    const c = {
      desborde: 0,
      toc: 0,
      sinNombre: 0,
      sinEtiqueta: 0,
      contraste: 0,
      fueraToken: 0,
      fuente: 0,
      tnum: 0,
      guion: 0,
      marco: 0,
      margen: 0,
      difTipo: 0,
      faltan: 0,
      sobran: 0,
    };
    L.push(
      `## ${m.variante} — captura \`capturas/${id}__${m.variante}.png\` (${m.vw}×${m.vh}, documento ${m.docW}×${m.docH}, tema ${m.tema || '¿sin data-theme?'})`,
    );

    if (m.desbordeHorizontal || m.fueraDeAncho.length) {
      c.desborde = 1;
      L.push(
        `- **Desborde horizontal**: documento ${m.docW}px en ${m.vw}px. Fuera de ancho: ${m.fueraDeAncho
          .slice(0, 6)
          .map((f) => `\`${f.sel}\` x=${f.x} w=${f.w}`)
          .join('; ')}`,
      );
    }
    // Marco
    const mk = m.marco;
    const marco = [];
    if (telefono && tipo === 'flujo') {
      if (mk.campana) marco.push('flujo con campana');
      if (mk.barraInferior) marco.push('flujo con barra inferior');
    }
    if (telefono && tipo === 'pestana') {
      if (!mk.registrar) marco.push('pestaña sin Registrar');
      if (!mk.campana) marco.push('pestaña sin campana');
      if (!mk.masSecciones) marco.push('pestaña sin ☰');
      if (!mk.barraInferior) marco.push('pestaña sin barra inferior');
    }
    if (telefono && tipo === 'mas-secciones') {
      if (!mk.campana) marco.push('Más secciones sin campana');
      if (mk.registrar) marco.push('Más secciones con Registrar');
      if (mk.masSecciones) marco.push('Más secciones con ☰');
    }
    if (telefono && tipo === 'hija' && !mk.volver) marco.push('hija sin «Volver a …»');
    if (telefono && tipo === 'acceso' && (mk.barraInferior || mk.campana))
      marco.push('acceso con marco de la app');
    c.marco = marco.length;
    L.push(
      `- Marco: superior=${mk.barraSuperior} inferior=${mk.barraInferior} lateral=${mk.barraLateral} campana=${mk.campana} registrar=${mk.registrar} ☰=${mk.masSecciones} volver="${mk.volver}" cerrar=${mk.cerrar}${mk.main ? ` · main x=${mk.main.x} w=${mk.main.w} pad=${mk.main.padL}/${mk.main.padR} max=${mk.main.maxW}` : ' · sin <main>'}${marco.length ? ` · **REVISAR: ${marco.join(', ')}**` : ''}`,
    );
    const esperado = tipo === 'acceso' ? 24 : 20;
    if (
      telefono &&
      m.margenIzq >= 0 &&
      (Math.abs(m.margenIzq - esperado) > 2 || m.margenDer < esperado - 2)
    ) {
      c.margen = 1;
      L.push(
        `- **Márgenes**: texto más a la izquierda en x=${m.margenIzq}, margen derecho mínimo ${m.margenDer} (esperado ${esperado})`,
      );
    } else L.push(`- Márgenes: izq ${m.margenIzq} · der ${m.margenDer}`);

    // Tocables
    const chicos = m.tocables.filter(
      (t) => Math.max(t.w, t.aw) < 43.5 || Math.max(t.h, t.ah) < 43.5,
    );
    c.toc = chicos.length;
    if (chicos.length)
      L.push(
        `- **Tocables < 44** (${chicos.length}): ${chicos
          .slice(0, 14)
          .map((t) => `«${t.n || t.tag}» ${Math.max(t.w, t.aw)}×${Math.max(t.h, t.ah)}`)
          .join('; ')}`,
      );
    const mudos = m.tocables.filter((t) => t.sinNombre);
    c.sinNombre = mudos.length;
    if (mudos.length)
      L.push(
        `- **Tocables sin nombre accesible** (${mudos.length}): ${mudos
          .slice(0, 6)
          .map((t) => `${t.tag}@${t.x},${t.y}`)
          .join('; ')}`,
      );
    c.sinEtiqueta = m.camposSinEtiqueta.length;
    if (m.camposSinEtiqueta.length)
      L.push(
        `- **Campos sin etiqueta**: ${m.camposSinEtiqueta
          .slice(0, 6)
          .map((s) => `\`${s}\``)
          .join('; ')}`,
      );
    L.push(`- Roles: status=${m.roles.status} alert=${m.roles.alert} dialog=${m.roles.dialog}`);

    // Contraste y tokens
    const deshab =
      paleta[tema] && [...paleta[tema]].find(([, n]) => n.includes('texto-deshabilitado'))?.[0];
    const bajos = m.textos.filter((t) => t.cr < 4.5 && t.c.slice(0, 7) !== deshab);
    c.contraste = bajos.length;
    if (bajos.length)
      L.push(
        `- **Contraste < 4.5** (${bajos.length}): ${bajos
          .slice(0, 10)
          .map((t) => `«${t.t.slice(0, 30)}» ${t.c} sobre ${t.bg} = ${t.cr}`)
          .join('; ')}`,
      );
    const sueltos = new Map();
    for (const t of m.textos)
      if (!nombreToken(t.c, tema))
        sueltos.set(`texto ${t.c}`, (sueltos.get(`texto ${t.c}`) ?? []).concat(t.t.slice(0, 24)));
    for (const k of m.cajas) {
      const bg = k.bg.replace('img:', '');
      if (bg !== '#00000000' && !k.bg.startsWith('img:') && !nombreToken(bg, tema))
        sueltos.set(
          `fondo ${bg}`,
          (sueltos.get(`fondo ${bg}`) ?? []).concat(k.sel.split(' > ').pop().slice(0, 40)),
        );
      const b = k.borde.split(' ').pop();
      if (k.borde && b && b !== '#00000000' && !nombreToken(b, tema))
        sueltos.set(
          `borde ${b}`,
          (sueltos.get(`borde ${b}`) ?? []).concat(k.sel.split(' > ').pop().slice(0, 40)),
        );
    }
    c.fueraToken = sueltos.size;
    if (sueltos.size)
      L.push(
        `- **Colores que no son de un token (${tema})**: ${[...sueltos]
          .slice(0, 12)
          .map(([k, v]) => `${k} ×${v.length} (${v.slice(0, 2).join(', ')})`)
          .join('; ')}`,
      );

    // Tipografía propia
    const ajenas = [
      ...new Set(
        m.textos
          .map((t) => t.ff)
          .filter((f) => !['Archivo', 'Big Shoulders Display'].includes(familia(f))),
      ),
    ];
    c.fuente = ajenas.length;
    if (ajenas.length) L.push(`- **Familias ajenas**: ${ajenas.join(', ')}`);
    L.push(`- Fuentes cargadas: ${m.fuentes.join(' · ')}`);
    const montos = m.textos.filter((t) => /[$]\s?\d|^\s*[−-]?\d[\d,]*\.\d{2}\s*$/.test(t.t));
    const soloMonto = (t) => /^\s*[+−-]?\s?\$?[\d,]+\.\d{2}\s*$/.test(t.t);
    const sinTnum = montos.filter((t) => soloMonto(t) && !/tabular-nums/.test(t.fvn));
    const enFrase = montos.filter((t) => !soloMonto(t) && !/tabular-nums/.test(t.fvn));
    c.tnum = sinTnum.length;
    if (sinTnum.length)
      L.push(
        `- **Montos sin tabular-nums** (${sinTnum.length}): ${sinTnum
          .slice(0, 8)
          .map((t) => `«${t.t.slice(0, 28)}»`)
          .join('; ')}`,
      );
    if (enFrase.length)
      L.push(
        `- Montos dentro de una frase o botón sin tabular-nums (${enFrase.length}): ${enFrase
          .slice(0, 6)
          .map((t) => `«${t.t.slice(0, 28)}»`)
          .join('; ')}`,
      );
    const enTitulo = montos.filter((t) => familia(t.ff) !== 'Archivo');
    if (enTitulo.length)
      L.push(
        `- **Montos fuera de Archivo**: ${enTitulo
          .slice(0, 6)
          .map((t) => `«${t.t.slice(0, 28)}» en ${t.ff}`)
          .join('; ')}`,
      );
    const guiones = m.textos.filter(
      (t) => /(^|[\s(])-\s?\$?\d/.test(t.t) && !/\d{1,2}\/\d|\d-\d/.test(t.t),
    );
    c.guion = guiones.length;
    if (guiones.length)
      L.push(
        `- **Negativos con guion ASCII**: ${guiones
          .slice(0, 6)
          .map((t) => `«${t.t.slice(0, 28)}»`)
          .join('; ')}`,
      );
    const partidos = m.textos.filter(
      (t) =>
        t.lineas > 1 &&
        (/[$]\s?\d/.test(t.t) || familia(t.ff) === 'Big Shoulders Display') &&
        t.t.length < 40,
    );
    if (partidos.length)
      L.push(
        `- **Montos o títulos en más de una línea**: ${partidos
          .slice(0, 8)
          .map((t) => `«${t.t.slice(0, 30)}» ${t.lineas} líneas`)
          .join('; ')}`,
      );
    const cortados = m.textos.filter((t) => t.cortado);
    if (cortados.length)
      L.push(
        `- Textos cortados con puntos suspensivos: ${cortados
          .slice(0, 8)
          .map((t) => `«${t.t.slice(0, 30)}»`)
          .join('; ')}`,
      );
    if (m.animaciones.length)
      L.push(
        `- Animaciones activas al capturar: ${[...new Set(m.animaciones.map((a) => `${a.nombre}(${a.dur}ms×${a.iter})`))].slice(0, 10).join(', ')}`,
      );

    // Contra la referencia
    const refArchivo = join(
      SAL,
      'medidas-ref',
      `${String(m.ref).replaceAll('/', '~')}__${m.variante}.json`,
    );
    if (existsSync(refArchivo)) {
      const r = JSON.parse(readFileSync(refArchivo, 'utf8'));
      const marcoRef = r.cajas
        .filter((k) => Math.abs(k.w - (telefono ? 390 : 1440)) < 1)
        .sort((a, b) => b.h - a.h)[0];
      const ox = marcoRef?.x ?? 0;
      const usados = new Set();
      const difs = [];
      for (const tr of r.textos) {
        // entre los textos iguales, el más parecido en tamaño y familia (el título «Inicio» no es la pestaña «Inicio»)
        let i = -1;
        let mejor = Infinity;
        m.textos.forEach((ta, k) => {
          if (usados.has(k) || norm(ta.t) !== norm(tr.t)) return;
          const d =
            Math.abs(ta.fs - tr.fs) +
            (familia(ta.ff) === familia(tr.ff) ? 0 : 20) +
            Math.abs(ta.y - tr.y) / 1000;
          if (d < mejor) [mejor, i] = [d, k];
        });
        if (i < 0) continue;
        usados.add(i);
        const ta = m.textos[i];
        const d = [];
        if (familia(ta.ff) !== familia(tr.ff))
          d.push(`familia ${familia(ta.ff)}≠${familia(tr.ff)}`);
        if (Math.abs(ta.fs - tr.fs) > 0.4) d.push(`tamaño ${ta.fs}≠${tr.fs}`);
        if (ta.fw !== tr.fw) d.push(`peso ${ta.fw}≠${tr.fw}`);
        if (ta.lh !== tr.lh && Math.abs(parseFloat(ta.lh) - parseFloat(tr.lh)) > 0.6)
          d.push(`interlineado ${ta.lh}≠${tr.lh}`);
        if (ta.st !== tr.st) d.push(`font-stretch ${ta.st}≠${tr.st}`);
        if (ta.tt !== tr.tt) d.push(`transform ${ta.tt}≠${tr.tt}`);
        if (ta.td !== tr.td) d.push(`decoración ${ta.td}≠${tr.td}`);
        if (/tabular/.test(tr.fvn) !== /tabular/.test(ta.fvn)) d.push(`tnum ${ta.fvn}≠${tr.fvn}`);
        if (ta.c !== tr.c)
          d.push(`color ${nombreToken(ta.c, tema) ?? ta.c}≠${nombreToken(tr.c, tema) ?? tr.c}`);
        if (ta.bg !== tr.bg)
          d.push(`fondo ${nombreToken(ta.bg, tema) ?? ta.bg}≠${nombreToken(tr.bg, tema) ?? tr.bg}`);
        if (Math.abs(ta.x - (tr.x - ox)) > 2)
          d.push(`x ${ta.x}≠${Math.round((tr.x - ox) * 10) / 10}`);
        if (d.length)
          difs.push(`  - «${tr.t.slice(0, 40)}» [rol ref: ${tr.rol || '—'}]: ${d.join(' · ')}`);
      }
      c.difTipo = difs.length;
      const enApp = new Set(m.textos.map((t) => norm(t.t)));
      const enRef = new Set(r.textos.map((t) => norm(t.t)));
      const faltan = [...enRef].filter((t) => sinDatos(t) && !enApp.has(t));
      const sobran = [...enApp].filter((t) => sinDatos(t) && !enRef.has(t));
      c.faltan = faltan.length;
      c.sobran = sobran.length;
      L.push(
        `- Contra \`${r.ref}\` (${r.textos.length} textos en la referencia, ${usados.size} con el mismo texto en la app):`,
      );
      if (difs.length)
        L.push(
          `  - **Diferencias en textos iguales (${difs.length})**:`,
          ...difs.slice(0, 60).map((x) => '  ' + x),
        );
      if (faltan.length)
        L.push(
          `  - **Textos de la referencia que no están en la app (${faltan.length})**: ${faltan
            .slice(0, 40)
            .map((t) => `«${t.slice(0, 40)}»`)
            .join(' · ')}`,
        );
      if (sobran.length)
        L.push(
          `  - **Textos de la app que no están en la referencia (${sobran.length})**: ${sobran
            .slice(0, 40)
            .map((t) => `«${t.slice(0, 40)}»`)
            .join(' · ')}`,
        );
    } else L.push(`- Sin medida de referencia para esta variante (\`${m.ref}\`)`);

    // Roles tipográficos que no cumplen su token (clase text-<rol> en la app)
    const rotos = [];
    for (const t of m.textos) {
      const def = roles[t.rol];
      if (!def) continue;
      const fsEsperado = parseFloat(def.tamano) * 16;
      const d = [];
      if (Math.abs(t.fs - fsEsperado) > 0.4) d.push(`tamaño ${t.fs}≠${fsEsperado}`);
      const st = /font-stretch:\s*(\d+%)/.exec(def.extra ?? '')?.[1];
      if (st && t.st !== st) d.push(`stretch ${t.st}≠${st}`);
      if (/tabular-nums/.test(def.extra ?? '') && !/tabular/.test(t.fvn)) d.push('sin tnum');
      if (/uppercase/.test(def.extra ?? '') && t.tt !== 'uppercase') d.push('sin mayúsculas');
      const fam = def.fuente === 'fuente-titulo' ? 'Big Shoulders Display' : 'Archivo';
      if (familia(t.ff) !== fam) d.push(`familia ${t.ff}`);
      if (d.length) rotos.push(`«${t.t.slice(0, 24)}» (${t.rol}): ${d.join(', ')}`);
    }
    if (rotos.length)
      L.push(
        `- **Textos con clase de rol que no cumple el token** (${rotos.length}): ${rotos.slice(0, 10).join('; ')}`,
      );

    out.push(...L, '');
    resumen.push(
      [
        id,
        m.variante,
        tipo,
        c.desborde,
        c.toc,
        c.sinNombre,
        c.sinEtiqueta,
        c.contraste,
        c.fueraToken,
        c.fuente,
        c.tnum,
        c.guion,
        c.marco,
        c.margen,
        c.difTipo,
        c.faltan,
        c.sobran,
      ].join('\t'),
    );
  }
  writeFileSync(join(SAL, 'analisis', `${id}.md`), out.join('\n'));
}
writeFileSync(join(SAL, 'analisis', '_resumen.tsv'), resumen.join('\n'));
console.log(`analizadas ${porId.size} entradas (${archivos.length} medidas)`);
