'use client';
// `/programadas/nueva` y `/programadas/[programadaId]` (FT-40, OP-42 crear y editar, OP-51; 05 §2): el flujo largo de una programada: tipo, cuentas, comercio, monto y tolerancia, partes del
// gasto, frecuencia, primera fecha, fin y registro automático. Los destinos salen del catálogo del servidor. Con `programadaId` edita
// (OP-42 `editar`, OP-51 eliminar); con `calendarioEditable = false` la primera fecha y la frecuencia se muestran sin edición y con el motivo.
// No calcula montos (PF-3): la suma de las partes la valida el servidor.
import type { ErrorFinn } from '@finn/aplicacion/errores';
import type { FechaLocal } from '@finn/dominio/valores';
import type { ReactNode } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { EntradaTexto } from '../../componentes/base/campo';
import { SeleccionNativa } from '../../componentes/base/seleccion-nativa';
import { SelectorSegmentado } from '../../componentes/base/selector-segmentado';
import { CampoLineas } from '../../componentes/formularios/campo-lineas';
import { EntradaFecha } from '../../componentes/formularios/entrada-fecha';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import { CerrarFlujoAlMontar, PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { formularios } from '../../textos/formularios';
import { programadas as t } from '../../textos/programadas';
import {
  contrato,
  entradaDeCreacion,
  entradaDeEdicion,
  FRECUENCIAS,
  valoresEnviables,
  type Campos,
} from './campos';

interface Ref {
  readonly id: string;
  readonly nombre: string;
}
export interface PropsFormularioProgramada {
  /** Sin `programadaId`, crea. */
  readonly programadaId?: string;
  readonly nombre?: string;
  readonly inicial: Campos;
  /** Cuentas de origen: un gasto sale de efectivo o tarjeta; los demás tipos, de efectivo. */
  readonly origenes: { readonly gasto: readonly Ref[]; readonly otros: readonly Ref[] };
  readonly destinos: Readonly<
    Record<'pago_tarjeta' | 'cuota_prestamo' | 'aporte_inversion', readonly Ref[]>
  >;
  readonly categorias: readonly Ref[];
  /** `false` con historial: primera fecha y frecuencia sin edición, con este motivo. */
  readonly calendarioEditable: boolean;
  readonly motivoCalendario: string;
  readonly puedeEliminar: boolean;
  /** `gestionarProgramada` (OP-42) y `eliminarProgramada` (OP-51): las pone el lector. */
  readonly accion: AccionEscritura;
  readonly accionEliminar: AccionEscritura;
  /** Desactivar y reactivar (solo al editar): lo arma el lector. */
  readonly activar?: ReactNode;
}

const RUTA_PADRE = '/programadas';
const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
const enSuCampo = (e: ErrorFinn): boolean => Object.values(e.campos ?? {}).includes(e.mensaje);
const errorDe = (mensaje: string | undefined): { error?: string } =>
  mensaje === undefined ? {} : { error: mensaje };
const opciones = (m: Readonly<Record<string, string>>) =>
  Object.entries(m).map(([valor, etiqueta]) => ({ valor, etiqueta }));
const deRefs = (xs: readonly Ref[]) => xs.map((x) => ({ valor: x.id, etiqueta: x.nombre }));
const PARTE_VACIA = { monto: '', categoriaId: '' };

export function FormularioProgramada(p: PropsFormularioProgramada) {
  const { programadaId, inicial, calendarioEditable } = p;
  const edita = programadaId !== undefined;
  const operacion = useOperacion({
    accion: p.accion,
    ...(edita ? { esperado: valoresEnviables(inicial) } : { creacion: true }),
  });
  const eliminacion = useOperacion({ accion: p.accionEliminar });
  const formulario = useFormularioFinn<Campos>({
    contrato,
    valoresIniciales: inicial,
    operacion,
  });
  const c = formulario.watch();
  const { errors } = formulario.formState;
  const poner =
    <K extends keyof Campos>(n: K) =>
    (valor: Campos[K]) => {
      formulario.setValue(n, valor as never, {
        shouldDirty: true,
        shouldValidate: formulario.formState.isSubmitted,
      });
    };
  const ponerLineas = (lineas: Campos['lineas']) => {
    formulario.setValue('lineas', lineas, { shouldDirty: true });
  };
  const cambiarTipo = (tipo: string) => {
    formulario.setValue('tipo', tipo as Campos['tipo'], { shouldDirty: true });
    formulario.setValue('cuentaId', '');
    formulario.setValue('cuentaDestinoId', '');
    ponerLineas(tipo === 'pago_tarjeta' ? [] : [c.lineas[0] ?? PARTE_VACIA]);
  };
  const { estado, error: fallo } = operacion;
  const falla = fallo ?? eliminacion.error;
  const erroresLineas = errors.lineas as
    | readonly ({ monto?: { message?: string }; categoriaId?: { message?: string } } | undefined)[]
    | undefined;
  const alEnviar = formulario.handleSubmit(() => {
    const valores = formulario.getValues();
    if (!edita) return operacion.enviar(entradaDeCreacion(valores));
    const entrada = entradaDeEdicion(programadaId, inicial, valores);
    return entrada === undefined ? undefined : operacion.enviar(entrada);
  });

  if (estado === 'listo' || eliminacion.estado === 'listo')
    return (
      <PaginaFlujoDeRuta
        titulo={eliminacion.estado === 'listo' ? t.eliminada : edita ? t.guardada : t.creada}
        rutaPadre={RUTA_PADRE}
      >
        <CerrarFlujoAlMontar rutaPadre={RUTA_PADRE} />
      </PaginaFlujoDeRuta>
    );

  const origenes = c.tipo === 'gasto' ? p.origenes.gasto : p.origenes.otros;
  const destinos = c.tipo === 'gasto' ? [] : p.destinos[c.tipo];
  const varias = c.tipo === 'gasto' && c.lineas.length > 1;
  const ponerParte = (i: number, cambio: Partial<Campos['lineas'][number]>) => {
    ponerLineas(c.lineas.map((l, j) => (j === i ? { ...l, ...cambio } : l)));
  };

  return (
    <PaginaFlujoDeRuta
      titulo={edita ? t.tituloEditar(p.nombre ?? '') : t.tituloNueva}
      rutaPadre={RUTA_PADRE}
    >
      <form onSubmit={(e) => void alEnviar(e)} noValidate className="flex flex-col gap-5">
        {edita ? null : (
          <SelectorSegmentado
            etiqueta={t.tipo}
            opciones={opciones(t.tipos)}
            valor={c.tipo}
            alCambiar={cambiarTipo}
          />
        )}
        <SeleccionNativa
          etiqueta={t.cuenta}
          opciones={deRefs(origenes)}
          valor={c.cuentaId}
          alCambiar={poner('cuentaId')}
          marcador={t.elegirCuenta}
          {...errorDe(errors.cuentaId?.message)}
        />
        {c.tipo === 'gasto' ? null : (
          <SeleccionNativa
            etiqueta={t.cuentaDestino}
            opciones={deRefs(destinos)}
            valor={c.cuentaDestinoId}
            alCambiar={poner('cuentaDestinoId')}
            marcador={t.elegirCuenta}
            {...errorDe(errors.cuentaDestinoId?.message)}
          />
        )}
        <EntradaTexto
          etiqueta={t.comercio}
          requerido
          value={c.comercio}
          onChange={(e) => {
            poner('comercio')(e.target.value);
          }}
          {...errorDe(errors.comercio?.message)}
        />
        <div className="grid grid-cols-2 gap-3">
          <EntradaMonto
            nombre="monto"
            etiqueta={t.monto}
            valor={c.monto}
            alCambiar={poner('monto')}
            error={errors.monto?.message}
            requerido
          />
          <EntradaMonto
            nombre="tolerancia"
            etiqueta={t.tolerancia}
            valor={c.tolerancia}
            alCambiar={poner('tolerancia')}
            error={errors.tolerancia?.message}
          />
        </div>
        {c.tipo === 'pago_tarjeta' ? null : varias ? (
          <CampoLineas
            etiqueta={t.partes}
            claves={c.lineas.map((_, i) => String(i))}
            maximo={20}
            textoAgregar={t.agregarParte}
            textoParte={t.parte}
            textoQuitar={t.quitarParte}
            textoCantidad={t.cantidadPartes}
            alAgregar={() => {
              ponerLineas([...c.lineas, PARTE_VACIA]);
            }}
            alQuitar={(i) => {
              ponerLineas(c.lineas.filter((_, j) => j !== i));
            }}
            error={fallo?.codigo === 'suma_lineas_distinta' ? fallo.mensaje : undefined}
            renderParte={(i) => (
              <>
                <EntradaMonto
                  nombre={`lineas.${i}.monto`}
                  etiqueta={t.montoDeParte(String(i + 1))}
                  valor={c.lineas[i]?.monto ?? ''}
                  alCambiar={(v) => {
                    ponerParte(i, { monto: v });
                  }}
                  error={erroresLineas?.[i]?.monto?.message}
                  requerido
                />
                <SeleccionNativa
                  etiqueta={t.categoriaDeParte(String(i + 1))}
                  opciones={deRefs(p.categorias)}
                  valor={c.lineas[i]?.categoriaId ?? ''}
                  alCambiar={(v) => {
                    ponerParte(i, { categoriaId: v });
                  }}
                  marcador={t.categoria}
                  {...errorDe(erroresLineas?.[i]?.categoriaId?.message)}
                />
              </>
            )}
          />
        ) : (
          <>
            <SeleccionNativa
              etiqueta={t.categoria}
              opciones={deRefs(p.categorias)}
              valor={c.lineas[0]?.categoriaId ?? ''}
              alCambiar={(v) => {
                ponerLineas([{ monto: c.monto, categoriaId: v }]);
              }}
              marcador={t.categoria}
              {...errorDe(erroresLineas?.[0]?.categoriaId?.message)}
            />
            {c.tipo === 'gasto' ? (
              <Boton
                variante="discreta"
                onClick={() => {
                  ponerLineas([
                    { monto: c.monto, categoriaId: c.lineas[0]?.categoriaId ?? '' },
                    PARTE_VACIA,
                  ]);
                }}
              >
                {t.agregarParte}
              </Boton>
            ) : null}
          </>
        )}
        {calendarioEditable ? null : (
          <AvisoEnLinea estado="informacion">{p.motivoCalendario}</AvisoEnLinea>
        )}
        <SeleccionNativa
          deshabilitado={!calendarioEditable}
          etiqueta={t.frecuencia}
          opciones={FRECUENCIAS.map((f) => ({ valor: f, etiqueta: t.frecuencias[f] }))}
          valor={c.frecuencia}
          alCambiar={(v) => {
            poner('frecuencia')(v as Campos['frecuencia']);
          }}
          marcador={t.frecuencia}
        />
        {c.frecuencia === 'cada_n_dias' ? (
          <EntradaTexto
            etiqueta={t.cadaDias}
            requerido
            inputMode="numeric"
            disabled={!calendarioEditable}
            value={c.frecuenciaDias}
            onChange={(e) => {
              poner('frecuenciaDias')(e.target.value.replace(/\D/g, ''));
            }}
            {...errorDe(errors.frecuenciaDias?.message)}
          />
        ) : null}
        <EntradaFecha
          nombre="primeraFecha"
          etiqueta={t.primeraFecha}
          valor={c.primeraFecha as FechaLocal}
          alCambiar={poner('primeraFecha')}
          error={errors.primeraFecha?.message}
          deshabilitado={!calendarioEditable}
          requerido
        />
        <EntradaFecha
          nombre="fechaFin"
          etiqueta={t.fechaFin}
          valor={c.fechaFin as FechaLocal}
          alCambiar={poner('fechaFin')}
          error={errors.fechaFin?.message}
        />
        <label className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            role="switch"
            checked={c.registroAutomatico}
            onChange={(e) => {
              poner('registroAutomatico')(e.target.checked);
            }}
            className="size-11"
          />
          <span className="text-cuerpo">{t.registroAutomatico}</span>
        </label>
        {falla !== undefined && !enSuCampo(falla) ? (
          <AvisoEnLinea
            estado="problema"
            aparecioDespues
            {...(REINTENTABLES.includes(falla.categoria)
              ? {
                  accion: (
                    <Boton variante="secundaria" onClick={() => void operacion.reintentar()}>
                      {formularios.intentarDeNuevo}
                    </Boton>
                  ),
                }
              : {})}
          >
            {falla.mensaje}
          </AvisoEnLinea>
        ) : null}
        <Boton
          tipo="submit"
          enviando={estado === 'enviando'}
          textoEnviando={edita ? t.guardando : t.creando}
          deshabilitado={!operacion.enLinea}
          {...(operacion.motivoSinEnvio === undefined
            ? {}
            : { motivoDeshabilitado: operacion.motivoSinEnvio })}
        >
          {edita ? t.guardar : t.crear}
        </Boton>
        {edita ? p.activar : null}
        {edita && p.puedeEliminar ? (
          <Boton
            variante="peligro"
            enviando={eliminacion.estado === 'enviando'}
            textoEnviando={t.eliminando}
            onClick={() => void eliminacion.enviar({ programadaId })}
          >
            {t.eliminar}
          </Boton>
        ) : null}
      </form>
    </PaginaFlujoDeRuta>
  );
}
