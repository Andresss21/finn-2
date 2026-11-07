'use client';
// `/registrar/aporte-inversion`, `/registrar/retiro-inversion` y `/registrar/ajuste-inversion` (FT-57, OP-25; 05 §2.4): los flujos
// cortos de aportar a una inversión desde una categoría, retirar hacia Listo para asignar y ajustar su valor. Se guardan en un solo
// viaje (05 §4.4); con la fecha en un período cerrado el servidor pide confirmar con AV-01. No calcula montos (PF-3).
import type { ErrorFinn } from '@finn/aplicacion/errores';
import type { FechaLocal } from '@finn/dominio/valores';
import { useMemo, type ReactNode } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Resultado } from '../../componentes/base/resultado';
import { Seleccion, type Opcion } from '../../componentes/base/seleccion';
import { Vacio } from '../../componentes/base/vacio';
import { ConfirmacionImpactoDeVista as ConfirmacionImpacto } from '../../componentes/formularios/confirmacion-impacto-de-vista';
import { EntradaFecha } from '../../componentes/formularios/entrada-fecha';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import type { VistaDeImpacto } from '../../componentes/formularios/lineas-impacto';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { PaginaFlujoDeRuta, SuperpuestoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { formatearMontoTexto } from '../../formato';
import { aplicarSigno } from '../../formularios/normalizar-monto';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { registrarInversion as accion } from '../../servidor/acciones/transacciones';
import { formularios } from '../../textos/formularios';
import { registrarInversion as t } from '../../textos/registrar-inversion';
import {
  aEntradaDeAccion,
  contratoDe,
  modalidadDe,
  valoresIniciales,
  type Campos,
  type TipoDeInversion,
} from './inversion-campos';

export interface PropsFormularioRegistrarInversion {
  readonly tipo: TipoDeInversion;
  readonly hoy: FechaLocal;
  readonly inversiones: readonly Opcion[];
  readonly cuentas: readonly Opcion[];
  readonly categorias: readonly Opcion[];
  readonly inversionPropuesta: string | undefined;
  readonly cuentaPropuesta: string | undefined;
  /** Interceptado sobre la pantalla de origen (05 §1.4): hoja o panel; sin él, página completa. */
  readonly superpuesto?: boolean;
}

interface Previsualizacion extends VistaDeImpacto {
  readonly avisos?: readonly { readonly codigo: string }[];
}

const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
/** Un enlace con el aspecto de un botón principal (05 §10.7): al menos 44 px de alto (05 §11.5). */
const ENLACE =
  'inline-flex min-h-12 items-center justify-center rounded-control bg-accion px-5 font-semibold text-texto-sobre-accion focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
/** Un rechazo cuyo mensaje ya se muestra en su campo no se repite como aviso del formulario. */
const enSuCampo = (e: ErrorFinn): boolean => Object.values(e.campos ?? {}).includes(e.mensaje);

function Marco({
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

export function FormularioRegistrarInversion({
  tipo,
  hoy,
  inversiones,
  cuentas,
  categorias,
  inversionPropuesta,
  cuentaPropuesta,
  superpuesto = false,
}: PropsFormularioRegistrarInversion) {
  const modalidad = modalidadDe(tipo);
  const [titulo, listo, guardar] = [t.titulo[modalidad], t.listo[modalidad], t.guardar[modalidad]];
  const enviar: AccionEscritura = (payload) => accion(aEntradaDeAccion(tipo, payload));
  const operacion = useOperacion({ accion: enviar, creacion: true });
  const inicial = useMemo(
    () => valoresIniciales(hoy, inversionPropuesta, cuentaPropuesta),
    [hoy, inversionPropuesta, cuentaPropuesta],
  );
  const contrato = useMemo(() => contratoDe(tipo), [tipo]);
  const formulario = useFormularioFinn<Campos>({ contrato, valoresIniciales: inicial, operacion });
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
  const nombreDe = (lista: readonly Opcion[], valor: string): string =>
    lista.find((x) => x.valor === valor)?.etiqueta ?? '';

  const { estado, error: fallo, exito } = operacion;
  const vista = (operacion.previsualizacion ?? {}) as Previsualizacion;

  // Sin inversiones no se ofrece ningún tipo; aportar y retirar también piden una cuenta de efectivo (05 §7).
  const sinInversion = inversiones.length < 1;
  if (sinInversion || (modalidad !== 'ajuste' && cuentas.length < 1))
    return (
      <Marco superpuesto={superpuesto} titulo={titulo}>
        <Vacio
          titulo={sinInversion ? t.sinInversionesTitulo : t.sinEfectivoTitulo}
          texto={sinInversion ? t.sinInversionesTexto : t.sinEfectivoTexto}
          accion={
            <EnlaceFinn href="/cuentas/nueva" className={ENLACE}>
              {t.crearCuenta}
            </EnlaceFinn>
          }
        />
      </Marco>
    );

  if (estado === 'listo' && exito !== undefined) {
    const escrito = modalidad === 'ajuste' ? aplicarSigno(c.total, c.signo) : c.total;
    const monto = formatearMontoTexto(escrito);
    const inversion = nombreDe(inversiones, c.inversionId);
    const cuenta = nombreDe(cuentas, c.cuentaId);
    return (
      <Marco superpuesto={superpuesto} titulo={listo}>
        <div className="flex flex-col gap-4">
          <Resultado
            texto={
              modalidad === 'aporte'
                ? t.aporteGuardado(monto, cuenta, inversion)
                : modalidad === 'retiro'
                  ? t.retiroGuardado(monto, inversion, cuenta)
                  : t.ajusteGuardado(monto, inversion)
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
          <Seleccion
            etiqueta={t.inversion}
            opciones={inversiones}
            valor={c.inversionId}
            alCambiar={poner('inversionId')}
            {...conError('inversionId')}
          />
          {modalidad === 'ajuste' ? null : (
            <Seleccion
              etiqueta={modalidad === 'aporte' ? t.cuentaAporte : t.cuentaRetiro}
              opciones={cuentas}
              valor={c.cuentaId}
              alCambiar={poner('cuentaId')}
              {...conError('cuentaId')}
            />
          )}
          {modalidad === 'aporte' ? (
            <Seleccion
              etiqueta={t.categoria}
              opciones={categorias}
              valor={c.categoriaId}
              alCambiar={poner('categoriaId')}
              {...conError('categoriaId')}
            />
          ) : null}
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
            etiqueta={modalidad === 'ajuste' ? t.montoAjuste : t.monto}
            valor={c.total}
            alCambiar={poner('total')}
            error={error('total')}
            requerido
            {...(modalidad === 'ajuste'
              ? {
                  conSigno: true,
                  signo: c.signo,
                  alCambiarSigno: (s: Campos['signo']) => {
                    setValue('signo', s, { shouldDirty: true });
                  },
                  etiquetasSigno: { positivo: t.sube, negativo: t.baja },
                }
              : {})}
          />
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
          <Boton
            tipo="submit"
            enviando={estado === 'enviando'}
            textoEnviando={t.guardando}
            deshabilitado={!operacion.enLinea}
            {...(operacion.motivoSinEnvio === undefined
              ? {}
              : { motivoDeshabilitado: operacion.motivoSinEnvio })}
          >
            {guardar}
          </Boton>
        </form>
      )}
    </Marco>
  );
}
