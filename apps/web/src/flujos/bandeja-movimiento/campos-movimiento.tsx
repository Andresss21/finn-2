'use client';
// Los campos de `/bandeja/[movimientoId]` (FT-35, OP-36; S4 y S5 del export, CH-136): cuenta con `SeleccionNativa`, fecha y monto en
// dos columnas con el «$», comercio, tipo como selector segmentado, las partes en líneas compactas (las de Registrar gasto) y la
// nota. Se cargan aparte del resto del flujo para que la ruta no pase su presupuesto de bytes (05 §13.1). `Edicion` sigue siendo de
// «Editar transacción» (FT-25).
import type { FechaLocal } from '@finn/dominio/valores';
import type { UseFieldArrayReturn, UseFormReturn } from 'react-hook-form';
import { EntradaTexto } from '../../componentes/base/campo';
import { SelectorSegmentado } from '../../componentes/base/selector-segmentado';
import { SeleccionNativa, type OpcionNativa } from '../../componentes/base/seleccion-nativa';
import { EntradaFecha } from '../../componentes/formularios/entrada-fecha';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import { bandeja as t } from '../../textos/bandeja';
import { registrarGasto as g } from '../../textos/registrar-gasto';
import { parteVacia } from '../registrar-gasto/campos';
import LineasDeGasto from '../registrar-gasto/lineas';
import type { Campos } from './campos';

interface Referencia {
  readonly id: string;
  readonly nombre: string;
}

/** Una cuenta del campo: el detalle es «Deuda $642.18» o el saldo, ya formateado desde el DTO (S5). */
export interface CuentaDelMovimiento extends Referencia {
  readonly tipo: 'efectivo' | 'tarjeta';
  readonly detalle: string;
}

export interface PropsCamposMovimiento {
  readonly formulario: UseFormReturn<Campos>;
  readonly partes: UseFieldArrayReturn<Campos, 'lineas'>;
  readonly cuentas: readonly CuentaDelMovimiento[];
  readonly categorias: readonly Referencia[];
  readonly deudores: readonly Referencia[];
  /** El rechazo del servidor que va junto al campo de las partes, si lo hay. */
  readonly deLasPartes: string | undefined;
  readonly ayuda: string | undefined;
}

const TIPOS = (Object.keys(t.revisar.tipos) as (keyof typeof t.revisar.tipos)[]).map((k) => ({
  valor: k,
  etiqueta: t.revisar.tipos[k],
}));

const aOpciones = (xs: readonly CuentaDelMovimiento[]): OpcionNativa[] =>
  xs.map((x) => ({
    valor: x.id,
    etiqueta: x.nombre,
    detalle: x.detalle,
    icono: x.tipo === 'tarjeta' ? 'card' : 'wallet',
  }));

export default function CamposMovimiento({
  formulario,
  partes,
  cuentas,
  categorias,
  deudores,
  deLasPartes,
  ayuda,
}: PropsCamposMovimiento) {
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
  return (
    <>
      <SeleccionNativa
        etiqueta={g.cuenta}
        alta
        marcador={g.elegirCuenta}
        opciones={aOpciones(cuentas)}
        valor={c.cuentaId}
        alCambiar={poner('cuentaId')}
        error={error('cuentaId')}
      />
      <div className="grid grid-cols-2 gap-2.5 [&>*]:min-w-0">
        <EntradaFecha
          nombre="fecha"
          etiqueta={g.fecha}
          valor={c.fecha as FechaLocal}
          alCambiar={poner('fecha')}
          error={error('fecha')}
          requerido
          sinVistaPrevia
        />
        <EntradaMonto
          nombre="total"
          etiqueta={t.revisar.monto}
          valor={c.total}
          alCambiar={poner('total')}
          error={error('total')}
          requerido
          prefijo="$"
          sinVistaPrevia
        />
      </div>
      <EntradaTexto etiqueta={g.comercio} autoComplete="off" {...formulario.register('comercio')} />
      <div className="flex flex-col gap-1.5">
        <span className="text-etiqueta">{t.revisar.tipo}</span>
        <SelectorSegmentado
          etiqueta={t.revisar.tipo}
          opciones={TIPOS}
          valor={c.tipo}
          llena
          alCambiar={(tipo) => {
            poner('tipo')(tipo);
            if (tipo === 'gasto' && c.lineas.length === 0)
              partes.append({ ...parteVacia(), monto: c.total });
          }}
        />
      </div>
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
