#!/bin/bash
set +x
# H-10 (04 §17.2; 12.1, 12.6; BE-56): Auth del proyecto. Claves asimétricas en el JWKS; un usuario de prueba creado
# con la API de administración, con un TOTP inscrito y verificado (AAL2); `tools/recuperacion/borrar-factores.mjs`
# ([CH-41] [CH-42]) le borra el factor y le rota la contraseña; se comprueba que quedan 0 factores, que sus dos
# sesiones (AAL1 y AAL2) se cerraron y que entra con la contraseña nueva; se registra el vencimiento del JWT; el
# usuario se borra por su id; y un alta pública tiene que fallar con `signup_disabled` (TU-07, paso 5, [CH-42]).
# El id del usuario queda en $HUMO_ESTADO hasta borrarlo: si este paso no llega a hacerlo, lo borra H-12.
# Sin SUPABASE_SERVICE_ROLE, omitido. La clave pública (HUMO_CLAVE_PUBLICA) va en `apikey` si está; si no, la de servicio.
. "$(dirname "$0")/comun.sh"
[ -n "${SUPABASE_URL:-}" ] || { echo "detalle falta SUPABASE_URL"; exit 1; }
[ -n "${SUPABASE_SERVICE_ROLE:-}" ] || { echo "detalle falta SUPABASE_SERVICE_ROLE (TU-07): sin ella no se prueba Auth"; exit 3; }
HUMO_ESTADO=${HUMO_ESTADO:-$(mktemp -d)} node --input-type=module - <<'JS'
import { createHmac, randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
const e = process.env;
const api = `${e.SUPABASE_URL.replace(/\/+$/, '')}/auth/v1`;
const servicio = e.SUPABASE_SERVICE_ROLE;
const publica = e.HUMO_CLAVE_PUBLICA || servicio;
const estado = `${e.HUMO_ESTADO}/h10-usuarios`;
let fallas = 0;
const medido = (k, v) => console.log(`medido ${k} ${v}`);
const falla = (t) => (fallas++, console.log(`detalle ${t}`));
async function pedir(metodo, ruta, cuerpo, token = servicio, apikey = servicio) {
  const r = await fetch(api + ruta, {
    method: metodo,
    headers: { apikey, authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const t = await r.text();
  let b = {};
  try { b = t ? JSON.parse(t) : {}; } catch { b = {}; }
  return { s: r.status, b };
}
const exigir = (r, paso) => {
  if (r.s >= 300) throw new Error(`${paso}: HTTP ${r.s} ${r.b.error_code ?? ''}`);
  return r.b;
};
// RFC 6238 con SHA-1, 30 s y 6 dígitos (el TOTP de Supabase)
function totp(secreto) {
  const a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bits = [...secreto.replace(/=+$/, '')].map((c) => a.indexOf(c).toString(2).padStart(5, '0')).join('');
  const clave = Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2)));
  const paso = Buffer.alloc(8);
  paso.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)));
  const h = createHmac('sha1', clave).update(paso).digest();
  return String((h.readUInt32BE(h[19] & 15) & 0x7fffffff) % 1e6).padStart(6, '0');
}
const ingresar = (email, password) =>
  pedir('POST', '/token?grant_type=password', { email, password }, publica, publica);
const renovar = (t) => pedir('POST', '/token?grant_type=refresh_token', { refresh_token: t }, publica, publica);
const borrar = async (id) => {
  const r = await pedir('DELETE', `/admin/users/${id}`);
  if (r.s < 300 || r.s === 404) {
    const resto = readFileSync(estado, 'utf8').split('\n').filter((l) => l && l !== id);
    writeFileSync(estado, resto.map((l) => `${l}\n`).join(''));
    return true;
  }
  return false;
};

const jwks = await pedir('GET', '/.well-known/jwks.json', undefined, publica, publica);
const algs = (jwks.b.keys ?? []).map((k) => k.alg);
medido('jwks', algs.join(',') || 'sin claves');
if (!algs.some((a) => /^(RS|ES|PS)\d+$|^EdDSA$/.test(a)))
  falla('claves simétricas: activar las asimétricas en el panel; si no se puede, getClaims hace la petición de red (12.3)');

const email = `humo-auth-${randomBytes(6).toString('hex')}@example.com`;
const [clave1, clave2] = [randomBytes(18).toString('hex'), randomBytes(18).toString('hex')];
let id = '';
try {
  id = exigir(await pedir('POST', '/admin/users', { email, password: clave1, email_confirm: true }), 'crear').id;
  appendFileSync(estado, `${id}\n`);
  const s1 = exigir(await ingresar(email, clave1), 'ingresar');
  const f = exigir(await pedir('POST', '/factors', { factor_type: 'totp', friendly_name: 'humo' }, s1.access_token, publica), 'inscribir');
  const ch = exigir(await pedir('POST', `/factors/${f.id}/challenge`, {}, s1.access_token, publica), 'desafío');
  const s2 = exigir(await pedir('POST', `/factors/${f.id}/verify`, { challenge_id: ch.id, code: totp(f.totp.secret) }, s1.access_token, publica), 'verificar');
  const jwt = JSON.parse(Buffer.from(s2.access_token.split('.')[1], 'base64url'));
  medido('aal', jwt.aal);
  medido('jwt_vence_s', jwt.exp - jwt.iat);

  const r = spawnSync(process.execPath, ['tools/recuperacion/borrar-factores.mjs'], {
    encoding: 'utf8',
    env: { ...process.env, FINN_USUARIO_ID: id, FINN_CLAVE_NUEVA: clave2 },
  });
  const salida = `${r.stdout}${r.stderr}`;
  medido('borrar_factores', r.status === 0 ? 'pasa' : `falla (${r.status})`);
  if (r.status !== 0) falla(`borrar-factores.mjs: ${salida.trim().split('\n').pop()}`);
  if (salida.includes(clave2)) falla('borrar-factores.mjs escribió la contraseña nueva');
  const quedan = exigir(await pedir('GET', `/admin/users/${id}/factors`), 'listFactors');
  medido('factores', quedan.length);
  const vivas = [(await renovar(s1.refresh_token)).s, (await renovar(s2.refresh_token)).s].filter((s) => s < 300);
  medido('sesiones_abiertas', vivas.length);
  const vieja = (await ingresar(email, clave1)).s;
  const nueva = (await ingresar(email, clave2)).s;
  medido('ingreso', `contraseña vieja ${vieja}, nueva ${nueva}`);
  if (quedan.length || vivas.length || vieja < 400 || nueva >= 300)
    falla('el procedimiento de recuperación (12.6) no quedó como se espera: documentar otro antes de producción');
} catch (err) {
  falla(err.message);
} finally {
  if (id) medido('usuario_borrado', (await borrar(id)) ? 'si' : 'no');
}

// El alta pública: la cuenta única se crea a mano (ADR-08); si el registro sigue abierto, se borra lo que se creó
const alta = await pedir('POST', '/signup', { email: `humo-alta-${randomBytes(6).toString('hex')}@example.com`, password: clave1 }, publica, publica);
const creado = alta.b.user?.id ?? alta.b.id;
if (creado) {
  appendFileSync(estado, `${creado}\n`);
  await borrar(creado);
}
const cerrado = alta.b.error_code === 'signup_disabled';
medido('registro', cerrado ? 'cerrado' : `abierto (HTTP ${alta.s})`);
if (!cerrado) falla('registro abierto: deshabilitarlo (TU-07, paso 5) y repetir con HUMO_PASOS=H-10');
process.exit(fallas ? 1 : 0);
JS
