'use client';
// `/reglas/nueva` (FT-39, OP-41 crear; 05 §2): crear una regla de comercio sin esperar a aprobar un SMS. Los campos y el aviso
// de fallo los comparte `/reglas/[reglaId]`. No calcula nada (PF-3).
// [C-45] El comercio y la categoría son filas de un `GrupoCampos` (CAMPOS-V3 §2); la categoría, la lista propia con sus grupos (§6).
// «Guardar» se ve apagado mientras falte algo y dice debajo cuántos campos corregir (§5 y §11).
import * as z from 'zod';
import { useCallback } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { ErrorFinn } from '@finn/aplicacion/errores';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { EntradaTexto, GrupoCampos } from '../../componentes/base/campo';
import { SeleccionNativa } from '../../componentes/base/seleccion-nativa';
import { CerrarFlujoAlMontar, PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { useGuardarV3 } from '../../formularios/guardar-v3';
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
  const errorPatron = errors.patron?.message ?? errorDelServidor;
  return (
    <GrupoCampos>
      <EntradaTexto
        etiqueta={t.patron}
        requerido
        name="patron"
        autoComplete="off"
        value={valores.patron}
        onChange={(e) => {
          poner('patron')(e.target.value);
        }}
        {...(errorPatron === undefined ? {} : { error: errorPatron })}
      />
      <SeleccionNativa
        etiqueta={t.categoria}
        marcador={t.elegirCategoria}
        nombre="categoriaId"
        opciones={[
          ...(extra === undefined
            ? []
            : [{ valor: extra.id, etiqueta: t.archivadaEnLista(extra.nombre) }]),
          ...grupos.flatMap((g) =>
            g.categorias.map((c) => ({ valor: c.id, etiqueta: c.nombre, grupo: g.nombre })),
          ),
        ]}
        valor={valores.categoriaId}
        alCambiar={poner('categoriaId')}
        error={errors.categoriaId?.message}
      />
    </GrupoCampos>
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
  const guardar = useGuardarV3({
    contrato: CONTRATO_REGLA,
    campos: formulario.watch(),
    intentos: formulario.formState.submitCount,
    motivoSinEnvio: operacion.motivoSinEnvio,
  });

  if (estado === 'listo')
    return (
      <PaginaFlujoDeRuta titulo={t.creada} rutaPadre={RUTA_PADRE}>
        <CerrarFlujoAlMontar rutaPadre={RUTA_PADRE} />
      </PaginaFlujoDeRuta>
    );

  const repetido = fallo?.codigo === 'patron_repetido';
  return (
    <PaginaFlujoDeRuta titulo={t.tituloNueva} rutaPadre={RUTA_PADRE}>
      <form
        ref={guardar.forma}
        onSubmit={(e) => void formulario.enviar(e)}
        noValidate
        className="flex flex-col gap-5"
      >
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
          className="w-full"
          {...guardar.boton}
        >
          {t.guardar}
        </Boton>
      </form>
    </PaginaFlujoDeRuta>
  );
}
