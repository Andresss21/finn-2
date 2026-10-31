// Los factores TOTP del usuario de prueba (FT-02): dejarlo sin factores para que su primer ingreso lleve a inscribir, y
// volver a darle uno con secreto conocido. Usa las funciones de 04 §12.2 y la API de Auth del propio usuario con AAL2:
// la E2E no tiene la clave de servicio. Una sola E2E a la vez (workers: 1), así que nadie más usa al usuario mientras tanto.
import {
  ingresar,
  verificarFactor,
} from '../../../../packages/aplicacion/src/autenticacion/supabase.ts';
import { clienteConFrasco, variable } from './sesion.ts';
import { codigoDe, codigoTotp, guardarSecreto } from './totp.ts';

type Cliente = ReturnType<typeof clienteConFrasco>['cliente'];

export async function clienteAal1(): Promise<Cliente> {
  const { cliente } = clienteConFrasco();
  const paso = await ingresar(cliente.auth, variable('FINN_USUARIO_ID'), {
    email: variable('E2E_EMAIL'),
    contrasena: variable('E2E_CLAVE'),
  });
  if (!paso.ok) throw new Error('el usuario de prueba no pudo ingresar');
  return cliente;
}

/** Todos los factores del usuario, verificados o no. */
export async function listarFactores(cliente: Cliente) {
  const { data, error } = await cliente.auth.mfa.listFactors();
  if (error !== null) throw new Error('no se pudieron listar los factores');
  return data.all.map((f) => ({ id: f.id, estado: f.status }));
}

/** Sesión AAL2 con el factor vigente, para poder quitar factores. */
export async function clienteAal2(): Promise<Cliente> {
  const cliente = await clienteAal1();
  const verificado = await verificarFactor(cliente.auth, variable('FINN_USUARIO_ID'), {
    codigo: codigoTotp(),
  });
  if (!verificado.ok) throw new Error('el factor del usuario de prueba no se verificó');
  return cliente;
}

/** Quita todos los factores: el próximo ingreso con contraseña queda en AAL1 sin factores verificados. */
export async function dejarSinFactores(): Promise<void> {
  const cliente = await clienteAal2();
  for (const { id } of await listarFactores(cliente)) {
    const { error } = await cliente.auth.mfa.unenroll({ factorId: id });
    if (error !== null) throw new Error('no se pudo quitar un factor del usuario de prueba');
  }
}

/** Si no queda ningún factor verificado, inscribe uno con un secreto que las demás pruebas conocen. */
export async function asegurarFactor(): Promise<void> {
  const cliente = await clienteAal1();
  const factores = await listarFactores(cliente);
  if (factores.some((f) => f.estado === 'verified')) return;
  for (const { id } of factores) await cliente.auth.mfa.unenroll({ factorId: id });
  const { data, error } = await cliente.auth.mfa.enroll({ factorType: 'totp' });
  if (error !== null) throw new Error('no se pudo inscribir el factor de respaldo de la prueba');
  const reto = await cliente.auth.mfa.challengeAndVerify({
    factorId: data.id,
    code: codigoDe(data.totp.secret),
  });
  if (reto.error !== null) throw new Error('el factor de la prueba no se verificó');
  guardarSecreto(data.totp.secret);
}
