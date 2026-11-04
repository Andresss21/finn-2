'use client';
// `/ajustes/instituciones/nueva` y `/ajustes/instituciones/[institucionId]` (FT-73, OPT-07; 05 §2.11): crear o renombrar una institución.
// El nombre es único sin distinguir mayúsculas; el rechazo (`nombre_repetido`) llega del servidor en el campo. Flujo corto.
import type { ErrorFinn } from '@finn/aplicacion/errores';
import { useState, type SyntheticEvent } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { EntradaTexto } from '../../componentes/base/campo';
import { CerrarFlujoAlMontar, PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { ajustesInstituciones as t } from '../../textos/ajustes-instituciones';
import { formularios } from '../../textos/formularios';

const RUTA_PADRE = '/ajustes/instituciones';
const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
const enSuCampo = (e: ErrorFinn): boolean => Object.values(e.campos ?? {}).includes(e.mensaje);

export interface PropsFormularioInstitucion {
  /** `guardarInstitucion` (OPT-07): la pone el lector, así el formulario se prueba sin servidor. */
  readonly guardar: AccionEscritura;
  /** Con él se renombra; sin él se crea (el `id` lo genera `useOperacion`). */
  readonly institucion?: { readonly id: string; readonly nombre: string };
}

export function FormularioInstitucion({ guardar, institucion }: PropsFormularioInstitucion) {
  const operacion = useOperacion({ accion: guardar, creacion: institucion === undefined });
  const [nombre, setNombre] = useState(institucion?.nombre ?? '');
  const { estado, error: fallo } = operacion;
  const titulo = institucion === undefined ? t.tituloNueva : t.tituloEditar;

  if (estado === 'listo')
    return (
      <PaginaFlujoDeRuta titulo={titulo} rutaPadre={RUTA_PADRE}>
        <CerrarFlujoAlMontar rutaPadre={RUTA_PADRE} />
      </PaginaFlujoDeRuta>
    );

  const enviar = (e: SyntheticEvent) => {
    e.preventDefault();
    void operacion.enviar({ nombre, ...(institucion === undefined ? {} : { id: institucion.id }) });
  };
  const errorNombre = fallo?.campos?.['nombre'];
  return (
    <PaginaFlujoDeRuta titulo={titulo} rutaPadre={RUTA_PADRE}>
      <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
        <EntradaTexto
          etiqueta={t.nombre}
          requerido
          autoComplete="off"
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
          }}
          {...(errorNombre === undefined ? {} : { error: errorNombre })}
        />
        {estado === 'error' && fallo !== undefined && !enSuCampo(fallo) ? (
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
        <Boton
          tipo="submit"
          enviando={estado === 'enviando'}
          textoEnviando={t.guardando}
          deshabilitado={!operacion.enLinea}
          {...(operacion.motivoSinEnvio === undefined
            ? {}
            : { motivoDeshabilitado: operacion.motivoSinEnvio })}
        >
          {t.guardar}
        </Boton>
      </form>
    </PaginaFlujoDeRuta>
  );
}
