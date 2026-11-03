'use client';
// Los campos de edición de un movimiento (FT-35, OP-36): tipo, cuenta, fecha, monto, comercio, nota y las partes con división y
// por cobrar. Se cargan aparte del resto del flujo para que `/bandeja/[movimientoId]` no pase su presupuesto de bytes (05 §13.1).
import type { FechaLocal } from '@finn/dominio/valores';
import type { UseFieldArrayReturn, UseFormReturn } from 'react-hook-form';
import { EntradaTexto } from '../../componentes/base/campo';
import { Seleccion, type Opcion } from '../../componentes/base/seleccion';
import { CampoLineas } from '../../componentes/formularios/campo-lineas';
import { EntradaFecha } from '../../componentes/formularios/entrada-fecha';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import { bandeja as t } from '../../textos/bandeja';
import { registrarGasto as g } from '../../textos/registrar-gasto';
import {
  DEUDOR_NUEVO,
  MAXIMO_PARTES,
  parteVacia,
  type DestinoDeParte,
} from '../registrar-gasto/campos';
import { ParteDeGasto } from '../registrar-gasto/parte';
import type { Campos } from './campos';

interface Referencia {
  readonly id: string;
  readonly nombre: string;
}

export interface PropsEdicion {
  readonly formulario: UseFormReturn<Campos>;
  readonly partes: UseFieldArrayReturn<Campos, 'lineas'>;
  readonly cuentas: readonly Referencia[];
  readonly categorias: readonly Referencia[];
  readonly deudores: readonly Referencia[];
  /** El rechazo del servidor que va junto al campo de las partes, si lo hay. */
  readonly deLasPartes: string | undefined;
  readonly ayuda: string | undefined;
  /** Con la edición de una transacción ya registrada (FT-25): sin tipo, con la cuenta fija o ausente y las partes al total. */
  readonly registrada?: {
    /** No se ofrece la cuenta: la transacción mueve más de una (transferencia, pago). */
    readonly sinCuenta: boolean;
    /** Por qué no se puede cambiar la cuenta (04 §6.7.2 `restricciones`). */
    readonly motivoCuenta?: string;
    /** Cuenta archivada (CB-24): solo categoría, comercio y nota. */
    readonly soloEtiquetas: boolean;
  };
}

const aOpciones = (xs: readonly Referencia[]): Opcion[] =>
  xs.map((x) => ({ valor: x.id, etiqueta: x.nombre }));
const TIPOS: Opcion[] = (Object.keys(t.revisar.tipos) as (keyof typeof t.revisar.tipos)[]).map(
  (k) => ({ valor: k, etiqueta: t.revisar.tipos[k] }),
);

export default function Edicion({
  formulario,
  partes,
  cuentas,
  categorias,
  deudores,
  deLasPartes,
  ayuda,
  registrada,
}: PropsEdicion) {
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
  const opcionesCategorias = aOpciones(categorias);
  const opcionesDeudores: Opcion[] = [
    ...aOpciones(deudores),
    { valor: DEUDOR_NUEVO, etiqueta: g.otraPersona },
  ];
  const errorCuenta = error('cuentaId');
  return (
    <>
      {registrada === undefined ? (
        <Seleccion
          etiqueta={t.revisar.tipo}
          opciones={TIPOS}
          valor={c.tipo}
          alCambiar={(tipo) => {
            poner('tipo')(tipo);
            if (tipo === 'gasto' && c.lineas.length === 0)
              partes.append({ ...parteVacia(), monto: c.total });
          }}
        />
      ) : null}
      {registrada?.sinCuenta === true ? null : (
        <Seleccion
          etiqueta={g.cuenta}
          opciones={aOpciones(cuentas)}
          valor={c.cuentaId}
          alCambiar={poner('cuentaId')}
          deshabilitada={
            registrada?.soloEtiquetas === true || registrada?.motivoCuenta !== undefined
          }
          {...(registrada?.motivoCuenta === undefined
            ? {}
            : { descripcion: registrada.motivoCuenta })}
          {...(errorCuenta === undefined ? {} : { error: errorCuenta })}
        />
      )}
      <EntradaFecha
        nombre="fecha"
        etiqueta={g.fecha}
        valor={c.fecha as FechaLocal}
        alCambiar={poner('fecha')}
        error={error('fecha')}
        requerido
        deshabilitado={registrada?.soloEtiquetas === true}
      />
      <EntradaMonto
        nombre="total"
        etiqueta={t.revisar.monto}
        valor={c.total}
        alCambiar={(valor) => {
          poner('total')(valor);
          // Una sola parte sigue al total (OP-28): se copia el texto, no se calcula (PF-3)
          if (registrada !== undefined && c.lineas.length === 1) poner('lineas.0.monto')(valor);
        }}
        error={error('total')}
        requerido
        deshabilitado={registrada?.soloEtiquetas === true}
      />
      <EntradaTexto etiqueta={g.comercio} autoComplete="off" {...formulario.register('comercio')} />
      <EntradaTexto etiqueta={g.nota} autoComplete="off" {...formulario.register('nota')} />
      {c.tipo === 'gasto' ? (
        <CampoLineas
          etiqueta={g.partes}
          claves={partes.fields.map((f) => f.id)}
          maximo={MAXIMO_PARTES}
          textoAgregar={g.agregarParte}
          textoParte={g.parte}
          textoQuitar={g.quitarParte}
          textoCantidad={g.cantidadPartes}
          alAgregar={() => {
            partes.append(parteVacia());
          }}
          alQuitar={(i) => {
            partes.remove(i);
          }}
          ayuda={ayuda}
          error={deLasPartes ?? formState.errors.lineas?.message}
          renderParte={(i) => {
            const parte = c.lineas[i];
            if (parte === undefined) return null;
            return (
              <ParteDeGasto
                i={i}
                parte={parte}
                categorias={opcionesCategorias}
                deudores={opcionesDeudores}
                error={(campo) => errorDeParte(i, campo)}
                poner={poner}
                alCambiarDestino={(destino: DestinoDeParte) => {
                  poner(`lineas.${i}.destino`)(destino);
                  poner(`lineas.${i}.deudorId`)(
                    destino === 'por_cobrar' && deudores.length === 0 ? DEUDOR_NUEVO : '',
                  );
                }}
                registroDeudorNuevo={formulario.register(`lineas.${i}.deudorNuevo`)}
              />
            );
          }}
        />
      ) : null}
    </>
  );
}
