'use client';
// Los campos de `/actividad/[transaccionId]/editar` (FT-25, OP-28; `pantallas/03-detalle-de-transaccion` del export): la cuenta como
// selección de 52 px, Fecha y Total en dos columnas, el comercio, las partes compactas de Registrar gasto (CH-126) y la nota. Se
// cargan aparte para que la ruta no pase su presupuesto de bytes (05 §13.1). La edición de un movimiento (FT-35) conserva la suya
// en `bandeja-movimiento/edicion.tsx`. No calcula montos (PF-3): la suma de las partes la valida el servidor.
import { useEffect } from 'react';
import type { FechaLocal } from '@finn/dominio/valores';
import type { UseFieldArrayReturn, UseFormReturn } from 'react-hook-form';
import { EntradaTexto } from '../../componentes/base/campo';
import { Icono } from '../../componentes/base/icono';
import { SeleccionNativa, type OpcionNativa } from '../../componentes/base/seleccion-nativa';
import { EntradaFecha } from '../../componentes/formularios/entrada-fecha';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import { registrarGasto as g } from '../../textos/registrar-gasto';
import { transaccion as t } from '../../textos/transaccion';
import type { Campos } from '../bandeja-movimiento/campos';
import { parteVacia } from '../registrar-gasto/campos';
import LineasDeGasto from '../registrar-gasto/lineas';

interface Referencia {
  readonly id: string;
  readonly nombre: string;
}
export interface CuentaDeEdicion extends Referencia {
  readonly tipo: 'efectivo' | 'tarjeta' | 'otra';
  /** «Deuda $642.18» o «Saldo $…», ya formateado por el lector con las cifras del DTO. */
  readonly detalle?: string;
}

export interface PropsEdicion {
  /** Avisa que los campos ya están: hasta entonces «Guardar cambios» espera (V-01). */
  readonly alMontar?: () => void;
  readonly formulario: UseFormReturn<Campos>;
  readonly partes: UseFieldArrayReturn<Campos, 'lineas'>;
  readonly cuentas: readonly CuentaDeEdicion[];
  readonly categorias: readonly Referencia[];
  readonly deudores: readonly Referencia[];
  /** El rechazo del servidor que va junto al campo de las partes, si lo hay. */
  readonly deLasPartes: string | undefined;
  readonly ayuda: string | undefined;
  /** No se ofrece la cuenta: la transacción mueve más de una (transferencia, pago). */
  readonly sinCuenta: boolean;
  /** Por qué no se puede cambiar la cuenta (04 §6.7.2 `restricciones`). */
  readonly motivoCuenta?: string;
  /** Cuenta archivada (CB-24): solo categoría, comercio y nota. */
  readonly soloEtiquetas: boolean;
}

const aOpciones = (xs: readonly CuentaDeEdicion[]): OpcionNativa[] =>
  xs.map((x) => ({
    valor: x.id,
    etiqueta: x.nombre,
    ...(x.detalle === undefined ? {} : { detalle: x.detalle }),
    icono: x.tipo === 'tarjeta' ? 'card' : 'wallet',
  }));

export default function Edicion({
  alMontar,
  formulario,
  partes,
  cuentas,
  categorias,
  deudores,
  deLasPartes,
  ayuda,
  sinCuenta,
  motivoCuenta,
  soloEtiquetas,
}: PropsEdicion) {
  useEffect(() => {
    alMontar?.();
  }, [alMontar]);
  const { setValue, formState } = formulario;
  const c = formulario.watch();
  const poner = (nombre: Parameters<typeof setValue>[0]) => (valor: string) => {
    setValue(nombre, valor as never, { shouldDirty: true, shouldValidate: formState.isSubmitted });
  };
  const error = (n: 'cuentaId' | 'fecha' | 'total'): string | undefined =>
    formState.errors[n]?.message;
  const errorDeParte = (
    i: number,
    n: 'monto' | 'categoriaId' | 'deudorId' | 'deudorNuevo',
  ): string | undefined => formState.errors.lineas?.[i]?.[n]?.message;
  const errorCuenta = error('cuentaId');
  const fija = cuentas.find((x) => x.id === c.cuentaId);
  const cuentaFija = soloEtiquetas || motivoCuenta !== undefined;
  return (
    <>
      {sinCuenta ? null : cuentaFija && fija !== undefined ? (
        <div className="flex flex-col gap-1" data-cuenta-fija>
          <div className="flex justify-between gap-2">
            <span className="font-semibold">{g.cuenta}</span>
            <span className="text-cuerpo-pequeno text-texto-terciario">{t.soloLectura}</span>
          </div>
          <div className="flex min-h-13 items-center gap-2.5 rounded-control border border-dashed border-borde-control px-3">
            <Icono nombre={fija.tipo === 'tarjeta' ? 'card' : 'wallet'} tamano={22} />
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-semibold">{fija.nombre}</span>
              <span className="text-cuerpo-pequeno text-texto-secundario">{fija.detalle}</span>
            </span>
          </div>
          {motivoCuenta === undefined || soloEtiquetas ? null : (
            <p className="text-cuerpo-pequeno text-texto-secundario">{motivoCuenta}</p>
          )}
        </div>
      ) : (
        <SeleccionNativa
          etiqueta={g.cuenta}
          alta
          marcador={g.elegirCuenta}
          opciones={aOpciones(cuentas)}
          valor={c.cuentaId}
          alCambiar={poner('cuentaId')}
          {...(errorCuenta === undefined ? {} : { error: errorCuenta })}
        />
      )}
      <div className="grid grid-cols-2 gap-2.5 [&>*]:min-w-0">
        <EntradaFecha
          nombre="fecha"
          etiqueta={g.fecha}
          valor={c.fecha as FechaLocal}
          alCambiar={poner('fecha')}
          error={error('fecha')}
          requerido
          sinVistaPrevia
          deshabilitado={soloEtiquetas}
        />
        <EntradaMonto
          nombre="total"
          etiqueta={g.total}
          valor={c.total}
          alCambiar={(valor) => {
            poner('total')(valor);
            // Una sola parte sigue al total (OP-28): se copia el texto, no se calcula (PF-3)
            if (c.lineas.length === 1) poner('lineas.0.monto')(valor);
          }}
          error={error('total')}
          requerido
          prefijo="$"
          sinVistaPrevia
          deshabilitado={soloEtiquetas}
        />
      </div>
      <EntradaTexto etiqueta={g.comercio} autoComplete="off" {...formulario.register('comercio')} />
      {c.tipo === 'gasto' ? (
        <LineasDeGasto
          lineas={c.lineas}
          claves={partes.fields.map((f) => f.id)}
          categorias={categorias}
          deudores={deudores}
          total={c.total}
          error={errorDeParte}
          errorDeLasPartes={deLasPartes ?? formState.errors.lineas?.message}
          ayuda={ayuda}
          poner={poner}
          registroDeudorNuevo={(i) => formulario.register(`lineas.${i}.deudorNuevo`)}
          alAgregar={() => {
            partes.append(parteVacia());
          }}
          alQuitar={(i) => {
            partes.remove(i);
          }}
        />
      ) : null}
      <EntradaTexto etiqueta={g.nota} autoComplete="off" {...formulario.register('nota')} />
    </>
  );
}
