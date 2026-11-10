// `ajustes().webhook.ultimoSmsEn` contra PostgreSQL (TA-511 c, CH-227 c; 04 §6.11, 03 §3.17). Sobre la base de prueba de
// @finn/db: sin SMS no viene; con los siete SMS de la bandeja de prueba (del 2027-02-04 a las 10:01 a las 10:07 UTC) y el
// token, es el `recibido_en` más reciente, y el DTO no lleva el texto de ningún SMS ni el hash del token.
import { beforeAll, describe, expect, it } from 'vitest';
import { Memoria } from '@finn/db';
import {
  sembrarAjustesTecnicos,
  sembrarBandejaCompleta,
} from '../../db/test/ayudantes/ajustes-prueba.ts';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import type { ClaimsSesion, SesionServidor } from '../src/autenticacion/autorizar.ts';
import { ajustes } from '../src/consultas/ajustes.ts';
import type { DepsConsulta } from '../src/consultas/comun.ts';

const USUARIO = 'usuario-unico';
const sesion: SesionServidor = {
  obtenerClaims: () => Promise.resolve({ sub: USUARIO, aal: 'aal2' } as ClaimsSesion),
  obtenerUsuario: () => Promise.resolve({ id: USUARIO }),
};

describe('PRU-INT-AJUS', () => {
  const base = crearBasePrueba();
  const deps = (): DepsConsulta => ({
    memoria: new Memoria(),
    sesion,
    usuarioPermitido: USUARIO,
    opciones: () => RELOJ,
  });

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
  });

  it('PRU-INT-AJUS-110 [Q-ajustes] (CH-227) ultimoSmsEn es el recibido_en más reciente de los SMS y el DTO no expone el texto ni el token', async () => {
    expect((await ajustes(deps())).webhook).not.toHaveProperty('ultimoSmsEn');

    await sembrarBandejaCompleta(base);
    await sembrarAjustesTecnicos(base);
    const dto = await ajustes(deps());
    expect(dto.webhook).toEqual({
      configurado: true,
      rotadoEn: '2027-02-01T12:00:00.000Z',
      ultimoSmsEn: '2027-02-04T10:07:00.000Z',
    });
    const todo = JSON.stringify(dto);
    expect(todo).not.toContain('compra super');
    expect(todo).not.toContain('sms 2');
    expect(todo).not.toContain('abab');
  });
});
