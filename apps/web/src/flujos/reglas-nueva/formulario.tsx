'use client';
// `/reglas/nueva` (FT-39, OP-41 crear; 05 §2): crear una regla de comercio sin esperar a aprobar un SMS. Los campos y el aviso
// de fallo los comparte `/reglas/[reglaId]`. No calcula nada (PF-3).
import * as z from 'zod';
import { useCallback } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { ErrorFinn } from '@finn/aplicacion/errores';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Campo } from '../../componentes/base/campo';
import { CerrarFlujoAlMontar, PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { gestionarRegla } from '../../servidor/acciones/bandeja';
import { formularios } from '../../textos/formularios';
import { reglas as t } from '../../textos/reglas';

export interface GrupoCategorias {
  readonly nombre: string;
  readonly categorias: readonly { readonly id: string; readonly nombre: string }[];
}
export const CONTRATO_REGLA = z.object({
  patron: z.string().trim().min(1, t.obligatorio),
  categoriaId: z.string().min(1, t.obligatorio),
});
export type CamposDeRegla = z.infer<typeof CONTRATO_REGLA>;
export const RUTA_PADRE = '/reglas';
// El campo relleno (06-identidad-visual 2.5) para el texto y para el `<select>` nativo.
const CAJA =
  'min-h-12 w-full rounded-t-control rounded-b-sm border-b-2 border-borde-control bg-superficie px-3 text-base text-texto focus-visible:border-b-4 focus-visible:border-foco focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco aria-invalid:border-2 aria-invalid:border-problema-borde';

/** Un fallo que no es del campo del patrón; si se puede repetir, con el botón (4.7). */
export function AvisoDeFallo({ fallo, reintentar }: { fallo: ErrorFinn; reintentar: () => void }) {
  const reintentable = ['OCUPADO', 'INCIERTO', 'INTERNO'].includes(fallo.categoria);
  return (
    <AvisoEnLinea
      estado="problema"
      aparecioDespues
      {...(reintentable
        ? {
            accion: (
              <Boton variante="secundaria" onClick={reintentar}>
                {formularios.intentarDeNuevo}
              </Boton>
            ),
          }
        : {})}
    >
      {fallo.mensaje}
    </AvisoEnLinea>
  );
}

export interface PropsCamposRegla {
  readonly formulario: UseFormReturn<CamposDeRegla>;
  readonly grupos: readonly GrupoCategorias[];
  /** La categoría actual de la regla cuando ya no está en el catálogo (archivada): se ofrece para no perderla. */
  readonly extra?: { readonly id: string; readonly nombre: string };
  /** `patron_repetido`, que el servidor no trae en `campos`. */
  readonly errorDelServidor: string | undefined;
}

export function CamposRegla({ formulario, grupos, extra, errorDelServidor }: PropsCamposRegla) {
  const valores = formulario.watch();
  const { errors, isSubmitted } = formulario.formState;
  const poner = (campo: keyof CamposDeRegla) => (valor: string) => {
    formulario.setValue(campo, valor, { shouldDirty: true, shouldValidate: isSubmitted });
  };
  const error = (mensaje: string | undefined) => (mensaje === undefined ? {} : { error: mensaje });
  return (
    <div className="flex flex-col gap-5">
      <Campo etiqueta={t.patron} requerido {...error(errors.patron?.message ?? errorDelServidor)}>
        {(props) => (
          <input
            {...props}
            name="patron"
            value={valores.patron}
            autoComplete="off"
            className={CAJA}
            onChange={(e) => {
              poner('patron')(e.target.value);
            }}
          />
        )}
      </Campo>
      <Campo etiqueta={t.categoria} requerido {...error(errors.categoriaId?.message)}>
        {(props) => (
          <select
            {...props}
            name="categoriaId"
            value={valores.categoriaId}
            onChange={(e) => {
              poner('categoriaId')(e.target.value);
            }}
            className={CAJA}
          >
            <option value="" disabled>
              {t.categoria}
            </option>
            {extra === undefined ? null : (
              <option value={extra.id}>{t.archivadaEnLista(extra.nombre)}</option>
            )}
            {grupos.map((g) => (
              <optgroup key={g.nombre} label={g.nombre}>
                {g.categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        )}
      </Campo>
    </div>
  );
}

export function FormularioReglaNueva({ grupos }: { readonly grupos: readonly GrupoCategorias[] }) {
  const crear = useCallback<AccionEscritura>((payload) => {
    const c = payload as CamposDeRegla & { id: string; modo: string };
    return gestionarRegla({ ...c, accion: 'crear', patron: c.patron.trim() });
  }, []);
  const operacion = useOperacion({ accion: crear, creacion: true });
  const formulario = useFormularioFinn<CamposDeRegla>({
    contrato: CONTRATO_REGLA,
    valoresIniciales: { patron: '', categoriaId: '' },
    operacion,
  });
  const { estado, error: fallo } = operacion;

  if (estado === 'listo')
    return (
      <PaginaFlujoDeRuta titulo={t.creada} rutaPadre={RUTA_PADRE}>
        <CerrarFlujoAlMontar rutaPadre={RUTA_PADRE} />
      </PaginaFlujoDeRuta>
    );

  const repetido = fallo?.codigo === 'patron_repetido';
  return (
    <PaginaFlujoDeRuta titulo={t.tituloNueva} rutaPadre={RUTA_PADRE}>
      <form onSubmit={(e) => void formulario.enviar(e)} noValidate className="flex flex-col gap-5">
        <CamposRegla
          formulario={formulario}
          grupos={grupos}
          errorDelServidor={repetido ? fallo.mensaje : undefined}
        />
        {estado === 'error' && fallo !== undefined && !repetido ? (
          <AvisoDeFallo fallo={fallo} reintentar={() => void operacion.reintentar()} />
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
