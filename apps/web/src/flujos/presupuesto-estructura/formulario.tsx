'use client';
// Los flujos cortos de alta de la estructura (FT-18, OP-07; 05 §2.3, §15.2): nuevo grupo y nueva categoría, en una pantalla
// completa o superpuestos (05 §1.4). No calcula nada: los rechazos (`nombre_repetido`, `grupo_del_sistema`) llegan con su mensaje.
import type { ErrorFinn } from '@finn/aplicacion/errores';
import type { GrupoDeEstructura } from '@finn/dominio/selectores';
import { useCallback, type ReactNode } from 'react';
import * as z from 'zod';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { EntradaTexto } from '../../componentes/base/campo';
import { Seleccion } from '../../componentes/base/seleccion';
import { PaginaFlujoDeRuta, SuperpuestoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { crearEnEstructura } from '../../servidor/acciones/categorias';
import { estructura as t } from '../../textos/estructura';

export type ModoEstructura = 'grupo-nuevo' | 'categoria-nueva';
export interface PropsFormularioEstructura {
  readonly modo: ModoEstructura;
  readonly grupos: readonly GrupoDeEstructura[];
  readonly grupoInicial?: string;
  readonly superpuesto: boolean;
}

const RAIZ = '/presupuesto/estructura';
const CONTRATO = z.object({ nombre: z.string().trim().min(1, t.obligatorio), grupoId: z.string() });
type Campos = z.infer<typeof CONTRATO>;
type Cruda = Campos & { modo: string; id?: string };
const ENLACE = 'inline-flex min-h-11 items-center px-3 font-semibold text-enlace underline';

/** Un rechazo cuyo mensaje ya se muestra en su campo no se repite como aviso del formulario. */
const Fallo = ({ e }: { readonly e: ErrorFinn | undefined }) =>
  e === undefined || Object.values(e.campos ?? {}).includes(e.mensaje) ? null : (
    <AvisoEnLinea estado="problema" aparecioDespues>
      {e.mensaje}
    </AvisoEnLinea>
  );

export function FormularioEstructura({
  modo,
  grupos,
  grupoInicial,
  superpuesto,
}: PropsFormularioEstructura) {
  const esGrupo = modo === 'grupo-nuevo';
  // El grupo del sistema no recibe categorías normales (`grupo_del_sistema`) ni uno archivado (`grupo_archivado`).
  const elegibles = grupos.filter((g) => !g.grupo.archivado && !g.grupo.sistema);
  const inicial: Campos = {
    nombre: '',
    grupoId:
      elegibles.find((g) => g.grupo.id === grupoInicial)?.grupo.id ?? elegibles[0]?.grupo.id ?? '',
  };
  const enviarFormulario = useCallback<AccionEscritura>(
    (payload) => {
      const c = payload as Cruda;
      return crearEnEstructura({
        tipo: esGrupo ? 'grupo' : 'categoria',
        id: c.id,
        nombre: c.nombre.trim(),
        modo: c.modo,
        ...(esGrupo ? {} : { grupoId: c.grupoId }),
      });
    },
    [esGrupo],
  );
  const operacion = useOperacion({ accion: enviarFormulario, creacion: true });
  const formulario = useFormularioFinn<Campos>({
    contrato: CONTRATO,
    valoresIniciales: inicial,
    operacion,
  });

  const envuelve = (titulo: string, hijos: ReactNode) =>
    superpuesto ? (
      <SuperpuestoDeRuta titulo={titulo}>{hijos}</SuperpuestoDeRuta>
    ) : (
      <PaginaFlujoDeRuta titulo={titulo} rutaPadre={RAIZ}>
        {hijos}
      </PaginaFlujoDeRuta>
    );
  const volver = (
    <EnlaceFinn href={RAIZ} className={ENLACE}>
      {t.volver}
    </EnlaceFinn>
  );
  if (operacion.estado === 'listo')
    return envuelve(esGrupo ? t.grupoCreado : t.categoriaCreada, volver);

  const { estado } = operacion;
  const errorNombre = formulario.formState.errors.nombre?.message;
  return envuelve(
    esGrupo ? t.tituloGrupoNuevo : t.tituloCategoriaNueva,
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
        textoEnviando={t.creando}
        deshabilitado={!operacion.enLinea}
        {...(operacion.motivoSinEnvio === undefined
          ? {}
          : { motivoDeshabilitado: operacion.motivoSinEnvio })}
      >
        {t.crear}
      </Boton>
    </form>,
  );
}
