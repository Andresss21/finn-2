// Selector de Inicio (04 §6.1; BE-37 horizonte de 7 días; CF-18 primeros pasos en 06 §3.15). Los montos
// salen de la instantánea y de `avisosDeEstado` (AV-14, AV-17, AV-20); no hay fórmulas propias.
// Fuera del selector quedan lo que lee la consulta ([H] y [T]: `Encabezado`, `bandeja`,
// `cambiosRetroactivos`, `recientes`, `hallazgosRitmo`) y las `accion: Propuesta` de AV-08 y AV-14,
// que arma la aplicación (04 §7.10).
import { avisosDeEstado } from '../avisos/estado';
import { desgloseAlPagar } from '../calculo/patrimonio';
import { pagoExcedente } from '../calculo/sobregiros';
import type { Instantanea, Programada, Uuid } from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import {
  type CausaDeExcedente,
  causasDelExcedente,
  nombres,
  type Ref,
  type SobregiroDto,
  sobregiroDe,
} from './comunes';

/** Horizonte de "próximos pagos" en Inicio: 7 días (BE-37). */
export const HORIZONTE_PROXIMOS_PAGOS = 7;
/** Una tarjeta entra en `pagosTarjetaProximos` si fp − hoy ≤ 3 (CF-06/CF-07). */
const DIAS_AVISO_DE_PAGO = 3;

export interface OcurrenciaDto {
  readonly programada: Ref;
  readonly fechaEsperada: FechaLocal;
  readonly monto: Centavos;
  readonly cuenta: Ref;
  readonly tipo: Programada['tipo'];
  readonly registroAutomatico: boolean;
  readonly atrasada: boolean;
}

export interface PrimerosPasos {
  readonly cuenta: boolean;
  readonly categorias: boolean;
  readonly sms: boolean;
}

export interface InicioSel {
  readonly lpa: Centavos;
  readonly enCamino: Centavos;
  readonly lpaNegativo: boolean;
  readonly reduccionProyectadaAlCierre: Centavos;
  readonly atencion: {
    readonly sobregiradas: { categoria: Ref; grupo: Ref; sobregiro: SobregiroDto }[];
    readonly faltaReservar: { tarjeta: Ref; monto: Centavos }[];
    readonly pagosExcedentes: { tarjeta: Ref; monto: Centavos; causas: CausaDeExcedente[] }[];
    /** Sin `accion`: la propuesta de AV-08 la arma la aplicación. */
    readonly reservaExcedente: { tarjeta: Ref; monto: Centavos }[];
    readonly proximosPagos: OcurrenciaDto[];
    readonly pagosAtrasados: OcurrenciaDto[];
    readonly metasVencidas: { categoria: Ref; falta: Centavos }[];
    /** Sin `accion`: la propuesta de AV-14 la arma la aplicación. */
    readonly archivadasConDisponible: { categoria: Ref; disponible: Centavos }[];
    readonly pagosTarjetaProximos: {
      tarjeta: Ref;
      fechaPago: FechaLocal;
      paraNoGenerarIntereses: Centavos;
    }[];
  };
  readonly primerosPasos: PrimerosPasos | null;
  readonly patrimonio: { activos: Centavos; deudas: Centavos; neto: Centavos };
}

const positivo = (x: Centavos) => x > Centavos.cero;

/** Primera fecha ≥ hoy con el día de pago, recortado al fin de mes (§4.14, supuesto 19). */
function proximoPago(diaPago: number, hoy: FechaLocal): FechaLocal {
  const esteMes = FechaLocal.inicioDeMes(hoy, diaPago);
  return esteMes >= hoy ? esteMes : FechaLocal.inicioDeMes(FechaLocal.sumarMeses(hoy, 1), diaPago);
}

/**
 * Los datos de Inicio que salen del motor. `smsConectado` es "`token_webhook` está configurado" ([T], 06
 * §3.15): la consulta lo lee y el selector solo lo recibe como booleano.
 */
export function inicio(i: Instantanea, smsConectado: boolean): InicioSel {
  const b = i.presupuesto;
  const nom = nombres(i);
  const h = i.hechos;
  const celdas = b.celdas.filter((x) => x.periodo.inicio === b.activo.inicio);
  const categoriaDe = new Map(h.categorias.map((x) => [x.id, x]));
  const avisos = avisosDeEstado(i);

  // Orden de pantalla: por orden del grupo y de la categoría.
  const grupoDe = new Map(h.grupos.map((g) => [g.id, g]));
  const sobregiradas = celdas
    .flatMap((x) => {
      const categoria = categoriaDe.get(x.categoriaId);
      const grupo = categoria === undefined ? undefined : grupoDe.get(categoria.grupoId);
      const sobregiro = sobregiroDe(x);
      return x.clase !== 'normal' ||
        categoria === undefined ||
        grupo === undefined ||
        sobregiro === null
        ? []
        : [{ orden: [grupo.orden, categoria.orden], categoria, grupo, sobregiro }];
    })
    .sort((a, b) => (a.orden[0] ?? 0) - (b.orden[0] ?? 0) || (a.orden[1] ?? 0) - (b.orden[1] ?? 0))
    .map((x) => ({
      categoria: nom.categoria(x.categoria.id),
      grupo: nom.grupo(x.grupo.id),
      sobregiro: x.sobregiro,
    }));

  const ocurrencia = (o: Instantanea['ocurrencias'][number]): OcurrenciaDto[] => {
    const p = h.programadas.find((x) => x.id === o.programadaId);
    return p === undefined
      ? []
      : [
          {
            programada: { id: p.id, nombre: p.comercio },
            fechaEsperada: o.fecha,
            monto: p.monto,
            cuenta: nom.cuenta(p.cuentaId),
            tipo: p.tipo,
            registroAutomatico: p.registroAutomatico,
            atrasada: o.atrasada,
          },
        ];
  };
  const limite = FechaLocal.sumarDias(i.hoy, HORIZONTE_PROXIMOS_PAGOS);

  const pagosTarjetaProximos = h.tarjetas.flatMap((t) => {
    if (h.cuentas.find((k) => k.id === t.cuentaId)?.archivada !== false) return [];
    const fechaPago = proximoPago(t.diaPago, i.hoy);
    const monto = desgloseAlPagar(h, t, i.hoy).paraNoGenerarIntereses;
    return FechaLocal.diasEntre(i.hoy, fechaPago) <= DIAS_AVISO_DE_PAGO && positivo(monto)
      ? [{ tarjeta: nom.cuenta(t.cuentaId), fechaPago, paraNoGenerarIntereses: monto }]
      : [];
  });

  const hecho = {
    cuenta: h.cuentas.length > 0,
    categorias: h.categorias.some((x) => x.clase === 'normal'),
    sms: smsConectado,
  };
  const p = i.patrimonio;
  return {
    lpa: i.lpa.total,
    enCamino: i.lpa.dineroEnCamino,
    lpaNegativo: avisos.some((a) => a.aviso === 'AV-20'),
    reduccionProyectadaAlCierre: i.reduccionProyectada,
    atencion: {
      sobregiradas,
      faltaReservar: i.tarjetas
        .filter((t) => positivo(t.sinRespaldo))
        .map((t) => ({ tarjeta: nom.cuenta(t.tarjetaId), monto: t.sinRespaldo })),
      pagosExcedentes: celdas
        .filter((x) => x.clase === 'pago' && x.tarjetaId !== null && positivo(pagoExcedente(x)))
        .map((x) => {
          const t = x.tarjetaId as Uuid;
          return {
            tarjeta: nom.cuenta(t),
            monto: pagoExcedente(x),
            causas: causasDelExcedente(i, t),
          };
        }),
      reservaExcedente: i.tarjetas
        .filter((t) => positivo(t.reservaExcedente))
        .map((t) => ({ tarjeta: nom.cuenta(t.tarjetaId), monto: t.reservaExcedente })),
      proximosPagos: i.ocurrencias
        .filter((o) => o.fecha >= i.hoy && o.fecha <= limite)
        .flatMap(ocurrencia),
      pagosAtrasados: i.ocurrencias.filter((o) => o.fecha < i.hoy).flatMap(ocurrencia),
      metasVencidas: avisos
        .filter((a) => a.aviso === 'AV-17')
        .map((a) => ({
          categoria: nom.categoria(a.datos.categoriaId as Uuid),
          falta: a.datos.falta as Centavos,
        })),
      archivadasConDisponible: avisos
        .filter((a) => a.aviso === 'AV-14')
        .map((a) => ({
          categoria: nom.categoria(a.datos.categoriaId as Uuid),
          disponible: a.datos.monto as Centavos,
        })),
      pagosTarjetaProximos,
    },
    primerosPasos: hecho.cuenta && hecho.categorias && hecho.sms ? null : hecho,
    patrimonio: {
      activos: [p.saldosAFavor, p.inversiones, p.porCobrar].reduce(Centavos.sumar, p.efectivo),
      deudas: Centavos.sumar(p.deudasDeTarjeta, p.prestamos),
      neto: p.total,
    },
  };
}
