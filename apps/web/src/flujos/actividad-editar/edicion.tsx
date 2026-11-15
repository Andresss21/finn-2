'use client';
// Los campos de `/actividad/[transaccionId]/editar` (FT-25, OP-28). Se cargan aparte para que la ruta no pase su presupuesto de
// bytes (05 §13.1). [C-45, C-49 §5] Campos v3: el total es el billete; Cuenta, Fecha y Comercio van en un grupo (la cuenta fija, en
// «Solo lectura»); un gasto usa «¿Quién paga?» y «¿En qué categorías?» de Registrar gasto, y la nota va en su grupo. Las partes con
// cobros o devoluciones no cambian de destino ni se quitan (E3-16). Los montos que se proponen salen de `formularios/reparto`
// (CH-276); la suma la valida el servidor.
import { useEffect } from 'react';
import type { FechaLocal } from '@finn/dominio/valores';
import type { UseFormReturn } from 'react-hook-form';
import { EntradaTexto, GrupoCampos } from '../../componentes/base/campo';
import { SeleccionFila } from '../../componentes/base/seleccion-fila';
import { DatoFijo } from '../../componentes/formularios/dato-fijo';
import { EntradaFecha } from '../../componentes/formularios/entrada-fecha';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import { registrarGasto as g } from '../../textos/registrar-gasto';
import type { CategoriaDelCampo } from '../registrar-gasto/categorias';
import type { EstadoDelGasto } from '../registrar-gasto/estado';
import type { Bloqueo } from '../registrar-gasto/quien-paga';
import { SeccionesDelGasto } from '../registrar-gasto/secciones';
import type { CamposDeEdicion as Campos } from './campos';

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
  readonly cuentas: readonly CuentaDeEdicion[];
  readonly categorias: readonly CategoriaDelCampo[];
  readonly deudores: readonly Referencia[];
  /** El estado de las dos secciones de un gasto (`estadoDelGasto`); sin él, no es un gasto. */
  readonly e: EstadoDelGasto | undefined;
  /** El rechazo del servidor que va junto al resumen de las categorías, si lo hay. */
  readonly deLasPartes: string | undefined;
  /** No se ofrece la cuenta: la transacción mueve más de una (transferencia, pago). */
  readonly sinCuenta: boolean;
  /** Por qué no se puede cambiar la cuenta (04 §6.7.2 `restricciones`). */
  readonly motivoCuenta?: string;
  /** Cuenta archivada (CB-24): solo categoría, comercio y nota. */
  readonly soloEtiquetas: boolean;
  readonly bloqueo?: Bloqueo | undefined;
  readonly alSalir: (seccion: 'personas' | 'categorias') => () => void;
  readonly anunciar: (texto: string) => void;
}

export default function Edicion({
  alMontar,
  formulario,
  cuentas,
  categorias,
  deudores,
  e,
  deLasPartes,
  sinCuenta,
  motivoCuenta,
  soloEtiquetas,
  bloqueo,
  alSalir,
  anunciar,
}: PropsEdicion) {
  useEffect(() => {
    alMontar?.();
  }, [alMontar]);
  const { setValue, formState } = formulario;
  const c = formulario.watch();
  const poner = (nombre: 'cuentaId' | 'fecha' | 'total') => (valor: string) => {
    setValue(nombre, valor, { shouldDirty: true, shouldValidate: formState.isSubmitted });
  };
  const ponerVarios = (parcial: Partial<Campos>) => {
    for (const [k, v] of Object.entries(parcial))
      setValue(k as keyof Campos, v as never, { shouldDirty: true });
  };
  const error = (n: 'cuentaId' | 'fecha' | 'total'): string | undefined =>
    formState.errors[n]?.message;
  const fija = cuentas.find((x) => x.id === c.cuentaId);
  return (
    <>
      <EntradaMonto
        nombre="total"
        etiqueta={g.totalV3}
        variante="total"
        valor={c.total}
        alCambiar={poner('total')}
        error={e?.errorTotal ?? error('total')}
        requerido
        deshabilitado={soloEtiquetas}
      />
      <GrupoCampos>
        {sinCuenta ? null : (soloEtiquetas || motivoCuenta !== undefined) && fija !== undefined ? (
          <DatoFijo
            nombre="cuenta"
            rotulo={g.cuentaV3}
            valor={fija.nombre}
            {...(motivoCuenta === undefined || soloEtiquetas ? {} : { motivo: motivoCuenta })}
          />
        ) : (
          <SeleccionFila
            etiqueta={g.cuentaV3}
            marcador={g.elegirCuenta}
            opciones={cuentas.map((x) => ({ valor: x.id, etiqueta: x.nombre, detalle: x.detalle }))}
            valor={c.cuentaId}
            alCambiar={poner('cuentaId')}
            error={error('cuentaId')}
          />
        )}
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
        <EntradaTexto
          etiqueta={g.comercio}
          autoComplete="off"
          {...formulario.register('comercio')}
        />
      </GrupoCampos>
      {e === undefined ? null : (
        <SeccionesDelGasto
          c={c}
          e={e}
          categorias={categorias}
          deudores={deudores}
          deLasPartes={deLasPartes}
          poner={ponerVarios}
          alSalir={alSalir}
          anunciar={anunciar}
          bloqueo={bloqueo}
        />
      )}
      <GrupoCampos>
        <EntradaTexto etiqueta={g.nota} autoComplete="off" {...formulario.register('nota')} />
      </GrupoCampos>
    </>
  );
}
