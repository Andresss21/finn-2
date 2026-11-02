'use client';
// `/cuentas/nueva` (FT-50, OP-01; 05 §2.3): el flujo largo de crear una cuenta con su saldo inicial. Borrador (4.11), aviso previo
// de la tarjeta con nombre repetido (BE-35) y la confirmación con AV-01 si la apertura cae en un período cerrado. No calcula
// montos (PF-3): el impacto y los avisos los trae el servidor.
import type { ErrorFinn } from '@finn/aplicacion/errores';
import type { Centavos, FechaLocal } from '@finn/dominio/valores';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { EntradaTexto } from '../../componentes/base/campo';
import { Seleccion } from '../../componentes/base/seleccion';
import { ConfirmacionImpacto } from '../../componentes/formularios/confirmacion-impacto';
import { EntradaFecha } from '../../componentes/formularios/entrada-fecha';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import { PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { formatearMonto } from '../../formato';
import { useBorrador } from '../../formularios/use-borrador';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { crearCuenta } from '../../servidor/acciones/cuentas';
import { cuentasNueva as t } from '../../textos/cuentas-nueva';
import { formularios } from '../../textos/formularios';
import {
  CAMPOS_DE_TIPO,
  CONTRATO,
  aEntradaDeAccion,
  avisoDeNombreRepetido,
  valoresIniciales,
  visible,
  type Campos,
  type Descriptor,
  type TipoCuenta,
} from './campos';

export interface PropsFormularioCuentaNueva {
  readonly hoy: FechaLocal;
  readonly tipoInicial: TipoCuenta;
  readonly instituciones: readonly { readonly id: string; readonly nombre: string }[];
  readonly nombresTarjetaUsados: readonly {
    readonly nombre: string;
    readonly archivada: boolean;
  }[];
}

interface Previsualizacion {
  readonly impacto?: { readonly deltaLpa: Centavos } | null;
  readonly avisos?: readonly { readonly codigo: string }[];
}

const opciones = (m: Readonly<Record<string, string>>) =>
  Object.entries(m).map(([valor, etiqueta]) => ({ valor, etiqueta }));
const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
/** La pantalla a la que vuelve el flujo al terminar (`cerrarFlujo()`, 05 §1.4). */
const RUTA_PADRE = '/cuentas';
/** Un rechazo cuyo mensaje ya se muestra en su campo no se repite como aviso del formulario. */
const enSuCampo = (e: ErrorFinn): boolean => Object.values(e.campos ?? {}).includes(e.mensaje);
/** La acción de OP-01 con la entrada armada desde lo escrito (los montos normalizados, lo vacío omitido). */
const enviarCuenta: AccionEscritura = (payload) => crearCuenta(aEntradaDeAccion(payload));

export function FormularioCuentaNueva({
  hoy,
  tipoInicial,
  instituciones,
  nombresTarjetaUsados,
}: PropsFormularioCuentaNueva) {
  const operacion = useOperacion({ accion: enviarCuenta, creacion: true });
  const inicial = useMemo(() => valoresIniciales(hoy, tipoInicial), [hoy, tipoInicial]);
  const formulario = useFormularioFinn<Campos>({
    contrato: CONTRATO,
    valoresIniciales: inicial,
    operacion,
  });
  const { reset, setValue, formState } = formulario;
  const c = formulario.watch();
  const borrador = useBorrador({
    campos: c,
    operacion,
    restaurar: useCallback(
      (campos: Campos) => {
        reset(campos);
      },
      [reset],
    ),
    alDescartar: useCallback(() => {
      reset(inicial);
    }, [reset, inicial]),
  });
  const poner = (n: keyof Campos) => (valor: string) => {
    setValue(n, valor as never, { shouldDirty: true, shouldValidate: formState.isSubmitted });
  };
  const error = (n: keyof Campos): string | undefined => formState.errors[n]?.message;
  const conError = (n: keyof Campos): { error?: string } => {
    const mensaje = error(n);
    return mensaje === undefined ? {} : { error: mensaje };
  };
  const avisoDeNombre = avisoDeNombreRepetido(c.tipo, c.nombre, nombresTarjetaUsados);

  const { estado, error: fallo, exito } = operacion;
  const router = useRouter();
  useEffect(() => {
    if (estado === 'listo') router.replace(RUTA_PADRE);
  }, [estado, router]);
  const vista = (operacion.previsualizacion ?? {}) as Previsualizacion;

  function campo(x: Descriptor) {
    if (!visible(x, c)) return null;
    const mensaje = error(x.n);
    if (x.clase === 'monto')
      return (
        <EntradaMonto
          key={x.n}
          nombre={x.n}
          etiqueta={x.etiqueta}
          valor={c[x.n]}
          alCambiar={poner(x.n)}
          error={mensaje}
          requerido={x.requerido}
        />
      );
    if (x.clase === 'opciones')
      return (
        <Seleccion
          key={x.n}
          etiqueta={x.etiqueta}
          opciones={opciones(x.opciones ?? {})}
          valor={c[x.n]}
          alCambiar={poner(x.n)}
          {...(mensaje === undefined ? {} : { error: mensaje })}
        />
      );
    return (
      <EntradaTexto
        key={x.n}
        etiqueta={x.etiqueta}
        requerido={x.requerido}
        inputMode={x.clase === 'texto' ? 'text' : x.clase === 'entero' ? 'numeric' : 'decimal'}
        autoComplete="off"
        {...(mensaje === undefined ? {} : { error: mensaje })}
        {...formulario.register(x.n)}
      />
    );
  }

  // Terminó: `cerrarFlujo()` a la ruta padre (05 §1.4). Cuentas ya trae la cuenta nueva y su estado (la tarjeta con deuda, AV-07).
  if (estado === 'listo' && exito !== undefined)
    return (
      <PaginaFlujoDeRuta titulo={t.listo} rutaPadre={RUTA_PADRE}>
        {null}
      </PaginaFlujoDeRuta>
    );

  return (
    <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre={RUTA_PADRE}>
      {estado === 'confirmando' ? (
        <ConfirmacionImpacto
          titulo={t.revisar}
          {...(operacion.impactoCambio ? { nota: formularios.impactoCambio } : {})}
          impacto={
            vista.impacto
              ? [
                  t.impactoLpa(
                    `${vista.impacto.deltaLpa > 0 ? '+' : ''}${formatearMonto(vista.impacto.deltaLpa)}`,
                  ),
                ]
              : []
          }
          avisos={(vista.avisos ?? []).map((a) => t.avisos[a.codigo] ?? a.codigo)}
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
          {borrador.recuperado ? (
            <AvisoEnLinea
              estado="informacion"
              aparecioDespues
              accion={
                <Boton variante="secundaria" onClick={borrador.descartar}>
                  {formularios.descartarBorrador}
                </Boton>
              }
            >
              {formularios.borradorRecuperado}
            </AvisoEnLinea>
          ) : null}
          <Seleccion
            etiqueta={t.tipo}
            opciones={opciones(t.tipos)}
            valor={c.tipo}
            alCambiar={poner('tipo')}
          />
          <EntradaTexto
            etiqueta={t.nombre}
            requerido
            autoComplete="off"
            {...conError('nombre')}
            {...formulario.register('nombre')}
          />
          {avisoDeNombre === undefined ? null : (
            <AvisoEnLinea estado="advertencia" aparecioDespues>
              {avisoDeNombre}
            </AvisoEnLinea>
          )}
          <Seleccion
            etiqueta={t.institucion}
            opciones={[
              { valor: 'ninguna', etiqueta: t.sinInstitucion },
              ...instituciones.map((i) => ({ valor: i.id, etiqueta: i.nombre })),
            ]}
            valor={c.institucionId}
            alCambiar={poner('institucionId')}
          />
          <EntradaTexto
            etiqueta={t.ultimos4}
            inputMode="numeric"
            maxLength={4}
            autoComplete="off"
            {...conError('ultimos4')}
            {...formulario.register('ultimos4')}
          />
          <EntradaFecha
            nombre="fechaApertura"
            etiqueta={t.apertura}
            valor={c.fechaApertura as FechaLocal}
            alCambiar={poner('fechaApertura')}
            maxima={hoy}
            error={error('fechaApertura')}
            requerido
          />
          <EntradaMonto
            nombre="saldo"
            etiqueta={t.saldo[c.tipo]}
            valor={c.saldo}
            alCambiar={poner('saldo')}
            error={error('saldo')}
            requerido
            {...(c.tipo === 'tarjeta'
              ? {
                  conSigno: true,
                  signo: c.signo,
                  alCambiarSigno: poner('signo'),
                  etiquetasSigno: { positivo: t.debo, negativo: t.tengoAFavor },
                }
              : {})}
          />
          {CAMPOS_DE_TIPO[c.tipo].map(campo)}
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
            {t.guardar}
          </Boton>
        </form>
      )}
    </PaginaFlujoDeRuta>
  );
}
