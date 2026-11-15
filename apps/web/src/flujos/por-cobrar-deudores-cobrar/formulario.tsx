'use client';
// «Cobrar varios» (05 §2 [CH-291], OP-31b), campos v3 como Cobrar (C-45). «Se cobra» solo se ve (`cobroEnOrden`, la regla del
// dominio, PF-3 [CH-291]): viajan el pago y las marcadas y el servidor reparte. Sin «Antes de guardar»; AV-01 pide confirmar.
import type { Centavos, FechaLocal } from '@finn/dominio/valores';
import { useRef, useState } from 'react';
import * as z from 'zod';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { GrupoCampos, MensajeError } from '../../componentes/base/campo';
import { Casilla } from '../../componentes/base/controles-fila';
import { Resultado } from '../../componentes/base/resultado';
import { SeleccionFila } from '../../componentes/base/seleccion-fila';
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

/** Un gasto abierto, ya formateado; `abiertoTexto` (decimal) es para el reparto que se ve. */
type Linea = { id: string; comercio: string; fecha: string; abierto: string; abiertoTexto: string };
export type LineaDeCobro = Readonly<Linea>;
type Cuenta = Readonly<{ id: string; nombre: string; detalle: string; tarjeta: boolean }>;

export type PropsFormularioCobrarVarios = Readonly<{
  hoy: FechaLocal;
  rutaPadre: string;
  deudorId: string;
  deudor: string;
  totalTexto: string;
  lineas: readonly LineaDeCobro[];
  cuentas: readonly Cuenta[];
}>;

/** La salida de OP-31b: lo que cobró de cada línea y el saldo con que quedó (vacía si ya estaba aplicada). */
type Cobros = readonly { lineaId: string; queda: Centavos }[];

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
  const opciones = { shouldDirty: true, shouldValidate: formState.isSubmitted };
  const poner = (n: 'total' | 'cuentaId' | 'fecha') => (valor: string) => {
    setValue(n, valor, opciones);
  };
  const error = (n: 'total' | 'cuentaId' | 'fecha'): string | undefined =>
    formState.errors[n]?.message;
  const { estado, error: fallo, exito } = operacion;
  const vista = (operacion.previsualizacion ?? {}) as VistaDeImpacto & {
    readonly avisos?: readonly { readonly codigo: string }[];
  };
  const total = normalizarMontoEscrito(c.total);
  const totalFormateado = total.estado === 'valido' ? formatearMontoTexto(total.texto) : undefined;
  const marcadas = lineas.filter((l) => c.marcadas.includes(l.id));
  const abiertos = marcadas.map(({ abiertoTexto }) => abiertoTexto);
  const montos = cobroEnOrden(c.total, abiertos);
  const parteDe = (id: string) => montos[marcadas.findIndex((l) => l.id === id)];
  const forma = useRef<HTMLFormElement>(null);
  useFocoAlPrimerError(forma, formState.submitCount);
  const motivo =
    operacion.motivoSinEnvio ??
    (c.marcadas.length === 0 ? v.marcarUno : motivoQueFalta(contrato, c));

  if (estado === 'listo' && exito !== undefined) {
    const { cobros } = exito.valor as { readonly cobros: Cobros };
    const cerradas = cobros.filter((x) => x.queda <= 0).length;
    const parcial = cobros.find((x) => x.queda > 0);
    const comercio = lineas.find((l) => l.id === parcial?.lineaId)?.comercio;
    const partes = [
      ...(cerradas > 0 ? [v.cerraste(cerradas)] : []),
      ...(parcial && comercio ? [v.queda(comercio, formatearMonto(parcial.queda))] : []),
    ];
    const monto = totalFormateado ?? c.total;
    const texto =
      cobros.length === 0
        ? t.guardado(monto, deudor)
        : `${v.cobraste(monto, deudor)}${partes.length > 0 ? `: ${partes.join('; ')}` : ''}`;
    return (
      <PaginaFlujoDeRuta titulo={t.tituloListo} rutaPadre={rutaPadre}>
        <div className="flex flex-col gap-4">
          <Resultado texto={texto} />
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
              const parte = parteDe(l.id);
              const datos = `${l.fecha} · ${v.abierto(l.abierto)}`;
              return (
                <Casilla
                  key={l.id}
                  etiqueta={l.comercio}
                  descripcion={
                    parte === undefined ? datos : `${datos} · ${v.seCobra(formatearMonto(parte))}`
                  }
                  cifra={l.abierto}
                  marcada={c.marcadas.includes(l.id)}
                  alCambiar={(si) => {
                    const otras = c.marcadas.filter((x) => x !== l.id);
                    setValue('marcadas', si ? [...otras, l.id] : otras, opciones);
                  }}
                />
              );
            })}
          </GrupoCampos>
          {formState.errors.marcadas?.message === undefined ? null : (
            <MensajeError>{formState.errors.marcadas.message}</MensajeError>
          )}
          {estado === 'error' && fallo !== undefined ? (
            <AvisoEnLinea
              estado="problema"
              aparecioDespues
              {...(REINTENTABLES.includes(fallo.categoria)
                ? {
                    accion: (
                      <Boton variante="secundaria" onClick={() => void operacion.reintentar()}>
                        {formularios.intentarDeNuevo}
                      </Boton>
                    ),
                  }
                : {})}
            >
              {fallo.mensaje}
            </AvisoEnLinea>
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
