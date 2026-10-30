// tools/recuperacion/borrar-factores.mjs — recuperación si se pierden los dos factores (04 §12.6, BE-56, P4-12;
// [CH-41] [CH-42]). Procedimiento manual, en la computadora del usuario, fuera de la app.
// Uso: SUPABASE_URL=… SUPABASE_SERVICE_ROLE=… FINN_USUARIO_ID=… FINN_CLAVE_NUEVA=… node tools/recuperacion/borrar-factores.mjs
// La clave `service_role` y la contraseña nueva llegan solo por el entorno de esa ejecución (`read -rs`), nunca por
// un argumento ni un archivo, y nada de lo que escribe las contiene.
// 1. listFactors y deleteFactor por cada factor (las rutas de `auth.admin.mfa.*` de supabase-js, sin dependencia).
// 2. updateUserById(userId, { password }): en GoTrue, borrar un factor desde la API de administración no cierra las
//    sesiones (medido en TA-253); fijar la contraseña sí las cierra todas, también las del dispositivo perdido.
// 3. Comprueba que quedan 0 factores. Sale con 0 si todo salió bien, 1 si falló un paso y 2 si falta una variable.
const e = process.env;
const faltan = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE',
  'FINN_USUARIO_ID',
  'FINN_CLAVE_NUEVA',
].filter((n) => !e[n]);
if (faltan.length) {
  console.error(`faltan variables de entorno: ${faltan.join(', ')}`);
  process.exit(2);
}
const base = `${e.SUPABASE_URL.replace(/\/+$/, '')}/auth/v1/admin/users/${encodeURIComponent(e.FINN_USUARIO_ID)}`;
const clave = e.SUPABASE_SERVICE_ROLE;

/** Una llamada a la API de administración de Auth; corta con el código y el error de GoTrue, sin el cuerpo enviado. */
async function admin(paso, metodo, ruta, cuerpo) {
  const r = await globalThis.fetch(base + ruta, {
    method: metodo,
    headers: {
      apikey: clave,
      authorization: `Bearer ${clave}`,
      'content-type': 'application/json',
    },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const texto = await r.text();
  if (!r.ok) {
    let codigo = '';
    try {
      const j = JSON.parse(texto);
      codigo = String(j.error_code ?? j.msg ?? j.message ?? '');
    } catch {
      // sin cuerpo JSON
    }
    console.error(
      `error en ${paso}: HTTP ${r.status} ${codigo.split(clave).join('***').slice(0, 200)}`,
    );
    process.exit(1);
  }
  return texto ? JSON.parse(texto) : null;
}

const factores = await admin('listFactors', 'GET', '/factors');
for (const f of factores) {
  await admin('deleteFactor', 'DELETE', `/factors/${encodeURIComponent(f.id)}`);
  console.log(`factor borrado ${f.id} (${f.factor_type}, ${f.status})`);
}
await admin('updateUserById', 'PUT', '', { password: e.FINN_CLAVE_NUEVA });
console.log('contraseña nueva fijada: sesiones cerradas');
const quedan = await admin('listFactors', 'GET', '/factors');
console.log(`factores restantes: ${quedan.length}`);
process.exit(quedan.length === 0 ? 0 : 1);
