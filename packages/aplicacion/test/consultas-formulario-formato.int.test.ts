// `formulario({ operacion: 'formato' })` (TA-433; 04 §6.14.4, BE-42): el formato con su `esperado`, las instituciones y los 20 SMS
// más recientes sin reconocer o con error. Es lo que la pantalla de FT-73 necesita para editar y probar un formato.
import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { Memoria } from '@finn/db';
import { consultar, crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import type { SesionServidor } from '../src/autenticacion/autorizar.ts';
import type { DepsConsulta } from '../src/consultas/comun.ts';
import { formulario } from '../src/consultas/formulario/index.ts';
import { ExcepcionFinn } from '../src/errores/index.ts';

const USUARIO = 'usuario-unico';
const sesion: SesionServidor = {
  obtenerClaims: () => Promise.resolve({ sub: USUARIO, aal: 'aal2' }),
  obtenerUsuario: () => Promise.resolve({ id: USUARIO }),
};

describe('PRU-INT-BAND-130', () => {
  const base = crearBasePrueba();
  const admin = (sql: string): Promise<string[]> => consultar(base.urlAdmin, sql);
  const deps = (): DepsConsulta => ({
    memoria: new Memoria(),
    sesion,
    usuarioPermitido: USUARIO,
    opciones: () => RELOJ,
  });
  beforeAll(() => {
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
  });

  it('PRU-INT-BAND-130 [FORM-formato] formulario(formato) da las instituciones y los SMS sin reconocer o con error (los más recientes primero, hasta 20); con formatoId, el formato con esperado; sin él, NO_ENCONTRADO', async () => {
    const filas: string[] = [];
    for (let n = 0; n < 22; n += 1) {
      const sms = randomUUID();
      const estado = n === 21 ? 'pendiente' : n % 2 === 0 ? 'no_reconocido' : 'error';
      const minutos = String(n);
      filas.push(
        `INSERT INTO finn.sms_recibidos (id, texto, remitente, recibido_en) VALUES ('${sms}', 'sms ${minutos.padStart(2, '0')}', 'BAC', '2027-02-01T10:00:00Z'::timestamptz + interval '${minutos} minutes');
         INSERT INTO finn.movimientos (sms_id, estado) VALUES ('${sms}', '${estado}');`,
      );
    }
    await admin(`BEGIN; SELECT finn.tomar_bloqueo(); ${filas.join('\n')} COMMIT;`);
    const nuevo = await formulario(deps(), { operacion: 'formato' });
    expect(nuevo.contexto.instituciones.map((i) => i.nombre).sort()).toEqual([
      'BAC',
      'Banco Agrícola',
      'Cuscatlán',
    ]);
    expect(nuevo.contexto).not.toHaveProperty('formato');
    const sms = nuevo.contexto.smsParaProbar;
    expect(sms).toHaveLength(20);
    // El 21 está pendiente y no entra; el más reciente es el 20 y el último de los 20 es el 1
    expect(sms[0]).toMatchObject({ texto: 'sms 20', estado: 'no_reconocido' });
    expect(sms[1]).toMatchObject({ texto: 'sms 19', estado: 'error' });
    expect(sms[19]?.texto).toBe('sms 01');

    const [formatoId = ''] = await admin(
      "SELECT id FROM finn.formatos_bancarios WHERE nombre = 'BAC compra'",
    );
    const editar = await formulario(deps(), { operacion: 'formato', formatoId });
    expect(editar.contexto.formato).toMatchObject({
      id: formatoId,
      institucion: { nombre: 'BAC' },
      nombre: 'BAC compra',
      tipoMovimiento: 'compra',
      banderas: 'i',
      montoSeparadorMiles: ',',
      montoSeparadorDecimal: '.',
      formatosFecha: ['AAAA/MM/DD', 'AAAAMMDD'],
      activo: true,
      esperado: { nombre: 'BAC compra', activo: true },
    });

    const error = await formulario(deps(), {
      operacion: 'formato',
      formatoId: randomUUID(),
    }).then(
      () => null,
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(ExcepcionFinn);
    expect((error as ExcepcionFinn).error.categoria).toBe('NO_ENCONTRADO');
  });
});
