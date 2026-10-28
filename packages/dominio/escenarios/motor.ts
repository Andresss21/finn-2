// Ejecutor `motor` de los escenarios (07 §12.3; portado del prototipo de V7-08): traduce cada operación del dato a un
// comando de dominio, la aplica con `aplicar` a los hechos en memoria y observa con `calcular`.
// Convenciones de completado (DP-16): hoy del paso, fecha de la transacción = hoy, hora de registro hoy 12:00 más un
// minuto por operación, apertura 21/01/2027, tarjetas con límite $5,000 y corte 15, grupo "Gastos", saldo inicial 0.
import { aplicar, avisosDeEstado, calcular } from '../src/index';
import type {
  Cambio,
  ComandoDominio,
  Hechos,
  Instantanea,
  Instante,
  Movimiento,
  MovimientoLinea,
  Uuid,
} from '../src/index';
import { diferenciaActual } from '../src/selectores/detalle-cuenta';
import { desgloseAlPagar } from '../src/calculo/patrimonio';
import { ciclo, duracion, periodoDe } from '../src/calculo/periodos';
import { op43Automatico } from '../src/operaciones/op-43';
import { Centavos, FechaLocal } from '../src/valores/index';
import type { Ejecutor } from './ejecutar';
import {
  type Escenario,
  type Observado,
  type Op,
  PERIODOS,
  type Paso,
  type Periodo,
  usd,
} from './tipos';

export interface Estado {
  hechos: Hechos;
  hoy: FechaLocal;
  contador: number; // ids de filas nuevas, deterministas
  reloj: number; // operaciones aplicadas: da el minuto de registro (orden D2)
  bandeja: Bandeja[]; // los movimientos [H] que dejó OP-35: `Hechos` no los lleva (BE-10)
}
interface Bandeja {
  movimiento: Movimiento;
  lineas: MovimientoLinea[];
  recibidoEn: Instante;
}

const id = (t: string) => t as Uuid;
const c = (dolares: number) => Centavos.desdeEntero(usd(dolares));
const pad = (n: number) => String(n).padStart(2, '0');
const GASTOS = id('grupo-gastos');
const BANCO = id('institucion-banco');

/** 'AAAA-MM-DDThh:mm' local (UTC−6, sin horario de verano) a instante UTC. */
function instante(local: string): Instante {
  const [dia = '', hm = ''] = local.split('T');
  const [h = 0, m = 0] = hm.split(':').map(Number);
  const fecha = h + 6 >= 24 ? FechaLocal.sumarDias(FechaLocal.desdeTexto(dia), 1) : dia;
  return `${fecha}T${pad((h + 6) % 24)}:${pad(m)}:00.000Z` as Instante;
}

type Grupo = Hechos['grupos'][number];
const grupo = (orden: number, nombre: string, claveSistema: string | null): Grupo => ({
  id: claveSistema ? id('grupo-pagos') : GASTOS,
  nombre,
  orden,
  archivado: false,
  claveSistema,
  revision: null,
});
export function sembrar(hoy: string): Estado {
  const vigencia = { id: id('vigencia-1'), diaInicio: 21, rigeDesde: null, revision: null };
  const hechos: Hechos = {
    vigencias_ciclo: [vigencia],
    grupos: [grupo(1, 'Pagos de tarjeta', 'pagos_tarjeta'), grupo(2, 'Gastos', null)],
    cuentas: [],
    tarjetas: [],
    prestamos: [],
    inversiones: [],
    categorias: [],
    asignaciones: [],
    deudores: [],
    transacciones: [],
    efectos: [],
    lineas: [],
    condonaciones: [],
    metas: [],
    programadas: [],
    programada_lineas: [],
    ocurrencias_resueltas: [],
    conciliaciones: [],
  };
  return { hechos, hoy: FechaLocal.desdeTexto(hoy), contador: 0, reloj: 0, bandeja: [] };
}

const cuentaId = (s: Estado, nombre: string) => {
  const k = s.hechos.cuentas.find((x) => x.nombre === nombre);
  if (!k) throw new Error(`el dato nombra una cuenta que no existe: ${nombre}`);
  return k.id;
};

/** Nombre con que 01 §8 llama a una categoría: la de pago de la tarjeta T es "Pago T". */
function nombresDeCategorias(h: Hechos): Map<Uuid, string> {
  const cuentas = new Map(h.cuentas.map((k) => [k.id, k.nombre]));
  return new Map(
    h.categorias.map((x) => [x.id, x.tarjetaId ? `Pago ${cuentas.get(x.tarjetaId)}` : x.nombre]),
  );
}
const categoriaId = (s: Estado, nombre: string) => {
  for (const [k, v] of nombresDeCategorias(s.hechos)) if (v === nombre) return k;
  throw new Error(`el dato nombra una categoría que no existe: ${nombre}`);
};

/** Destino del dinero que se saca o se archiva: 'LPA' o una categoría. */
const destino = (s: Estado, nombre: string) =>
  nombre === 'LPA' ? ('lpa' as const) : { categoriaId: categoriaId(s, nombre) };

/** Comando de dominio de una operación del dato; avanza el reloj y el contador del estado. */
function comando(s: Estado, op: Op): ComandoDominio {
  const ids = { siguiente: () => id(`n${++s.contador}`) };
  const minutos = 12 * 60 + ++s.reloj;
  const hora = (registrado?: string) =>
    instante(registrado ?? `${s.hoy}T${pad(Math.floor(minutos / 60))}:${pad(minutos % 60)}`);
  const fecha = (f?: string) => FechaLocal.desdeTexto(f ?? s.hoy);
  switch (op.op) {
    case 'OP-01': {
      const { tipo = 'efectivo', prestamo: p } = op;
      if (tipo === 'prestamo' && !p)
        throw new Error(`OP-01: ${op.cuenta} no trae datos de préstamo`);
      const comunes = { tasaNominalAnualMillonesimas: null, seguroPrimerMes: null, comision: null };
      const subtipo =
        tipo === 'inversion'
          ? { tipo, rendimientoAnualEsperadoMillonesimas: null }
          : tipo === 'tarjeta'
            ? {
                tipo,
                limiteCredito: c(op.limite ?? 5000),
                tasaAnualMillonesimas: null,
                diaCorte: op.diaCorte ?? 15,
              }
            : p && {
                ...comunes,
                tipo,
                contraparte: p.contraparte,
                montoOriginal: c(p.montoOriginal),
                tipoTasa: 'fija',
                frecuencia: 'mensual',
                frecuenciaDias: null,
                modeloCalculo: null,
                cuotaPactada: c(p.cuota),
                plazoCuotas: p.plazoCuotas,
                cuotasPagadasAlCrear: p.cuotasPagadas,
              };
      const [institucionId, ultimos4] = op.ultimos4 ? [BANCO, op.ultimos4] : [null, null];
      const cuenta = { tipo, nombre: op.cuenta, institucionId, ultimos4 };
      return {
        operacion: 'OP-01',
        id: id(`cuenta-${op.cuenta}`),
        instante: hora(),
        ids,
        saldo: c(op.saldo ?? 0),
        cuenta: { ...cuenta, fechaApertura: fecha(op.apertura ?? '2027-01-21') },
        ...(subtipo && {
          subtipo: { diaPago: op.diaPago ?? 5, red: null, color: null, ...subtipo },
        }),
      } as ComandoDominio;
    }
    case 'OP-07':
      return {
        operacion: 'OP-07',
        id: id(`categoria-${op.categoria}`),
        tipo: 'categoria',
        nombre: op.categoria,
        grupoId: GASTOS,
      };
    case 'OP-14': {
      const inicio = calcular(s.hechos, s.hoy).presupuesto.activo.inicio;
      const periodoInicio = FechaLocal.desdeTexto(
        op.desde ?? (op.periodo ? PERIODOS[op.periodo] : inicio),
      );
      const cat = categoriaId(s, op.categoria);
      const propia = (a: Hechos['asignaciones'][number]) =>
        a.categoriaId === cat && a.periodoInicio === periodoInicio;
      const actual = s.hechos.asignaciones.find(propia)?.monto ?? Centavos.cero;
      const montoNuevo = Centavos.sumar(actual, c(op.monto));
      return { operacion: 'OP-14', categoriaId: cat, periodoInicio, montoNuevo, ids };
    }
    case 'OP-17':
      return {
        operacion: 'OP-17',
        periodoInicio: FechaLocal.desdeTexto(
          op.periodo ? PERIODOS[op.periodo] : calcular(s.hechos, s.hoy).presupuesto.activo.inicio,
        ),
        ids,
      };
    case 'OP-15':
      return {
        operacion: 'OP-15',
        origenId: categoriaId(s, op.origen),
        destinoId: categoriaId(s, op.destino),
        periodoInicio: FechaLocal.desdeTexto(
          op.periodo ? PERIODOS[op.periodo] : calcular(s.hechos, s.hoy).presupuesto.activo.inicio,
        ),
        monto: c(op.monto),
        ids,
      };
    case 'OP-18': {
      const fechaObjetivo = op.fecha ? { fechaObjetivo: FechaLocal.desdeTexto(op.fecha) } : {};
      if (op.editar)
        return {
          operacion: 'OP-18',
          accion: 'editar',
          metaId: id(`meta-${op.categoria}`),
          ...(op.monto !== undefined && { monto: c(op.monto) }),
          ...fechaObjetivo,
        };
      const porPeriodo = (op.tipo ?? 'mensual') === 'mensual' || op.tipo === 'semanal';
      return {
        operacion: 'OP-18',
        accion: 'crear',
        id: id(`meta-${op.categoria}`),
        categoriaId: categoriaId(s, op.categoria),
        tipo: op.tipo ?? 'mensual',
        ...(porPeriodo && { modo: op.modo ?? ('acumular' as const) }),
        monto: c(op.monto ?? 0),
        ...fechaObjetivo,
      };
    }
    case 'OP-20': {
      const unica: { categoria?: string; deudor?: string; monto: number } = {
        monto: op.monto,
        ...(op.categoria && { categoria: op.categoria }),
      };
      const lineas = op.lineas ?? [unica];
      return {
        operacion: 'OP-20',
        id: id(op.etiqueta ? `t-${op.etiqueta}` : `t${++s.contador}`),
        instante: hora(op.registrado),
        ids,
        fecha: fecha(op.fecha),
        total: c(op.monto),
        cuentaId: cuentaId(s, op.cuenta),
        lineas: lineas.map((l) => ({
          monto: c(l.monto),
          destino: l.deudor
            ? { deudorNuevo: l.deudor }
            : { categoriaId: categoriaId(s, l.categoria as string) },
        })),
      };
    }
    case 'OP-28':
      return {
        operacion: 'OP-28',
        transaccionId: id(`t-${op.etiqueta}`),
        instante: hora(),
        ids,
        ...(op.cuenta && { cuentaId: cuentaId(s, op.cuenta) }),
        ...(op.fecha && { fecha: fecha(op.fecha) }),
        ...(op.monto !== undefined && { total: c(op.monto) }),
      };
    case 'OP-30': {
      // 'saldo-inicial:Cuenta': la transacción del saldo inicial de esa cuenta (OP-01 no le da etiqueta).
      const [clave, nombre = ''] = op.etiqueta.split(':');
      const cuenta = clave === 'saldo-inicial' ? cuentaId(s, nombre) : null;
      const inicial = s.hechos.efectos.find(
        (e) =>
          e.cuentaId === cuenta &&
          s.hechos.transacciones.some(
            (t) => t.id === e.transaccionId && t.tipo === 'saldo_inicial',
          ),
      );
      const transaccionId = cuenta ? inicial?.transaccionId : id(`t-${op.etiqueta}`);
      if (!transaccionId) throw new Error(`OP-30: ${op.etiqueta} no existe`);
      return { operacion: 'OP-30', transaccionId, estadoNuevo: op.estado };
    }
    case 'OP-29':
      return {
        operacion: 'OP-29',
        transaccionId: id(`t-${op.etiqueta}`),
        instante: hora(),
        ids,
        movimientos: [],
      };
    case 'OP-31': {
      const linea = s.hechos.lineas.find(
        (l) => l.transaccionId === id(`t-${op.cobro}`) && l.deudorId,
      );
      if (!linea?.deudorId) throw new Error(`OP-31: ${op.cobro} no tiene línea por cobrar`);
      return {
        operacion: 'OP-31',
        id: id(`t${++s.contador}`),
        instante: hora(),
        ids,
        fecha: fecha(op.fecha),
        total: c(op.monto),
        lineaId: linea.id,
        cuentaId: cuentaId(s, op.cuenta ?? 'Ahorro'),
      };
    }
    case 'OP-32': {
      const linea = s.hechos.lineas.find(
        (l) => l.transaccionId === id(`t-${op.cobro}`) && l.deudorId,
      );
      if (!linea) throw new Error(`OP-32: ${op.cobro} no tiene línea por cobrar`);
      return {
        operacion: 'OP-32',
        id: id(`t${++s.contador}`),
        instante: hora(),
        lineaId: linea.id,
        monto: c(op.monto),
        fecha: fecha(op.fecha),
        categoriaId: categoriaId(s, op.categoria),
      };
    }
    case 'OP-33': {
      const alta = {
        operacion: 'OP-33' as const,
        id: id(`t${++s.contador}`),
        instante: hora(),
        ids,
        fecha: fecha(op.fecha),
        total: c(op.monto),
      };
      if (op.compra === undefined)
        return {
          ...alta,
          cuentaId: cuentaId(s, op.cuenta as string),
          categoriaId: categoriaId(s, op.categoria as string),
        };
      const originales = s.hechos.lineas
        .filter((l) => l.transaccionId === id(`t-${op.compra}`))
        .sort((a, b) => a.orden - b.orden);
      const reparto = (op.reparto ?? [{ linea: 1, monto: op.monto }]).map((r) => {
        const l = originales[r.linea - 1];
        if (!l) throw new Error(`OP-33: ${op.compra} no tiene la línea ${r.linea}`);
        return { lineaId: l.id, monto: c(r.monto) };
      });
      return {
        ...alta,
        transaccionOriginalId: id(`t-${op.compra}`),
        ...(op.cuenta && { cuentaId: cuentaId(s, op.cuenta) }),
        reparto,
      };
    }
    case 'OP-27': {
      const comun = {
        operacion: 'OP-27' as const,
        id: id(`t${++s.contador}`),
        instante: hora(),
        ids,
        fecha: fecha(),
        total: c(op.monto),
        tarjetaId: cuentaId(s, op.tarjeta),
      };
      if (op.modalidad === 'avance')
        return { ...comun, modalidad: 'avance', cuentaId: cuentaId(s, op.cuenta ?? 'Ahorro') };
      if (op.modalidad === 'entrada') return { ...comun, modalidad: 'entrada' };
      return {
        ...comun,
        modalidad: 'transferencia_deuda',
        tarjetaDestinoId: cuentaId(s, op.destino as string),
      };
    }
    case 'OP-23':
      return {
        operacion: 'OP-23',
        id: id(op.etiqueta ? `t-${op.etiqueta}` : `t${++s.contador}`),
        instante: hora(),
        ids,
        fecha: fecha(op.fecha),
        total: c(op.monto),
        origenId: cuentaId(s, op.origen ?? 'Ahorro'),
        tarjetaId: cuentaId(s, op.tarjeta),
      };
    case 'OP-06':
      return { operacion: 'OP-06', cuentaId: cuentaId(s, op.cuenta) };
    case 'OP-09':
      return {
        operacion: 'OP-09',
        categoriaId: categoriaId(s, op.categoria),
        ids,
        ...(op.destino && { destinoDisponible: destino(s, op.destino) }),
        ...(op.devolverFuturas && { devolverAsignacionesFuturas: true }),
        programadas: (op.desactivar ?? []).map((e) => ({
          programadaId: id(`programada-${e}`),
          accion: 'desactivar' as const,
        })),
      };
    case 'OP-11':
      return {
        operacion: 'OP-11',
        categoriaId: categoriaId(s, op.categoria),
        ids,
        monto: c(op.monto),
        destino: destino(s, op.destino),
      };
    case 'OP-12':
      return {
        operacion: 'OP-12',
        origenId: categoriaId(s, op.origen),
        destinoId: categoriaId(s, op.destino),
        ids,
        reglas: [],
        movimientoLineas: [],
      };
    case 'OP-24':
      return {
        operacion: 'OP-24',
        modalidad: 'cuota',
        id: id(`t${++s.contador}`),
        instante: hora(),
        ids,
        fecha: fecha(),
        total: c(op.capital + op.interes + op.seguro),
        origenId: cuentaId(s, op.origen ?? 'Ahorro'),
        prestamoId: cuentaId(s, op.prestamo),
        categoriaId: categoriaId(s, op.categoria),
        capital: c(op.capital),
        interes: c(op.interes),
        seguro: c(op.seguro),
      };
    case 'OP-42':
      return {
        operacion: 'OP-42',
        accion: 'crear',
        id: id(`programada-${op.etiqueta}`),
        ids,
        tipo: 'gasto',
        cuentaId: cuentaId(s, op.cuenta),
        cuentaDestinoId: null,
        comercio: op.comercio,
        monto: c(op.monto),
        tolerancia: Centavos.cero,
        frecuencia: 'mensual',
        frecuenciaDias: null,
        primeraFecha: fecha(op.primeraFecha),
        fechaFin: null,
        registroAutomatico: op.automatico === true,
        lineas: [{ monto: c(op.monto), categoriaId: categoriaId(s, op.categoria) }],
      };
    case 'OP-35': {
      const recibidoEn = instante(op.recibido);
      const ultimos4 = s.hechos.cuentas.find((k) => k.id === cuentaId(s, op.cuenta))?.ultimos4;
      return {
        operacion: 'OP-35',
        id: id(`m-${op.etiqueta}`),
        ids,
        sms: {
          id: id(`sms-${op.etiqueta}`),
          texto: `Compra ${op.comercio} ${op.monto}`,
          recibidoEn,
          fechaRecepcion: fecha(op.recibido.slice(0, 10)),
        },
        interpretacion: {
          ...{ resultado: 'reconocido', institucionId: BANCO, tipoMovimiento: 'compra' },
          ...{ ultimos4: ultimos4 as string, monto: c(op.monto), comercio: op.comercio },
          fecha: fecha(op.fecha),
        },
        anteriores: [],
        movimientos: [],
        reglas: [],
      };
    }
    case 'OP-37': {
      const b = s.bandeja.find((x) => x.movimiento.id === id(`m-${op.etiqueta}`));
      if (!b) throw new Error(`OP-37: no hay un movimiento ${op.etiqueta}`);
      return {
        operacion: 'OP-37',
        movimiento: b.movimiento,
        lineas: b.lineas,
        id: id(`t-${op.etiqueta}`),
        instante: instante(op.aprobado),
        recibidoEn: b.recibidoEn,
        ids,
        categoriaId: categoriaId(s, op.categoria),
      };
    }
    case 'OP-47': {
      const movimientos = op.movimientos.map((m) => ({
        ...{ indice: m.indice, fecha: fecha(m.fecha), monto: c(m.monto) },
      }));
      return {
        operacion: 'OP-47',
        id: id(`conciliacion-${++s.contador}`),
        instante: hora(),
        cuentaId: cuentaId(s, op.cuenta),
        estado: { fechaEstado: fecha(op.fecha), saldoFinal: c(op.saldo), movimientos },
        coincidencias: op.coincidencias.map((x) => ({
          transaccionId: id(`t-${x.etiqueta}`),
          movimientoIndice: x.indice,
        })),
      };
    }
    case 'OP-19':
      return { operacion: 'OP-19', diaInicio: op.diaInicio, ids };
    case 'OP-25': {
      const alta = {
        operacion: 'OP-25' as const,
        id: id(`t${++s.contador}`),
        instante: hora(),
        ids,
        fecha: fecha(),
        total: c(op.monto),
        inversionId: cuentaId(s, op.inversion),
        cuentaId: cuentaId(s, op.cuenta ?? 'Ahorro'),
      };
      if (op.modalidad === 'retiro') return { ...alta, modalidad: 'retiro' };
      return { ...alta, modalidad: 'aporte', categoriaId: categoriaId(s, op.categoria as string) };
    }
    case 'OP-26':
      return {
        operacion: 'OP-26',
        id: id(`t${++s.contador}`),
        instante: hora(),
        ids,
        fecha: fecha(),
        total: c(op.monto),
        prestamoId: cuentaId(s, op.prestamo),
        cuentaId: cuentaId(s, op.cuenta ?? 'Ahorro'),
      };
    case 'OP-43': {
      if (op.modo === 'automatico')
        throw new Error('OP-43 automático no es un comando: lo corre el paso');
      return {
        operacion: 'OP-43',
        programadaId: id(`programada-${op.programada}`),
        fechaEsperada: fecha(op.fecha),
        id: id(`t${++s.contador}`),
        instante: hora(),
        ids,
      };
    }
    case 'OP-21':
      return {
        operacion: 'OP-21',
        id: id(op.etiqueta ? `t-${op.etiqueta}` : `t${++s.contador}`),
        instante: hora(op.registrado),
        ids,
        fecha: fecha(op.fecha),
        total: c(op.monto),
        cuentaId: cuentaId(s, op.cuenta ?? 'Ahorro'),
      };
  }
}

/** El registro automático de las programadas (04 §10.2 paso 1), con la hora de registro de la convención de DP-16. */
function registroAutomatico(s: Estado) {
  const minutos = 12 * 60 + ++s.reloj;
  const ids = { siguiente: () => id(`n${++s.contador}`) };
  const hora = instante(`${s.hoy}T${pad(Math.floor(minutos / 60))}:${pad(minutos % 60)}`);
  return op43Automatico(s.hechos, s.hoy, ids, hora);
}

/** Consultas que se observan antes de aplicar las operaciones del paso (el desglose que ve quien va a pagar). */
const ANTES = new Set(['desgloseAntes']);
function desglose(i: Instantanea, arg: string): number {
  const [tarjeta = '', campo = ''] = arg.split(':');
  const cuenta = i.hechos.cuentas.find((k) => k.nombre === tarjeta);
  const t = i.hechos.tarjetas.find((x) => x.cuentaId === cuenta?.id);
  if (!t) throw new Error(`desglose:${arg}: la tarjeta no existe`);
  const d = desgloseAlPagar(i.hechos, t, i.hoy) as unknown as Record<string, number>;
  return d[campo] as number;
}

function evaluacionDeMeta(i: Instantanea, nombre: string) {
  const cat = i.hechos.categorias.find((x) => x.nombre === nombre);
  const m = i.metas.find((x) => x.categoriaId === cat?.id)?.evaluacion;
  if (!m) throw new Error(`la categoría ${nombre} no tiene meta evaluada`);
  return m;
}

const cuentaDe = (i: Instantanea, nombre: string) =>
  i.hechos.cuentas.find((k) => k.nombre === nombre);
const ultimaConciliacion = (i: Instantanea, nombre: string) =>
  i.hechos.conciliaciones.filter((x) => x.cuentaId === cuentaDe(i, nombre)?.id).at(-1);

/** Columnas fuera de la instantánea (regla 9) que `motor` evalúa; el argumento va después de ':'. */
const EXTRAS: Record<string, (i: Instantanea, arg: string) => number> = {
  patrimonio: (i) => i.patrimonio.total,
  reduccionProyectada: (i) => i.reduccionProyectada,
  // Σ de las reducciones por sobregiro con débito de los períodos cerrados (detalle de LPA).
  reduccionesDebito: (i) => i.lpa.sobregirosDebito,
  // Desglose del pago (§4.14) de la tarjeta `T` al día de hoy: 'T:campo'. `desgloseAntes` se evalúa antes de las operaciones.
  desglose: desglose,
  desgloseAntes: desglose,
  // Dinero en camino del por cobrar con débito (D1) y partidas de reportes por clase (§4.13); `excedente` = ingreso de cobros.
  enCamino: (i) => i.lpa.dineroEnCamino,
  reporte: (i, clase) => {
    const cobro = new Set(
      i.hechos.transacciones.filter((t) => t.tipo === 'cobro').map((t) => t.id),
    );
    return i.clasificacion.partidas
      .filter((x) =>
        clase === 'excedente' ? x.clase === 'ingreso' && cobro.has(x.id) : x.clase === clase,
      )
      .reduce((a, x) => a + x.monto, 0);
  },
  // Préstamos (H6): capital pendiente de `P` y costo financiero (interés + seguro) de todas las cuotas.
  capitalPrestamo: (i, p) => i.cuentas.find((x) => x.cuentaId === cuentaDe(i, p)?.id)?.saldo ?? 0,
  costoFinanciero: (i) =>
    i.clasificacion.costosFinancieros.reduce((a, x) => a + x.interes + x.seguro, 0),
  // Conciliación de la tarjeta/cuenta `T` (DM-8): la diferencia que se aceptó al terminar y la de hoy.
  difAceptada: (i, t) => ultimaConciliacion(i, t)?.diferenciaAceptada ?? 0,
  difActual: (i, t) => {
    const k = ultimaConciliacion(i, t);
    return k ? diferenciaActual(i, k) : 0;
  },
  // Saldo a favor de la tarjeta (Q4): lo pagado de más, el saldo positivo de la cuenta.
  aFavor: (i, t) => {
    const k = i.hechos.cuentas.find((x) => x.nombre === t);
    return Math.max(0, i.cuentas.find((x) => x.cuentaId === k?.id)?.saldo ?? 0);
  },
  // Metas (§4.12): pedido, falta y monto del período de la meta de la categoría `Cat` en el período activo.
  metaPedido: (i, cat) => evaluacionDeMeta(i, cat).pedido,
  metaFalta: (i, cat) => evaluacionDeMeta(i, cat).falta,
  metaPeriodo: (i, cat) => evaluacionDeMeta(i, cat).montoDelPeriodo ?? 0,
  lpaCierre: (i, p) => {
    const x = i.historialLpa.find((y) => y.periodo.inicio === PERIODOS[p as Periodo]);
    if (!x) throw new Error(`lpaCierre:${p}: el período no está cerrado`);
    return x.lpa;
  },
  arrastre: (i, p) =>
    i.presupuesto.celdas
      .filter((x) => x.periodo.inicio === PERIODOS[p as Periodo])
      .reduce((a, x) => a + x.arrastre, 0),
  // Valor de la inversión `Nombre` (su saldo) y días del período que contiene `AAAA-MM-DD` (×100: las columnas van en dólares).
  valorInversion: (i, n) => i.cuentas.find((x) => x.cuentaId === cuentaDe(i, n)?.id)?.saldo ?? 0,
  diasPeriodo: (i, f) =>
    duracion(periodoDe(ciclo(i.hechos.vigencias_ciclo), FechaLocal.desdeTexto(f))) * 100,
  // Reportes de la transacción que dejó la fila (la última de los hechos): `reporteFila:otras_entradas` (01 §8, ESC-40).
  reporteFila: (i, clase) => {
    const ultima = i.hechos.transacciones.at(-1);
    return i.clasificacion.partidas
      .filter((x) => x.id === ultima?.id && x.clase === clase)
      .reduce((a, x) => a + x.monto, 0);
  },
  efAl: (i, fecha) => {
    const efectivo = new Set(
      i.hechos.cuentas.filter((k) => k.tipo === 'efectivo').map((k) => k.id),
    );
    const hasta = new Set(i.hechos.transacciones.filter((t) => t.fecha <= fecha).map((t) => t.id));
    const suyos = i.hechos.efectos.filter(
      (e) => efectivo.has(e.cuentaId) && hasta.has(e.transaccionId),
    );
    return suyos.reduce((a, e) => a + e.monto, 0);
  },
};

function observar(
  s: Estado,
  claves: string[],
  avisos: Set<string>,
  previas: Observado['extra'] = {},
): Observado {
  const i = calcular(s.hechos, s.hoy);
  const nombres = nombresDeCategorias(i.hechos);
  const cuentas = new Map(i.hechos.cuentas.map((k) => [k.id, k.nombre]));
  const disp: Observado['disp'] = {};
  const activo = i.presupuesto.activo.inicio;
  for (const x of i.presupuesto.celdas)
    if (x.periodo.inicio === activo) disp[nombres.get(x.categoriaId) as string] = x.disponible;
  const tarjetas: Observado['tarjetas'] = {};
  for (const t of i.tarjetas)
    tarjetas[cuentas.get(t.tarjetaId) as string] = [t.deuda, t.sinRespaldo, t.reservaExcedente];
  for (const a of avisosDeEstado(i)) avisos.add(a.aviso);
  const extra: Observado['extra'] = { ...previas };
  for (const k of claves) {
    if (ANTES.has(k.split(':')[0] as string)) continue;
    const [nombre = '', arg = ''] = k.split(/:(.*)/s);
    const f = EXTRAS[nombre];
    if (f) extra[k] = f(i, arg);
  }
  const ef = i.cuentas.filter((k) => k.tipo === 'efectivo').reduce((a, k) => a + k.saldo, 0);
  const [lpa, fut, sobta] = [i.lpa.total, i.lpa.asignadoFuturos, i.sobregiroConTarjeta];
  return { ef, lpa, disp, fut, sobta, tarjetas, avisos: [...avisos].sort(), extra };
}

/** El movimiento y las líneas que insertó OP-35 (tablas [H]): OP-37 los recibe del llamador. */
function guardarMovimiento(s: Estado, recibidoEn: Instante, cambios: readonly Cambio[]) {
  const filas = <T>(tabla: string) =>
    cambios.flatMap((x) => (x.tipo === 'insertar' && x.tabla === tabla ? [x.fila as T] : []));
  const movimiento = filas<Movimiento>('movimientos')[0] as Movimiento;
  const lineas = filas<MovimientoLinea>('movimiento_lineas');
  s.bandeja = [...s.bandeja, { movimiento, lineas, recibidoEn }];
}

/** Forma canónica de la instantánea completa, para comprobar que un rechazo no cambia nada (regla 7). */
const huella = (s: Estado) => JSON.stringify(calcular(s.hechos, s.hoy));

export const ejecutorMotor: Ejecutor<Estado> = {
  nombre: 'motor',
  iniciar(e: Escenario, hoy: string) {
    const s = sembrar(hoy);
    for (const op of e.estadoInicial ?? []) {
      const r = aplicar(s.hechos, comando(s, op), s.hoy);
      if (!r.ok)
        throw new Error(`${e.id}: el estado inicial se rechazó (${r.rechazos[0]?.codigo})`);
      s.hechos = r.hechosNuevos;
    }
    return Promise.resolve(s);
  },
  // Los hechos son inmutables (cada operación entrega otros): basta copiar el estado.
  bifurcar: (s: Estado) => Promise.resolve({ ...s }),
  paso(s: Estado, p: Paso) {
    if (p.hoy) s.hoy = FechaLocal.desdeTexto(p.hoy);
    const [antes, previa, avisos] = [{ ...s }, huella(s), new Set<string>()];
    const previas: Observado['extra'] = {};
    for (const k of Object.keys(p.espera.extra ?? {})) {
      const [nombre = '', arg = ''] = k.split(/:(.*)/s);
      if (ANTES.has(nombre))
        previas[k] = (EXTRAS[nombre] as (i: Instantanea, a: string) => number)(
          calcular(s.hechos, s.hoy),
          arg,
        );
    }
    let rechazo: string | undefined;
    for (const op of p.ops) {
      const hoyDelPaso = s.hoy;
      if (op.hoy) s.hoy = FechaLocal.desdeTexto(op.hoy);
      if (op.op === 'OP-43' && op.modo === 'automatico') {
        const a = registroAutomatico(s);
        s.hoy = hoyDelPaso;
        s.hechos = a.hechos;
        for (const x of a.avisos) avisos.add(x.codigo);
        for (const x of a.resultados)
          if (x.salida.ok) for (const v of x.salida.avisos) avisos.add(v.codigo);
        continue;
      }
      const cmd = comando(s, op);
      const r = aplicar(s.hechos, cmd, s.hoy);
      s.hoy = hoyDelPaso;
      if (!r.ok) {
        rechazo = r.rechazos[0]?.codigo ?? 'sin_codigo';
        break;
      }
      s.hechos = r.hechosNuevos;
      if (cmd.operacion === 'OP-35') guardarMovimiento(s, cmd.sms.recibidoEn, r.cambios);
      for (const a of r.avisos) avisos.add(a.codigo);
    }
    if (rechazo !== undefined) Object.assign(s, antes); // atomicidad: la fila entera se descarta (01 §5.0.1)
    const obs = observar(s, Object.keys(p.espera.extra ?? {}), avisos, previas);
    return Promise.resolve(
      rechazo === undefined ? obs : { ...obs, rechazo, intacto: huella(s) === previa },
    );
  },
  terminar: () => Promise.resolve(),
};
