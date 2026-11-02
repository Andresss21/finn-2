'use client';
// Los cuatro flujos cortos de la estructura (FT-18; 05 §2.3, §15.2): nuevo grupo y nueva categoría (OP-07), y editar (OP-08:
// nombre y grupo; OP-13: eliminar o archivar). No calcula nada: qué se elimina lo dice `estructura()`.
import type { ErrorFinn } from '@finn/aplicacion/errores';
import type { GrupoDeEstructura } from '@finn/dominio/selectores';
import { useCallback, useState, type ReactNode } from 'react';
import * as z from 'zod';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { EntradaTexto } from '../../componentes/base/campo';
import { Seleccion } from '../../componentes/base/seleccion';
import { PaginaFlujoDeRuta, SuperpuestoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import {
  crearEnEstructura,
  editarEnEstructura,
  eliminarEnEstructura,
} from '../../servidor/acciones/categorias';
import { estructura as t } from '../../textos/estructura';

export type ModoEstructura = 'grupo-nuevo' | 'categoria-nueva' | 'grupo' | 'categoria';
export interface PropsFormularioEstructura {
  readonly modo: ModoEstructura;
  readonly grupos: readonly GrupoDeEstructura[];
  readonly id?: string;
  readonly grupoInicial?: string;
  readonly superpuesto: boolean;
  readonly motivoHistorial?: string;
}

const RAIZ = '/presupuesto/estructura';
const CONTRATO = z.object({ nombre: z.string().trim().min(1, t.obligatorio), grupoId: z.string() });
type Campos = z.infer<typeof CONTRATO>;
type Cruda = Campos & { modo: string; id?: string; esperado?: Record<string, unknown> };
const ENLACE = 'inline-flex min-h-11 items-center px-3 font-semibold text-enlace underline';
const TITULOS = {
  'grupo-nuevo': t.tituloGrupoNuevo,
  'categoria-nueva': t.tituloCategoriaNueva,
  grupo: t.tituloGrupo,
  categoria: t.tituloCategoria,
};

/** El mensaje de un rechazo que no se muestra ya en su campo. */
const Fallo = ({ e }: { readonly e: ErrorFinn | undefined }) =>
  e === undefined || Object.values(e.campos ?? {}).includes(e.mensaje) ? null : (
    <AvisoEnLinea estado="problema" aparecioDespues>
      {e.mensaje}
    </AvisoEnLinea>
  );

export function FormularioEstructura(p: PropsFormularioEstructura) {
  const { modo, grupos, id, superpuesto } = p;
  const esGrupo = modo.startsWith('grupo');
  const nuevo = modo.endsWith('nuevo') || modo.endsWith('nueva');
  const tipo = esGrupo ? 'grupo' : 'categoria';
  const delGrupo = grupos.find((g) =>
    esGrupo ? g.grupo.id === id : g.categorias.some((c) => c.categoria.id === id),
  );
  const fila = esGrupo ? undefined : delGrupo?.categorias.find((c) => c.categoria.id === id);
  const actual = nuevo ? undefined : esGrupo ? delGrupo?.grupo : fila?.categoria;
  const grupoDe = esGrupo || nuevo ? undefined : delGrupo?.grupo.id;
  const elegibles = grupos.filter(
    (g) => (!g.grupo.archivado && !g.grupo.sistema) || g.grupo.id === grupoDe,
  );
  const inicial: Campos = {
    nombre: actual?.nombre ?? '',
    grupoId:
      grupoDe ??
      elegibles.find((g) => g.grupo.id === p.grupoInicial)?.grupo.id ??
      elegibles[0]?.grupo.id ??
      '',
  };

  /** OP-07 u OP-08 desde lo escrito; en OP-08 solo lo que cambió, con lo que vio la persona como `esperado`. */
  const enviarFormulario = useCallback<AccionEscritura>(
    (payload) => {
      const c = payload as Cruda;
      const nombre = c.nombre.trim();
      if (nuevo)
        return crearEnEstructura({
          tipo,
          id: c.id,
          nombre,
          modo: c.modo,
          ...(esGrupo ? {} : { grupoId: c.grupoId }),
        });
      const cambios = {
        ...(nombre === actual?.nombre ? {} : { nombre }),
        ...(esGrupo || c.grupoId === grupoDe ? {} : { grupoId: c.grupoId }),
      };
      return editarEnEstructura({ tipo, id, ...cambios, esperado: c.esperado, modo: c.modo });
    },
    [nuevo, tipo, esGrupo, id, actual?.nombre, grupoDe],
  );
  const operacion = useOperacion({
    accion: enviarFormulario,
    creacion: nuevo,
    ...(nuevo
      ? {}
      : { esperado: { nombre: actual?.nombre, ...(esGrupo ? {} : { grupoId: grupoDe }) } }),
  });
  const formulario = useFormularioFinn<Campos>({
    contrato: CONTRATO,
    valoresIniciales: inicial,
    operacion,
  });
  const baja = useOperacion({ accion: eliminarEnEstructura });
  const [archivando, setArchivando] = useState(false);
  const quitar = (archivar: boolean): void => {
    setArchivando(archivar);
    const accion = esGrupo
      ? archivar
        ? 'archivar_grupo'
        : 'eliminar_grupo'
      : 'eliminar_categoria';
    void baja.enviar({ accion, id });
  };

  const envuelve = (titulo: string, hijos: ReactNode) =>
    superpuesto ? (
      <SuperpuestoDeRuta titulo={titulo}>{hijos}</SuperpuestoDeRuta>
    ) : (
      <PaginaFlujoDeRuta titulo={titulo} rutaPadre={RAIZ}>
        {hijos}
      </PaginaFlujoDeRuta>
    );
  const hecho =
    operacion.estado === 'listo'
      ? nuevo
        ? esGrupo
          ? t.grupoCreado
          : t.categoriaCreada
        : t.guardado
      : baja.estado === 'listo'
        ? archivando
          ? t.grupoArchivado
          : t.eliminado
        : undefined;
  const aparte =
    !nuevo && actual === undefined
      ? t.noExiste
      : esGrupo && delGrupo?.grupo.sistema
        ? t.sinAcciones
        : null;
  if (hecho !== undefined || aparte !== null)
    return envuelve(
      hecho ?? TITULOS[modo],
      <>
        {aparte === null || hecho !== undefined ? null : <p>{aparte}</p>}
        <EnlaceFinn href={RAIZ} className={ENLACE}>
          {t.volver}
        </EnlaceFinn>
      </>,
    );

  const { estado } = operacion;
  const errorNombre = formulario.formState.errors.nombre?.message;
  const sinCambios = !nuevo && !formulario.formState.isDirty;
  const motivo = !operacion.enLinea
    ? operacion.motivoSinEnvio
    : sinCambios
      ? t.sinCambios
      : undefined;
  return envuelve(
    TITULOS[modo],
    <>
      <form onSubmit={(e) => void formulario.enviar(e)} noValidate className="flex flex-col gap-5">
        <EntradaTexto
          etiqueta={t.nombre}
          requerido
          autoComplete="off"
          {...(errorNombre === undefined ? {} : { error: errorNombre })}
          {...formulario.register('nombre')}
        />
        {esGrupo ? null : (
          <Seleccion
            etiqueta={t.grupo}
            opciones={elegibles.map((g) => ({ valor: g.grupo.id, etiqueta: g.grupo.nombre }))}
            valor={formulario.watch('grupoId')}
            alCambiar={(v) => {
              formulario.setValue('grupoId', v, { shouldDirty: true });
            }}
          />
        )}
        <Fallo e={estado === 'error' ? operacion.error : undefined} />
        <Boton
          tipo="submit"
          enviando={estado === 'enviando'}
          textoEnviando={nuevo ? t.creando : t.guardando}
          deshabilitado={motivo !== undefined}
          {...(motivo === undefined ? {} : { motivoDeshabilitado: motivo })}
        >
          {nuevo ? t.crear : t.guardar}
        </Boton>
      </form>
      {nuevo || fila?.clase === 'pago' ? null : (
        <div className="mt-8 flex flex-col gap-3">
          <Fallo e={baja.estado === 'error' ? baja.error : undefined} />
          {esGrupo && !delGrupo?.grupo.archivado ? (
            <Boton
              variante="secundaria"
              enviando={baja.estado === 'enviando' && archivando}
              textoEnviando={t.archivando}
              onClick={() => {
                quitar(true);
              }}
            >
              {t.archivarGrupo}
            </Boton>
          ) : null}
          <Boton
            variante="peligro"
            enviando={baja.estado === 'enviando' && !archivando}
            textoEnviando={t.eliminando}
            deshabilitado={fila?.puedeEliminar === false}
            {...(p.motivoHistorial === undefined ? {} : { motivoDeshabilitado: p.motivoHistorial })}
            onClick={() => {
              quitar(false);
            }}
          >
            {esGrupo ? t.eliminarGrupo : t.eliminarCategoria}
          </Boton>
          {fila?.puedeEliminar === false ? (
            <div className="flex flex-wrap">
              <EnlaceFinn
                href={`/presupuesto/categorias/${fila.categoria.id}/archivar`}
                className={ENLACE}
              >
                {t.archivarCategoria}
              </EnlaceFinn>
              <EnlaceFinn
                href={`/presupuesto/categorias/${fila.categoria.id}/fusionar`}
                className={ENLACE}
              >
                {t.fusionarCategoria}
              </EnlaceFinn>
            </div>
          ) : null}
        </div>
      )}
    </>,
  );
}
