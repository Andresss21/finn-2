// Formularios (04 §6.14, BE-42): catálogos comunes y el contexto propio de cada operación. Esta parte
// cubre `registrar`, `pagar_tarjeta` y `cuota_prestamo`; el resto (`editar_transaccion`, `asignar`,
// `archivar_categoria`, `cuenta`, `movimiento`, `meta`) lo agrega TA-240 en `ParametrosFormulario`,
// `pide`, `Contextos` y `contextoDe`, sin tocar los catálogos.
// No calcula: cada número sale de la instantánea o de un selector.
import { desgloseAlPagar } from '../calculo/patrimonio';
import type { Periodo } from '../calculo/periodos';
import type { Instantanea, ReglaComercio, TipoCuenta, Uuid } from '../hechos';
import { desglosePropuesto } from '../operaciones/op-24';
import { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';
import { origenPropuestoPagoTarjeta } from './bandeja';
import { nombres, type Ref, sobregiroDe } from './comunes';
import { amortizacionDe } from './detalle-cuenta';
import { porOrden } from './estructura';
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
    };

/** Lo que no está en los hechos del motor: tablas [H] e [I]. */
export interface AuxiliaresDeFormulario {
  readonly reglas?: readonly ReglaComercio[];
}

type Pide = 'cuentas' | 'categorias' | 'categoriasPago' | 'deudores' | 'comercios' | 'lpa';

/** La tabla de 6.14.2: qué catálogos pide cada operación. */
function pide(p: ParametrosFormulario): readonly Pide[] {
  switch (p.operacion) {
    case 'registrar':
      if (p.tipo === 'gasto') return ['cuentas', 'categorias', 'deudores', 'comercios'];
      if (p.tipo === 'devolucion_sin_compra') return ['cuentas', 'categorias', 'comercios'];
      return p.tipo === 'aporte_inversion' ? ['cuentas', 'categorias'] : ['cuentas'];
    case 'pagar_tarjeta':
      return ['cuentas', 'categoriasPago'];
    case 'cuota_prestamo':
      return ['cuentas', 'categorias'];
  }
}

const suma = (xs: readonly Centavos[]) => xs.reduce(Centavos.sumar, Centavos.cero);

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

/** El contexto de cada operación (6.14.4), con la forma que devuelve su función. */
interface Contextos {
  readonly registrar: ReturnType<typeof contextoRegistrar>;
  readonly pagar_tarjeta: ReturnType<typeof contextoPagarTarjeta>;
  readonly cuota_prestamo: ReturnType<typeof contextoCuotaPrestamo>;
}

function contextoDe(i: Instantanea, p: ParametrosFormulario) {
  switch (p.operacion) {
    case 'registrar':
      return contextoRegistrar(i, p);
    case 'pagar_tarjeta':
      return contextoPagarTarjeta(i, p.tarjetaId);
    case 'cuota_prestamo':
      return contextoCuotaPrestamo(i, p);
  }
}

/** `consultas.formulario` (6.14): catálogos y contexto de la operación. Lanza `RangeError` si falta lo pedido. */
export function formulario<P extends ParametrosFormulario>(
  i: Instantanea,
  p: P,
  aux: AuxiliaresDeFormulario = {},
): { readonly catalogos: Catalogos; readonly contexto: Contextos[P['operacion']] } {
  const opciones: Opciones = {
    periodo: i.presupuesto.activo,
    conAsignado: false,
    cuentasExtra: new Set(),
    categoriasExtra: new Set(),
  };
  return {
    catalogos: catalogos(i, pide(p), aux, opciones),
    contexto: contextoDe(i, p) as Contextos[P['operacion']],
  };
}
