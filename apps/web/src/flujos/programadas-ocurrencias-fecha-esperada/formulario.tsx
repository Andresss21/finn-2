'use client';
// `/programadas/[programadaId]/ocurrencias/[fechaEsperada]` (FT-41, OP-43 y OP-44; 05 §2, §4.4): registrar con un toque la ocurrencia, con
// los campos editables de su tipo, u omitirla. La fecha es la esperada (B-12); con un período cerrado el servidor pide AV-01. No calcula
// montos (PF-3). Las Server Actions de OP-43 y OP-44 las pasa el lector, así el formulario se prueba sin servidor.
import { useMemo, useState, type ReactNode } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Resultado } from '../../componentes/base/resultado';
import { ConfirmacionImpactoDeVista as ConfirmacionImpacto } from '../../componentes/formularios/confirmacion-impacto-de-vista';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import {
  PaginaFlujoDeRuta,
  SuperpuestoDeRuta,
  useCerrarFlujo,
} from '../../componentes/navegacion/flujo-de-ruta';
import { formatearFecha, formatearFechaTexto, formatearMontoTexto } from '../../formato';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { formularios } from '../../textos/formularios';
import { programadas } from '../../textos/programadas';
import { TablaDatos } from '../bandeja-movimiento/piezas';
import { aEntradaDeAccion, contratoDe, type Campos, type Edicion, type Parte } from './campos';
import { OcurrenciaResuelta } from './resuelta';

const t = programadas.ocurrencia;
const RUTA_PADRE = '/programadas';
const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
const DESGLOSE = ['capital', 'interes', 'seguro'] as const;

export interface PropsFormularioOcurrencia {
  readonly programadaId: string;
  readonly fechaEsperada: string;
  readonly comercio: string;
  readonly cuenta: string;
  readonly estado: 'pendiente' | 'emparejada' | 'registrada' | 'omitida';
  readonly transaccionId: string | null;
  readonly textoYaResuelta: string;
  readonly edicion: Edicion;
  readonly monto: string;
  readonly partes: readonly Parte[];
  readonly montosDePartes: readonly string[];
  readonly desglose: Readonly<Record<(typeof DESGLOSE)[number], string>> | null;
  readonly superpuesto: boolean;
  readonly accionRegistrar: AccionEscritura;
  readonly accionOmitir: AccionEscritura;
}

function Marco({
  p,
  children,
}: {
  readonly p: PropsFormularioOcurrencia;
  readonly children: ReactNode;
}) {
  const titulo = t.titulo(p.comercio, formatearFechaTexto(p.fechaEsperada));
  return p.superpuesto ? (
    <SuperpuestoDeRuta titulo={titulo}>{children}</SuperpuestoDeRuta>
  ) : (
    <PaginaFlujoDeRuta titulo={titulo} rutaPadre={RUTA_PADRE}>
      {children}
    </PaginaFlujoDeRuta>
  );
}

function Pendiente({ p }: { readonly p: PropsFormularioOcurrencia }) {
  const { edicion, programadaId, fechaEsperada, partes } = p;
  const cerrar = useCerrarFlujo(RUTA_PADRE, p.superpuesto);
  const registrar = useOperacion({
    accion: (payload) =>
      p.accionRegistrar(aEntradaDeAccion(edicion, programadaId, fechaEsperada, partes, payload)),
    creacion: true,
  });
  const omitir = useOperacion({ accion: p.accionOmitir });
  const formulario = useFormularioFinn<Campos>({
    contrato: useMemo(() => contratoDe(edicion), [edicion]),
    valoresIniciales: {
      monto: p.monto,
      partes: [...p.montosDePartes],
      capital: p.desglose?.capital ?? '',
      interes: p.desglose?.interes ?? '',
      seguro: p.desglose?.seguro ?? '',
    },
    operacion: registrar,
  });
  const { setValue, formState } = formulario;
  const c = formulario.watch();
  const poner =
    (n: 'monto' | 'capital' | 'interes' | 'seguro' | `partes.${number}`) => (v: string) => {
      setValue(n, v, { shouldDirty: true, shouldValidate: formState.isSubmitted });
    };
  const monto = edicion === 'partes' ? null : formatearMontoTexto(c.monto);

  const listo = registrar.estado === 'listo' || omitir.estado === 'listo';
  if (listo) {
    const salida = registrar.exito?.valor as { id?: string } | undefined;
    return (
      <Marco p={p}>
        <div className="flex flex-col gap-4">
          <Resultado
            texto={
              registrar.estado === 'listo'
                ? t.registrado(
                    p.comercio,
                    monto ?? formatearMontoTexto(c.partes[0] ?? '0'),
                    p.cuenta,
                  )
                : t.omitido(p.comercio, formatearFechaTexto(fechaEsperada))
            }
            {...(salida?.id === undefined
              ? {}
              : {
                  enlace: (
                    <EnlaceFinn href={`/actividad/${salida.id}`}>{t.verTransaccion}</EnlaceFinn>
                  ),
                })}
          />
          <Boton variante="secundaria" onClick={cerrar} className="w-full">
            {t.cerrar}
          </Boton>
        </div>
      </Marco>
    );
  }
  if (registrar.estado === 'confirmando') {
    const vista = (registrar.previsualizacion ?? {}) as Parameters<
      typeof ConfirmacionImpacto
    >[0]['vista'] & {
      readonly avisos?: readonly { readonly codigo: string }[];
    };
    return (
      <Marco p={p}>
        <ConfirmacionImpacto
          titulo={t.revisar}
          {...(registrar.impactoCambio ? { nota: formularios.impactoCambio } : {})}
          vista={vista}
          avisos={(vista.avisos ?? []).map((a) =>
            a.codigo === 'AV-01' ? t.avisoPeriodoCerrado : a.codigo,
          )}
          textoConfirmar={t.confirmar}
          textoVolver={t.volverAEditar}
          enviando={false}
          alConfirmar={() => void registrar.confirmar()}
          alVolver={registrar.volverAEditar}
        />
      </Marco>
    );
  }

  const fallo = registrar.estado === 'error' ? registrar.error : omitir.error;
  const reintento = registrar.estado === 'error' ? registrar.reintentar : omitir.reintentar;
  const enviando = registrar.estado === 'enviando' || omitir.estado === 'enviando';
  const campo = (n: 'monto' | 'capital' | 'interes' | 'seguro', etiqueta: string) => (
    <EntradaMonto
      key={n}
      nombre={n}
      etiqueta={etiqueta}
      valor={c[n]}
      alCambiar={poner(n)}
      error={formState.errors[n]?.message}
      requerido
      prefijo="$"
      sinVistaPrevia
    />
  );
  return (
    <Marco p={p}>
      <form onSubmit={(e) => void formulario.enviar(e)} noValidate className="flex flex-col gap-5">
        <TablaDatos
          filas={[
            [t.fechaEsperada, formatearFecha(fechaEsperada)],
            [t.cuenta, p.cuenta],
            ...(partes.length === 1 ? [[t.categoria, partes[0]?.categoria ?? ''] as const] : []),
          ]}
        />
        {edicion === 'partes'
          ? partes.map((parte, i) => (
              <EntradaMonto
                key={parte.categoriaId}
                nombre={`partes.${i}`}
                etiqueta={parte.categoria}
                valor={c.partes[i] ?? ''}
                alCambiar={poner(`partes.${i}`)}
                error={formState.errors.partes?.[i]?.message}
                requerido
                prefijo="$"
                sinVistaPrevia
              />
            ))
          : campo('monto', t.monto)}
        {edicion === 'cuota' ? (
          <>
            <p className="text-cuerpo-pequeno text-texto-secundario">
              {p.desglose === null ? t.sinDesglose : t.desgloseDelModelo}
            </p>
            {DESGLOSE.map((n) => campo(n, t[n]))}
          </>
        ) : null}
        <p className="text-cuerpo-pequeno text-texto-secundario">{t.notaOmitir}</p>
        {fallo !== undefined ? (
          <AvisoEnLinea
            estado="problema"
            aparecioDespues
            {...(REINTENTABLES.includes(fallo.categoria)
              ? {
                  accion: (
                    <Boton variante="secundaria" onClick={() => void reintento()}>
                      {formularios.intentarDeNuevo}
                    </Boton>
                  ),
                }
              : {})}
          >
            {fallo.mensaje}
          </AvisoEnLinea>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <Boton
            variante="secundaria"
            enviando={omitir.estado === 'enviando'}
            textoEnviando={t.omitiendo}
            deshabilitado={!omitir.enLinea || enviando}
            onClick={() => {
              void omitir.enviar({ programadaId, fechaEsperada });
            }}
          >
            {t.omitir}
          </Boton>
          <Boton
            tipo="submit"
            enviando={registrar.estado === 'enviando'}
            textoEnviando={t.registrando}
            deshabilitado={!registrar.enLinea || enviando}
            {...(registrar.motivoSinEnvio === undefined
              ? {}
              : { motivoDeshabilitado: registrar.motivoSinEnvio })}
          >
            {monto === null ? t.registrar : t.registrarMonto(monto)}
          </Boton>
        </div>
      </form>
    </Marco>
  );
}

export function FormularioOcurrencia(p: PropsFormularioOcurrencia) {
  const cerrar = useCerrarFlujo(RUTA_PADRE, p.superpuesto);
  // Al registrar u omitir, la revalidación trae la ocurrencia ya resuelta: lo que se ve sigue siendo lo del flujo que se abrió.
  const [estadoAlAbrir] = useState(p.estado);
  if (estadoAlAbrir === 'pendiente') return <Pendiente p={p} />;
  const omitida = p.estado === 'omitida';
  return (
    <Marco p={p}>
      <OcurrenciaResuelta
        texto={omitida ? t.omitida : p.textoYaResuelta}
        transaccionId={omitida ? null : p.transaccionId}
        fechaEsperada={p.fechaEsperada}
        cuenta={p.cuenta}
        alCerrar={cerrar}
      />
    </Marco>
  );
}
