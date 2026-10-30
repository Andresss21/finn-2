// OPT-05, OPT-06 y OPT-07 contra PostgreSQL como `finn_app` (TA-195; 04 §3.10, §8.5, §8.7; BE-46, BE-47; 03 EN-1).
import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { escribir, escribirSms, guardarSms, purgarEventos } from '@finn/db';
import { consultar, crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import {
  guardarFormatoBancario,
  guardarInstitucionBancaria,
  probarFormato,
} from '../src/operaciones/formatos/index.ts';

const opciones = () => RELOJ;
const SESION = '11111111-1111-4111-8111-111111111111';
const PATRON = String.raw`compra (?<ultimos4>\d{4}) (?<monto>[\d.,]+) (?<comercio>.+?)$`;

describe('PRU-INT-BAND-104', () => {
  const base = crearBasePrueba();
  let institucionId = '';
  beforeAll(async () => {
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
    institucionId =
      (await admin("SELECT id FROM finn.instituciones WHERE nombre = 'BAC'"))[0] ?? '';
  });

  /** Filas como texto `a|b|c` (las columnas de estas consultas no llevan `|`, salvo la última). */
  const admin = (sql: string): Promise<string[]> => consultar(base.urlAdmin, sql);
  const auditorias = async () =>
    (
      await admin(
        "SELECT mensaje || '|' || datos::text FROM finn.eventos_sistema WHERE datos->>'tipo' = 'auditoria_formato' ORDER BY id",
      )
    ).map((f) => {
      const [mensaje = '', ...resto] = f.split('|');
      return { mensaje, datos: JSON.parse(resto.join('|')) as Record<string, unknown> };
    });
  const formato = (id: string, resto: Record<string, unknown> = {}) => ({
    id,
    institucionId,
    nombre: 'Compra de prueba',
    tipoMovimiento: 'compra',
    patron: PATRON,
    banderas: 'i',
    montoSeparadorMiles: ',',
    montoSeparadorDecimal: '.',
    formatosFecha: [],
    activo: true,
    ...resto,
  });

  it('PRU-INT-BAND-104 OPT-05: rechaza un patrón fuera de la política (04 §8.5) y no escribe ni audita', async () => {
    const id = randomUUID();
    const casos: [Record<string, unknown>, string, string][] = [
      [{ patron: '(' }, 'patron_invalido', 'patron'],
      [{ banderas: 'g' }, 'banderas_no_permitidas', 'banderas'],
      [{ patron: String.raw`compra (?<ultimos4>\d{4})` }, 'grupos_obligatorios', 'patron'],
      [{ formatosFecha: ['DD/MM/AAAA'] }, 'grupos_obligatorios', 'patron'],
      [
        { patron: String.raw`(?<ultimos4>\d{4}) (?<monto>(\d+)+)$`, nombre: 'Exponencial' },
        'patron_lento',
        'patron',
      ],
    ];
    for (const [resto, codigo, campo] of casos) {
      const r = await guardarFormatoBancario(formato(id, resto), SESION, opciones);
      expect(r).toMatchObject({ ok: false, error: { categoria: 'VALIDACION', codigo } });
      if (!r.ok) expect(Object.keys(r.error.campos ?? {})).toEqual([campo]);
    }
    // El contrato también rechaza separadores iguales
    const iguales = await guardarFormatoBancario(
      formato(id, { montoSeparadorMiles: '.', montoSeparadorDecimal: '.' }),
      SESION,
      opciones,
    );
    expect(iguales).toMatchObject({ ok: false, error: { categoria: 'VALIDACION' } });
    expect(await admin(`SELECT 1 FROM finn.formatos_bancarios WHERE id = '${id}'`)).toHaveLength(0);
    expect(await auditorias()).toHaveLength(0);
  });

  it('PRU-INT-BAND-104 OPT-05 BE-47 EN-1: crear, editar, desactivar y reactivar auditan en la misma transacción la fila anterior y la nueva; repetir es ya aplicada y la purga no las borra', async () => {
    const id = randomUUID();
    const crear = await guardarFormatoBancario(formato(id), SESION, opciones);
    expect(crear).toMatchObject({
      ok: true,
      valor: { formatoId: id, accion: 'crear' },
      yaAplicada: false,
    });
    const repetir = await guardarFormatoBancario(formato(id), SESION, opciones);
    expect(repetir).toMatchObject({ ok: true, valor: { accion: null }, yaAplicada: true });
    expect(await auditorias()).toHaveLength(1);

    expect(
      await guardarFormatoBancario(formato(id, { nombre: 'Otro nombre' }), SESION, opciones),
    ).toMatchObject({
      ok: true,
      valor: { accion: 'editar' },
    });
    expect(
      await guardarFormatoBancario(
        formato(id, { nombre: 'Otro nombre', activo: false }),
        SESION,
        opciones,
      ),
    ).toMatchObject({
      ok: true,
      valor: { accion: 'desactivar' },
    });
    expect(
      await guardarFormatoBancario(formato(id, { nombre: 'Otro nombre' }), SESION, opciones),
    ).toMatchObject({
      ok: true,
      valor: { accion: 'activar' },
    });

    const filas = await auditorias();
    expect(filas.map((f) => f.mensaje)).toEqual([
      'auditoria_formato crear',
      'auditoria_formato editar',
      'auditoria_formato desactivar',
      'auditoria_formato activar',
    ]);
    const [uno, dos, tres] = filas.map((f) => f.datos);
    expect(uno).toMatchObject({
      tipo: 'auditoria_formato',
      formatoId: id,
      accion: 'crear',
      sesion: SESION,
      antes: null,
    });
    expect(uno?.['despues']).toMatchObject({
      id,
      nombre: 'Compra de prueba',
      patron: PATRON,
      activo: true,
    });
    // La fila anterior de cada auditoría es la nueva de la anterior
    expect(dos?.['antes']).toEqual(uno?.['despues']);
    expect(dos?.['despues']).toMatchObject({ nombre: 'Otro nombre', activo: true });
    expect(tres?.['antes']).toEqual(dos?.['despues']);
    expect(tres?.['despues']).toMatchObject({ activo: false });
    expect(
      await admin(`SELECT nombre || '|' || activo FROM finn.formatos_bancarios WHERE id = '${id}'`),
    ).toEqual(['Otro nombre|true']);

    // EN-1: la purga de 90 días no toca la auditoría, aunque sea más vieja
    await admin(
      "UPDATE finn.eventos_sistema SET ocurrido_en = ocurrido_en - interval '400 days' WHERE datos->>'tipo' = 'auditoria_formato'",
    );
    await escribir((tx) => purgarEventos(tx, new Date()), RELOJ);
    expect(await auditorias()).toHaveLength(4);
  });

  it('PRU-INT-BAND-104 OPT-05: un nombre repetido en la institución y una institución inexistente se rechazan; un fallo de la base revierte también la auditoría', async () => {
    const a = randomUUID();
    await guardarFormatoBancario(formato(a, { nombre: 'Repetido' }), SESION, opciones);
    const antes = (await auditorias()).length;
    expect(
      await guardarFormatoBancario(formato(randomUUID(), { nombre: 'Repetido' }), SESION, opciones),
    ).toMatchObject({
      ok: false,
      error: { categoria: 'VALIDACION', campos: { nombre: expect.any(String) } },
    });
    expect(
      await guardarFormatoBancario(
        formato(randomUUID(), { institucionId: randomUUID() }),
        SESION,
        opciones,
      ),
    ).toMatchObject({
      ok: false,
      error: { categoria: 'VALIDACION', campos: { institucionId: expect.any(String) } },
    });
    // Node acepta el grupo con un escape; el CHECK de la base busca el texto `(?<monto>` y rechaza al guardar
    const id = randomUUID();
    const r = await guardarFormatoBancario(
      formato(id, {
        nombre: 'Escapado',
        patron: String.raw`(?<ultimos4>\d{4}) (?<mont\u006f>\d+)`,
      }),
      SESION,
      opciones,
    );
    expect(r).toMatchObject({ ok: false, error: { categoria: 'INTERNO', codigo: '23514' } });
    expect(await admin(`SELECT 1 FROM finn.formatos_bancarios WHERE id = '${id}'`)).toHaveLength(0);
    expect(await auditorias()).toHaveLength(antes);
  });

  it('PRU-INT-BAND-104 OPT-06: prueba el formato guardado o el que se edita contra un SMS, sin escribir; un SMS largo o inexistente no se evalúa', async () => {
    const id = randomUUID();
    await guardarFormatoBancario(formato(id, { nombre: 'Para probar' }), SESION, opciones);
    const sms = await escribirSms(
      (tx) => guardarSms(tx, { texto: 'compra 1234 12.50 Super Selectos', remitente: 'BAC' }),
      opciones(),
    );
    const otro = await escribirSms(
      (tx) => guardarSms(tx, { texto: 'otro texto', remitente: 'BAC' }),
      opciones(),
    );
    const largo = await escribirSms(
      (tx) => guardarSms(tx, { texto: 'x'.repeat(641), remitente: 'BAC' }),
      opciones(),
    );
    const eventos = await admin('SELECT count(*) FROM finn.eventos_sistema');

    const guardado = await probarFormato({ smsId: sms.id, formatoId: id }, opciones);
    expect(guardado).toMatchObject({
      ok: true,
      valor: {
        coincide: true,
        demasiadoLargo: false,
        grupos: { ultimos4: '1234', monto: '12.50' },
        campos: { ultimos4: '1234', monto: 1250, comercio: 'Super Selectos' },
      },
    });
    // En edición: el formato sin guardar contra un SMS con monto cero; el normalizador de monto falla y se dice cuál
    const cero = await escribirSms(
      (tx) => guardarSms(tx, { texto: 'compra 1234 0.00 Cero', remitente: 'BAC' }),
      opciones(),
    );
    const { id: _id, activo: _activo, ...sinId } = formato(id);
    const enEdicion = await probarFormato({ smsId: cero.id, formato: sinId }, opciones);
    expect(enEdicion).toMatchObject({
      ok: true,
      valor: { coincide: false, fallo: 'monto', grupos: { monto: '0.00' } },
    });
    expect(await probarFormato({ smsId: otro.id, formatoId: id }, opciones)).toMatchObject({
      ok: true,
      valor: { coincide: false, fallo: 'patron' },
    });
    expect(await probarFormato({ smsId: largo.id, formatoId: id }, opciones)).toMatchObject({
      ok: true,
      valor: { coincide: false, demasiadoLargo: true },
    });
    expect(await probarFormato({ smsId: randomUUID(), formatoId: id }, opciones)).toMatchObject({
      ok: false,
      error: { categoria: 'NO_ENCONTRADO' },
    });
    expect(await probarFormato({ smsId: sms.id }, opciones)).toMatchObject({
      ok: false,
      error: { categoria: 'VALIDACION' },
    });
    expect(await admin('SELECT count(*) FROM finn.eventos_sistema')).toEqual(eventos);
  });

  it('PRU-INT-BAND-104 OPT-07: crea y renombra instituciones; el nombre es único sin mayúsculas, repetirla es ya aplicada y no audita', async () => {
    const id = randomUUID();
    expect(await guardarInstitucionBancaria({ id, nombre: 'Banco Nuevo' }, opciones)).toMatchObject(
      {
        ok: true,
        valor: { institucionId: id, accion: 'crear' },
        yaAplicada: false,
      },
    );
    expect(await guardarInstitucionBancaria({ id, nombre: 'Banco Nuevo' }, opciones)).toMatchObject(
      {
        ok: true,
        valor: { accion: null },
        yaAplicada: true,
      },
    );
    expect(
      await guardarInstitucionBancaria({ id, nombre: 'Banco Renombrado' }, opciones),
    ).toMatchObject({
      ok: true,
      valor: { accion: 'renombrar' },
    });
    const igualAOtra = await guardarInstitucionBancaria({ id, nombre: 'bac' }, opciones);
    expect(igualAOtra).toMatchObject({
      ok: false,
      error: { categoria: 'VALIDACION', campos: { nombre: expect.any(String) } },
    });
    expect(
      await guardarInstitucionBancaria({ id: randomUUID(), nombre: 'BANCO RENOMBRADO' }, opciones),
    ).toMatchObject({
      ok: false,
      error: { categoria: 'VALIDACION' },
    });
    expect(
      await guardarInstitucionBancaria({ id, nombre: ' sin recortar ' }, opciones),
    ).toMatchObject({ ok: false });
    expect(await admin(`SELECT nombre FROM finn.instituciones WHERE id = '${id}'`)).toEqual([
      'Banco Renombrado',
    ]);
  });
});
