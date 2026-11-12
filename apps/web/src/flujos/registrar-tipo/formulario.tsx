'use client';
// `/registrar/ingreso` y `/registrar/transferencia` (FT-22 y FT-23, OP-21 y OP-22; 05 §2.4): los flujos cortos de registrar un
// ingreso y de mover dinero entre dos cuentas de efectivo. Se guardan en un solo viaje (05 §4.4); con la fecha en un período
// cerrado el servidor pide confirmar con AV-01 antes de escribir. No calcula montos (PF-3): el impacto lo trae el servidor.
import type { ErrorFinn } from '@finn/aplicacion/errores';
import type { FechaLocal } from '@finn/dominio/valores';
import { useMemo, type ReactNode } from 'react';
import type { VistaDeImpacto } from '../../componentes/formularios/lineas-impacto';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { NotaFija } from './nota-fija';
import { Boton } from '../../componentes/base/boton';
import { EntradaTexto } from '../../componentes/base/campo';
import { Resultado } from '../../componentes/base/resultado';
import { Seleccion } from '../../componentes/base/seleccion';
import { Vacio } from '../../componentes/base/vacio';
import { ConfirmacionImpactoDeVista as ConfirmacionImpacto } from '../../componentes/formularios/confirmacion-impacto-de-vista';
import { EntradaFecha } from '../../componentes/formularios/entrada-fecha';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { PaginaFlujoDeRuta, SuperpuestoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { formatearMontoTexto } from '../../formato';
import type { ValoresDeUrl } from '../../formularios/valores-de-url';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { registrarIngreso, transferirEntreCuentas } from '../../servidor/acciones/transacciones';
import { formularios } from '../../textos/formularios';
import { registrarTipo as t } from '../../textos/registrar-tipo';
import {
  aEntradaDeAccion,
  contratoDe,
  valoresIniciales,
  type Campos,
  type TipoDeRegistro,
} from './campos';

export interface PropsFormularioRegistrarTipo {
  readonly tipo: TipoDeRegistro;
  readonly hoy: FechaLocal;
  readonly cuentas: readonly { readonly id: string; readonly nombre: string }[];
  readonly cuentaPropuesta: string | undefined;
  /** Interceptado sobre la pantalla de origen (05 §1.4): hoja o panel; sin él, página completa. */
  readonly superpuesto?: boolean;
  /** `?fecha=`, `?total=` y `?comercio=` de la propuesta de ajuste de AV-21 (CH-212). */
  readonly desdeUrl?: ValoresDeUrl;
}

interface Previsualizacion extends VistaDeImpacto {
  readonly avisos?: readonly { readonly codigo: string }[];
}

const SIN_VALORES: ValoresDeUrl = {};
export const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
const ACCIONES = { ingreso: registrarIngreso, transferencia: transferirEntreCuentas } as const;
/** Un enlace con el aspecto de un botón principal (05 §10.7): al menos 44 px de alto (05 §11.5). */
export const ENLACE =
  'inline-flex min-h-12 items-center justify-center rounded-control bg-accion px-5 font-semibold text-texto-sobre-accion focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
/** Un rechazo cuyo mensaje ya se muestra en su campo no se repite como aviso del formulario. */
export const enSuCampo = (e: ErrorFinn): boolean =>
  Object.values(e.campos ?? {}).includes(e.mensaje);

/** El marco del flujo: el superpuesto de la ruta interceptada o la página completa. */
export function Marco({
  superpuesto,
  titulo,
  children,
}: {
  readonly superpuesto: boolean;
  readonly titulo: string;
  readonly children: ReactNode;
}) {
  return superpuesto ? (
    <SuperpuestoDeRuta titulo={titulo}>{children}</SuperpuestoDeRuta>
  ) : (
    <PaginaFlujoDeRuta titulo={titulo} rutaPadre="/registrar">
      {children}
    </PaginaFlujoDeRuta>
  );
}

export function FormularioRegistrarTipo({
  tipo,
  hoy,
  cuentas,
  cuentaPropuesta,
  superpuesto = false,
  desdeUrl = SIN_VALORES,
}: PropsFormularioRegistrarTipo) {
  const esIngreso = tipo === 'ingreso';
  const titulo = esIngreso ? t.tituloIngreso : t.tituloTransferencia;
  const enviar: AccionEscritura = (payload) => ACCIONES[tipo](aEntradaDeAccion(tipo, payload));
  const operacion = useOperacion({ accion: enviar, creacion: true });
  const inicial = useMemo(
    () => valoresIniciales(hoy, cuentaPropuesta, desdeUrl),
    [hoy, cuentaPropuesta, desdeUrl],
  );
  const contrato = useMemo(() => contratoDe(tipo), [tipo]);
  const formulario = useFormularioFinn<Campos>({
    contrato,
    valoresIniciales: inicial,
    operacion,
  });
  const { setValue, formState } = formulario;
  const c = formulario.watch();
  const poner = (n: keyof Campos) => (valor: string) => {
    setValue(n, valor as never, { shouldDirty: true, shouldValidate: formState.isSubmitted });
  };
  const error = (n: keyof Campos): string | undefined => formState.errors[n]?.message;
  const conError = (n: keyof Campos): { error?: string } => {
    const mensaje = error(n);
    return mensaje === undefined ? {} : { error: mensaje };
  };
  const opciones = cuentas.map((x) => ({ valor: x.id, etiqueta: x.nombre }));
  const nombreDe = (id: string): string => cuentas.find((x) => x.id === id)?.nombre ?? '';

  const { estado, error: fallo, exito } = operacion;
  const vista = (operacion.previsualizacion ?? {}) as Previsualizacion;

  const faltan = esIngreso ? cuentas.length < 1 : cuentas.length < 2;
  if (faltan)
    return (
      <Marco superpuesto={superpuesto} titulo={titulo}>
        <Vacio
          titulo={esIngreso ? t.sinEfectivoTitulo : t.pocasTitulo}
          texto={esIngreso ? t.sinEfectivoTexto : t.pocasTexto(cuentas[0]?.nombre ?? '')}
          accion={
            <EnlaceFinn href="/cuentas/nueva" className={ENLACE}>
              {t.crearCuenta}
            </EnlaceFinn>
          }
        />
      </Marco>
    );

  if (estado === 'listo' && exito !== undefined) {
    const monto = formatearMontoTexto(c.total);
    return (
      <Marco superpuesto={superpuesto} titulo={esIngreso ? t.listoIngreso : t.listoTransferencia}>
        <div className="flex flex-col gap-4">
          <Resultado
            texto={
              esIngreso
                ? t.ingresoGuardado(monto, nombreDe(c.cuentaId))
                : t.transferenciaGuardada(monto, nombreDe(c.origenId), nombreDe(c.destinoId))
            }
          />
          <Boton
            onClick={() => {
              window.location.assign(window.location.pathname);
            }}
          >
            {t.registrarOtro}
          </Boton>
        </div>
      </Marco>
    );
  }

  return (
    <Marco superpuesto={superpuesto} titulo={titulo}>
      {estado === 'confirmando' ? (
        <ConfirmacionImpacto
          titulo={t.revisar}
          {...(operacion.impactoCambio ? { nota: formularios.impactoCambio } : {})}
          vista={vista}
          avisos={(vista.avisos ?? []).map((a) =>
            a.codigo === 'AV-01' ? t.avisoPeriodoCerrado : a.codigo,
          )}
          textoConfirmar={t.confirmar}
          textoVolver={t.volverAEditar}
          enviando={false}
          alConfirmar={() => void operacion.confirmar()}
          alVolver={operacion.volverAEditar}
        />
      ) : (
        <form
          onSubmit={(e) => void formulario.enviar(e)}
          noValidate
          className="flex flex-col gap-5"
        >
          {esIngreso ? (
            <Seleccion
              etiqueta={t.cuentaIngreso}
              opciones={opciones}
              valor={c.cuentaId}
              alCambiar={poner('cuentaId')}
              {...conError('cuentaId')}
            />
          ) : (
            <>
              <Seleccion
                etiqueta={t.origen}
                opciones={opciones}
                valor={c.origenId}
                alCambiar={poner('origenId')}
                {...conError('origenId')}
              />
              <Seleccion
                etiqueta={t.destino}
                opciones={opciones}
                valor={c.destinoId}
                alCambiar={poner('destinoId')}
                {...conError('destinoId')}
              />
            </>
          )}
          <EntradaFecha
            nombre="fecha"
            etiqueta={t.fecha}
            valor={c.fecha as FechaLocal}
            alCambiar={poner('fecha')}
            maxima={hoy}
            hoy={hoy}
            error={error('fecha')}
            requerido
          />
          <EntradaMonto
            nombre="total"
            etiqueta={t.total}
            valor={c.total}
            alCambiar={poner('total')}
            error={error('total')}
            requerido
          />
          {esIngreso ? (
            <EntradaTexto
              etiqueta={t.descripcion}
              autoComplete="off"
              {...conError('descripcion')}
              {...formulario.register('descripcion')}
            />
          ) : null}
          {estado === 'error' && fallo !== undefined && !enSuCampo(fallo) ? (
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
          {/* [CH-240 E4-3] Una nota fija dice el efecto del tipo, sin cifras ni impacto en vivo */}
          {esIngreso ? <NotaFija clave="ingreso" /> : null}
          <Boton
            tipo="submit"
            enviando={estado === 'enviando'}
            textoEnviando={t.guardando}
            deshabilitado={!operacion.enLinea}
            {...(operacion.motivoSinEnvio === undefined
              ? {}
              : { motivoDeshabilitado: operacion.motivoSinEnvio })}
          >
            {esIngreso ? t.guardarIngreso : t.guardarTransferencia}
          </Boton>
        </form>
      )}
    </Marco>
  );
}
