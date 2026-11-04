'use client';
// `/programadas/nueva` (FT-40, OP-42 crear; 05 §2): el flujo largo de un gasto programado: cuenta, comercio, monto y tolerancia, categoría,
// frecuencia, primera fecha, fin y registro automático. Los tipos con destino y las partes son de TA-473. No calcula montos (PF-3).
import type { ErrorFinn } from '@finn/aplicacion/errores';
import type { FechaLocal } from '@finn/dominio/valores';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Campo, EntradaTexto } from '../../componentes/base/campo';
import { EntradaFecha } from '../../componentes/formularios/entrada-fecha';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import { CerrarFlujoAlMontar, PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { formularios } from '../../textos/formularios';
import { programadas as t } from '../../textos/programadas';
import { contrato, entradaDeCreacion, FRECUENCIAS, type Campos } from './campos';

interface Ref {
  readonly id: string;
  readonly nombre: string;
}
export interface PropsFormularioProgramada {
  readonly inicial: Campos;
  readonly cuentas: readonly Ref[];
  readonly categorias: readonly Ref[];
  /** `gestionarProgramada` (OP-42): la pone el lector. */
  readonly accion: AccionEscritura;
}

const RUTA_PADRE = '/programadas';
const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
const SELECT = 'min-h-11 rounded-control border border-borde bg-superficie px-3 text-base';
const enSuCampo = (e: ErrorFinn): boolean => Object.values(e.campos ?? {}).includes(e.mensaje);
const errorDe = (mensaje: string | undefined): { error?: string } =>
  mensaje === undefined ? {} : { error: mensaje };

function Lista({
  valor,
  alCambiar,
  items,
  props,
  vacio,
}: {
  readonly valor: string;
  readonly alCambiar: (v: string) => void;
  readonly items: readonly Ref[];
  readonly props: object;
  readonly vacio: string;
}) {
  return (
    <select
      {...props}
      value={valor}
      onChange={(e) => {
        alCambiar(e.target.value);
      }}
      className={SELECT}
    >
      <option value="">{vacio}</option>
      {items.map((x) => (
        <option key={x.id} value={x.id}>
          {x.nombre}
        </option>
      ))}
    </select>
  );
}

export function FormularioProgramada(p: PropsFormularioProgramada) {
  const operacion = useOperacion({ accion: p.accion, creacion: true });
  const formulario = useFormularioFinn<Campos>({
    contrato,
    valoresIniciales: p.inicial,
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
  const { estado, error: falla } = operacion;
  const alEnviar = formulario.handleSubmit(() =>
    operacion.enviar(entradaDeCreacion(formulario.getValues())),
  );

  if (estado === 'listo')
    return (
      <PaginaFlujoDeRuta titulo={t.creada} rutaPadre={RUTA_PADRE}>
        <CerrarFlujoAlMontar rutaPadre={RUTA_PADRE} />
      </PaginaFlujoDeRuta>
    );

  return (
    <PaginaFlujoDeRuta titulo={t.tituloNueva} rutaPadre={RUTA_PADRE}>
      <form onSubmit={(e) => void alEnviar(e)} noValidate className="flex flex-col gap-5">
        <Campo etiqueta={t.cuenta} requerido {...errorDe(errors.cuentaId?.message)}>
          {(props) => (
            <Lista
              props={props}
              valor={c.cuentaId}
              alCambiar={poner('cuentaId')}
              items={p.cuentas}
              vacio={t.elegirCuenta}
            />
          )}
        </Campo>
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
        <Campo etiqueta={t.categoria} requerido {...errorDe(errors.categoriaId?.message)}>
          {(props) => (
            <Lista
              props={props}
              valor={c.categoriaId}
              alCambiar={poner('categoriaId')}
              items={p.categorias}
              vacio={t.categoria}
            />
          )}
        </Campo>
        <Campo etiqueta={t.frecuencia} requerido>
          {(props) => (
            <select
              {...props}
              value={c.frecuencia}
              onChange={(e) => {
                poner('frecuencia')(e.target.value as Campos['frecuencia']);
              }}
              className={SELECT}
            >
              {FRECUENCIAS.map((f) => (
                <option key={f} value={f}>
                  {t.frecuencias[f]}
                </option>
              ))}
            </select>
          )}
        </Campo>
        {c.frecuencia === 'cada_n_dias' ? (
          <EntradaTexto
            etiqueta={t.cadaDias}
            requerido
            inputMode="numeric"
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
          textoEnviando={t.creando}
          deshabilitado={!operacion.enLinea}
          {...(operacion.motivoSinEnvio === undefined
            ? {}
            : { motivoDeshabilitado: operacion.motivoSinEnvio })}
        >
          {t.crear}
        </Boton>
      </form>
    </PaginaFlujoDeRuta>
  );
}
