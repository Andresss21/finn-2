'use client';
// Formulario del flujo de prueba `/pruebas/eco` (TA-210): usa `useFormularioFinn` y `useOperacion` como lo hará cada flujo.
import { AvisoEnLinea } from '../../../../componentes/base/aviso.tsx';
import { Boton } from '../../../../componentes/base/boton.tsx';
import { EntradaTexto } from '../../../../componentes/base/campo.tsx';
import { useFormularioFinn } from '../../../../formularios/use-formulario-finn.ts';
import { useOperacion } from '../../../../formularios/use-operacion.ts';
import { eco } from '../../../../servidor/acciones/eco.ts';
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
  const { estado, error, exito } = operacion;
  const mensajeTexto = formulario.formState.errors.texto?.message;
  const puedeReintentar =
    error !== undefined && ['OCUPADO', 'INCIERTO', 'INTERNO'].includes(error.categoria);
  return (
    <form onSubmit={(e) => void formulario.enviar(e)} noValidate>
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
            : {})}
        >
          {error.mensaje}
        </AvisoEnLinea>
      ) : null}
    </form>
  );
}
