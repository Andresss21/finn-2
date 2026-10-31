// El usuario de prueba de la E2E (TA-219; 07 §5.3, 05 §14.1): se crea contra el Auth de la pila local al arrancar, con
// contraseña y TOTP inscrito y verificado. Se genera en cada corrida: nada de esto se escribe en un log ni en un
// artefacto (07 §32.4). La clave `service_role` es la de la pila local, que `supabase status` informa.
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export type UsuarioE2E = { id: string; email: string; clave: string; secretoTotp: string };
export type Auth = { url: string; clavePublica: string; claveServicio: string };
type Totp = { generate(): string };
type Otpauth = { TOTP: new (o: { secret: string }) => Totp };

// `otpauth` es dependencia de desarrollo de la web (05 §14.1)
const web = fileURLToPath(new URL('../../../apps/web/package.json', import.meta.url));
const { TOTP } = createRequire(web)('otpauth') as Otpauth;

/** El código vigente de un secreto base32, como lo calcularía la app autenticadora. */
export const codigoDe = (secreto: string): string => new TOTP({ secret: secreto }).generate();

async function pedir<T>(url: string, clave: string, cuerpo: object, token = clave): Promise<T> {
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: clave,
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(cuerpo),
  });
  // Solo el código y la ruta: el cuerpo podría traer el secreto o la contraseña
  if (!r.ok) throw new Error(`usuario E2E: ${new URL(url).pathname} respondió ${r.status}`);
  return (await r.json()) as T;
}

export async function crearUsuario(auth: Auth): Promise<UsuarioE2E> {
  const api = `${auth.url}/auth/v1`;
  const email = 'usuario-e2e@finn.test';
  const clave = randomBytes(24).toString('base64url');
  const { id } = await pedir<{ id: string }>(`${api}/admin/users`, auth.claveServicio, {
    email,
    password: clave,
    email_confirm: true,
  });
  const { access_token: token } = await pedir<{ access_token: string }>(
    `${api}/token?grant_type=password`,
    auth.clavePublica,
    { email, password: clave },
  );
  const factor = await pedir<{ id: string; totp: { secret: string } }>(
    `${api}/factors`,
    auth.clavePublica,
    { factor_type: 'totp' },
    token,
  );
  const base = `${api}/factors/${factor.id}`;
  const reto = await pedir<{ id: string }>(`${base}/challenge`, auth.clavePublica, {}, token);
  await pedir(
    `${base}/verify`,
    auth.clavePublica,
    { challenge_id: reto.id, code: codigoDe(factor.totp.secret) },
    token,
  );
  return { id, email, clave, secretoTotp: factor.totp.secret };
}

/** Un segundo usuario de Auth, sin factores: no es `FINN_USUARIO_ID`, así que Finn lo trata como credenciales inválidas (07 §18). */
export async function crearUsuarioNoPermitido(
  auth: Auth,
): Promise<Pick<UsuarioE2E, 'email' | 'clave'>> {
  const email = 'otro-usuario-e2e@finn.test';
  const clave = randomBytes(24).toString('base64url');
  await pedir(`${auth.url}/auth/v1/admin/users`, auth.claveServicio, {
    email,
    password: clave,
    email_confirm: true,
  });
  return { email, clave };
}
