'use client';
// `/ajustes/instituciones/nueva` y `/ajustes/instituciones/[institucionId]` (FT-73, OPT-07; 05 §2.11; E5-14): crear o renombrar una
// institución. Flujo corto: hoja sobre la lista cuando se llega desde ella (panel de 440 px en computadora); página completa si se abre
// la URL. El nombre es único sin distinguir mayúsculas; el rechazo (`nombre_repetido`) llega del servidor con el texto de 04 §7.10 en
// el campo.
import type { ErrorFinn } from '@finn/aplicacion/errores';
import { useState, type ReactNode, type SyntheticEvent } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { EntradaTexto } from '../../componentes/base/campo';
import {
  CerrarFlujoAlMontar,
  PaginaFlujoDeRuta,
  SuperpuestoDeRuta,
  useCerrarFlujo,
} from '../../componentes/navegacion/flujo-de-ruta';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { ajustesInstituciones as t } from '../../textos/ajustes-instituciones';
import { formularios } from '../../textos/formularios';

const RUTA_PADRE = '/ajustes/instituciones';
const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
const enSuCampo = (e: ErrorFinn): boolean => Object.values(e.campos ?? {}).includes(e.mensaje);

export interface PropsFormularioInstitucion {
  /** `guardarInstitucion` (OPT-07): la pone el lector, así el formulario se prueba sin servidor. */
  readonly guardar: AccionEscritura;
  /** Con ella se renombra; sin ella se crea (el `id` lo genera `useOperacion`). */
  readonly institucion?: {
    readonly id: string;
    readonly nombre: string;
    readonly formatos: number;
  };
  /** Hoja sobre la lista (ruta interceptada) o página completa. */
  readonly superpuesto?: boolean;
}

export function FormularioInstitucion({
  guardar,
  institucion,
  superpuesto = false,
}: PropsFormularioInstitucion) {
  const operacion = useOperacion({ accion: guardar, creacion: institucion === undefined });
  const [nombre, setNombre] = useState(institucion?.nombre ?? '');
  const cerrar = useCerrarFlujo(RUTA_PADRE, superpuesto);
  const { estado, error: fallo } = operacion;
  const titulo = institucion === undefined ? t.tituloNueva : t.renombrar(institucion.nombre);
  const marco = (contenido: ReactNode) =>
    superpuesto ? (
      <SuperpuestoDeRuta
        titulo={titulo}
        {...(institucion === undefined ? {} : { descripcion: t.formatosDe(institucion.formatos) })}
      >
        {contenido}
      </SuperpuestoDeRuta>
    ) : (
      <PaginaFlujoDeRuta titulo={titulo} rutaPadre={RUTA_PADRE}>
        {contenido}
      </PaginaFlujoDeRuta>
    );

  if (estado === 'listo')
    return marco(<CerrarFlujoAlMontar rutaPadre={RUTA_PADRE} superpuesto={superpuesto} />);

  const enviar = (e: SyntheticEvent) => {
    e.preventDefault();
    void operacion.enviar({ nombre, ...(institucion === undefined ? {} : { id: institucion.id }) });
  };
  const errorNombre = fallo?.campos?.['nombre'];
  return marco(
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
      <EntradaTexto
        etiqueta={t.nombre}
        descripcion={institucion === undefined ? t.ayudaNueva : t.ayudaRenombrar}
        requerido
        autoComplete="off"
        value={nombre}
        onChange={(e) => {
          setNombre(e.target.value);
        }}
        {...(errorNombre === undefined ? {} : { error: errorNombre })}
      />
      {estado === 'error' &&
      fallo !== undefined &&
      !enSuCampo(fallo) &&
      errorNombre === undefined ? (
        <AvisoEnLinea
          estado="problema"
          aparecioDespues
          {...(REINTENTABLES.includes(fallo.categoria)
            ? {
                accion: (
                  <Boton variante="secundaria" onClick={() => void operacion.reintentar()}>
                    {formularios.intentarDeNuevo}
                  </Boton>
                ),
              }
            : {})}
        >
          {fallo.mensaje}
        </AvisoEnLinea>
      ) : null}
      <div className="flex gap-3 *:flex-1">
        <Boton variante="secundaria" onClick={cerrar}>
          {t.cancelar}
        </Boton>
        <Boton
          tipo="submit"
          enviando={estado === 'enviando'}
          textoEnviando={t.guardando}
          deshabilitado={!operacion.enLinea}
          {...(operacion.motivoSinEnvio === undefined
            ? {}
            : { motivoDeshabilitado: operacion.motivoSinEnvio })}
        >
          {institucion === undefined ? t.crear : t.guardar}
        </Boton>
      </div>
    </form>,
  );
}
