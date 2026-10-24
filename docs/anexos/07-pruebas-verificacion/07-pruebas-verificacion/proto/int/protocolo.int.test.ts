// PRU-INT-PROTO-001..006 (prototipo de V7-01): protocolo de escritura, RLS y privilegios contra el esquema real de 03.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { crearBase, escribir } from './base';
let b: Awaited<ReturnType<typeof crearBase>>, app: any;
beforeAll(async () => { b = await crearBase(); app = await b.conectar(); console.log(`clonar + reloj: ${b.ms.toFixed(0)} ms`); });
afterAll(async () => { await app?.end(); await b?.destruir(); });
const rev = async () => Number((await app.query('SELECT valor FROM finn.revision')).rows[0].valor);
const crearAhorro = (c: any, saldo: number, fecha: string) => c.query(`WITH i AS (SELECT finn.instante() t), cta AS (INSERT INTO finn.cuentas (tipo, nombre, fecha_apertura) VALUES ('efectivo','Ahorro',$2) RETURNING id),
  tx AS (INSERT INTO finn.transacciones (tipo, fecha, hora_registro, clave_orden, origen, estado_bancario, total)
         SELECT 'saldo_inicial', $2, i.t, i.t, 'manual', 'pendiente', $1 FROM i RETURNING id, hora_registro)
  INSERT INTO finn.efectos (transaccion_id, cuenta_id, monto) SELECT tx.id, cta.id, $1 FROM tx, cta RETURNING cuenta_id`, [saldo, fecha]);

describe('PRU-INT-PROTO', () => {
  it('PRU-INT-PROTO-001 escritura de hechos sin el bloqueo → FN001 (ADR-06)', async () => {
    await expect(app.query(`INSERT INTO finn.deudores (nombre) VALUES ('Ana')`)).rejects.toMatchObject({ code: 'FN001' });
  });
  it('PRU-INT-PROTO-002 con el bloqueo: la revisión sube una vez por transacción aunque haya varias sentencias', async () => {
    const r0 = await rev();
    await escribir(app, '2027-02-05', async c => { await c.query(`INSERT INTO finn.deudores (nombre) VALUES ('Ana')`); await c.query(`INSERT INTO finn.deudores (nombre) VALUES ('Beto')`); });
    expect(await rev()).toBe(r0 + 1);
  });
  it('PRU-INT-PROTO-003 ESC-01 paso 1 por SQL: saldo inicial con reloj simulado y verificación diferida al confirmar', async () => {
    const [cuenta] = (await escribir(app, '2027-02-05', c => crearAhorro(c, 100000, '2027-02-05'))).rows;
    const t = (await app.query(`SELECT to_char(hora_registro AT TIME ZONE 'America/El_Salvador','YYYY-MM-DD') d FROM finn.transacciones t JOIN finn.efectos e ON e.transaccion_id=t.id WHERE e.cuenta_id=$1`, [cuenta.cuenta_id])).rows[0];
    expect(t.d).toBe('2027-02-05');
  });
  it('PRU-INT-PROTO-004 fecha posterior a hoy simulado → FN002 (inv. 12)', async () => {
    await expect(escribir(app, '2027-02-05', c => crearAhorro(c, 5000, '2027-02-06'))).rejects.toMatchObject({ code: 'FN002' });
  });
  it('PRU-INT-PROTO-005 efecto que no suma el total → FN003 al confirmar (diferida)', async () => {
    await expect(escribir(app, '2027-02-05', async c => {
      const { rows: [cta] } = await c.query(`SELECT id FROM finn.cuentas LIMIT 1`);
      const { rows: [tx] } = await c.query(`INSERT INTO finn.transacciones (tipo, fecha, hora_registro, clave_orden, origen, estado_bancario, total) SELECT 'ingreso','2027-02-05',t,t,'manual','pendiente',500 FROM (SELECT finn.instante() t) i RETURNING id`);
      await c.query(`INSERT INTO finn.efectos (transaccion_id, cuenta_id, monto) VALUES ($1,$2,400)`, [tx.id, cta.id]);
    })).rejects.toMatchObject({ code: 'FN003' });
  });
  it('PRU-INT-PROTO-006 un rol sin BYPASSRLS (como anon) ve 0 filas; finn_app no tiene TRUNCATE ni puede quitar triggers', async () => {
    const adm = await b.conectar('postgres', '');
    await adm.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='v7_anon') THEN CREATE ROLE v7_anon LOGIN PASSWORD 'x'; END IF; END $$`);
    await adm.query(`GRANT USAGE ON SCHEMA finn TO v7_anon; GRANT SELECT ON finn.cuentas TO v7_anon`);
    const anon = await b.conectar('v7_anon', 'x');
    expect((await anon.query('SELECT count(*)::int n FROM finn.cuentas')).rows[0].n).toBe(0);
    expect((await app.query('SELECT count(*)::int n FROM finn.cuentas')).rows[0].n).toBeGreaterThan(0);
    await expect(app.query('TRUNCATE finn.deudores')).rejects.toMatchObject({ code: '42501' });
    await expect(app.query('ALTER TABLE finn.deudores DISABLE TRIGGER a_exigir_bloqueo')).rejects.toMatchObject({ code: '42501' });
    await anon.end(); await adm.query(`REVOKE ALL ON finn.cuentas FROM v7_anon; REVOKE USAGE ON SCHEMA finn FROM v7_anon`); await adm.end();
  });
});
