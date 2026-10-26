import { describe, expect, it } from 'vitest';
import type {
  Asignacion,
  Cambio,
  Categoria,
  Cuenta,
  Efecto,
  GeneradorIds,
  Hechos,
  Linea,
  Prestamo,
  ResultadoAplicar,
  TipoCuenta,
  Transaccion,
  Uuid,
} from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { aplicar, ejecutar } from './aplicar';
import { formaCanonicaDelImpacto } from './impacto';

const c = (n: number) => Centavos.desdeEntero(n * 100);
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;
/** Ciclo del día 1: enero y febrero cerrados, marzo activo. */
const HOY = f('2027-03-15');

const cuenta = (nombre: string, tipo: TipoCuenta, archivada = false) =>
  ({ id: id(nombre), tipo, nombre, fechaApertura: f('2027-01-01'), archivada }) as Cuenta;
const categoria = (nombre: string, tarjeta: string | null = null, archivada = false) =>
  ({
    id: id(nombre),
    grupoId: id('G'),
    clase: tarjeta === null ? 'normal' : 'pago',
    tarjetaId: tarjeta === null ? null : id(tarjeta),
    archivada,
  }) as Categoria;
const asignacion = (
  cat: string,
  periodo: string,
  monto: number,
  clave = `asig-${cat}-${periodo}`,
) =>
  ({
    id: id(clave),
    categoriaId: id(cat),
    periodoInicio: f(periodo),
    monto: c(monto),
  }) as Asignacion;

/** Una transacción con un efecto y, si es un gasto, una línea por el total. */
function movimiento(tx: string, fecha: string, cuentaId: string, monto: number, cat?: string) {
  const t = {
    id: id(tx),
    tipo: cat === undefined ? 'saldo_inicial' : 'gasto',
    fecha: f(fecha),
    claveOrden: `${fecha}T12:00:00.000Z`,
    secuencia: '1',
    estadoBancario: 'pendiente',
    total: c(Math.abs(monto)),
    lineaCobradaId: null,
    revision: '7',
  } as Transaccion;
  const e = {
    id: id(`ef-${tx}`),
    transaccionId: id(tx),
    cuentaId: id(cuentaId),
    monto: c(monto),
    revision: '7',
  } as Efecto;
  const l =
    cat === undefined
      ? []
      : [
          {
            id: id(`${tx}.1`),
            transaccionId: id(tx),
            orden: 1,
            monto: c(Math.abs(monto)),
            categoriaId: id(cat),
            deudorId: null,
            lineaOriginalId: null,
            revision: '7',
          } as Linea,
        ];
  return { t, e, l };
}

/**
 * E (efectivo) con 1.000 de saldo inicial; T (tarjeta) con su categoría de pago P; C1 y C2
 * normales; X, cuenta archivada, y Z, categoría archivada, sin movimientos. Febrero: Asig(C1) 300,
 * compra con T de 100 en C1 (tc) y compra con E de 30 en C2 (d2). Marzo: Asig(P) 50 y compra con E
 * de 150 en C1 (dm).
 */
function base(): Hechos {
  const movs = [
    movimiento('si', '2027-01-01', 'E', 1000),
    movimiento('tc', '2027-02-05', 'T', -100, 'C1'),
    movimiento('d2', '2027-02-08', 'E', -30, 'C2'),
    movimiento('dm', '2027-03-03', 'E', -150, 'C1'),
  ];
  return {
    vigencias_ciclo: [{ id: id('v'), diaInicio: 1, rigeDesde: null, revision: null }],
    cuentas: [cuenta('E', 'efectivo'), cuenta('T', 'tarjeta'), cuenta('X', 'efectivo', true)],
    tarjetas: [{ cuentaId: id('T'), tipo: 'tarjeta' }],
    prestamos: [],
    inversiones: [],
    grupos: [{ id: id('G'), nombre: 'G', orden: 1, archivado: false }],
    categorias: [categoria('C1'), categoria('C2'), categoria('P', 'T'), categoria('Z', null, true)],
    asignaciones: [asignacion('C1', '2027-02-01', 300), asignacion('P', '2027-03-01', 50)],
    deudores: [],
    transacciones: movs.map((m) => m.t),
    efectos: movs.map((m) => m.e),
    lineas: movs.flatMap((m) => m.l),
    condonaciones: [],
    metas: [],
    programadas: [],
    programada_lineas: [],
    ocurrencias_resueltas: [],
    conciliaciones: [],
  } as unknown as Hechos;
}

/** Operación de prueba interna: devuelve tal cual los cambios del comando. */
interface ComandoDePrueba {
  readonly operacion: string;
  readonly cambios: readonly Cambio[];
}
const prueba = (h: Hechos, cambios: readonly Cambio[], operacion = 'prueba') =>
  ejecutar<ComandoDePrueba>(h, { operacion, cambios }, HOY, (_, k) => ({ cambios: k.cambios }));

/** Cambia el total, el efecto y la única línea de una transacción de `base()`. */
const nuevoMonto = (tx: string, monto: number): Cambio[] => [
  { tipo: 'actualizar', tabla: 'transacciones', id: id(tx), campos: { total: c(monto) } },
  { tipo: 'actualizar', tabla: 'efectos', id: id(`ef-${tx}`), campos: { monto: c(-monto) } },
  { tipo: 'actualizar', tabla: 'lineas', id: id(`${tx}.1`), campos: { monto: c(monto) } },
];

/** Inserta un gasto de `monto` con una cuenta, con una línea por el total. */
const gasto = (tx: string, fecha: string, monto: number, cuentaId = 'E', cat = 'C1'): Cambio[] => {
  const m = movimiento(tx, fecha, cuentaId, -monto, cat);
  return [
    { tipo: 'insertar', tabla: 'transacciones', fila: m.t },
    { tipo: 'insertar', tabla: 'efectos', fila: m.e },
    ...m.l.map((fila): Cambio => ({ tipo: 'insertar', tabla: 'lineas', fila })),
  ];
};

const codigos = (r: ResultadoAplicar) => (r.ok ? [] : r.rechazos.map((x) => x.codigo));
const exito = (r: ResultadoAplicar) => {
  if (!r.ok) throw new Error(`rechazada: ${JSON.stringify(r.rechazos)}`);
  return r;
};

describe('aplicar: marco común de las operaciones (01 §5.0, 04 §2.4)', () => {
  it('PRU-DOM-MOTOR-110 [inv. 6] MOT-5.0 BE-09: una operación que rompe una invariante se rechaza completa con invariante_violada y los hechos quedan iguales', () => {
    const h = base();
    const copia = JSON.parse(JSON.stringify(h)) as Hechos;
    const cambios = gasto('g', '2027-03-10', 40);
    // La línea suma 25 y el total es 40: inv. 6.
    const roto = cambios.map((x) =>
      x.tipo === 'insertar' && x.tabla === 'lineas'
        ? { ...x, fila: { ...x.fila, monto: c(25) } }
        : x,
    );
    const r = prueba(h, roto);
    expect(r.ok).toBe(false);
    // El total sale de la cuenta y solo 25 de la categoría: también se rompe la identidad (inv. 1).
    expect(codigos(r)).toEqual(['invariante_violada', 'invariante_violada']);
    expect(r.ok ? [] : r.rechazos.map((x) => x.datos?.invariante)).toEqual([1, 6]);
    expect(h).toEqual(copia);
    // La misma operación sin el error se aplica.
    expect(prueba(h, cambios).ok).toBe(true);
  });

  it('PRU-DOM-MOTOR-110 [AV-01] MOT-5.0 BE-09: el impacto retroactivo en el período activo lista Δ LPA, Δ Disp, Δ S, Δ RE y Δ de la reducción proyectada', () => {
    // Febrero cerrado: la compra con tarjeta pasa de 100 a 400 y la de débito en C2 de 30 a 80.
    // Antes: Disp(C1, A) 50, Disp(P, A) 150, deuda 100 → S 0, RE 50; LPA 1.000 − 300 − 50 − 30 = 620.
    // Después: C1 en febrero −100, todo con tarjeta (SobT 100; traslado 300 a P): Arr(C1) 0 y
    // Disp(C1, A) −150, sobregiro de débito en A → reducción proyectada 150; Disp(P, A) 300 + 50;
    // deuda 400 → S 50, RE 0; SobD(C2, feb.) 80 → LPA 1.000 − 300 − 50 − 80 = 570.
    const r = exito(prueba(base(), [...nuevoMonto('tc', 400), ...nuevoMonto('d2', 80)]));
    expect(r.impacto).toEqual({
      deltaLpa: c(-50),
      deltaDisponible: [
        { categoriaId: 'C1', delta: c(-200) },
        { categoriaId: 'P', delta: c(200) },
      ],
      deltaTarjetas: [{ tarjetaId: 'T', deltaSaldo: c(50), deltaReserva: c(-50) }],
      deltaReduccionProyectadaLpaAlCierre: c(150),
      avisos: r.avisos,
    });
    const av01 = r.avisos.find((a) => a.codigo === 'AV-01');
    expect(av01).toEqual({
      codigo: 'AV-01',
      momento: 'antes_y_despues',
      requiereConfirmacion: true,
      datos: { deltaLpa: c(-50), deltaReduccionProyectadaLpaAlCierre: c(150) },
    });
    // AV-07 aparece por la operación (S pasa a 50) y se informa después; AV-08 desaparece.
    expect(r.avisos.map((a) => a.codigo)).toEqual(['AV-01', 'AV-02', 'AV-07']);
  });

  it('PRU-DOM-MOTOR-110 [AV-01] MOT-5.0: mover un hecho entre períodos es retroactivo; uno solo en el activo no lo es', () => {
    const mover: Cambio = {
      tipo: 'actualizar',
      tabla: 'transacciones',
      id: id('dm'),
      campos: { fecha: f('2027-03-01') },
    };
    expect(exito(prueba(base(), [mover])).avisos.map((a) => a.codigo)).toEqual([]);
    const aFebrero = { ...mover, campos: { fecha: f('2027-02-27') } };
    expect(exito(prueba(base(), [aFebrero])).avisos[0]?.codigo).toBe('AV-01');
    const borrar: Cambio = { tipo: 'eliminar', tabla: 'transacciones', id: id('tc') };
    expect(exito(prueba(base(), [borrar])).avisos[0]?.codigo).toBe('AV-01');
  });

  it('PRU-DOM-MOTOR-110 [inv. 18] MOT-5.0.4: lo asignado en un período cerrado solo cambia por OP-12 u OP-06', () => {
    const feb: Cambio = {
      tipo: 'actualizar',
      tabla: 'asignaciones',
      id: id('asig-C1-2027-02-01'),
      campos: { monto: c(200) },
    };
    const r = prueba(base(), [feb]);
    expect(r.ok ? [] : r.rechazos).toEqual([
      { codigo: 'periodo_cerrado', datos: { categoriaId: 'C1', periodoInicio: '2027-02-01' } },
    ]);
    expect(prueba(base(), [feb], 'OP-12').ok).toBe(true);
    const nueva: Cambio = {
      tipo: 'insertar',
      tabla: 'asignaciones',
      fila: asignacion('C2', '2027-01-01', 10, 'n'),
    };
    expect(codigos(prueba(base(), [nueva], 'OP-06'))).not.toContain('periodo_cerrado');
    expect(codigos(prueba(base(), [nueva]))).toEqual(['periodo_cerrado']);
  });

  it('PRU-DOM-MOTOR-110 [inv. 20] MOT-5.0.5: una cuenta archivada no recibe movimientos ni cambia de saldo; una categoría archivada no recibe asignaciones positivas ni consumos nuevos', () => {
    expect(codigos(prueba(base(), gasto('g', '2027-03-10', 5, 'X')))).toContain('cuenta_archivada');
    const aX: Cambio = {
      tipo: 'actualizar',
      tabla: 'efectos',
      id: id('ef-dm'),
      campos: { cuentaId: id('X') },
    };
    expect(codigos(prueba(base(), [aX]))).toContain('cuenta_archivada');
    expect(codigos(prueba(base(), gasto('g', '2027-03-10', 5, 'E', 'Z')))).toEqual([
      'categoria_archivada',
    ]);
    const aZ: Cambio = {
      tipo: 'actualizar',
      tabla: 'lineas',
      id: id('dm.1'),
      campos: { categoriaId: id('Z') },
    };
    expect(codigos(prueba(base(), [aZ]))).toEqual(['categoria_archivada']);
    const asigZ: Cambio = {
      tipo: 'insertar',
      tabla: 'asignaciones',
      fila: asignacion('Z', '2027-03-01', 5),
    };
    expect(codigos(prueba(base(), [asigZ]))).toEqual(['categoria_archivada']);
    // Sí admite que se saque su Disponible (δ ≤ 0).
    const sacar = { ...asigZ, fila: asignacion('Z', '2027-03-01', -5) };
    expect(codigos(prueba(base(), [sacar]))).not.toContain('categoria_archivada');
  });

  it('PRU-DOM-MOTOR-110 [inv. 12] MOT-5.0.6: la fecha de una transacción creada o editada va de la apertura de sus cuentas a hoy', () => {
    expect(codigos(prueba(base(), gasto('g', '2027-03-16', 5)))).toEqual(['fecha_posterior_a_hoy']);
    expect(codigos(prueba(base(), gasto('g', '2026-12-31', 5)))).toEqual([
      'fecha_anterior_a_apertura',
    ]);
    const editada: Cambio = {
      tipo: 'actualizar',
      tabla: 'transacciones',
      id: id('dm'),
      campos: { fecha: f('2027-04-01') },
    };
    expect(codigos(prueba(base(), [editada]))).toEqual(['fecha_posterior_a_hoy']);
  });

  it('PRU-DOM-MOTOR-110 MOT-5.0 BE-09: hechosNuevos replica las cascadas de 03 (DB-12) y deja pendientes la revisión y la secuencia', () => {
    const r = exito(
      prueba(base(), [
        { tipo: 'eliminar', tabla: 'transacciones', id: id('dm') },
        ...gasto('g', '2027-03-10', 150),
        { tipo: 'actualizar', tabla: 'categorias', id: id('C2'), campos: { nombre: 'Otra' } },
        { tipo: 'eliminarConciliacionesDeCuenta', cuentaId: id('E') },
      ]),
    );
    const h = r.hechosNuevos;
    expect(h.transacciones.map((t) => t.id)).not.toContain('dm');
    expect(h.efectos.map((e) => e.id)).not.toContain('ef-dm');
    expect(h.lineas.map((l) => l.id)).not.toContain('dm.1');
    expect(h.transacciones.find((t) => t.id === 'g')).toMatchObject({
      secuencia: null,
      revision: null,
    });
    expect(h.categorias.find((x) => x.id === 'C2')).toMatchObject({
      nombre: 'Otra',
      revision: null,
    });
    expect(r.impacto.deltaLpa).toBe(0);
    expect(Object.isFrozen(h)).toBe(true);
  });

  it('PRU-DOM-MOTOR-110 MOT-5.0 BE-09: aplicar despacha OP-48 y devuelve su rechazo sin excepción', () => {
    const h = base();
    const prestamo = { cuentaId: id('L'), tipo: 'prestamo', cuotaPactada: c(10) } as Prestamo;
    const conL = {
      ...h,
      cuentas: [...h.cuentas, cuenta('L', 'prestamo')],
      prestamos: [prestamo],
    } as Hechos;
    const comando = {
      operacion: 'OP-48' as const,
      prestamoId: id('L'),
      campos: { cuotaPactada: c(12) },
      esperado: {},
    };
    const r = exito(aplicar(conL, comando, HOY));
    expect(r.cambios).toEqual([
      { tipo: 'actualizar', tabla: 'prestamos', id: 'L', campos: { cuotaPactada: c(12) } },
    ]);
    expect(r.hechosNuevos.prestamos[0]?.cuotaPactada).toBe(c(12));
    expect(codigos(aplicar(h, comando, HOY))).toEqual(['cuenta_tipo_no_valido']);
    expect(() => aplicar(h, { ...comando, operacion: 'OP-99' as 'OP-48' }, HOY)).toThrow(TypeError);
  });
});

describe('huella del impacto (04 §4.3)', () => {
  /** Contador determinista con un prefijo: dos generadores dan ids distintos y en otro orden. */
  const contador = (prefijo: string): GeneradorIds => {
    let n = 0;
    return { siguiente: () => id(`${prefijo}-0000-4000-8000-${String(++n).padStart(12, '0')}`) };
  };
  /** Crea una categoría con 100 asignados en A, más 20 en `otra` (existente). */
  const crear = (ids: GeneradorIds, otra = 'C1') => {
    const nueva = ids.siguiente();
    const cambios: Cambio[] = [
      { tipo: 'insertar', tabla: 'categorias', fila: { ...categoria('N'), id: nueva } },
      {
        tipo: 'insertar',
        tabla: 'asignaciones',
        fila: asignacion(nueva, '2027-03-01', 100, ids.siguiente()),
      },
      {
        tipo: 'insertar',
        tabla: 'asignaciones',
        fila: asignacion(otra, '2027-03-01', 20, ids.siguiente()),
      },
    ];
    return exito(prueba(base(), cambios));
  };

  it('PRU-DOM-VAL-003 [V-20] BE-13: la forma canónica no depende de los ids de las filas nuevas y sí de las filas existentes', () => {
    const a = crear(contador('00000000'));
    const b = crear(contador('ffffffff'));
    expect(JSON.stringify(a.impacto)).not.toBe(JSON.stringify(b.impacto));
    expect(formaCanonicaDelImpacto(a)).toBe(formaCanonicaDelImpacto(b));
    expect(formaCanonicaDelImpacto(a)).toContain('"@nueva#0"');
    expect(formaCanonicaDelImpacto(a)).not.toContain('00000000-');
    // Otra categoría existente afectada: el impacto cambió.
    expect(formaCanonicaDelImpacto(crear(contador('00000000'), 'C2'))).not.toBe(
      formaCanonicaDelImpacto(a),
    );
  });
});
