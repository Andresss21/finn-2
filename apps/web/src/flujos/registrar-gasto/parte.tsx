'use client';
// Una parte de un gasto (FT-21; la reusa la revisión de un movimiento, FT-35): monto, destino y categoría o persona por cobrar.
import type { UseFormRegisterReturn } from 'react-hook-form';
import { EntradaTexto } from '../../componentes/base/campo';
import { Seleccion, type Opcion } from '../../componentes/base/seleccion';
import { SelectorSegmentado } from '../../componentes/base/selector-segmentado';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import { registrarGasto as t } from '../../textos/registrar-gasto';
import { DEUDOR_NUEVO, type DestinoDeParte, type Parte } from './campos';

type Campo = 'monto' | 'categoriaId' | 'deudorId' | 'deudorNuevo';

export interface PropsParteDeGasto {
  readonly i: number;
  readonly parte: Parte;
  readonly categorias: readonly Opcion[];
  /** Incluye la opción «Otra persona» (`DEUDOR_NUEVO`). */
  readonly deudores: readonly Opcion[];
  readonly error: (campo: Campo) => string | undefined;
  readonly poner: (nombre: `lineas.${number}.${Campo | 'destino'}`) => (valor: string) => void;
  readonly alCambiarDestino: (destino: DestinoDeParte) => void;
  readonly registroDeudorNuevo: UseFormRegisterReturn<`lineas.${number}.deudorNuevo`>;
}

export function ParteDeGasto({
  i,
  parte,
  categorias,
  deudores,
  error,
  poner,
  alCambiarDestino,
  registroDeudorNuevo,
}: PropsParteDeGasto) {
  const n = String(i + 1);
  const conError = (campo: Campo): { error?: string } => {
    const mensaje = error(campo);
    return mensaje === undefined ? {} : { error: mensaje };
  };
  return (
    <>
      <EntradaMonto
        nombre={`lineas.${i}.monto`}
        etiqueta={t.montoDeParte(n)}
        valor={parte.monto}
        alCambiar={poner(`lineas.${i}.monto`)}
        error={error('monto')}
        requerido
      />
      <SelectorSegmentado
        etiqueta={t.destinoDeParte(n)}
        opciones={[
          { valor: 'categoria', etiqueta: t.destinoCategoria },
          { valor: 'por_cobrar', etiqueta: t.destinoPorCobrar },
        ]}
        valor={parte.destino}
        alCambiar={(v) => {
          alCambiarDestino(v as DestinoDeParte);
        }}
      />
      {parte.destino === 'categoria' ? (
        <Seleccion
          etiqueta={t.categoriaDeParte(n)}
          opciones={categorias}
          valor={parte.categoriaId}
          alCambiar={poner(`lineas.${i}.categoriaId`)}
          {...conError('categoriaId')}
        />
      ) : (
        <>
          <Seleccion
            etiqueta={t.deudorDeParte(n)}
            opciones={deudores}
            valor={parte.deudorId}
            alCambiar={poner(`lineas.${i}.deudorId`)}
            {...conError('deudorId')}
          />
          {parte.deudorId === DEUDOR_NUEVO ? (
            <EntradaTexto
              etiqueta={t.deudorNuevoDeParte(n)}
              autoComplete="off"
              {...conError('deudorNuevo')}
              {...registroDeudorNuevo}
            />
          ) : null}
        </>
      )}
    </>
  );
}
