'use client';
// Formulario del flujo de prueba `/pruebas/eco` (TA-210): usa `useFormularioFinn` y `useOperacion` como lo hará cada flujo.
import { useCallback } from 'react';
import { AvisoEnLinea } from '../../../../componentes/base/aviso.tsx';
import { Boton } from '../../../../componentes/base/boton.tsx';
import { EntradaTexto } from '../../../../componentes/base/campo.tsx';
import { useBorrador } from '../../../../formularios/use-borrador.ts';
import { useFormularioFinn } from '../../../../formularios/use-formulario-finn.ts';
import { useLecturaInteractiva } from '../../../../formularios/use-lectura-interactiva.ts';
import { useOperacion } from '../../../../formularios/use-operacion.ts';
import { eco } from '../../../../servidor/acciones/eco.ts';
import { sugerencia } from '../../../../servidor/lecturas/interactivas.ts';
import { contratoFormularioEco, type CamposEco } from '../../../../servidor/eco-contrato.ts';
import { formularios } from '../../../../textos/formularios.ts';

export function FormularioEco({
  textoVisto,
  previsualizarPrimero,
}: {
  readonly textoVisto: string;
  readonly previsualizarPrimero: boolean;
}) {
  const operacion = useOperacion({
    accion: eco,
    creacion: true,
    previsualizarPrimero,
    esperado: { texto: textoVisto },
  });
  const formulario = useFormularioFinn<CamposEco>({
    contrato: contratoFormularioEco,
    valoresIniciales: { texto: '' },
    operacion,
  });
  const texto = formulario.watch('texto');
  const { reset } = formulario;
  const borrador = useBorrador({
    campos: { texto },
    operacion,
    restaurar: useCallback(
      (campos: CamposEco) => {
        reset(campos);
      },
      [reset],
    ),
    alDescartar: useCallback(() => {
      reset({ texto: '' });
    }, [reset]),
  });
  const lectura = useLecturaInteractiva(
    useCallback(async ({ texto: escrito }: { readonly texto: string }) => {
      // La lectura real de CP-3; se muestra el texto consultado para ver cuál respuesta gana.
      const r = await sugerencia({ comercio: escrito });
      return r.ok ? { ...r, valor: { texto: escrito } } : r;
    }, []),
  );
  const { estado, error, exito } = operacion;
  const mensajeTexto = formulario.formState.errors.texto?.message;
  const puedeReintentar =
    error !== undefined &&
    error.codigo !== 'version_nueva' &&
    ['OCUPADO', 'INCIERTO', 'INTERNO'].includes(error.categoria);
  return (
    <form onSubmit={(e) => void formulario.enviar(e)} noValidate>
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
      <EntradaTexto
        etiqueta={'Buscar'}
        name="buscar"
        onChange={(e) => {
          lectura.consultar(e.target.value);
        }}
      />
      <p>{`Lectura: ${lectura.resultado?.texto ?? ''}`}</p>
      <EntradaTexto
        etiqueta={'Texto'}
        {...formulario.register('texto')}
        {...(mensajeTexto === undefined ? {} : { error: mensajeTexto })}
      />
      <Boton
        tipo="submit"
        enviando={estado === 'enviando'}
        deshabilitado={!operacion.enLinea}
        {...(operacion.motivoSinEnvio === undefined
          ? {}
          : { motivoDeshabilitado: operacion.motivoSinEnvio })}
      >
        {'Guardar'}
      </Boton>
      {estado === 'confirmando' ? (
        <AvisoEnLinea
          estado="advertencia"
          aparecioDespues
          accion={
            <>
              <Boton onClick={() => void operacion.confirmar()}>{'Confirmar'}</Boton>
              <Boton variante="secundaria" onClick={operacion.volverAEditar}>
                {'Volver a editar'}
              </Boton>
            </>
          }
        >
          {operacion.impactoCambio
            ? formularios.impactoCambio
            : 'Revisá el impacto antes de confirmar.'}
        </AvisoEnLinea>
      ) : null}
      {estado === 'listo' && exito !== undefined ? (
        <AvisoEnLinea estado="positivo" aparecioDespues>
          {exito.yaAplicada
            ? formularios.yaEstabaGuardado
            : `Guardado: ${(exito.valor as { texto: string; esperado: string | null }).texto} (esperado: ${(exito.valor as { esperado: string | null }).esperado ?? ''})`}
        </AvisoEnLinea>
      ) : null}
      {estado === 'error' && error !== undefined ? (
        <AvisoEnLinea
          estado="problema"
          aparecioDespues
          {...(puedeReintentar
            ? {
                accion: (
                  <Boton variante="secundaria" onClick={() => void operacion.reintentar()}>
                    {formularios.intentarDeNuevo}
                  </Boton>
                ),
              }
            : error.codigo === 'version_nueva'
              ? {
                  accion: (
                    <Boton variante="secundaria" onClick={operacion.recargar}>
                      {formularios.recargar}
                    </Boton>
                  ),
                }
              : {})}
        >
          {error.mensaje}
        </AvisoEnLinea>
      ) : null}
    </form>
  );
}
