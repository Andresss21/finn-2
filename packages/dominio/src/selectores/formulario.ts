// Formularios (04 §6.14, BE-42): catálogos comunes y el contexto propio de cada operación (ola 1:
// `registrar`, `pagar_tarjeta`, `cuota_prestamo`, `editar_transaccion`, `asignar`, `archivar_categoria`,
// `cuenta`, `movimiento` y `meta`; ola 2, TA-140: `cobrar`, `condonar` y `devolver`; TA-241:
// `fusionar`, `programada`, `regla`, `conciliar` y `verificar_saldo`; falta `formato`, que llega con TA-195).
// No calcula: cada número sale de la instantánea o de un selector. Las tablas [H] llegan como parámetro.
import { destinos } from '../calculo/destino';
import { esOcurrencia } from '../calculo/ocurrencias';
import { desgloseAlPagar } from '../calculo/patrimonio';
import type { Periodo } from '../calculo/periodos';
import { evaluarMeta } from '../calculo/metas';
import { saldoAl, saldoConfirmado } from '../calculo/saldos';
import type {
  Instantanea,
  Institucion,
  Linea,
  ReglaComercio,
  TipoCuenta,
  TipoTransaccion,
  Transaccion,
  Uuid,
} from '../hechos';
import { asignacionRapida } from '../operaciones/op-16';
import { desglosePropuesto } from '../operaciones/op-24';
import { eventosDe } from '../operaciones/op-28';
import { propuestaCondonacion } from '../operaciones/op-32';
import { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';
import { filaDe } from './actividad';
import { type DatosDeBandeja, movimientoDeBandeja, origenPropuestoPagoTarjeta } from './bandeja';
import { nombres, type Ref, sobregiroDe } from './comunes';
import { amortizacionDe, type Auxiliares } from './detalle-cuenta';
import { type DatosDeOrigen, detalleTransaccion } from './detalle-transaccion';
import { porOrden } from './estructura';
import { metas } from './metas';
import { lineasPorCobrar, menor } from './por-cobrar';
import {
  calendarioEditable,
  PROXIMAS_EN_FORMULARIO,
  proximasOcurrencias,
  type ReferenciasDeProgramadas,
} from './programadas';
import { candidatasDeConciliacion } from './conciliacion';
import { comerciosRecientes } from './sugerencia';

export type ParametrosFormulario =
  | {
      readonly operacion: 'registrar';
      readonly tipo:
        | 'gasto'
        | 'ingreso'
        | 'transferencia'
        | 'devolucion_sin_compra'
        | 'aporte_inversion'
        | 'retiro_inversion'
        | 'ajuste_inversion'
        | 'desembolso'
        | 'avance'
        | 'entrada_tarjeta'
        | 'transferencia_deuda';
      readonly cuentaId?: Uuid;
    }
  | { readonly operacion: 'pagar_tarjeta'; readonly tarjetaId?: Uuid }
  | {
      readonly operacion: 'cuota_prestamo';
      readonly prestamoId: Uuid;
      readonly modalidad: 'cuota' | 'abono';
      readonly fecha?: FechaLocal;
    }
  | { readonly operacion: 'editar_transaccion'; readonly transaccionId: Uuid }
  | {
      readonly operacion: 'asignar';
      readonly categoriaId: Uuid;
      readonly periodoInicio?: FechaLocal;
    }
  | { readonly operacion: 'archivar_categoria'; readonly categoriaId: Uuid }
  | { readonly operacion: 'cuenta'; readonly cuentaId?: Uuid; readonly tipo?: TipoCuenta }
  | { readonly operacion: 'movimiento'; readonly movimientoId: Uuid }
  | { readonly operacion: 'meta'; readonly categoriaId?: Uuid; readonly metaId?: Uuid }
  | {
      readonly operacion: 'cobrar';
      readonly lineaId?: Uuid;
      readonly deudorId?: Uuid;
      readonly fecha?: FechaLocal;
    }
  | { readonly operacion: 'condonar'; readonly lineaId: Uuid }
  | {
      readonly operacion: 'devolver';
      readonly transaccionOriginalId?: Uuid;
      readonly busqueda?: string;
    }
  | { readonly operacion: 'fusionar'; readonly categoriaId: Uuid }
  | {
      readonly operacion: 'programada';
      readonly programadaId?: Uuid;
      readonly fechaEsperada?: FechaLocal;
    }
  | { readonly operacion: 'regla'; readonly reglaId?: Uuid }
  | { readonly operacion: 'conciliar'; readonly cuentaId: Uuid }
  | { readonly operacion: 'verificar_saldo'; readonly cuentaId: Uuid; readonly fecha?: FechaLocal };

/** Lo que no está en los hechos del motor: tablas [H] e [I]. */
export interface AuxiliaresDeFormulario extends Auxiliares, DatosDeOrigen {
  readonly instituciones?: readonly Institucion[];
  readonly reglas?: readonly ReglaComercio[];
  /** Obligatorio para `movimiento`. */
  readonly bandeja?: DatosDeBandeja;
  /** Para `calendarioEditable` de `programada` ([H], 6.12.1). */
  readonly referencias?: ReferenciasDeProgramadas;
}

type Pide = 'cuentas' | 'categorias' | 'categoriasPago' | 'deudores' | 'comercios' | 'lpa';

/** La tabla de 6.14.2: qué catálogos pide cada operación. */
function pide(p: ParametrosFormulario, esPago: boolean): readonly Pide[] {
  switch (p.operacion) {
    case 'registrar':
      if (p.tipo === 'gasto') return ['cuentas', 'categorias', 'deudores', 'comercios'];
      if (p.tipo === 'devolucion_sin_compra') return ['cuentas', 'categorias', 'comercios'];
      return p.tipo === 'aporte_inversion' ? ['cuentas', 'categorias'] : ['cuentas'];
    case 'pagar_tarjeta':
      return ['cuentas', 'categoriasPago'];
    case 'cuota_prestamo':
      return ['cuentas', 'categorias'];
    case 'editar_transaccion':
      return [
        'cuentas',
        'categorias',
        ...(esPago ? (['categoriasPago'] as const) : []),
        'deudores',
        'comercios',
      ];
    case 'asignar':
      return ['categorias', 'categoriasPago', 'lpa'];
    case 'archivar_categoria':
      return ['categorias', 'lpa'];
    case 'cuenta':
      return [];
    case 'movimiento':
      return ['cuentas', 'categorias', 'deudores', 'comercios'];
    case 'meta':
    case 'condonar':
    case 'fusionar':
    case 'regla':
      return ['categorias'];
    case 'programada':
      return ['cuentas', 'categorias', 'comercios'];
    case 'conciliar':
      return ['cuentas', 'categorias', 'categoriasPago', 'deudores', 'comercios'];
    case 'verificar_saldo':
      return [];
    case 'cobrar':
      return ['cuentas', 'categoriasPago', 'deudores'];
    case 'devolver':
      return ['cuentas'];
  }
}

const suma = (xs: readonly Centavos[]) => xs.reduce(Centavos.sumar, Centavos.cero);

function periodoPedido(i: Instantanea, inicio?: FechaLocal): Periodo {
  if (inicio === undefined) return i.presupuesto.activo;
  const p = i.presupuesto.periodos.find((x) => x.inicio === inicio);
  if (p === undefined) throw new RangeError(`el período que empieza el ${inicio} no existe`);
  return p;
}

interface Opciones {
  readonly periodo: Periodo;
  readonly conAsignado: boolean;
  /** Cuentas y categorías archivadas que la transacción editada ya usa (van marcadas). */
  readonly cuentasExtra: ReadonlySet<Uuid>;
  readonly categoriasExtra: ReadonlySet<Uuid>;
}

function catalogoDeCuentas(i: Instantanea, extra: ReadonlySet<Uuid>) {
  const [h, n] = [i.hechos, nombres(i)];
  const abiertas = h.cuentas.filter((k) => !k.archivada || extra.has(k.id)).sort(porOrden);
  const saldo = (id: Uuid) => i.cuentas.find((s) => s.cuentaId === id)?.saldo ?? Centavos.cero;
  const de = (tipo: TipoCuenta) => abiertas.filter((k) => k.tipo === tipo);
  return {
    efectivo: de('efectivo').map((k) => ({ cuenta: n.cuenta(k.id), saldo: saldo(k.id) })),
    tarjetas: de('tarjeta').map((k) => ({
      cuenta: n.cuenta(k.id),
      deuda: i.tarjetas.find((t) => t.tarjetaId === k.id)?.deuda ?? Centavos.cero,
      saldoAFavor: Centavos.max(Centavos.cero, saldo(k.id)),
    })),
    prestamos: de('prestamo').map((k) => ({
      cuenta: n.cuenta(k.id),
      capitalPendiente: saldo(k.id),
      tieneModelo: h.prestamos.find((p) => p.cuentaId === k.id)?.modeloCalculo != null,
    })),
    inversiones: de('inversion').map((k) => ({ cuenta: n.cuenta(k.id), valor: saldo(k.id) })),
  };
}

const celdaDe = (i: Instantanea, categoriaId: Uuid, p: Periodo) =>
  i.presupuesto.celdas.find((x) => x.categoriaId === categoriaId && x.periodo.inicio === p.inicio);

function catalogoDeCategorias(i: Instantanea, o: Opciones) {
  const n = nombres(i);
  const grupos = [...i.hechos.grupos].sort(porOrden);
  return {
    grupos: grupos
      .map((g) => ({
        grupo: n.grupo(g.id),
        categorias: i.hechos.categorias
          .filter(
            (c) =>
              c.grupoId === g.id &&
              c.clase === 'normal' &&
              (!c.archivada || o.categoriasExtra.has(c.id)),
          )
          .sort(porOrden)
          .map((c) => {
            const x = celdaDe(i, c.id, o.periodo);
            return {
              categoria: n.categoria(c.id),
              ...(o.conAsignado ? { asignado: x?.asignado ?? Centavos.cero } : {}),
              disponible: x?.disponible ?? Centavos.cero,
              sobregiro: x === undefined ? null : sobregiroDe(x),
            };
          }),
      }))
      .filter((g) => g.categorias.length > 0),
  };
}

function catalogoDePagos(i: Instantanea) {
  const n = nombres(i);
  const grupos = new Map(i.hechos.grupos.map((g) => [g.id, g]));
  return i.hechos.categorias
    .filter(
      (c) => c.clase === 'pago' && c.tarjetaId !== null && n.cuenta(c.tarjetaId).archivada !== true,
    )
    .sort(
      (a, b) => porOrden(grupos.get(a.grupoId) ?? a, grupos.get(b.grupoId) ?? b) || porOrden(a, b),
    )
    .flatMap((c) => {
      const t = i.tarjetas.find((x) => x.tarjetaId === c.tarjetaId);
      return t === undefined
        ? []
        : [
            {
              categoria: n.categoria(c.id),
              tarjeta: n.cuenta(t.tarjetaId),
              disponible: t.disponibleDePago,
              faltaReservar: t.sinRespaldo,
            },
          ];
    });
}

type Catalogos = ReturnType<typeof catalogos>;

function catalogos(
  i: Instantanea,
  quiere: readonly Pide[],
  aux: AuxiliaresDeFormulario,
  o: Opciones,
) {
  const tiene = (x: Pide) => quiere.includes(x);
  return {
    ...(tiene('cuentas') ? { cuentas: catalogoDeCuentas(i, o.cuentasExtra) } : {}),
    ...(tiene('categorias') ? { categorias: catalogoDeCategorias(i, o) } : {}),
    ...(tiene('categoriasPago') ? { categoriasPago: catalogoDePagos(i) } : {}),
    ...(tiene('deudores')
      ? {
          deudores: [...i.hechos.deudores]
            .sort((a, b) =>
              a.nombre < b.nombre ? -1 : a.nombre > b.nombre ? 1 : a.id < b.id ? -1 : 1,
            )
            .map((d) => ({
              deudor: { id: d.id, nombre: d.nombre },
              abierto: suma(i.porCobrar.filter((p) => p.deudorId === d.id).map((p) => p.abierto)),
            })),
        }
      : {}),
    ...(tiene('comercios') ? { comercios: comerciosRecientes(i, aux.reglas ?? []) } : {}),
    ...(tiene('lpa') ? { lpa: { lpa: i.lpa.total, enCamino: i.lpa.dineroEnCamino } } : {}),
  };
}

// ───────────── contextos ─────────────

function contextoRegistrar(
  i: Instantanea,
  p: Extract<ParametrosFormulario, { operacion: 'registrar' }>,
) {
  const n = nombres(i);
  if (p.cuentaId !== undefined) return { cuentaPropuesta: n.cuenta(p.cuentaId) };
  if (p.tipo !== 'gasto') return {};
  const [ultimo] = i.hechos.transacciones
    .filter((t) => t.tipo === 'gasto')
    .sort((a, b) =>
      a.horaRegistro < b.horaRegistro ? 1 : a.horaRegistro > b.horaRegistro ? -1 : 0,
    );
  const e = i.hechos.efectos.find((x) => x.transaccionId === ultimo?.id);
  const ref = e === undefined ? undefined : n.cuenta(e.cuentaId);
  return ref === undefined || ref.archivada === true ? {} : { cuentaPropuesta: ref };
}

function contextoPagarTarjeta(i: Instantanea, tarjetaId?: Uuid) {
  const n = nombres(i);
  return {
    tarjetas: [...i.hechos.cuentas]
      .sort(porOrden)
      .flatMap((k) =>
        k.tipo === 'tarjeta' ? i.hechos.tarjetas.filter((t) => t.cuentaId === k.id) : [],
      )
      .filter(
        (t) =>
          (tarjetaId === undefined || t.cuentaId === tarjetaId) &&
          n.cuenta(t.cuentaId).archivada !== true,
      )
      .flatMap((t) => {
        const e = i.tarjetas.find((x) => x.tarjetaId === t.cuentaId);
        if (e === undefined) return [];
        const d = desgloseAlPagar(i.hechos, t, i.hoy);
        const origen = origenPropuestoPagoTarjeta(i, t.cuentaId);
        const saldo = i.cuentas.find((s) => s.cuentaId === t.cuentaId)?.saldo ?? Centavos.cero;
        return [
          {
            tarjeta: n.cuenta(t.cuentaId),
            deuda: e.deuda,
            saldoAFavor: Centavos.max(Centavos.cero, saldo),
            reservado: e.reservado,
            disponiblePago: e.disponibleDePago,
            faltaReservar: e.sinRespaldo,
            desgloseAlPagar: {
              deudaAnterior: d.deudaAnterior,
              cargosDelCiclo: d.cargosDelCiclo,
              yaPagado: d.yaPagado,
              paraNoGenerarIntereses: d.paraNoGenerarIntereses,
              ultimoCorte: d.corte,
            },
            ...(origen === undefined ? {} : { origenPropuesto: origen }),
          },
        ];
      }),
  };
}

/** La categoría de la última cuota o abono al préstamo; si no hay, la de su programada de cuota activa. */
function categoriaUltimaCuota(i: Instantanea, prestamoId: Uuid): Ref | undefined {
  const h = i.hechos;
  const n = nombres(i);
  const efectos = new Set(
    h.efectos.filter((e) => e.cuentaId === prestamoId).map((e) => e.transaccionId),
  );
  const [ultima] = h.transacciones
    .filter((t) => (t.tipo === 'cuota_prestamo' || t.tipo === 'abono_capital') && efectos.has(t.id))
    .sort((a, b) => (`${a.fecha}|${a.claveOrden}` < `${b.fecha}|${b.claveOrden}` ? 1 : -1));
  const deLinea = h.lineas.find(
    (l) => l.transaccionId === ultima?.id && l.categoriaId !== null,
  )?.categoriaId;
  const programada = h.programadas.find(
    (q) =>
      q.activa &&
      q.tipo === 'cuota_prestamo' &&
      (q.cuentaId === prestamoId || q.cuentaDestinoId === prestamoId),
  );
  const dePrograma = h.programada_lineas
    .filter((l) => l.programadaId === programada?.id)
    .sort((a, b) => a.orden - b.orden)[0]?.categoriaId;
  const id = deLinea ?? dePrograma;
  return id === undefined ? undefined : n.categoria(id);
}

function contextoCuotaPrestamo(
  i: Instantanea,
  p: Extract<ParametrosFormulario, { operacion: 'cuota_prestamo' }>,
) {
  const h = i.hechos;
  const pr = h.prestamos.find((x) => x.cuentaId === p.prestamoId);
  if (pr === undefined) throw new RangeError(`el préstamo ${p.prestamoId} no existe`);
  const n = nombres(i);
  const propuesto = p.modalidad === 'cuota' ? desglosePropuesto(i, p.prestamoId) : null;
  const cuota =
    propuesto === null
      ? undefined
      : amortizacionDe(i, pr)?.find((q) => q.numero === propuesto.numero);
  const categoria = categoriaUltimaCuota(i, p.prestamoId);
  return {
    prestamo: n.cuenta(p.prestamoId),
    capitalPendiente: i.cuentas.find((s) => s.cuentaId === p.prestamoId)?.saldo ?? Centavos.cero,
    cuotaPactada: pr.cuotaPactada,
    tieneModelo: pr.modeloCalculo !== null,
    ...(propuesto === null
      ? {}
      : {
          desglosePropuesto: {
            capital: propuesto.capital,
            interes: propuesto.interes,
            seguro: propuesto.seguro,
            total: suma([propuesto.capital, propuesto.interes, propuesto.seguro]),
            numeroCuota: propuesto.numero,
          },
        }),
    ...(cuota === undefined
      ? {}
      : { cuotaEmparejada: { numero: cuota.numero, fecha: cuota.fecha, estado: cuota.estado } }),
    ...(categoria === undefined ? {} : { categoriaPropuesta: categoria }),
  };
}

/** La capacidad de devolución de una línea, la de OP-33 (inv. 9 e inv. 10): lo abierto por cobrar, o monto − devuelto. */
function capacidadDeLinea(i: Instantanea, l: Linea) {
  const devuelto = suma(eventosDe(i.hechos, l).devoluciones.map((d) => d.monto));
  const abierto = i.porCobrar.find((q) => q.lineaId === l.id)?.abierto;
  return { devuelto, capacidad: abierto ?? Centavos.restar(l.monto, devuelto) };
}

function contextoEditar(i: Instantanea, transaccionId: Uuid, aux: AuxiliaresDeFormulario) {
  const h = i.hechos;
  const detalle = detalleTransaccion(i, transaccionId, aux);
  const cuentasArchivadas = detalle.efectos
    .map((e) => e.cuenta)
    .filter((c) => c.archivada === true);
  const categoriasArchivadas = detalle.lineas.flatMap((l) =>
    'categoria' in l.destino && l.destino.categoria.archivada === true ? [l.destino.categoria] : [],
  );
  const conDevoluciones = detalle.lineas.some((l) => l.devoluciones.length > 0);
  return {
    ...detalle,
    cuentasArchivadas,
    categoriasArchivadas,
    ...(conDevoluciones
      ? {
          capacidadDevolucion: detalle.lineas.map((l) => ({
            lineaId: l.id,
            monto: l.monto,
            ...capacidadDeLinea(i, h.lineas.find((x) => x.id === l.id) as Linea),
          })),
        }
      : {}),
  };
}

function contextoAsignar(
  i: Instantanea,
  p: Extract<ParametrosFormulario, { operacion: 'asignar' }>,
) {
  const h = i.hechos;
  const c = h.categorias.find((x) => x.id === p.categoriaId);
  if (c === undefined) throw new RangeError(`la categoría ${p.categoriaId} no existe`);
  const periodo = periodoPedido(i, p.periodoInicio);
  const celda = celdaDe(i, c.id, periodo);
  const asignado = celda?.asignado ?? Centavos.cero;
  const disponible = celda?.disponible ?? Centavos.cero;
  const m = h.metas.find((x) => x.categoriaId === c.id);
  const ev =
    m === undefined || periodo.inicio < i.presupuesto.activo.inicio
      ? null
      : evaluarMeta(m, c, i.presupuesto, i.ciclo, i.hoy, periodo);
  return {
    categoria: nombres(i).categoria(c.id),
    periodo: periodo.inicio,
    asignado,
    disponible,
    asignadoEsperado: asignado,
    ...(ev === null ? {} : { meta: { pedido: ev.pedido, falta: ev.falta } }),
    rapida: asignacionRapida(i, c.id, periodo),
  };
}

function contextoArchivar(i: Instantanea, categoriaId: Uuid) {
  const h = i.hechos;
  const c = h.categorias.find((x) => x.id === categoriaId);
  if (c === undefined) throw new RangeError(`la categoría ${categoriaId} no existe`);
  const activo = i.presupuesto.activo;
  const celda = celdaDe(i, c.id, activo);
  const meta = h.metas.find((m) => m.categoriaId === c.id);
  return {
    categoria: nombres(i).categoria(c.id),
    disponible: celda?.disponible ?? Centavos.cero,
    sobregiro: celda === undefined ? null : sobregiroDe(celda),
    asignacionesFuturas: h.asignaciones
      .filter((a) => a.categoriaId === c.id && a.periodoInicio > activo.inicio && a.monto !== 0)
      .sort((a, b) => (a.periodoInicio < b.periodoInicio ? -1 : 1))
      .map((a) => ({ periodo: a.periodoInicio, monto: a.monto })),
    programadasActivas: h.programadas
      .filter((q) => q.activa)
      .flatMap((q) => {
        const suyas = h.programada_lineas.filter(
          (l) => l.programadaId === q.id && l.categoriaId === c.id,
        );
        return suyas.length === 0
          ? []
          : [
              {
                programada: { id: q.id, nombre: q.comercio },
                comercio: q.comercio,
                monto: q.monto,
                montoHaciaCategoria: suma(suyas.map((l) => l.monto)),
                frecuencia: q.frecuencia,
              },
            ];
      }),
    ...(meta === undefined ? {} : { meta: { id: meta.id, nombre: c.nombre } }),
    asignadoEsperado: celda?.asignado ?? Centavos.cero,
  };
}

function contextoCuenta(
  i: Instantanea,
  p: Extract<ParametrosFormulario, { operacion: 'cuenta' }>,
  aux: AuxiliaresDeFormulario,
) {
  const h = i.hechos;
  const instituciones = (aux.instituciones ?? []).map((x) => ({ id: x.id, nombre: x.nombre }));
  const base = {
    instituciones,
    nombresTarjetaUsados: [...h.cuentas]
      .sort(porOrden)
      .filter((k) => k.tipo === 'tarjeta')
      .map((k) => ({ nombre: k.nombre, archivada: k.archivada })),
    modelosPrestamo: ['banco_agricola'] as const,
  };
  if (p.cuentaId === undefined) return base;
  const k = h.cuentas.find((x) => x.id === p.cuentaId);
  if (k === undefined) throw new RangeError(`la cuenta ${p.cuentaId} no existe`);
  const subtipo = [...h.tarjetas, ...h.prestamos, ...h.inversiones].find(
    (x) => x.cuentaId === k.id,
  );
  const camposDeSubtipo = Object.fromEntries(
    Object.entries(subtipo ?? {}).filter(
      ([clave]) => !['cuentaId', 'tipo', 'revision'].includes(clave),
    ),
  );
  const campos = {
    tipo: k.tipo,
    nombre: k.nombre,
    institucion: instituciones.find((x) => x.id === k.institucionId) ?? null,
    ultimos4: k.ultimos4,
    fechaApertura: k.fechaApertura,
    ...camposDeSubtipo,
  };
  const efectos = new Set(h.efectos.filter((e) => e.cuentaId === k.id).map((e) => e.transaccionId));
  const [primera] = h.transacciones
    .filter((t) => t.tipo !== 'saldo_inicial' && efectos.has(t.id))
    .map((t) => t.fecha)
    .sort();
  return {
    ...base,
    cuenta: { cuenta: nombres(i).cuenta(k.id), ...campos, esperado: campos },
    ...(primera === undefined ? {} : { fechaAperturaMaxima: primera }),
  };
}

function contextoMeta(i: Instantanea, p: Extract<ParametrosFormulario, { operacion: 'meta' }>) {
  const { metas: lista, categoriasSinMeta } = metas(i);
  const meta = lista.find((m) =>
    p.metaId !== undefined
      ? m.id === p.metaId
      : p.categoriaId !== undefined && m.categoria.id === p.categoriaId,
  );
  return { ...(meta === undefined ? {} : { meta }), categoriasSinMeta };
}

// ───────────── ola 2 (TA-140) ─────────────

function existeLinea(i: Instantanea, lineaId: Uuid) {
  const x = lineasPorCobrar(i).find((y) => y.lineaId === lineaId);
  if (x === undefined) throw new RangeError(`la línea ${lineaId} no es por cobrar`);
  return x;
}

function contextoCobrar(i: Instantanea, p: Extract<ParametrosFormulario, { operacion: 'cobrar' }>) {
  if (p.lineaId !== undefined) existeLinea(i, p.lineaId);
  if (p.deudorId !== undefined && !i.hechos.deudores.some((d) => d.id === p.deudorId))
    throw new RangeError(`el deudor ${p.deudorId} no existe`);
  return {
    lineas: lineasPorCobrar(i, p.fecha)
      .filter(
        (x) =>
          x.abierto > 0 &&
          (p.lineaId === undefined || x.lineaId === p.lineaId) &&
          (p.deudorId === undefined || x.deudor.id === p.deudorId),
      )
      .sort((a, b) => menor(a.fechaOrigen, b.fechaOrigen) || menor(a.lineaId, b.lineaId))
      .map((x) => ({
        lineaId: x.lineaId,
        transaccionId: x.transaccionId,
        deudor: x.deudor,
        fechaOrigen: x.fechaOrigen,
        comercio: x.comercio,
        monto: x.monto,
        abierto: x.abierto,
        medio: x.medio,
        ...(x.tarjeta === undefined ? {} : { tarjeta: x.tarjeta }),
        propuestaAV22: x.medio === 'tarjeta',
      })),
  };
}

function contextoCondonar(i: Instantanea, lineaId: Uuid) {
  const x = existeLinea(i, lineaId);
  const categoria = propuestaCondonacion(i.hechos, lineaId);
  return {
    linea: {
      lineaId,
      deudor: x.deudor,
      abierto: x.abierto,
      medio: x.medio,
      fechaOrigen: x.fechaOrigen,
    },
    ...(categoria === null ? {} : { categoriaPropuesta: nombres(i).categoria(categoria) }),
  };
}

interface FiltroDeCandidatas {
  readonly busqueda?: string;
  readonly cuentaId?: Uuid;
  /** El monto que la compra todavía debe admitir. */
  readonly montoMinimo?: Centavos;
  /** La devolución no puede ser anterior a la compra. */
  readonly hasta?: FechaLocal;
}

const MAX_CANDIDATAS = 20;

/** Gastos con `restante > 0` (inv. 11), los más recientes primero; la búsqueda mira comercio y nota. */
function candidatasDeDevolucion(i: Instantanea, f: FiltroDeCandidatas = {}) {
  const h = i.hechos;
  const n = nombres(i);
  const q = f.busqueda?.trim().toLowerCase() ?? '';
  const compraDe = new Map(h.lineas.map((l) => [l.id, l.transaccionId]));
  const devuelto = new Map<Uuid, Centavos>();
  for (const l of h.lineas) {
    const t = l.lineaOriginalId === null ? undefined : compraDe.get(l.lineaOriginalId);
    if (t !== undefined) devuelto.set(t, Centavos.sumar(devuelto.get(t) ?? Centavos.cero, l.monto));
  }
  return h.transacciones
    .filter(
      (t) =>
        t.tipo === 'gasto' &&
        (f.hasta === undefined || t.fecha <= f.hasta) &&
        (q === '' ||
          (t.comercio ?? '').toLowerCase().includes(q) ||
          (t.nota ?? '').toLowerCase().includes(q)),
    )
    .flatMap((t) => {
      const cuenta = h.efectos.find((e) => e.transaccionId === t.id)?.cuentaId;
      const restante = Centavos.restar(t.total, devuelto.get(t.id) ?? Centavos.cero);
      return cuenta === undefined ||
        restante <= 0 ||
        (f.cuentaId !== undefined && cuenta !== f.cuentaId) ||
        (f.montoMinimo !== undefined && restante < f.montoMinimo)
        ? []
        : [{ t, cuenta, restante }];
    })
    .sort((a, b) =>
      menor(`${b.t.fecha}|${b.t.claveOrden}|${b.t.id}`, `${a.t.fecha}|${a.t.claveOrden}|${a.t.id}`),
    )
    .slice(0, MAX_CANDIDATAS)
    .map(({ t, cuenta, restante }) => ({
      transaccionId: t.id,
      fecha: t.fecha,
      comercio: t.comercio,
      cuenta: n.cuenta(cuenta),
      total: t.total,
      restante,
    }));
}

function contextoDevolver(
  i: Instantanea,
  p: Extract<ParametrosFormulario, { operacion: 'devolver' }>,
) {
  if (p.transaccionOriginalId === undefined)
    return {
      candidatas: candidatasDeDevolucion(
        i,
        p.busqueda === undefined ? {} : { busqueda: p.busqueda },
      ),
    };
  const h = i.hechos;
  const t = h.transacciones.find((x) => x.id === p.transaccionOriginalId);
  if (t === undefined || t.tipo !== 'gasto')
    throw new RangeError(`la compra ${p.transaccionOriginalId} no existe o no es un gasto`);
  const n = nombres(i);
  const cuenta = h.efectos.find((e) => e.transaccionId === t.id)?.cuentaId;
  if (cuenta === undefined) throw new RangeError(`la compra ${t.id} no tiene cuenta`);
  const lineas = h.lineas
    .filter((l) => l.transaccionId === t.id)
    .sort((a, b) => a.orden - b.orden)
    .map((l) => {
      const deudor = h.deudores.find((d) => d.id === l.deudorId);
      const destino =
        l.categoriaId !== null
          ? { ...n.categoria(l.categoriaId), tipo: 'categoria' as const }
          : { id: l.deudorId as Uuid, nombre: deudor?.nombre ?? '', tipo: 'deudor' as const };
      return { lineaId: l.id, destino, monto: l.monto, ...capacidadDeLinea(i, l) };
    });
  const devuelto = suma(lineas.map((l) => l.devuelto));
  return {
    compra: {
      transaccionId: t.id,
      fecha: t.fecha,
      comercio: t.comercio,
      cuenta: n.cuenta(cuenta),
      total: t.total,
      devuelto,
      restante: Centavos.restar(t.total, devuelto),
    },
    lineas,
  };
}

function contextoMovimiento(
  i: Instantanea,
  p: Extract<ParametrosFormulario, { operacion: 'movimiento' }>,
  aux: AuxiliaresDeFormulario,
) {
  if (aux.bandeja === undefined)
    throw new TypeError('formulario(movimiento): faltan los datos de la bandeja');
  const x = aux.bandeja.movimientos.find((y) => y.movimiento.id === p.movimientoId);
  if (x === undefined) throw new RangeError(`el movimiento ${p.movimientoId} no existe`);
  const m = x.movimiento;
  const dto = movimientoDeBandeja(i, aux.bandeja, m, x.lineas);
  if (m.tipoPropuesto !== 'devolucion') return { movimiento: dto };
  // Misma cuenta, restante suficiente y compra no posterior al movimiento (04 §6.14.4).
  const filtro: FiltroDeCandidatas = {
    ...(m.cuentaId === null ? {} : { cuentaId: m.cuentaId }),
    ...(m.monto === null ? {} : { montoMinimo: m.monto }),
    ...(m.fecha === null ? {} : { hasta: m.fecha }),
  };
  return { movimiento: dto, candidatas: candidatasDeDevolucion(i, filtro) };
}

/** El contexto de cada operación (6.14.4), con la forma que devuelve su función. */
interface Contextos {
  readonly registrar: ReturnType<typeof contextoRegistrar>;
  readonly pagar_tarjeta: ReturnType<typeof contextoPagarTarjeta>;
  readonly cuota_prestamo: ReturnType<typeof contextoCuotaPrestamo>;
  readonly editar_transaccion: ReturnType<typeof contextoEditar>;
  readonly asignar: ReturnType<typeof contextoAsignar>;
  readonly archivar_categoria: ReturnType<typeof contextoArchivar>;
  readonly cuenta: ReturnType<typeof contextoCuenta>;
  readonly movimiento: ReturnType<typeof contextoMovimiento>;
  readonly meta: ReturnType<typeof contextoMeta>;
  readonly cobrar: ReturnType<typeof contextoCobrar>;
  readonly condonar: ReturnType<typeof contextoCondonar>;
  readonly devolver: ReturnType<typeof contextoDevolver>;
  readonly fusionar: ReturnType<typeof contextoFusionar>;
  readonly programada: ReturnType<typeof contextoProgramada>;
  readonly regla: ReturnType<typeof contextoRegla>;
  readonly conciliar: ReturnType<typeof contextoConciliar>;
  readonly verificar_saldo: ReturnType<typeof contextoVerificar>;
}

// ───────────── ola 2, resto (TA-241, CH-30) ─────────────

function contextoFusionar(i: Instantanea, categoriaId: Uuid, aux: AuxiliaresDeFormulario) {
  const h = i.hechos;
  const c = h.categorias.find((x) => x.id === categoriaId);
  if (c === undefined || c.clase !== 'normal')
    throw new RangeError(`la categoría ${categoriaId} no existe o no es normal`);
  const n = nombres(i);
  const grupos = new Map(h.grupos.map((g) => [g.id, g]));
  const delOrigen = <T extends { readonly categoriaId: Uuid | null }>(xs: readonly T[]) =>
    xs.filter((x) => x.categoriaId === c.id);
  const meta = h.metas.find((m) => m.categoriaId === c.id);
  return {
    origen: n.categoria(c.id),
    destinosValidos: h.categorias
      .filter((x) => x.clase === 'normal' && !x.archivada && x.id !== c.id)
      .sort(
        (a, b) =>
          porOrden(grupos.get(a.grupoId) ?? a, grupos.get(b.grupoId) ?? b) || porOrden(a, b),
      )
      .map((x) => n.categoria(x.id)),
    resumen: {
      periodosConAsignacion: delOrigen(h.asignaciones).length,
      transacciones: new Set(delOrigen(h.lineas).map((l) => l.transaccionId)).size,
      condonaciones: delOrigen(h.condonaciones).length,
      programadas: new Set(delOrigen(h.programada_lineas).map((l) => l.programadaId)).size,
      reglas: delOrigen(aux.reglas ?? []).length,
      ...(meta === undefined ? {} : { meta: { tipo: meta.tipo, monto: meta.monto } }),
    },
  };
}

function contextoProgramada(
  i: Instantanea,
  p: Extract<ParametrosFormulario, { operacion: 'programada' }>,
  aux: AuxiliaresDeFormulario,
) {
  const h = i.hechos;
  const base = {
    prestamosConModelo: h.prestamos.filter((x) => x.modeloCalculo !== null).map((x) => x.cuentaId),
  };
  if (p.programadaId === undefined) return base;
  const q = h.programadas.find((x) => x.id === p.programadaId);
  if (q === undefined) throw new RangeError(`la programada ${p.programadaId} no existe`);
  const n = nombres(i);
  const lineas = h.programada_lineas
    .filter((l) => l.programadaId === q.id)
    .sort((a, b) => a.orden - b.orden)
    .map((l) => ({ categoria: n.categoria(l.categoriaId), monto: l.monto }));
  const campos = {
    tipo: q.tipo,
    cuentaId: q.cuentaId,
    cuentaDestinoId: q.cuentaDestinoId,
    comercio: q.comercio,
    monto: q.monto,
    tolerancia: q.tolerancia,
    frecuencia: q.frecuencia,
    frecuenciaDias: q.frecuenciaDias,
    primeraFecha: q.primeraFecha,
    fechaFin: q.fechaFin,
    registroAutomatico: q.registroAutomatico,
    lineas: lineas.map((l) => ({ categoriaId: l.categoria.id, monto: l.monto })),
  };
  const resuelta = h.ocurrencias_resueltas.find(
    (o) => o.programadaId === q.id && o.fechaEsperada === p.fechaEsperada,
  );
  if (p.fechaEsperada !== undefined && resuelta === undefined && !esOcurrencia(q, p.fechaEsperada))
    throw new RangeError(`el ${p.fechaEsperada} no es una ocurrencia de la programada ${q.id}`);
  const desglose =
    p.fechaEsperada !== undefined && q.tipo === 'cuota_prestamo' && q.cuentaDestinoId !== null
      ? desglosePropuesto(i, q.cuentaDestinoId)
      : null;
  return {
    ...base,
    programada: {
      programada: { id: q.id, nombre: q.comercio },
      activa: q.activa,
      ...campos,
      esperado: campos,
      calendarioEditable: calendarioEditable(i, q.id, aux.referencias),
      proximas: proximasOcurrencias(i, q, PROXIMAS_EN_FORMULARIO),
    },
    ...(p.fechaEsperada === undefined
      ? {}
      : {
          ocurrencia: {
            fechaEsperada: p.fechaEsperada,
            estado: resuelta?.estado ?? ('pendiente' as const),
            ...(resuelta?.transaccionId == null ? {} : { transaccionId: resuelta.transaccionId }),
            monto: q.monto,
            cuenta: n.cuenta(q.cuentaId),
            lineas,
            ...(desglose === null ? {} : { desglosePropuesto: desglose }),
          },
        }),
  };
}

function contextoRegla(
  i: Instantanea,
  p: Extract<ParametrosFormulario, { operacion: 'regla' }>,
  aux: AuxiliaresDeFormulario,
) {
  if (p.reglaId === undefined) return {};
  const r = (aux.reglas ?? []).find((x) => x.id === p.reglaId);
  if (r === undefined) throw new RangeError(`la regla ${p.reglaId} no existe`);
  const regla = { id: r.id, patron: r.patron, categoria: nombres(i).categoria(r.categoriaId) };
  return { regla: { ...regla, esperado: { patron: r.patron, categoriaId: r.categoriaId } } };
}

/** Conciliar y verificar saldo solo admiten efectivo y tarjeta (OP-45, OP-53). */
function cuentaConciliable(i: Instantanea, cuentaId: Uuid) {
  const k = i.hechos.cuentas.find((x) => x.id === cuentaId);
  if (k === undefined || (k.tipo !== 'efectivo' && k.tipo !== 'tarjeta') || k.archivada)
    throw new RangeError(`la cuenta ${cuentaId} no existe o no se puede conciliar`);
  return { id: k.id, tipo: k.tipo };
}

/**
 * Los tipos de alta que admite un movimiento del estado según el tipo de la cuenta y el signo del
 * efecto (03 §4.5.1): cargo = efecto negativo, abono = efecto positivo.
 */
const TIPOS_DE_ALTA: Record<
  'efectivo' | 'tarjeta',
  { readonly cargo: readonly TipoTransaccion[]; readonly abono: readonly TipoTransaccion[] }
> = {
  efectivo: {
    cargo: ['gasto', 'transferencia', 'pago_tarjeta', 'cuota_prestamo', 'abono_capital'],
    abono: ['ingreso', 'transferencia', 'cobro', 'devolucion'],
  },
  tarjeta: {
    cargo: ['gasto', 'avance_efectivo', 'transferencia_tarjetas'],
    abono: ['pago_tarjeta', 'entrada_tarjeta', 'devolucion', 'transferencia_tarjetas'],
  },
};

function ultimaConciliacion(i: Instantanea, cuentaId: Uuid) {
  const [u] = i.hechos.conciliaciones
    .filter((x) => x.cuentaId === cuentaId)
    .sort((a, b) =>
      a.fechaEstado === b.fechaEstado
        ? menor(b.terminadaEn, a.terminadaEn)
        : menor(b.fechaEstado, a.fechaEstado),
    );
  return u === undefined
    ? undefined
    : {
        fechaEstado: u.fechaEstado,
        saldoEstado: u.saldoEstado,
        modo: u.modo,
        diferenciaActual: Centavos.restar(
          u.saldoEstado,
          saldoAl(i.hechos, cuentaId, u.fechaEstado),
        ),
      };
}

function contextoConciliar(i: Instantanea, cuentaId: Uuid) {
  const k = cuentaConciliable(i, cuentaId);
  const origen = k.tipo === 'tarjeta' ? origenPropuestoPagoTarjeta(i, k.id) : undefined;
  const n = nombres(i);
  const u = ultimaConciliacion(i, k.id);
  return {
    cuenta: {
      cuenta: n.cuenta(k.id),
      tipo: k.tipo,
      saldo: saldoAl(i.hechos, k.id, i.hoy),
      saldoConfirmado: saldoConfirmado(i.hechos, k.id),
      ...(u === undefined
        ? {}
        : {
            ultimaConciliacion: {
              fechaEstado: u.fechaEstado,
              saldoEstado: u.saldoEstado,
              diferenciaActual: u.diferenciaActual,
            },
          }),
    },
    tiposAlta: TIPOS_DE_ALTA[k.tipo],
    ...(origen === undefined ? {} : { origenPropuestoPago: origen }),
    prestamos: [...i.hechos.cuentas]
      .sort(porOrden)
      .filter((x) => !x.archivada)
      .flatMap((x) => i.hechos.prestamos.filter((p) => p.cuentaId === x.id))
      .map((p) => {
        const categoria = categoriaUltimaCuota(i, p.cuentaId);
        return {
          cuenta: n.cuenta(p.cuentaId),
          tieneModelo: p.modeloCalculo !== null,
          ...(categoria === undefined ? {} : { categoriaPropuesta: categoria }),
        };
      }),
    porCobrarAbiertos: lineasPorCobrar(i)
      .filter((x) => x.abierto > 0)
      .sort((a, b) => menor(a.fechaOrigen, b.fechaOrigen) || menor(a.lineaId, b.lineaId))
      .map((x) => ({
        lineaId: x.lineaId,
        transaccionId: x.transaccionId,
        deudor: x.deudor,
        fechaOrigen: x.fechaOrigen,
        comercio: x.comercio,
        abierto: x.abierto,
        medio: x.medio,
      })),
  };
}

const MAX_VERIFICACION = 200;

function contextoVerificar(i: Instantanea, cuentaId: Uuid, fecha?: FechaLocal) {
  const k = cuentaConciliable(i, cuentaId);
  const al = fecha ?? i.hoy;
  if (al > i.hoy) throw new RangeError(`la fecha ${al} es posterior a hoy`);
  const candidatas = candidatasDeConciliacion(i.hechos, k.id, al);
  const porId = new Map(i.hechos.transacciones.map((t) => [t.id, t]));
  const u = ultimaConciliacion(i, k.id);
  return {
    cuenta: { ...nombres(i).cuenta(k.id), tipo: k.tipo },
    fecha: al,
    candidatas: {
      cantidad: candidatas.length,
      recientes: candidatas
        .slice(-MAX_VERIFICACION)
        .reverse()
        .map((c) => filaDe(i, porId.get(c.id as Uuid) as Transaccion)),
    },
    ...(u === undefined ? {} : { ultimaConciliacion: u }),
  };
}

function contextoDe(i: Instantanea, p: ParametrosFormulario, aux: AuxiliaresDeFormulario) {
  switch (p.operacion) {
    case 'registrar':
      return contextoRegistrar(i, p);
    case 'pagar_tarjeta':
      return contextoPagarTarjeta(i, p.tarjetaId);
    case 'cuota_prestamo':
      return contextoCuotaPrestamo(i, p);
    case 'editar_transaccion':
      return contextoEditar(i, p.transaccionId, aux);
    case 'asignar':
      return contextoAsignar(i, p);
    case 'archivar_categoria':
      return contextoArchivar(i, p.categoriaId);
    case 'cuenta':
      return contextoCuenta(i, p, aux);
    case 'movimiento':
      return contextoMovimiento(i, p, aux);
    case 'meta':
      return contextoMeta(i, p);
    case 'cobrar':
      return contextoCobrar(i, p);
    case 'condonar':
      return contextoCondonar(i, p.lineaId);
    case 'devolver':
      return contextoDevolver(i, p);
    case 'fusionar':
      return contextoFusionar(i, p.categoriaId, aux);
    case 'programada':
      return contextoProgramada(i, p, aux);
    case 'regla':
      return contextoRegla(i, p, aux);
    case 'conciliar':
      return contextoConciliar(i, p.cuentaId);
    case 'verificar_saldo':
      return contextoVerificar(i, p.cuentaId, p.fecha);
  }
}

/** `consultas.formulario` (6.14): catálogos y contexto de la operación. Lanza `RangeError` si falta lo pedido. */
export function formulario<P extends ParametrosFormulario>(
  i: Instantanea,
  p: P,
  aux: AuxiliaresDeFormulario = {},
): { readonly catalogos: Catalogos; readonly contexto: Contextos[P['operacion']] } {
  const h = i.hechos;
  const tx =
    p.operacion === 'editar_transaccion'
      ? h.transacciones.find((t) => t.id === p.transaccionId)
      : undefined;
  if (p.operacion === 'editar_transaccion' && tx === undefined)
    throw new RangeError(`la transacción ${p.transaccionId} no existe`);
  const usadas = h.efectos.filter((e) => e.transaccionId === tx?.id).map((e) => e.cuentaId);
  const destino = destinos(h.lineas);
  const categoriasUsadas = h.lineas.flatMap((l) => {
    const { categoriaId } = destino(l);
    return l.transaccionId === tx?.id && categoriaId !== null ? [categoriaId] : [];
  });
  const opciones: Opciones = {
    periodo: periodoPedido(i, p.operacion === 'asignar' ? p.periodoInicio : undefined),
    conAsignado: p.operacion === 'asignar',
    cuentasExtra: new Set(usadas),
    categoriasExtra: new Set(categoriasUsadas),
  };
  const catalogo = catalogos(i, pide(p, tx?.tipo === 'pago_tarjeta'), aux, opciones);
  return { catalogos: catalogo, contexto: contextoDe(i, p, aux) as Contextos[P['operacion']] };
}
