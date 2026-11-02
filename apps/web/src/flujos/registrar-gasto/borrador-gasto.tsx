'use client';
// El borrador de `/registrar/gasto` (05 §4.11, FE-14; CA-21.9): se carga aparte del formulario (05 §13.1, presupuesto de bytes de la
// ruta) y, una vez montado, restaura lo escrito en la pestaña con el mismo id de creación y ofrece descartarlo.
import { useCallback } from 'react';
import type { UseFormReset } from 'react-hook-form';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { useBorrador } from '../../formularios/use-borrador';
import type { Operacion } from '../../formularios/use-operacion';
import { formularios } from '../../textos/formularios';
import type { Campos } from './campos';

export default function BorradorGasto({
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
