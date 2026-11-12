'use client';
// `/actividad/[transaccionId]/devolver` (FT-28, OP-33a; 05 §2.6): el monto devuelto, su reparto entre las partes de la compra con lo que
// queda en cada una, la fecha y la cuenta a la que vuelve. Flujo largo. Se guarda en un solo viaje (05 §4.4); el servidor pide confirmar
// con AV-01. No calcula montos (PF-3): lo que queda, el reparto distinto del total y el exceso por parte los dice el servidor.
import type { FechaLocal } from '@finn/dominio/valores';
import { lazy, Suspense, useState } from 'react';
import * as z from 'zod';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { SeleccionNativa, type OpcionNativa } from '../../componentes/base/seleccion-nativa';
import { EntradaFecha } from '../../componentes/formularios/entrada-fecha';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import type { VistaDeImpacto } from '../../componentes/formularios/lineas-impacto';
import { CerrarFlujoAlMontar, PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { formatearMontoTexto } from '../../formato';
import { normalizarMontoEscrito } from '../../formularios/normalizar-monto';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { formularios } from '../../textos/formularios';
import { registrarGasto as g } from '../../textos/registrar-gasto';
import { transaccion as t } from '../../textos/transaccion';
import { SinCapacidad, type ResumenDeCompra } from './sin-capacidad';

const ConfirmacionImpacto = lazy(() =>
  import('../../componentes/formularios/confirmacion-impacto-de-vista').then((m) => ({
    default: m.ConfirmacionImpactoDeVista,
  })),
);

export interface PropsFormularioDevolver {
  /** `devolver` (OP-33): la pone el lector, así el formulario se prueba sin servidor. */
  readonly accion: AccionEscritura;
  readonly transaccionId: string;
  readonly hoy: FechaLocal;
  /** Las partes de la compra; `queda` es lo que falta devolver en esa parte, ya formateado del DTO (PF-3). */
  readonly partes: readonly {
    readonly lineaId: string;
    readonly nombre: string;
    readonly queda: string;
    readonly sinCapacidad: boolean;
  }[];
  readonly cuentas: readonly OpcionNativa[];
  readonly cuentaDeLaCompra: string;
  readonly resumen: ResumenDeCompra;
  /** El detalle al que se vuelve al terminar (con su `?volver=`). */
  readonly detalle: string;
}

interface Campos {
  cuentaId: string;
  fecha: string;
  total: string;
  reparto: string[];
}

const ID = 'formulario-devolver';
const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
const montoValido = (s: string): boolean => normalizarMontoEscrito(s).estado === 'valido';
const esCero = (s: string): boolean => /^[0.,\s]*$/.test(s);
const contrato = z.object({
  cuentaId: z.string().min(1, g.elegirCuenta),
  fecha: z.string().min(1, g.completar),
  total: z.string().refine(montoValido, g.completar),
  reparto: z.array(z.string().refine((s) => esCero(s) || montoValido(s), g.completar)),
});
const monto = (s: string): string => {
  const r = normalizarMontoEscrito(s);
  return r.estado === 'valido' ? r.texto : s;
};

export function FormularioActividadDevolver(p: PropsFormularioDevolver) {
  const { accion, transaccionId, hoy, partes, detalle } = p;
  const enviar: AccionEscritura = (payload) => {
    const { modo, id, revisionVista, huellaImpacto, ...escrito } = payload as Record<
      string,
      unknown
    >;
    const c = escrito as unknown as Campos;
    const reparto = partes.flatMap((x, i) =>
      esCero(c.reparto[i] ?? '') ? [] : [{ lineaId: x.lineaId, monto: monto(c.reparto[i] ?? '') }],
    );
    return accion({
      transaccionOriginalId: transaccionId,
      fecha: c.fecha,
      total: monto(c.total),
      cuentaId: c.cuentaId,
      reparto,
      modo,
      id,
      ...(revisionVista === undefined ? {} : { revisionVista, huellaImpacto }),
    });
  };
  const operacion = useOperacion({ accion: enviar, creacion: true });
  const formulario = useFormularioFinn<Campos>({
    contrato,
    valoresIniciales: {
      cuentaId: p.cuentaDeLaCompra,
      fecha: hoy,
      total: '',
      reparto: partes.map(() => ''),
    },
    operacion,
  });
  const { setValue, formState } = formulario;
  const c = formulario.watch();
  const { estado, error: fallo } = operacion;
  const [rechazo, setRechazo] = useState<{ fallo: unknown; escrito: string }>();
  const vista = (operacion.previsualizacion ?? {}) as VistaDeImpacto & {
    readonly avisos?: readonly { readonly codigo: string }[];
  };
  const poner = (nombre: Parameters<typeof setValue>[0]) => (valor: string) => {
    setValue(nombre, valor as never, { shouldDirty: true, shouldValidate: formState.isSubmitted });
  };

  if (estado === 'listo') return <CerrarFlujoAlMontar rutaPadre={detalle} />;
  if (partes.every((x) => x.sinCapacidad))
    return (
      <PaginaFlujoDeRuta titulo={t.devolverTitulo} rutaPadre={detalle}>
        <SinCapacidad resumen={p.resumen} detalle={detalle} />
      </PaginaFlujoDeRuta>
    );

  // `devolucion_mayor_que_linea` dice lo que queda en la parte pasada: la parte cuyo «queda» está en el mensaje es la que se corrige
  const candidatas = partes.filter(
    (x) => fallo?.codigo === 'devolucion_mayor_que_linea' && fallo.mensaje.includes(x.queda),
  );
  const delError = candidatas.length === 1 ? candidatas[0] : undefined;
  // ACT-30: con el exceso en una parte, el botón espera a que se cambie ese monto y dice cuál corregir
  const escritoEnLaParte = c.reparto[delError === undefined ? -1 : partes.indexOf(delError)] ?? '';
  if (delError !== undefined && rechazo?.fallo !== fallo)
    setRechazo({ fallo, escrito: escritoEnLaParte });
  const parteSinCorregir = delError !== undefined && rechazo?.escrito === escritoEnLaParte;
  const error = (n: 'cuentaId' | 'fecha' | 'total'): string | undefined =>
    formState.errors[n]?.message;
  const guardar = (
    <Boton
      tipo="submit"
      form={ID}
      enviando={estado === 'enviando'}
      textoEnviando={t.guardando}
      deshabilitado={!operacion.enLinea || parteSinCorregir}
      className="w-full"
      {...(operacion.motivoSinEnvio !== undefined
        ? { motivoDeshabilitado: operacion.motivoSinEnvio }
        : parteSinCorregir && delError !== undefined
          ? { motivoDeshabilitado: t.corregiMonto(delError.nombre) }
          : {})}
    >
      {montoValido(c.total)
        ? t.registrarDevolucionMonto(formatearMontoTexto(c.total))
        : t.registrarDevolucion}
    </Boton>
  );

  return (
    <PaginaFlujoDeRuta
      titulo={t.devolverTitulo}
      rutaPadre={detalle}
      {...(estado === 'confirmando' ? {} : { acciones: guardar })}
    >
      {estado === 'confirmando' ? (
        <Suspense fallback={null}>
          <ConfirmacionImpacto
            titulo={t.revisar}
            {...(operacion.impactoCambio ? { nota: formularios.impactoCambio } : {})}
            vista={vista}
            avisos={(vista.avisos ?? []).map((a) => t.avisos[a.codigo] ?? a.codigo)}
            textoConfirmar={t.confirmar}
            textoVolver={t.volverAEditar}
            enviando={false}
            alConfirmar={() => void operacion.confirmar()}
            alVolver={operacion.volverAEditar}
          />
        </Suspense>
      ) : (
        <form
          id={ID}
          noValidate
          onSubmit={(e) => void formulario.enviar(e)}
          className="flex flex-col gap-6"
        >
          <AvisoEnLinea estado="informacion">{t.devolverNota}</AvisoEnLinea>
          <EntradaMonto
            nombre="total"
            etiqueta={t.montoDevuelto}
            valor={c.total}
            alCambiar={(v) => {
              poner('total')(v);
              // Una sola parte sigue al total: se copia el texto, no se calcula (PF-3)
              if (partes.length === 1) poner('reparto.0')(v);
            }}
            error={error('total')}
            requerido
            prefijo="$"
            sinVistaPrevia
          />
          <section aria-label={t.repartoEntrePartes} className="flex flex-col gap-2.5">
            <h2 className="flex min-h-11 items-center text-titulo-seccion">
              {t.repartoEntrePartes}
            </h2>
            <ul className="divide-y divide-borde-sutil rounded-contenedor bg-superficie shadow-elevacion-1">
              {partes.map((x, i) => (
                <li
                  key={x.lineaId}
                  data-linea={x.lineaId}
                  className="grid grid-cols-[minmax(0,1fr)_8rem] items-start gap-3 px-4 py-3"
                >
                  <span className="flex flex-col gap-0.5 pt-2.5">
                    <span className="font-semibold">{x.nombre}</span>
                    <span className="text-cuerpo-pequeno text-texto-secundario">
                      {t.quedanPorDevolver(x.queda)}
                    </span>
                  </span>
                  <EntradaMonto
                    nombre={`reparto.${i}`}
                    etiqueta={t.montoDe(x.nombre)}
                    valor={c.reparto[i] ?? ''}
                    alCambiar={poner(`reparto.${i}`)}
                    error={
                      x === delError && parteSinCorregir
                        ? fallo?.mensaje
                        : formState.errors.reparto?.[i]?.message
                    }
                    prefijo="$"
                    compacto
                    deshabilitado={x.sinCapacidad}
                  />
                </li>
              ))}
            </ul>
          </section>
          <div className="grid grid-cols-2 gap-2.5 [&>*]:min-w-0">
            <EntradaFecha
              nombre="fecha"
              etiqueta={g.fecha}
              valor={c.fecha as FechaLocal}
              alCambiar={poner('fecha')}
              error={error('fecha')}
              requerido
              sinVistaPrevia
              hoy={hoy}
            />
            <SeleccionNativa
              etiqueta={t.devolverA}
              alta
              marcador={g.elegirCuenta}
              opciones={p.cuentas}
              valor={c.cuentaId}
              alCambiar={poner('cuentaId')}
              error={error('cuentaId')}
            />
          </div>
          {estado === 'error' && fallo !== undefined && delError === undefined ? (
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
        </form>
      )}
    </PaginaFlujoDeRuta>
  );
}
