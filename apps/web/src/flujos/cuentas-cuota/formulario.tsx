'use client';
// `/cuentas/[cuentaId]/cuota` (FT-54, OP-24; 05 §2.7): pagar la cuota de un préstamo o abonar a capital. El desglose propuesto se
// recalcula al cambiar la fecha si la persona no lo editó. No calcula montos (PF-3): el servidor decide la suma y los avisos.
import type { ErrorFinn } from '@finn/aplicacion/errores';
import type { Centavos, FechaLocal } from '@finn/dominio/valores';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { ErrorDeFlujo } from '../../componentes/formularios/error-de-flujo';
import { Boton } from '../../componentes/base/boton';
import { Resultado } from '../../componentes/base/resultado';
import { Seleccion } from '../../componentes/base/seleccion';
import { ConfirmacionImpacto } from '../../componentes/formularios/confirmacion-impacto';
import { EntradaFecha } from '../../componentes/formularios/entrada-fecha';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import { PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { useReemplazarBusqueda } from '../../componentes/navegacion/use-reemplazar-busqueda';
import { formatearMonto, formatearMontoTexto } from '../../formato';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { pagarCuotaPrestamo } from '../../servidor/acciones/transacciones';
import { cuentasCuota as t } from '../../textos/cuentas-cuota';
import { formularios } from '../../textos/formularios';
import {
  CAMPOS_PROPUESTOS,
  aEntradaDeAccion,
  contratoDe,
  valoresIniciales,
  type Campos,
  type Modalidad,
  type Propuesta,
} from './campos';

export interface PropsFormularioCuentasCuota {
  readonly modalidad: Modalidad;
  readonly prestamoId: string;
  readonly prestamoNombre: string;
  readonly hoy: FechaLocal;
  /** La fecha con que abre: la de `?fecha=` o `hoy`. */
  readonly fecha: string;
  readonly origenes: readonly {
    readonly id: string;
    readonly nombre: string;
    readonly tarjeta: boolean;
  }[];
  readonly categorias: readonly {
    readonly id: string;
    readonly nombre: string;
    readonly grupo: string;
    readonly disponible: Centavos;
  }[];
  readonly capitalPendiente: Centavos;
  readonly cuotaPactada: string;
  readonly tieneModelo: boolean;
  readonly propuesta: Propuesta | undefined;
  readonly categoriaPropuesta: string | undefined;
}

interface Previsualizacion {
  readonly impacto?: { readonly deltaLpa: Centavos } | null;
  readonly avisos?: readonly { readonly codigo: string }[];
}

/** Un rechazo que ya se muestra en su campo no se repite como aviso. */
const enSuCampo = (e: ErrorFinn): boolean => Object.values(e.campos ?? {}).includes(e.mensaje);

export function FormularioCuentasCuota(props: PropsFormularioCuentasCuota) {
  const { modalidad, prestamoId, prestamoNombre, hoy, origenes, categorias, propuesta } = props;
  const esCuota = modalidad === 'cuota';
  const titulo = esCuota ? t.tituloCuota : t.tituloAbono;
  const rutaPadre = `/cuentas/${prestamoId}`;
  const reemplazarBusqueda = useReemplazarBusqueda();
  const enviar: AccionEscritura = (payload) =>
    pagarCuotaPrestamo(aEntradaDeAccion(modalidad, prestamoId, payload));
  const operacion = useOperacion({ accion: enviar, creacion: true });
  const [inicial] = useState(() =>
    valoresIniciales(
      props.fecha,
      props.categoriaPropuesta,
      propuesta,
      props.cuotaPactada,
      modalidad,
    ),
  );
  const contrato = useMemo(() => contratoDe(modalidad), [modalidad]);
  const formulario = useFormularioFinn<Campos>({ contrato, valoresIniciales: inicial, operacion });
  const { setValue, formState } = formulario;
  const c = formulario.watch();

  // Lo que la persona ya escribió no se pisa con una propuesta nueva (05 §2.7).
  const editados = useRef(new Set<keyof Campos>());
  useEffect(() => {
    if (propuesta === undefined) return;
    for (const n of CAMPOS_PROPUESTOS)
      if (!editados.current.has(n)) setValue(n, propuesta[n], { shouldDirty: false });
  }, [propuesta, setValue]);

  const poner = (n: keyof Campos) => (valor: string) => {
    if ((CAMPOS_PROPUESTOS as readonly string[]).includes(n)) editados.current.add(n);
    setValue(n, valor as never, { shouldDirty: true, shouldValidate: formState.isSubmitted });
  };
  const cambiarFecha = (fecha: string) => {
    setValue('fecha', fecha, { shouldDirty: true, shouldValidate: formState.isSubmitted });
    if (esCuota && props.tieneModelo) reemplazarBusqueda({ modalidad, fecha });
  };
  const error = (n: keyof Campos): string | undefined => formState.errors[n]?.message;
  const conError = (n: keyof Campos): { error?: string } => {
    const mensaje = error(n);
    return mensaje === undefined ? {} : { error: mensaje };
  };

  const { estado, error: fallo, exito } = operacion;
  const vista = (operacion.previsualizacion ?? {}) as Previsualizacion;

  if (estado === 'listo' && exito !== undefined) {
    const monto = formatearMontoTexto(c.total);
    return (
      <PaginaFlujoDeRuta titulo={esCuota ? t.listoCuota : t.listoAbono} rutaPadre={rutaPadre}>
        <div className="flex flex-col gap-4">
          <Resultado texto={(esCuota ? t.cuotaGuardada : t.abonoGuardado)(monto, prestamoNombre)} />
          {exito.avisos.map((a) => (
            <AvisoEnLinea key={a.codigo} estado="informacion" aparecioDespues>
              {t.avisos[a.codigo] ?? a.mensaje}
            </AvisoEnLinea>
          ))}
        </div>
      </PaginaFlujoDeRuta>
    );
  }

  return (
    <PaginaFlujoDeRuta titulo={titulo} rutaPadre={rutaPadre}>
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
          <p>{t.capitalPendiente(formatearMonto(props.capitalPendiente))}</p>
          <Seleccion
            etiqueta={t.origen}
            opciones={origenes.map((x) => ({
              valor: x.id,
              etiqueta: x.nombre,
              descripcion: x.tarjeta ? t.tarjeta : t.efectivo,
            }))}
            valor={c.origenId}
            alCambiar={poner('origenId')}
            {...conError('origenId')}
          />
          <EntradaFecha
            nombre="fecha"
            etiqueta={t.fecha}
            valor={c.fecha as FechaLocal}
            alCambiar={cambiarFecha}
            maxima={hoy}
            hoy={hoy}
            error={error('fecha')}
            requerido
          />
          <Seleccion
            etiqueta={t.categoria}
            opciones={categorias.map((x) => ({
              valor: x.id,
              etiqueta: x.nombre,
              descripcion: t.disponibleDe(x.grupo, formatearMonto(x.disponible)),
            }))}
            valor={c.categoriaId}
            alCambiar={poner('categoriaId')}
            {...conError('categoriaId')}
          />
          <EntradaMonto
            nombre="total"
            etiqueta={t.total}
            valor={c.total}
            alCambiar={poner('total')}
            error={error('total')}
            requerido
          />
          {esCuota ? (
            <>
              <p>
                {propuesta !== undefined
                  ? t.propuestaCuota(String(propuesta.numeroCuota))
                  : props.tieneModelo
                    ? t.sinPropuesta
                    : t.sinModelo}
              </p>
              {(['capital', 'interes', 'seguro'] as const).map((n) => (
                <EntradaMonto
                  key={n}
                  nombre={n}
                  etiqueta={t[n]}
                  valor={c[n]}
                  alCambiar={poner(n)}
                  error={error(n)}
                  requerido
                />
              ))}
            </>
          ) : (
            <p>{t.abonoNota(formatearMontoTexto('0'))}</p>
          )}
          {estado === 'error' && fallo !== undefined && !enSuCampo(fallo) ? (
            <ErrorDeFlujo
              tipo="largo"
              error={fallo}
              alReintentar={() => void operacion.reintentar()}
            />
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
            {esCuota ? t.guardarCuota : t.guardarAbono}
          </Boton>
        </form>
      )}
    </PaginaFlujoDeRuta>
  );
}
