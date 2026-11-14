'use client';
// `/por-cobrar/deudores/[deudorId]/cobrar` (05 §2 [CH-291], OP-31b): «Cobrar varios», un pago del deudor repartido entre sus
// gastos abiertos. Campos v3 como Cobrar (C-45): el monto es el billete, precargado con el total abierto; cuenta y fecha en un
// grupo; y los gastos, del más antiguo al más nuevo, todos marcados al abrir, cada uno con «Se cobra {monto}» según el reparto.
// Ese reparto solo se ve (`cobroEnOrden`, la regla del dominio): el servidor reparte de nuevo y manda. Un solo viaje, sin «Antes
// de guardar»; el servidor pide confirmar solo con AV-01. El resultado dice cuánto cobró y qué quedó, con lo que devolvió.
import type { ErrorFinn } from '@finn/aplicacion/errores';
import type { Centavos, FechaLocal } from '@finn/dominio/valores';
import { useRef, useState } from 'react';
import * as z from 'zod';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { GrupoCampos, MensajeError } from '../../componentes/base/campo';
import { Casilla } from '../../componentes/base/controles-fila';
import { Resultado } from '../../componentes/base/resultado';
import { SeleccionFila } from '../../componentes/base/seleccion-fila';
import { Vacio } from '../../componentes/base/vacio';
import { ConfirmacionImpactoDeVista } from '../../componentes/formularios/confirmacion-impacto-de-vista';
import { EntradaFecha } from '../../componentes/formularios/entrada-fecha';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import type { VistaDeImpacto } from '../../componentes/formularios/lineas-impacto';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { formatearMonto, formatearMontoTexto } from '../../formato';
import { motivoQueFalta, useFocoAlPrimerError } from '../../formularios/motivo-v3';
import { normalizarMontoEscrito } from '../../formularios/normalizar-monto';
import { centavosEscritos, cobroEnOrden } from '../../formularios/reparto';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { cobrarVarios } from '../../servidor/acciones/eventos';
import { base } from '../../textos/base';
import { formularios } from '../../textos/formularios';
import { porCobrarCobrar as t, porCobrarCobrarVarios as v } from '../../textos/por-cobrar-cobrar';
import { PieDeHoja } from '../pie-de-hoja';

export interface LineaDeCobro {
  readonly id: string;
  readonly comercio: string;
  /** Fecha y saldo abierto ya formateados; el saldo también en texto decimal para el reparto que se ve. */
  readonly fecha: string;
  readonly abierto: string;
  readonly abiertoTexto: string;
  /** La tarjeta de la compra si hay propuesta AV-22. */
  readonly tarjeta: string | undefined;
}

export interface PropsFormularioCobrarVarios {
  readonly hoy: FechaLocal;
  readonly rutaPadre: string;
  readonly deudorId: string;
  readonly deudor: string;
  readonly totalTexto: string;
  readonly lineas: readonly LineaDeCobro[];
  readonly cuentas: readonly {
    readonly id: string;
    readonly nombre: string;
    readonly detalle: string;
    readonly tarjeta: boolean;
  }[];
}

/** Lo que devuelve OP-31b: cada cobro con lo que cobró y el saldo con que quedó la línea (vacío si ya estaba aplicada). */
interface Salida {
  readonly cobros: readonly {
    readonly lineaId: string;
    readonly monto: Centavos;
    readonly queda: Centavos;
  }[];
}

const contrato = z
  .object({
    total: z.string(),
    cuentaId: z.string(),
    fecha: z.string(),
    marcadas: z.array(z.string()),
  })
  .superRefine((c, ctx) => {
    const falta = (path: string, message: string) => {
      ctx.addIssue({ code: 'custom', path: [path], message });
    };
    if (centavosEscritos(c.total) <= 0) falta('total', base.montoMayorQueCero);
    if (c.cuentaId === '') falta('cuentaId', t.elegirCuenta);
    if (c.fecha === '') falta('fecha', t.completar);
    if (c.marcadas.length === 0) falta('marcadas', v.marcarUno);
  });
type Campos = z.infer<typeof contrato>;

const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
const ENLACE =
  'inline-flex min-h-11 items-center font-semibold text-enlace focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

export function FormularioCobrarVarios(props: PropsFormularioCobrarVarios) {
  const { hoy, rutaPadre, deudor } = props;
  // Lo que vio el usuario al abrir (FE-09): guardar refresca la ruta y el resultado no debe perderse.
  const [lineas] = useState(props.lineas);
  const [cuentas] = useState(props.cuentas);
  const [inicial] = useState<Campos>(() => ({
    total: props.totalTexto,
    cuentaId: cuentas.find((x) => !x.tarjeta)?.id ?? '',
    fecha: hoy,
    marcadas: lineas.map((l) => l.id),
  }));
  const enviar: AccionEscritura = (payload) => {
    const { modo, id, revisionVista, huellaImpacto, ...resto } = payload as Record<string, unknown>;
    const c = resto as Campos;
    const total = normalizarMontoEscrito(c.total);
    return cobrarVarios({
      deudorId: props.deudorId,
      lineaIds: lineas.filter((l) => c.marcadas.includes(l.id)).map((l) => l.id),
      cuentaId: c.cuentaId,
      fecha: c.fecha,
      total: total.estado === 'valido' ? total.texto : c.total,
      modo,
      id,
      ...(revisionVista === undefined ? {} : { revisionVista, huellaImpacto }),
    });
  };
  const operacion = useOperacion({ accion: enviar, creacion: true });
  const formulario = useFormularioFinn<Campos>({ contrato, valoresIniciales: inicial, operacion });
  const { setValue, formState } = formulario;
  const c = formulario.watch();
  const poner = (n: 'total' | 'cuentaId' | 'fecha') => (valor: string) => {
    setValue(n, valor, { shouldDirty: true, shouldValidate: formState.isSubmitted });
  };
  const marcar = (id: string, si: boolean) => {
    const marcadas = lineas.filter((l) => (l.id === id ? si : c.marcadas.includes(l.id)));
    setValue(
      'marcadas',
      marcadas.map((l) => l.id),
      { shouldDirty: true, shouldValidate: formState.isSubmitted },
    );
  };
  const error = (n: keyof Campos): string | undefined => formState.errors[n]?.message;
  const { estado, error: fallo, exito } = operacion;
  const vista = (operacion.previsualizacion ?? {}) as VistaDeImpacto & {
    readonly avisos?: readonly { readonly codigo: string }[];
  };
  const total = normalizarMontoEscrito(c.total);
  const totalFormateado = total.estado === 'valido' ? formatearMontoTexto(total.texto) : undefined;
  // El reparto que se ve: las marcadas en el orden del servidor, con la regla del dominio
  const marcadas = lineas.filter((l) => c.marcadas.includes(l.id));
  const reparto = new Map(
    cobroEnOrden(
      c.total,
      marcadas.map((l) => l.abiertoTexto),
    ).map((m, i) => [marcadas[i]?.id, m]),
  );
  const forma = useRef<HTMLFormElement>(null);
  useFocoAlPrimerError(forma, formState.submitCount);
  const motivo =
    operacion.motivoSinEnvio ??
    (c.marcadas.length === 0 ? v.marcarUno : motivoQueFalta(contrato, c));

  if (lineas.length === 0)
    return (
      <PaginaFlujoDeRuta titulo={t.tituloGenerico} rutaPadre={rutaPadre}>
        <Vacio titulo={t.sinSaldoTitulo} texto={v.sinGastosTexto} icono="cero" />
      </PaginaFlujoDeRuta>
    );

  if (estado === 'listo' && exito !== undefined) {
    const { cobros } = exito.valor as Salida;
    const cerradas = cobros.filter((x) => x.queda <= 0).length;
    const parcial = cobros.find((x) => x.queda > 0);
    const comercio = lineas.find((l) => l.id === parcial?.lineaId)?.comercio;
    const partes = [
      ...(cerradas > 0 ? [v.cerraste(cerradas)] : []),
      ...(parcial === undefined || comercio === undefined
        ? []
        : [v.queda(comercio, formatearMonto(parcial.queda))]),
    ];
    const monto = totalFormateado ?? c.total;
    const texto =
      cobros.length === 0
        ? t.guardado(monto, deudor)
        : `${v.cobraste(monto, deudor)}${partes.length > 0 ? `: ${partes.join('; ')}` : ''}`;
    // AV-22 (como en Cobrar): un gasto con tarjeta cobrado en efectivo puede reservarse para su tarjeta
    const tarjeta = exito.avisos.some((a) => a.codigo === 'AV-22')
      ? lineas.find((l) => l.tarjeta !== undefined && cobros.some((x) => x.lineaId === l.id))
          ?.tarjeta
      : undefined;
    return (
      <PaginaFlujoDeRuta titulo={t.tituloListo} rutaPadre={rutaPadre}>
        <div className="flex flex-col gap-4">
          <div data-resultado-flujo="cobrar-varios">
            <Resultado texto={texto} />
          </div>
          {tarjeta === undefined ? null : (
            <AvisoEnLinea estado="informacion" aparecioDespues>
              {t.avisoAV22(tarjeta)}
            </AvisoEnLinea>
          )}
          <EnlaceFinn href={rutaPadre} className={ENLACE}>
            {t.volver}
          </EnlaceFinn>
        </div>
      </PaginaFlujoDeRuta>
    );
  }

  return (
    <PaginaFlujoDeRuta titulo={t.titulo(deudor)} rutaPadre={rutaPadre}>
      {estado === 'confirmando' ? (
        <ConfirmacionImpactoDeVista
          titulo={t.revisar}
          {...(operacion.impactoCambio ? { nota: formularios.impactoCambio } : {})}
          vista={vista}
          avisos={
            (vista.avisos ?? []).some((a) => a.codigo === 'AV-01') ? [t.avisoPeriodoCerrado] : []
          }
          textoConfirmar={t.confirmar}
          textoVolver={t.volverAEditar}
          enviando={false}
          alConfirmar={() => void operacion.confirmar()}
          alVolver={operacion.volverAEditar}
        />
      ) : (
        <form
          ref={forma}
          onSubmit={(e) => void formulario.enviar(e)}
          noValidate
          className="flex flex-col gap-5"
        >
          <EntradaMonto
            nombre="total"
            etiqueta={t.monto}
            variante="total"
            valor={c.total}
            alCambiar={poner('total')}
            error={error('total')}
            requerido
          />
          <GrupoCampos>
            <SeleccionFila
              etiqueta={t.cuenta}
              marcador={t.marcadorCuenta}
              opciones={cuentas.map((x) => ({
                valor: x.id,
                etiqueta: x.nombre,
                detalle: x.detalle,
              }))}
              valor={c.cuentaId}
              alCambiar={poner('cuentaId')}
              error={error('cuentaId')}
            />
            <EntradaFecha
              nombre="fecha"
              etiqueta={t.fecha}
              valor={c.fecha as FechaLocal}
              alCambiar={poner('fecha')}
              maxima={hoy}
              hoy={hoy}
              error={error('fecha')}
              requerido
              sinVistaPrevia
            />
          </GrupoCampos>
          <GrupoCampos etiqueta={v.gastos}>
            {lineas.map((l) => {
              const parte = reparto.get(l.id);
              return (
                <Casilla
                  key={l.id}
                  etiqueta={l.comercio}
                  descripcion={
                    parte === undefined
                      ? `${l.fecha} · ${v.abierto(l.abierto)}`
                      : `${l.fecha} · ${v.abierto(l.abierto)} · ${v.seCobra(formatearMonto(parte))}`
                  }
                  cifra={l.abierto}
                  marcada={c.marcadas.includes(l.id)}
                  alCambiar={(si) => {
                    marcar(l.id, si);
                  }}
                />
              );
            })}
          </GrupoCampos>
          {formState.errors.marcadas?.message === undefined ? null : (
            <MensajeError>{formState.errors.marcadas.message}</MensajeError>
          )}
          {estado === 'error' && fallo !== undefined ? (
            <AvisoDeError fallo={fallo} alReintentar={() => void operacion.reintentar()} />
          ) : null}
          <PieDeHoja rutaPadre={rutaPadre} superpuesto={false}>
            <Boton
              tipo="submit"
              enviando={estado === 'enviando'}
              textoEnviando={v.guardando}
              deshabilitado={!operacion.enLinea}
              apagado={motivo !== undefined}
              className="w-full"
              {...(motivo === undefined ? {} : { motivoDeshabilitado: motivo })}
            >
              {totalFormateado === undefined ? v.guardar : v.guardarMonto(totalFormateado)}
            </Boton>
          </PieDeHoja>
        </form>
      )}
    </PaginaFlujoDeRuta>
  );
}

/** Los errores del servidor junto al resumen, como en Cobrar; los que se pueden reintentar llevan «Intentar de nuevo». */
function AvisoDeError({
  fallo,
  alReintentar,
}: {
  readonly fallo: ErrorFinn;
  readonly alReintentar: () => void;
}) {
  return (
    <AvisoEnLinea
      estado="problema"
      aparecioDespues
      {...(REINTENTABLES.includes(fallo.categoria)
        ? {
            accion: (
              <Boton variante="secundaria" onClick={alReintentar}>
                {formularios.intentarDeNuevo}
              </Boton>
            ),
          }
        : {})}
    >
      {fallo.mensaje}
    </AvisoEnLinea>
  );
}
