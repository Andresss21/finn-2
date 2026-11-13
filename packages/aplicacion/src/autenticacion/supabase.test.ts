// Funciones de 04 §12.2 con un `ClienteAuth` falso. El cliente real corre en PRU-E2E-ACCESO-101.
import { describe, expect, it } from 'vitest';
import {
  cerrarOtrasSesiones,
  completarInscripcion,
  estadoAcceso,
  estadoSeguridad,
  iniciarInscripcion,
  ingresar,
  quitarFactor,
  resumenSeguridad,
  salir,
  verificarFactor,
  type ClienteAuth,
  type ErrorAuth,
} from './supabase.ts';

const FINN = '0b6f2c1e-5a4d-4c3b-9e8f-7a6b5c4d3e2f';
const OTRO = '9d8c7b6a-5f4e-4d3c-8b2a-1f0e9d8c7b6a';
const CODIGO = '123456';

const verificado = {
  id: 'f1',
  friendly_name: 'Autenticador',
  factor_type: 'totp',
  status: 'verified',
};
const colgado = { id: 'f2', factor_type: 'totp', status: 'unverified' };

interface Opciones {
  aal?: string | null;
  sub?: string;
  factores?: (typeof verificado | typeof colgado)[];
  errorIngreso?: ErrorAuth;
  errorVerify?: ErrorAuth;
  qrCode?: string;
}

/** Como lo entrega auth-js 2.114 (`mfa.enroll` en GoTrueClient): el SVG tras un prefijo de data URI, sin codificar. */
const QR_DE_AUTH = 'data:image/svg+xml;utf-8,<svg/>';

function falso({
  aal = 'aal1',
  sub = FINN,
  factores = [],
  errorIngreso,
  errorVerify,
  qrCode = QR_DE_AUTH,
}: Opciones) {
  const llamadas: string[] = [];
  const nota = <T>(nombre: string, valor: T): Promise<T> => {
    llamadas.push(nombre);
    return Promise.resolve(valor);
  };
  const auth: ClienteAuth = {
    signInWithPassword: () =>
      nota(
        'signIn',
        errorIngreso
          ? { data: { user: null }, error: errorIngreso }
          : { data: { user: { id: sub } }, error: null },
      ),
    signOut: (o) => nota(`signOut:${o.scope}`, { error: null }),
    getClaims: () =>
      nota('getClaims', { data: aal === null ? null : { claims: { sub, aal } }, error: null }),
    getUser: () =>
      nota('getUser', { data: { user: aal === null ? null : { id: sub } }, error: null }),
    mfa: {
      listFactors: () => nota('listFactors', { data: { all: factores }, error: null }),
      challenge: (p) => nota(`challenge:${p.factorId}`, { data: { id: 'reto' }, error: null }),
      verify: (p) => nota(`verify:${p.code}`, { data: null, error: errorVerify ?? null }),
      enroll: (p) =>
        nota(`enroll:${p.friendlyName}`, {
          data: { id: 'f3', totp: { qr_code: qrCode, secret: 'S', uri: 'otpauth://x' } },
          error: null,
        }),
      unenroll: (p) => nota(`unenroll:${p.factorId}`, { data: null, error: null }),
    },
  };
  return { auth, llamadas };
}

const codigoDe = (r: { ok: boolean; error?: { codigo: string } }) =>
  r.ok ? 'ok' : r.error?.codigo;

describe('PRU-SEG-ACCESO', () => {
  it('PRU-SEG-ACCESO-105 AUTH-funciones: estadoAcceso e ingresar: niveles, usuario no permitido y errores sin revelar cuál falló', async () => {
    expect(await estadoAcceso(falso({ aal: null }).auth, FINN)).toEqual({
      sesion: 'ninguna',
      usuarioPermitido: false,
      factoresVerificados: [],
    });
    const ajeno = falso({ sub: OTRO, factores: [verificado] });
    expect(await estadoAcceso(ajeno.auth, FINN)).toEqual({
      sesion: 'aal1',
      usuarioPermitido: false,
      factoresVerificados: [],
    });
    expect(ajeno.llamadas).not.toContain('listFactors');
    expect(
      await estadoAcceso(falso({ aal: 'aal2', factores: [verificado, colgado] }).auth, FINN),
    ).toEqual({
      sesion: 'aal2',
      usuarioPermitido: true,
      factoresVerificados: [{ id: 'f1', nombre: 'Autenticador' }],
    });

    const entrada = { email: 'a@b.c', contrasena: 'x' };
    const conFactor = await ingresar(falso({ factores: [verificado] }).auth, FINN, entrada);
    expect(conFactor).toMatchObject({ ok: true, valor: { siguiente: 'verificar' } });
    const sinFactor = await ingresar(falso({ factores: [colgado] }).auth, FINN, entrada);
    expect(sinFactor).toMatchObject({ ok: true, valor: { siguiente: 'inscribir' } });

    const otro = falso({ sub: OTRO });
    expect(codigoDe(await ingresar(otro.auth, FINN, entrada))).toBe('credenciales_invalidas');
    expect(otro.llamadas).toContain('signOut:local');
    expect(codigoDe(await ingresar(falso({}).auth, '', entrada))).toBe('credenciales_invalidas');

    const conError = (status?: number) =>
      ingresar(falso({ errorIngreso: { status } }).auth, FINN, entrada);
    const malas = await conError(400);
    expect(malas).toMatchObject({
      ok: false,
      error: {
        categoria: 'DOMINIO',
        codigo: 'credenciales_invalidas',
        mensaje: 'El email o la contraseña no son correctos.',
      },
    });
    expect(codigoDe(await conError(429))).toBe('demasiados_intentos');
    expect(await conError(503)).toMatchObject({ ok: false, error: { categoria: 'INTERNO' } });
    expect(await ingresar(falso({}).auth, FINN, { email: '', contrasena: '' })).toMatchObject({
      ok: false,
      error: { categoria: 'VALIDACION' },
    });
  });

  it('PRU-SEG-ACCESO-106 AUTH-funciones: verificarFactor exige sesión del permitido, solo acepta factores verificados y traduce los códigos', async () => {
    const base = { factores: [verificado, colgado] };
    const bien = falso(base);
    expect(await verificarFactor(bien.auth, FINN, { codigo: CODIGO })).toMatchObject({ ok: true });
    expect(bien.llamadas).toContain('challenge:f1');
    expect(bien.llamadas).toContain(`verify:${CODIGO}`);
    expect(bien.llamadas).toContain('getUser');

    const sinVerificar = falso(base);
    const conColgado = await verificarFactor(sinVerificar.auth, FINN, {
      factorId: 'f2',
      codigo: CODIGO,
    });
    expect(codigoDe(conColgado)).toBe('codigo_incorrecto');
    expect(sinVerificar.llamadas.some((l) => l.startsWith('challenge'))).toBe(false);

    const sinSesion = await verificarFactor(falso({ aal: null }).auth, FINN, { codigo: CODIGO });
    expect(sinSesion).toMatchObject({
      ok: false,
      error: { categoria: 'NO_AUTORIZADO', datos: { aal: 'ninguna' } },
    });
    expect(
      await verificarFactor(falso({ sub: OTRO, ...base }).auth, FINN, { codigo: CODIGO }),
    ).toMatchObject({ ok: false, error: { categoria: 'NO_AUTORIZADO' } });
    expect(await verificarFactor(falso({}).auth, FINN, { codigo: CODIGO })).toMatchObject({
      ok: false,
      error: { categoria: 'NO_AUTORIZADO', datos: { aal: 'aal1' } },
    });
    expect(await verificarFactor(falso(base).auth, FINN, { codigo: '12' })).toMatchObject({
      ok: false,
      error: { categoria: 'VALIDACION' },
    });

    const conVerify = async (errorVerify: ErrorAuth) =>
      codigoDe(
        await verificarFactor(falso({ ...base, errorVerify }).auth, FINN, { codigo: CODIGO }),
      );
    expect(await conVerify({ status: 422, code: 'mfa_verification_failed' })).toBe(
      'codigo_incorrecto',
    );
    expect(await conVerify({ status: 422, code: 'mfa_challenge_expired' })).toBe('codigo_vencido');
    expect(await conVerify({ status: 429 })).toBe('demasiados_intentos');
    expect(await conVerify({ status: 500 })).toBe('interno');
  });

  it('PRU-SEG-ACCESO-107 AUTH-funciones: inscripción: se niega con AAL1 y factor verificado, limpia los colgados y salir cierra local', async () => {
    const limpio = falso({ factores: [colgado] });
    const inicio = await iniciarInscripcion(limpio.auth, FINN, {});
    expect(inicio).toMatchObject({
      ok: true,
      valor: { factorId: 'f3', qrSvg: '<svg/>', secreto: 'S', uri: 'otpauth://x' },
    });
    expect(limpio.llamadas.indexOf('unenroll:f2')).toBeLessThan(
      limpio.llamadas.indexOf('enroll:Autenticador'),
    );

    const negado = falso({ factores: [verificado, colgado] });
    expect(codigoDe(await iniciarInscripcion(negado.auth, FINN, {}))).toBe(
      'inscripcion_no_permitida',
    );
    expect(negado.llamadas.some((l) => l.startsWith('unenroll') || l.startsWith('enroll'))).toBe(
      false,
    );

    const respaldo = falso({ aal: 'aal2', factores: [verificado] });
    expect(await iniciarInscripcion(respaldo.auth, FINN, {})).toMatchObject({ ok: true });
    expect(respaldo.llamadas).toContain('enroll:Respaldo');
    expect(await iniciarInscripcion(falso({ aal: null }).auth, FINN, {})).toMatchObject({
      ok: false,
      error: { categoria: 'NO_AUTORIZADO' },
    });

    const entrada = { factorId: 'f3', codigo: CODIGO };
    const bien = falso({});
    expect(await completarInscripcion(bien.auth, FINN, entrada)).toMatchObject({ ok: true });
    expect(bien.llamadas).toContain('challenge:f3');
    expect(
      codigoDe(await completarInscripcion(falso({ factores: [verificado] }).auth, FINN, entrada)),
    ).toBe('inscripcion_no_permitida');
    expect(
      await completarInscripcion(
        falso({ aal: 'aal2', factores: [verificado] }).auth,
        FINN,
        entrada,
      ),
    ).toMatchObject({ ok: true });

    const fuera = falso({});
    expect(await salir(fuera.auth)).toMatchObject({ ok: true });
    expect(fuera.llamadas).toEqual(['signOut:local']);
  });

  it('PRU-SEG-ACCESO-108 [] qrSvg es solo el <svg>, sin el prefijo de data URI ni el prólogo que entrega auth-js; sin <svg>, interno', async () => {
    const qrSvgDe = async (qrCode: string) => {
      const r = await iniciarInscripcion(falso({ qrCode }).auth, FINN, {});
      return r.ok ? r.valor.qrSvg : r.error.codigo;
    };
    const svg = '<svg width="219"><rect style="fill:black" /></svg>\n';
    // La forma real, capturada de la pila local (CH-67)
    expect(
      await qrSvgDe(
        `data:image/svg+xml;utf-8,<?xml version="1.0"?>\n<!-- Generated by SVGo -->\n${svg}`,
      ),
    ).toBe(svg);
    expect(await qrSvgDe(svg)).toBe(svg);
    expect(await qrSvgDe('data:image/png;base64,AAAA')).toBe('interno');
  });

  it('PRU-SEG-ACCESO-800 [FT-74] resumenSeguridad cuenta solo los factores TOTP verificados de listFactors, con la sesión AAL2 del permitido; sin ella, NO_AUTORIZADO', async () => {
    const respaldo = { ...verificado, id: 'f4', friendly_name: 'Respaldo' };
    const dos = falso({ aal: 'aal2', factores: [verificado, colgado, respaldo] }).auth;
    expect(await resumenSeguridad(dos, FINN)).toEqual({ factores: 2 });
    const uno = falso({ aal: 'aal2', factores: [colgado, verificado] }).auth;
    expect(await resumenSeguridad(uno, FINN)).toEqual({ factores: 1 });
    await expect(resumenSeguridad(falso({ aal: 'aal1' }).auth, FINN)).rejects.toMatchObject({
      error: { categoria: 'NO_AUTORIZADO' },
    });
  });

  it('PRU-SEG-ACCESO-109 [CA-74.1] [CA-74.2] [CA-74.3] estadoSeguridad lista los factores; quitarFactor protege al único verificado; cerrarOtrasSesiones conserva esta', async () => {
    const respaldo = {
      id: 'f4',
      factor_type: 'totp',
      status: 'verified',
      friendly_name: 'Respaldo',
    };
    const f1 = { ...verificado, created_at: '2026-03-03T10:00:00Z' };
    const f2 = { ...colgado, created_at: '2026-04-01T10:00:00Z' };
    expect(await estadoSeguridad(falso({ aal: 'aal2', factores: [f2, f1] }).auth, FINN)).toEqual({
      aal: 'aal2',
      factores: [
        {
          id: 'f1',
          nombre: 'Autenticador',
          creadoEn: '2026-03-03T10:00:00Z',
          estado: 'verificado',
        },
        { id: 'f2', nombre: null, creadoEn: '2026-04-01T10:00:00Z', estado: 'sin_verificar' },
      ],
    });
    await expect(estadoSeguridad(falso({ aal: 'aal1' }).auth, FINN)).rejects.toMatchObject({
      error: { categoria: 'NO_AUTORIZADO' },
    });

    // CA-74.1: el único verificado no se quita; el colgado sí
    const unico = falso({ aal: 'aal2', factores: [verificado, colgado] });
    const negado = await quitarFactor(unico.auth, FINN, { factorId: 'f1' });
    expect(negado).toMatchObject({
      ok: false,
      error: { codigo: 'factor_unico', mensaje: 'Agregá otro factor antes de quitar este.' },
    });
    expect(unico.llamadas.some((l) => l.startsWith('unenroll'))).toBe(false);
    expect(await quitarFactor(unico.auth, FINN, { factorId: 'f2' })).toMatchObject({ ok: true });
    expect(unico.llamadas).toContain('unenroll:f2');

    // CA-74.2: con dos verificados se quita uno; con AAL1 o un id ajeno, no
    const dos = falso({ aal: 'aal2', factores: [verificado, respaldo] });
    expect(await quitarFactor(dos.auth, FINN, { factorId: 'f4' })).toMatchObject({ ok: true });
    expect(dos.llamadas).toContain('unenroll:f4');
    expect(codigoDe(await quitarFactor(dos.auth, FINN, { factorId: 'nadie' }))).toBe(
      'no_encontrado',
    );
    expect(
      await quitarFactor(falso({ aal: 'aal1', factores: [verificado, respaldo] }).auth, FINN, {
        factorId: 'f4',
      }),
    ).toMatchObject({ ok: false, error: { categoria: 'NO_AUTORIZADO' } });
    expect(await quitarFactor(dos.auth, FINN, {})).toMatchObject({
      ok: false,
      error: { categoria: 'VALIDACION' },
    });

    // CA-74.3
    const otras = falso({ aal: 'aal2', factores: [verificado] });
    expect(await cerrarOtrasSesiones(otras.auth, FINN, {})).toMatchObject({ ok: true });
    expect(otras.llamadas).toContain('signOut:others');
    expect(otras.llamadas).not.toContain('signOut:local');
    expect(
      await cerrarOtrasSesiones(falso({ aal: 'aal1', factores: [verificado] }).auth, FINN, {}),
    ).toMatchObject({ ok: false, error: { categoria: 'NO_AUTORIZADO' } });
  });
});
