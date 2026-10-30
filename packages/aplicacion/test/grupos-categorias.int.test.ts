// Operaciones de grupos y categorías OP-07 a OP-13 contra PostgreSQL como `finn_app` (TA-163; 04 §3.2, §4.2, §4.3,
// §4.5, §4.6; 01 inv. 18, 20 y 25; CH-31). Cada caso crea sus propios grupos y categorías (ids 800+) y lee lo que
// necesita de la base; los de OP-09 y OP-12 usan las categorías de los hechos de prueba de @finn/db.
import { beforeAll, describe, expect, it } from 'vitest';
import { calcular } from '@finn/dominio';
import type { Cambio, Hechos, Instante, Uuid } from '@finn/dominio';
import { FechaLocal } from '@finn/dominio/valores';
import { cargarHechos, escribir, leer, leerReglasComercio, Memoria } from '@finn/db';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import {
  confirmar,
  previsualizar,
  type DefinicionOperacion,
  type DepsMarco,
} from '../src/operaciones/marco.ts';
import {
  crearEnLote,
  OP07,
  OP08,
  OP09,
  OP10,
  OP11,
  OP12,
  OP13,
} from '../src/operaciones/categorias/index.ts';

const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const C1 = uuid(11), // Comida: asignación, meta y una programada activa
  C2 = uuid(12), // Préstamo: sobregiro y meta
  G1 = uuid(10); // Gastos
const INSTANTE = `${HOY}T12:00:00.000Z` as Instante;
const c = (n: number) => n as never; // Centavos de la prueba
const texto = expect.any(String) as string;

describe('PRU-INT-CATEG', () => {
  const base = crearBasePrueba();
  const deps = (): DepsMarco => ({
    memoria: new Memoria(),
    opciones: () => RELOJ,
    instante: () => INSTANTE,
  });
  const hechos = (): Promise<Hechos> => leer((t) => cargarHechos(t), RELOJ);
  const ejecutar = <E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: unknown) =>
    confirmar(def, entrada, deps());
  const preparar = <E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: unknown) =>
    previsualizar(def, entrada, deps());
  const escribirCambios = (cambios: Cambio[]) =>
    escribir((tx) => tx.aplicarCambios(cambios), RELOJ);
  const inicioA = (h: Hechos) => calcular(h, FechaLocal.desdeTexto(HOY)).presupuesto.activo.inicio;
  const asignacion = async (id: number, categoriaId: Uuid, monto: number) =>
    escribirCambios([
      {
        tipo: 'insertar',
        tabla: 'asignaciones',
        fila: {
          id: uuid(id),
          categoriaId,
          periodoInicio: inicioA(await hechos()),
          monto: c(monto),
          revision: null,
        },
      },
    ]);
  const asig = (h: Hechos, categoriaId: Uuid) =>
    h.asignaciones.find((a) => a.categoriaId === categoriaId && a.periodoInicio === inicioA(h))
      ?.monto ?? 0;
  const grupo = (n: number, nombre: string) => ({ tipo: 'grupo', id: uuid(n), nombre });
  const categoria = (n: number, nombre: string, grupoId: Uuid) => ({
    tipo: 'categoria',
    id: uuid(n),
    nombre,
    grupoId,
  });

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
  });

  it('PRU-INT-CATEG-101 OP-07: crea un grupo y una categoría con su orden, repetir el id es ya aplicada y con otros datos es conflicto_id', async () => {
    const vista = await preparar(OP07, grupo(800, 'Ahorros'));
    expect(vista).toMatchObject({ ok: true, valor: { rechazos: [] } });
    expect(await ejecutar(OP07, grupo(800, 'Ahorros'))).toMatchObject({
      ok: true,
      valor: { id: uuid(800) },
      yaAplicada: false,
    });
    expect(await ejecutar(OP07, categoria(801, 'Viajes', uuid(800)))).toMatchObject({ ok: true });
    const h = await hechos();
    const g = h.grupos.find((x) => x.id === uuid(800));
    expect(g).toMatchObject({ nombre: 'Ahorros', archivado: false, claveSistema: null });
    expect(g?.orden).toBe(
      Math.max(...h.grupos.filter((x) => x.id !== uuid(800)).map((x) => x.orden)) + 1,
    );
    expect(h.categorias.find((x) => x.id === uuid(801))).toMatchObject({
      grupoId: uuid(800),
      clase: 'normal',
      orden: 1,
      archivada: false,
    });

    expect(await ejecutar(OP07, grupo(800, 'Ahorros'))).toMatchObject({
      ok: true,
      yaAplicada: true,
    });
    expect(await ejecutar(OP07, categoria(801, 'Viajes', uuid(800)))).toMatchObject({
      yaAplicada: true,
    });
    expect(await ejecutar(OP07, grupo(800, 'Otro nombre'))).toMatchObject({
      ok: false,
      error: { categoria: 'CONFLICTO', codigo: 'conflicto_id' },
    });
  });

  it('PRU-INT-CATEG-101 OP-07: los rechazos del dominio llegan con su código y su mensaje y no escriben', async () => {
    const antes = await hechos();
    expect(await ejecutar(OP07, categoria(802, 'COMIDA', G1))).toMatchObject({
      ok: false,
      error: {
        categoria: 'DOMINIO',
        codigo: 'nombre_repetido',
        mensaje: 'Ya existe COMIDA en Gastos.',
      },
    });
    // un grupo repetido no tiene {grupo}: su propio texto [CH-40]
    expect(await ejecutar(OP07, grupo(805, 'gastos'))).toMatchObject({
      ok: false,
      error: { codigo: 'nombre_repetido', mensaje: 'Ya existe un grupo llamado gastos.' },
    });
    const sistema = antes.grupos.find((x) => x.claveSistema === 'pagos_tarjeta');
    expect(await ejecutar(OP07, categoria(803, 'Libre', sistema?.id as Uuid))).toMatchObject({
      ok: false,
      error: {
        codigo: 'grupo_del_sistema',
        mensaje: 'El grupo Pagos de tarjeta lo administra Finn.',
      },
    });
    expect(await ejecutar(OP07, categoria(804, 'Libre', uuid(899)))).toMatchObject({
      ok: false,
      error: { categoria: 'NO_ENCONTRADO' },
    });
    const despues = await hechos();
    expect(despues.categorias.length).toBe(antes.categorias.length);
  });

  it('PRU-INT-CATEG-101 [CF-19] OP-07 en lote: un elemento que falla no detiene a los demás y las categorías de un grupo fallido heredan su motivo', async () => {
    const lote = {
      elementos: [
        grupo(810, 'Hogar'),
        categoria(811, 'Luz', uuid(810)),
        categoria(812, 'Agua', uuid(810)),
        grupo(813, 'hogar'), // repite el nombre de Hogar
        categoria(814, 'Internet', uuid(813)), // no se intenta
        categoria(815, 'Gas', uuid(810)),
      ],
    };
    const r = await crearEnLote(lote, deps());
    if (!r.ok) throw new Error(JSON.stringify(r.error));
    const [g1, c1, c2, g2, c3, c4] = r.valor.elementos;
    expect([g1?.resultado, c1?.resultado, c2?.resultado, c4?.resultado]).toEqual([
      'creado',
      'creado',
      'creado',
      'creado',
    ]);
    expect(g2?.resultado).toMatchObject({ codigo: 'nombre_repetido' });
    expect(c3?.resultado).toEqual(g2?.resultado);
    expect(r.valor.elementos.map((e) => e.id)).toEqual(
      lote.elementos.map((e) => uuid(Number(e.id.slice(-3)))),
    );
    const h = await hechos();
    expect(
      h.categorias.filter((x) => x.grupoId === uuid(810)).map((x) => [x.nombre, x.orden]),
    ).toEqual([
      ['Luz', 1],
      ['Agua', 2],
      ['Gas', 3],
    ]);
    expect(h.categorias.some((x) => x.id === uuid(814))).toBe(false);

    // reanudar con los mismos ids: lo creado responde ya_aplicada, lo fallido vuelve a fallar
    const otra = await crearEnLote(lote, deps());
    if (!otra.ok) throw new Error(JSON.stringify(otra.error));
    expect(
      otra.valor.elementos.map((e) => (typeof e.resultado === 'string' ? e.resultado : 'error')),
    ).toEqual(['ya_aplicada', 'ya_aplicada', 'ya_aplicada', 'error', 'error', 'ya_aplicada']);
    const vacio = await crearEnLote({ elementos: [] }, deps());
    expect(vacio).toMatchObject({ ok: false, error: { categoria: 'VALIDACION' } });
  });

  it('PRU-INT-CATEG-101 OP-08: renombra, reordena y mueve con lo esperado, es idempotente y rechaza un valor desactualizado', async () => {
    await ejecutar(OP07, grupo(820, 'Casa'));
    await ejecutar(OP07, categoria(821, 'Renta', uuid(820)));
    await ejecutar(OP07, categoria(822, 'Mantenimiento', uuid(820)));
    await ejecutar(OP07, categoria(823, 'Seguro', uuid(820)));

    const renombrar = {
      tipo: 'categoria',
      id: uuid(821),
      nombre: 'Alquiler',
      esperado: { nombre: 'Renta' },
    };
    expect(await preparar(OP08, renombrar)).toMatchObject({ ok: true, valor: { rechazos: [] } });
    expect(await ejecutar(OP08, renombrar)).toMatchObject({ ok: true, yaAplicada: false });
    expect((await hechos()).categorias.find((x) => x.id === uuid(821))?.nombre).toBe('Alquiler');
    expect(await ejecutar(OP08, renombrar)).toMatchObject({ ok: true, yaAplicada: true });
    expect(
      await ejecutar(OP08, { ...renombrar, nombre: 'Casa propia', esperado: { nombre: 'Renta' } }),
    ).toMatchObject({
      ok: false,
      error: {
        categoria: 'CONFLICTO',
        codigo: 'conflicto_desactualizado',
        datos: { actuales: { nombre: 'Alquiler' } },
      },
    });

    // reordenar: Seguro pasa a la primera posición; solo cambian las filas afectadas
    const subir = { tipo: 'categoria', id: uuid(823), orden: 1, esperado: { orden: 3 } };
    expect(await ejecutar(OP08, subir)).toMatchObject({ ok: true, yaAplicada: false });
    let h = await hechos();
    const en = (g: Uuid) =>
      h.categorias
        .filter((x) => x.grupoId === g)
        .sort((a, b) => a.orden - b.orden)
        .map((x) => x.nombre);
    expect(en(uuid(820))).toEqual(['Seguro', 'Alquiler', 'Mantenimiento']);
    expect(await ejecutar(OP08, subir)).toMatchObject({ yaAplicada: true });

    // mover a otro grupo: va al final del nuevo grupo
    const mover = {
      tipo: 'categoria',
      id: uuid(822),
      grupoId: G1,
      esperado: { grupoId: uuid(820) },
    };
    expect(await ejecutar(OP08, mover)).toMatchObject({ ok: true, yaAplicada: false });
    h = await hechos();
    expect(en(G1).at(-1)).toBe('Mantenimiento');
    expect(en(uuid(820))).toEqual(['Seguro', 'Alquiler']);

    // un grupo se renombra; un nombre repetido y un grupo del sistema se rechazan con su mensaje
    expect(
      await ejecutar(OP08, {
        tipo: 'grupo',
        id: uuid(820),
        nombre: 'Hogar propio',
        esperado: { nombre: 'Casa' },
      }),
    ).toMatchObject({ ok: true });
    expect(
      await ejecutar(OP08, {
        tipo: 'grupo',
        id: uuid(820),
        nombre: 'gastos',
        esperado: { nombre: 'Hogar propio' },
      }),
    ).toMatchObject({
      ok: false,
      error: { codigo: 'nombre_repetido', campos: { nombre: texto } },
    });
    const sinEsperado = await ejecutar(OP08, {
      tipo: 'grupo',
      id: uuid(820),
      nombre: 'X',
      esperado: {},
    });
    expect(sinEsperado).toMatchObject({ ok: false, error: { categoria: 'VALIDACION' } });
  });

  it('PRU-INT-CATEG-101 [INV-20] OP-09: archiva una categoría con sobregiro sin violar inv. 20, conserva su meta y es natural', async () => {
    const antes = await hechos();
    const A = inicioA(antes);
    const disp = (h: Hechos, id: Uuid) =>
      calcular(h, FechaLocal.desdeTexto(HOY))
        .presupuesto.celdas.filter((x) => x.categoriaId === id && x.periodo.inicio === A)
        .reduce((s, x) => s + x.disponible, 0);
    expect(disp(antes, C2)).toBeLessThan(0);

    // sin decidir quién cubre el sobregiro, el dominio pide el dato
    expect(await ejecutar(OP09, { categoriaId: C2 })).toMatchObject({
      ok: false,
      error: {
        codigo: 'conflicto_desactualizado',
        campos: { cubrirSobregiroCon: texto },
      },
    });
    const entrada = { categoriaId: C2, cubrirSobregiroCon: { categoriaId: C1 } };
    const vista = await preparar(OP09, entrada);
    expect(vista).toMatchObject({ ok: true, valor: { rechazos: [] } });
    expect(await ejecutar(OP09, entrada)).toMatchObject({ ok: true, yaAplicada: false });

    const h = await hechos();
    expect(h.categorias.find((x) => x.id === C2)?.archivada).toBe(true);
    expect(disp(h, C2)).toBe(0);
    expect(h.metas.some((m) => m.categoriaId === C2)).toBe(true); // B-11
    expect(await ejecutar(OP09, entrada)).toMatchObject({ ok: true, yaAplicada: true });
    expect(await ejecutar(OP09, { categoriaId: uuid(899) })).toMatchObject({
      ok: false,
      error: { categoria: 'NO_ENCONTRADO' },
    });
  });

  it('PRU-INT-CATEG-101 OP-09: una programada activa exige su decisión; con ella se desactiva y la categoría se archiva con su Disponible en LPA', async () => {
    const sinDecision = await ejecutar(OP09, { categoriaId: C1, destinoDisponible: 'lpa' });
    expect(sinDecision).toMatchObject({
      ok: false,
      error: {
        codigo: 'programada_sin_decision',
        mensaje: 'Decidí qué hacer con 1 transacciones programadas de Comida.',
      },
    });
    const pago = (await hechos()).categorias.find((x) => x.clase === 'pago');
    expect(await ejecutar(OP09, { categoriaId: pago?.id })).toMatchObject({
      ok: false,
      error: { codigo: 'categoria_de_pago_con_tarjeta' },
    });

    const programada = (await hechos()).programada_lineas.find((l) => l.categoriaId === C1)
      ?.programadaId as Uuid;
    const entrada = {
      categoriaId: C1,
      destinoDisponible: 'lpa',
      devolverAsignacionesFuturas: true,
      programadas: [{ programadaId: programada, accion: 'desactivar' }],
    };
    expect(await ejecutar(OP09, entrada)).toMatchObject({ ok: true, yaAplicada: false });
    const h = await hechos();
    expect(h.categorias.find((x) => x.id === C1)?.archivada).toBe(true);
    expect(h.programadas.find((p) => p.id === programada)?.activa).toBe(false);
    const celdas = calcular(h, FechaLocal.desdeTexto(HOY)).presupuesto.celdas;
    const disp = celdas.filter((x) => x.categoriaId === C1 && x.periodo.inicio === inicioA(h));
    expect(disp.reduce((s, x) => s + x.disponible, 0)).toBe(0);
  });

  it('PRU-INT-CATEG-101 OP-10: desarchiva una categoría, pide desarchivar su grupo archivado y es natural', async () => {
    await ejecutar(OP07, grupo(830, 'Temporal'));
    await ejecutar(OP07, categoria(831, 'Evento', uuid(830)));
    expect(await ejecutar(OP09, { categoriaId: uuid(831) })).toMatchObject({ ok: true });
    expect(await ejecutar(OP13, { accion: 'archivar_grupo', id: uuid(830) })).toMatchObject({
      ok: true,
      yaAplicada: false,
    });

    expect(await ejecutar(OP10, { categoriaId: uuid(831) })).toMatchObject({
      ok: false,
      error: { codigo: 'grupo_archivado', mensaje: 'Temporal está archivado.' },
    });
    const entrada = { categoriaId: uuid(831), desarchivarGrupo: true };
    expect(await preparar(OP10, entrada)).toMatchObject({ ok: true, valor: { rechazos: [] } });
    expect(await ejecutar(OP10, entrada)).toMatchObject({ ok: true, yaAplicada: false });
    const h = await hechos();
    expect(h.categorias.find((x) => x.id === uuid(831))?.archivada).toBe(false);
    expect(h.grupos.find((x) => x.id === uuid(830))?.archivado).toBe(false);
    expect(await ejecutar(OP10, entrada)).toMatchObject({ ok: true, yaAplicada: true });

    const pago = h.categorias.find((x) => x.clase === 'pago');
    expect(await ejecutar(OP10, { categoriaId: pago?.id })).toMatchObject({
      ok: false,
      error: { codigo: 'categoria_de_pago_con_tarjeta' },
    });
  });

  it('PRU-INT-CATEG-101 [INV-20] OP-11: saca el Disponible de una archivada hacia otra categoría y hacia LPA, con lo esperado', async () => {
    await ejecutar(OP07, categoria(840, 'Vieja', G1));
    await ejecutar(OP07, categoria(841, 'Nueva', G1));
    await asignacion(842, uuid(840), 5000);
    // se archiva con su Disponible: la base solo lo permite después (la archivada no recibe δ > 0)
    await escribirCambios([
      { tipo: 'actualizar', tabla: 'categorias', id: uuid(840), campos: { archivada: true } },
    ]);

    const entrada = {
      categoriaId: uuid(840),
      monto: '30.00',
      destino: { categoriaId: uuid(841) },
      esperado: { asignacionOrigen: '50.00', asignacionDestino: '0' },
    };
    expect(await preparar(OP11, entrada)).toMatchObject({ ok: true, valor: { rechazos: [] } });
    expect(await ejecutar(OP11, entrada)).toMatchObject({ ok: true, yaAplicada: false });
    let h = await hechos();
    expect([asig(h, uuid(840)), asig(h, uuid(841))]).toEqual([2000, 3000]);
    expect(await ejecutar(OP11, entrada)).toMatchObject({ ok: true, yaAplicada: true });
    expect(
      await ejecutar(OP11, { ...entrada, monto: '10.00' }), // lo visto ya no coincide
    ).toMatchObject({
      ok: false,
      error: {
        codigo: 'conflicto_desactualizado',
        datos: { actuales: { asignacionOrigen: 2000, asignacionDestino: 3000 } },
      },
    });

    const aLpa = {
      categoriaId: uuid(840),
      monto: '20.00',
      destino: 'lpa',
      esperado: { asignacionOrigen: '20.00' },
    };
    expect(await ejecutar(OP11, aLpa)).toMatchObject({ ok: true, yaAplicada: false });
    h = await hechos();
    expect(asig(h, uuid(840))).toBe(0);

    // con el Disponible en 0 ya no hay qué sacar
    expect(
      await ejecutar(OP11, { ...aLpa, monto: '1.00', esperado: { asignacionOrigen: '0' } }),
    ).toMatchObject({
      ok: false,
      error: { codigo: 'monto_mayor_que_disponible', mensaje: 'Vieja tiene $0.00.' },
    });
    expect(
      await ejecutar(OP11, {
        categoriaId: uuid(841),
        monto: '1.00',
        destino: 'lpa',
        esperado: { asignacionOrigen: '30.00' },
      }),
    ).toMatchObject({ ok: false, error: { codigo: 'categoria_no_archivada' } });
  });

  it('PRU-INT-CATEG-101 [AV-13] OP-12: fusiona con finn.operacion = fusion, suma las asignaciones, mueve las reglas y solo confirma con la huella', async () => {
    await ejecutar(OP07, categoria(850, 'Café', G1));
    await ejecutar(OP07, categoria(851, 'Salidas', G1));
    await asignacion(852, uuid(850), 1200);
    await asignacion(853, uuid(851), 800);
    await escribirCambios([
      {
        tipo: 'insertar',
        tabla: 'reglas_comercio',
        fila: { id: uuid(854), patron: 'starbucks', categoriaId: uuid(850) },
      },
    ]);
    const A = inicioA(await hechos());
    const entrada = { origenId: uuid(850), destinoId: uuid(851) };

    const vista = await preparar(OP12, entrada);
    if (!vista.ok) throw new Error(JSON.stringify(vista.error));
    expect(vista.valor.avisos).toContainEqual(expect.objectContaining({ codigo: 'AV-13' }));

    // siempre se confirma: sin huella no se escribe (4.3)
    expect(await ejecutar(OP12, entrada)).toMatchObject({
      ok: false,
      error: { categoria: 'REQUIERE_CONFIRMACION' },
    });
    expect((await hechos()).categorias.some((x) => x.id === uuid(850))).toBe(true);

    const confirmada = {
      ...entrada,
      revisionVista: vista.valor.revisionVista,
      huellaImpacto: vista.valor.huellaImpacto,
    };
    expect(await ejecutar(OP12, confirmada)).toMatchObject({ ok: true, yaAplicada: false });
    const h = await hechos();
    expect(h.categorias.some((x) => x.id === uuid(850))).toBe(false);
    expect(
      h.asignaciones.find((a) => a.categoriaId === uuid(851) && a.periodoInicio === A)?.monto,
    ).toBe(2000);
    expect(h.asignaciones.some((a) => a.categoriaId === uuid(850))).toBe(false);
    const reglas = await leer((t) => leerReglasComercio(t), RELOJ);
    expect(reglas.find((r) => r.id === uuid(854))?.categoriaId).toBe(uuid(851));

    // eliminación (4.6.3): el origen ya no existe pero `eliminaciones` lo registra
    expect(await ejecutar(OP12, confirmada)).toMatchObject({ ok: true, yaAplicada: true });
    expect(await ejecutar(OP12, { origenId: uuid(899), destinoId: uuid(851) })).toMatchObject({
      ok: false,
      error: { categoria: 'NO_ENCONTRADO' },
    });
  });

  it('PRU-INT-CATEG-101 OP-12: con una revisionVista vieja y otro impacto vuelve a pedir confirmación; los rechazos del dominio llegan con su mensaje', async () => {
    await ejecutar(OP07, categoria(860, 'Origen', G1));
    await ejecutar(OP07, categoria(861, 'Destino', G1));
    const entrada = { origenId: uuid(860), destinoId: uuid(861) };
    const vista = await preparar(OP12, entrada);
    if (!vista.ok) throw new Error(JSON.stringify(vista.error));
    await asignacion(862, uuid(860), 700); // otra escritura: cambia el impacto y la revisión

    const vieja = await ejecutar(OP12, {
      ...entrada,
      revisionVista: vista.valor.revisionVista,
      huellaImpacto: vista.valor.huellaImpacto,
    });
    expect(vieja).toMatchObject({
      ok: false,
      error: {
        categoria: 'REQUIERE_CONFIRMACION',
        datos: { revisionVista: vista.valor.revisionVista },
      },
    });
    if (vieja.ok) throw new Error('debía pedir confirmación');
    expect(vieja.error.previsualizacion?.huellaImpacto).not.toBe(vista.valor.huellaImpacto);
    expect((await hechos()).categorias.some((x) => x.id === uuid(860))).toBe(true);

    const nueva = vieja.error.previsualizacion;
    expect(
      await ejecutar(OP12, {
        ...entrada,
        revisionVista: nueva?.['revisionVista'],
        huellaImpacto: nueva?.huellaImpacto,
      }),
    ).toMatchObject({ ok: true });

    const pago = (await hechos()).categorias.find((x) => x.clase === 'pago');
    expect(await preparar(OP12, { origenId: uuid(861), destinoId: uuid(861) })).toMatchObject({
      ok: true,
      valor: { rechazos: [{ codigo: 'fusion_misma_categoria' }] },
    });
    expect(await preparar(OP12, { origenId: pago?.id, destinoId: uuid(861) })).toMatchObject({
      ok: true,
      valor: { rechazos: [{ codigo: 'fusion_categoria_de_pago' }] },
    });
  });

  it('PRU-INT-CATEG-101 [INV-25] OP-13: elimina lo que no tiene historial, rechaza lo que sí y la repetición es ya aplicada', async () => {
    await ejecutar(OP07, grupo(870, 'Efímero'));
    await ejecutar(OP07, categoria(871, 'Pasajera', uuid(870)));
    await ejecutar(OP07, categoria(872, 'Con regla', uuid(870)));
    await escribirCambios([
      {
        tipo: 'insertar',
        tabla: 'reglas_comercio',
        fila: { id: uuid(873), patron: 'tienda', categoriaId: uuid(872) },
      },
    ]);

    expect(await ejecutar(OP13, { accion: 'eliminar_categoria', id: C1 })).toMatchObject({
      ok: false,
      error: {
        codigo: 'categoria_con_historial',
        mensaje: 'Comida tiene historial. Podés archivarla o fusionarla.',
      },
    });
    expect(await ejecutar(OP13, { accion: 'eliminar_categoria', id: uuid(872) })).toMatchObject({
      ok: false,
      error: { codigo: 'categoria_con_historial' },
    });
    expect(await ejecutar(OP13, { accion: 'eliminar_grupo', id: uuid(870) })).toMatchObject({
      ok: false,
      error: { codigo: 'grupo_no_vacio', mensaje: 'Efímero tiene categorías.' },
    });
    expect(await ejecutar(OP13, { accion: 'archivar_grupo', id: uuid(870) })).toMatchObject({
      ok: false,
      error: { codigo: 'grupo_con_categorias_activas' },
    });
    const sistema = (await hechos()).grupos.find((x) => x.claveSistema === 'pagos_tarjeta');
    expect(await ejecutar(OP13, { accion: 'eliminar_grupo', id: sistema?.id })).toMatchObject({
      ok: false,
      error: { codigo: 'grupo_del_sistema' },
    });

    const eliminar = { accion: 'eliminar_categoria', id: uuid(871) };
    expect(await preparar(OP13, eliminar)).toMatchObject({ ok: true, valor: { rechazos: [] } });
    expect(await ejecutar(OP13, eliminar)).toMatchObject({ ok: true, yaAplicada: false });
    expect((await hechos()).categorias.some((x) => x.id === uuid(871))).toBe(false);
    expect(await ejecutar(OP13, eliminar)).toMatchObject({ ok: true, yaAplicada: true });

    // archivar el grupo: con todas sus categorías archivadas; la repetición es natural
    expect(await ejecutar(OP09, { categoriaId: uuid(872) })).toMatchObject({ ok: true });
    await escribirCambios([{ tipo: 'eliminar', tabla: 'reglas_comercio', id: uuid(873) }]);
    const archivar = { accion: 'archivar_grupo', id: uuid(870) };
    expect(await ejecutar(OP13, archivar)).toMatchObject({ ok: true, yaAplicada: false });
    expect((await hechos()).grupos.find((x) => x.id === uuid(870))?.archivado).toBe(true);
    expect(await ejecutar(OP13, archivar)).toMatchObject({ ok: true, yaAplicada: true });

    // eliminar el grupo (ahora con una categoría archivada) no se puede; vacío sí
    expect(await ejecutar(OP13, { accion: 'eliminar_grupo', id: uuid(870) })).toMatchObject({
      ok: false,
      error: { codigo: 'grupo_no_vacio' },
    });
    await ejecutar(OP07, grupo(874, 'Vacío'));
    expect(await ejecutar(OP13, { accion: 'eliminar_grupo', id: uuid(874) })).toMatchObject({
      ok: true,
    });
    expect(await ejecutar(OP13, { accion: 'eliminar_grupo', id: uuid(874) })).toMatchObject({
      ok: true,
      yaAplicada: true,
    });
    expect(await ejecutar(OP13, { accion: 'eliminar_grupo', id: uuid(899) })).toMatchObject({
      ok: false,
      error: { categoria: 'NO_ENCONTRADO' },
    });
  });
});
