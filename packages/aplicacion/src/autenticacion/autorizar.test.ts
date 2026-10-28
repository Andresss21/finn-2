// Autorización del usuario único (04 §2.2.5, §12.3; 02 ADR-08; BE-07, BE-55; CH-29). Una sesión falsa por caso.
import { describe, expect, it } from 'vitest';
import {
  exigirSesionEscritura,
  exigirSesionLectura,
  type ClaimsSesion,
  type SesionServidor,
} from './autorizar.ts';

const FINN = '0b6f2c1e-5a4d-4c3b-9e8f-7a6b5c4d3e2f';
const OTRO = '9d8c7b6a-5f4e-4d3c-8b2a-1f0e9d8c7b6a';

interface SesionFalsa extends SesionServidor {
  readonly llamadas: { claims: number; usuario: number };
}

/** `usuario` es lo que devolvería `getUser()`; por defecto, el mismo `sub` de las claims (sesión no revocada). */
function sesionFalsa(
  claims: ClaimsSesion | null,
  usuario: string | null = claims?.sub ?? null,
): SesionFalsa {
  const llamadas = { claims: 0, usuario: 0 };
  return {
    llamadas,
    obtenerClaims: () => {
      llamadas.claims += 1;
      return Promise.resolve(claims);
    },
    obtenerUsuario: () => {
      llamadas.usuario += 1;
      return Promise.resolve(usuario === null ? null : { id: usuario });
    },
  };
}

const NO_AUTORIZADO = (aal: 'ninguna' | 'aal1') => ({
  ok: false,
  error: {
    categoria: 'NO_AUTORIZADO',
    codigo: 'no_autorizado',
    mensaje: 'Tu sesión terminó. Ingresá de nuevo para seguir.',
    datos: { aal },
  },
});

const exigencias = [
  ['lectura', exigirSesionLectura],
  ['escritura', exigirSesionEscritura],
] as const;

describe('PRU-SEG-ACCESO', () => {
  it('PRU-SEG-ACCESO-101 BE-07, BE-55, CH-29: solo AAL2 de FINN_USUARIO_ID pasa; getClaims() al leer y getUser() al escribir', async () => {
    for (const [nombre, exigir] of exigencias) {
      // Sin sesión.
      expect(await exigir(sesionFalsa(null), FINN), `${nombre}: sin sesión`).toEqual(
        NO_AUTORIZADO('ninguna'),
      );
      // Sesión AAL2 de otro usuario.
      expect(
        await exigir(sesionFalsa({ sub: OTRO, aal: 'aal2' }), FINN),
        `${nombre}: otro usuario`,
      ).toEqual(NO_AUTORIZADO('ninguna'));
      // Otro usuario con AAL1: no se lo manda a verificar un factor que no es de Finn.
      expect(
        await exigir(sesionFalsa({ sub: OTRO, aal: 'aal1' }), FINN),
        `${nombre}: otro, AAL1`,
      ).toEqual(NO_AUTORIZADO('ninguna'));
      // Sesión AAL1 del usuario de Finn.
      expect(
        await exigir(sesionFalsa({ sub: FINN, aal: 'aal1' }), FINN),
        `${nombre}: AAL1`,
      ).toEqual(NO_AUTORIZADO('aal1'));
      // Un `aal` desconocido no cuenta como AAL2.
      expect(
        await exigir(sesionFalsa({ sub: FINN, aal: 'aal3' }), FINN),
        `${nombre}: aal raro`,
      ).toEqual(NO_AUTORIZADO('ninguna'));
      // Sin FINN_USUARIO_ID configurado nadie pasa.
      expect(
        await exigir(sesionFalsa({ sub: '', aal: 'aal2' }), ''),
        `${nombre}: id vacío`,
      ).toEqual(NO_AUTORIZADO('ninguna'));
      // AAL2 del usuario de Finn.
      expect(
        await exigir(sesionFalsa({ sub: FINN, aal: 'aal2' }), FINN),
        `${nombre}: AAL2`,
      ).toEqual({
        ok: true,
        sesion: { usuarioId: FINN, aal: 'aal2' },
      });
    }

    // Lectura: solo getClaims(); una sesión revocada sigue leyendo hasta que vence el JWT (04 §12.3).
    const revocadaLeyendo = sesionFalsa({ sub: FINN, aal: 'aal2' }, null);
    expect((await exigirSesionLectura(revocadaLeyendo, FINN)).ok).toBe(true);
    expect(revocadaLeyendo.llamadas).toEqual({ claims: 1, usuario: 0 });

    // Escritura: getUser() detecta la revocación.
    const revocadaEscribiendo = sesionFalsa({ sub: FINN, aal: 'aal2' }, null);
    expect(await exigirSesionEscritura(revocadaEscribiendo, FINN)).toEqual(
      NO_AUTORIZADO('ninguna'),
    );
    expect(revocadaEscribiendo.llamadas.usuario).toBe(1);

    // Escritura: el usuario de getUser() tiene que ser el de las claims y el de Finn.
    expect(
      await exigirSesionEscritura(sesionFalsa({ sub: FINN, aal: 'aal2' }, OTRO), FINN),
    ).toEqual(NO_AUTORIZADO('ninguna'));
    const escritura = sesionFalsa({ sub: FINN, aal: 'aal2' });
    expect((await exigirSesionEscritura(escritura, FINN)).ok).toBe(true);
    expect(escritura.llamadas).toEqual({ claims: 1, usuario: 1 });
  });
});
