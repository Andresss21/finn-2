'use client';
// El borrador de `/programadas/nueva` (05 §4.11, FE-14): se carga aparte del formulario (05 §13.1) y, una vez montado, restaura lo
// escrito en la pestaña y ofrece descartarlo. También recibe los valores iniciales que le deja «Programarla» de Suscripciones
// detectadas cuando la categoría de la última compra no está activa (06 FT-65, 3.6).
import { useCallback } from 'react';
import type { UseFormReset } from 'react-hook-form';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { useBorrador } from '../../formularios/use-borrador';
import type { Operacion } from '../../formularios/use-operacion';
import { formularios } from '../../textos/formularios';
import type { Campos } from './campos';

export default function BorradorProgramada({
  campos,
  inicial,
  operacion,
  reset,
}: {
  readonly campos: Campos;
  readonly inicial: Campos;
  readonly operacion: Operacion;
  readonly reset: UseFormReset<Campos>;
}) {
  const borrador = useBorrador<Campos>({
    campos,
    operacion,
    restaurar: useCallback(
      (restaurados: Campos) => {
        reset(restaurados);
      },
      [reset],
    ),
    alDescartar: useCallback(() => {
      reset(inicial);
    }, [reset, inicial]),
  });
  if (!borrador.recuperado) return null;
  return (
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
  );
}
