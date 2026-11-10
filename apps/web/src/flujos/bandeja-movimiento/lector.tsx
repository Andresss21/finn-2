// Lector de `/bandeja/[movimientoId]` (05 §2.5): llama a `formulario({ operacion: 'movimiento', movimientoId })` y pasa al
// flujo el movimiento con los catálogos de cuentas, categorías y personas. Lo único que traduce los errores de la consulta
// es `consultar()`.
import type { ReactNode } from 'react';
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { formatearFechaTexto, formatearMonto } from '../../formato';
import { vistaDe } from '../../componentes/dominio/vista-movimiento';
import { registrarGasto as g } from '../../textos/registrar-gasto';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { aCandidata } from './campos';
import { FormularioMovimiento } from './formulario';
import type { NavegacionDelPanel } from './panel-navegacion';

export async function LectorMovimiento({
  movimientoId,
  traspaso,
  categoriaSoltada,
  lateral,
  navegacion,
}: {
  readonly movimientoId: string;
  /** Viene de la fila de la lista, que no pudo aprobar con un toque (05 §4.15). */
  readonly traspaso: boolean;
  /** Viene de un arrastre (FT-78): la categoría soltada, que el flujo pone en la línea y envía con la variante de OP-37. */
  readonly categoriaSoltada?: string;
  /** Computadora: la lista de la Bandeja a la izquierda y el lugar del movimiento en ella (CH-137). */
  readonly lateral?: ReactNode;
  readonly navegacion?: NavegacionDelPanel;
}) {
  const dto = await consultar(async () =>
    formulario(await depsDeConsulta(), { operacion: 'movimiento', movimientoId }),
  );
  const m = dto.contexto.movimiento;
  // El detalle del campo cerrado es del DTO tal cual (S5): el saldo de efectivo o la deuda de la tarjeta; no se calcula nada.
  const cuentas = [
    ...(dto.catalogos.cuentas?.efectivo ?? []).map((x) => ({
      id: x.cuenta.id,
      nombre: x.cuenta.nombre,
      tipo: 'efectivo' as const,
      detalle: g.saldoDeCuenta(formatearMonto(x.saldo)),
    })),
    ...(dto.catalogos.cuentas?.tarjetas ?? []).map((x) => ({
      id: x.cuenta.id,
      nombre: x.cuenta.nombre,
      tipo: 'tarjeta' as const,
      detalle: g.deudaDeCuenta(formatearMonto(x.deuda)),
    })),
  ];
  const categorias = (dto.catalogos.categorias?.grupos ?? []).flatMap((g) =>
    g.categorias.map((x) => ({ id: x.categoria.id, nombre: x.categoria.nombre })),
  );
  const deudores = (dto.catalogos.deudores ?? []).map((x) => ({
    id: x.deudor.id,
    nombre: x.deudor.nombre,
  }));
  return (
    <FormularioMovimiento
      movimiento={{
        id: m.id,
        estado: m.estado,
        sms: m.sms.texto,
        ...(m.estado !== 'error' || m.procesamiento.errorDetalle === undefined
          ? {}
          : { errorDetalle: m.procesamiento.errorDetalle }),
        esperado: m.esperado,
        nota: m.nota,
        ...(m.duplicado === undefined
          ? {}
          : { duplicado: { ...m.duplicado, cuenta: m.duplicado.cuenta?.nombre ?? null } }),
        ...(m.estado === 'error'
          ? { reproceso: { smsId: m.sms.id, intentoVisto: m.procesamiento.intento } }
          : {}),
        resumen: {
          vista:
            m.estado === 'aprobado' || m.estado === 'descartado' || m.estado === 'autodescartado'
              ? 'listo'
              : vistaDe({ estado: m.estado, aprobacion: m.aprobacion }),
          comercio: m.comercio,
          monto: m.monto,
          // Solo un gasto y un pago de tarjeta sacan dinero: el signo sale del tipo del servidor, nunca se deduce (PF-3)
          sale: m.tipoPropuesto === 'gasto' || m.tipoPropuesto === 'pago_tarjeta',
          cuenta: m.cuenta?.nombre ?? null,
          fecha: m.fecha,
          sugerida:
            m.categoriaSugerida === null
              ? null
              : { nombre: m.categoriaSugerida.nombre, porRegla: m.categoriaSugerida.porRegla },
        },
        ...(m.coincidencia === undefined
          ? {}
          : {
              coincidencia: {
                programada: m.coincidencia.programada.nombre,
                fecha: formatearFechaTexto(m.coincidencia.fechaEsperada),
                monto: formatearMonto(m.coincidencia.montoEsperado),
                registrada: m.coincidencia.ocurrencia === 'registrada',
              },
            }),
        ...(m.origenPropuesto === undefined ? {} : { origenId: m.origenPropuesto.id }),
      }}
      cuentas={cuentas}
      categorias={categorias}
      deudores={deudores}
      // CH-226: «Hoy» y «Ayer» son fechas de negocio del servidor; las candidatas, las de una devolución (CH-30)
      hoy={dto.hoy}
      candidatas={('candidatas' in dto.contexto ? (dto.contexto.candidatas ?? []) : []).map(
        aCandidata,
      )}
      traspaso={traspaso}
      {...(categoriaSoltada !== undefined && categorias.some((c) => c.id === categoriaSoltada)
        ? { categoriaSoltada }
        : {})}
      {...(lateral === undefined ? {} : { lateral })}
      {...(navegacion === undefined ? {} : { navegacion })}
    />
  );
}
