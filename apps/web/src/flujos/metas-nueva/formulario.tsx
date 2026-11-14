'use client';
// `/metas/nueva` (FT-17, OP-18 crear; 05 §2.3): el flujo corto de crear la meta de una categoría. Editar y eliminar son de TA-442
// (`/metas/[metaId]`, CH-83). No calcula montos (PF-3).
// [C-45] Campos v3 (CAMPOS-V3 §2, §6 y §8): la categoría, el tipo (cuatro opciones en fila) y el modo (segmentado), y el monto y la
// fecha, en sus `GrupoCampos`. «Crear meta» se ve apagado mientras falte algo y dice debajo qué (§5 y §11).
import type { ErrorFinn } from '@finn/aplicacion/errores';
import type { FechaLocal } from '@finn/dominio/valores';
import { useCallback } from 'react';
import * as z from 'zod';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { GrupoCampos } from '../../componentes/base/campo';
import { SeleccionNativa } from '../../componentes/base/seleccion-nativa';
import { Opciones } from '../../componentes/base/controles-fila';
import { EntradaFecha } from '../../componentes/formularios/entrada-fecha';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import { CerrarFlujoAlMontar, PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { useGuardarV3 } from '../../formularios/guardar-v3';
import { normalizarMontoEscrito } from '../../formularios/normalizar-monto';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { gestionarMeta } from '../../servidor/acciones/presupuesto';
import { base } from '../../textos/base';
import { formularios } from '../../textos/formularios';
import { metas as t } from '../../textos/metas';

export interface PropsFormularioMeta {
  readonly categorias: readonly { readonly id: string; readonly nombre: string }[];
  readonly categoriaInicial?: string | undefined;
}

const TIPOS = ['mensual', 'semanal', 'anual', 'para_fecha'] as const;
const MODOS = ['acumular', 'rellenar_hasta'] as const;

export const CONTRATO = z
  .object({
    categoriaId: z.string(),
    tipo: z.enum(TIPOS),
    modoMeta: z.enum(MODOS),
    monto: z.string(),
    fechaObjetivo: z.string(),
  })
  .superRefine((c, ctx) => {
    const falla = (path: string, message: string): void => {
      ctx.addIssue({ code: 'custom', path: [path], message });
    };
    const monto = normalizarMontoEscrito(c.monto);
    if (monto.estado !== 'valido' || monto.esCero) falla('monto', base.montoMayorQueCero);
    if (c.categoriaId === '') falla('categoriaId', t.categoriaObligatoria);
    if (c.tipo === 'para_fecha' && c.fechaObjetivo === '') falla('fechaObjetivo', t.obligatorio);
  });
export type Campos = z.infer<typeof CONTRATO>;
type Cruda = Campos & { modo: string; id?: string };

const RUTA_PADRE = '/metas';
export const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
export const opciones = (m: Readonly<Record<string, string>>) =>
  Object.entries(m).map(([valor, etiqueta]) => ({ valor, etiqueta }));
export const enSuCampo = (e: ErrorFinn): boolean =>
  Object.values(e.campos ?? {}).includes(e.mensaje);

export function FormularioMeta({ categorias, categoriaInicial }: PropsFormularioMeta) {
  const inicial: Campos = {
    // [CH-289] Sin `?categoria=` no se preelige ninguna, ni con una sola: la elige el usuario.
    categoriaId: categorias.find((c) => c.id === categoriaInicial)?.id ?? '',
    tipo: 'mensual',
    modoMeta: 'acumular',
    monto: '',
    fechaObjetivo: '',
  };
  const enviarFormulario = useCallback<AccionEscritura>((payload) => {
    const c = payload as Cruda;
    const r = normalizarMontoEscrito(c.monto);
    const porPeriodo = c.tipo === 'mensual' || c.tipo === 'semanal';
    return gestionarMeta({
      accion: 'crear',
      id: c.id,
      modo: c.modo,
      categoriaId: c.categoriaId,
      tipo: c.tipo,
      monto: r.estado === 'valido' ? r.texto : c.monto,
      ...(porPeriodo ? { modoMeta: c.modoMeta } : {}),
      ...(c.fechaObjetivo === '' || porPeriodo ? {} : { fechaObjetivo: c.fechaObjetivo }),
    });
  }, []);
  const operacion = useOperacion({ accion: enviarFormulario, creacion: true });
  const formulario = useFormularioFinn<Campos>({
    contrato: CONTRATO,
    valoresIniciales: inicial,
    operacion,
  });
  const c = formulario.watch();
  const { errors } = formulario.formState;
  const poner = (n: keyof Campos) => (valor: string) => {
    formulario.setValue(n, valor, {
      shouldDirty: true,
      shouldValidate: formulario.formState.isSubmitted,
    });
  };
  const porPeriodo = c.tipo === 'mensual' || c.tipo === 'semanal';
  // Con la categoría ya elegida (S4 del export 09a) el título la nombra y no hay selector.
  const fija = categorias.find((x) => x.id === categoriaInicial);
  const { estado, error: fallo } = operacion;
  const guardar = useGuardarV3({
    contrato: CONTRATO,
    campos: c,
    intentos: formulario.formState.submitCount,
    motivoSinEnvio: operacion.motivoSinEnvio,
    monto: 'monto',
  });

  if (estado === 'listo')
    return (
      <PaginaFlujoDeRuta titulo={t.creada} rutaPadre={RUTA_PADRE}>
        <CerrarFlujoAlMontar rutaPadre={RUTA_PADRE} />
      </PaginaFlujoDeRuta>
    );

  return (
    <PaginaFlujoDeRuta
      titulo={fija === undefined ? t.tituloNueva : t.tituloPara(fija.nombre)}
      rutaPadre={RUTA_PADRE}
    >
      <form
        ref={guardar.forma}
        onSubmit={(e) => void formulario.enviar(e)}
        noValidate
        className="flex flex-col gap-5"
      >
        {fija === undefined ? (
          <GrupoCampos>
            <SeleccionNativa
              etiqueta={t.categoria}
              marcador={t.elegirCategoria}
              opciones={categorias.map((x) => ({ valor: x.id, etiqueta: x.nombre }))}
              valor={c.categoriaId}
              alCambiar={poner('categoriaId')}
              error={errors.categoriaId?.message}
            />
          </GrupoCampos>
        ) : null}
        <section className="flex flex-col gap-2">
          <h2 aria-hidden="true" className="text-cuerpo-pequeno font-semibold">
            {t.tipo}
          </h2>
          <Opciones
            etiqueta={t.tipo}
            opciones={opciones(t.tipos)}
            valor={c.tipo}
            alCambiar={poner('tipo')}
          />
        </section>
        <GrupoCampos>
          {porPeriodo ? (
            <SeleccionNativa
              etiqueta={t.modo}
              marcador={t.modo}
              opciones={opciones(t.modos)}
              valor={c.modoMeta}
              alCambiar={poner('modoMeta')}
            />
          ) : null}
          <EntradaMonto
            nombre="monto"
            etiqueta={t.monto}
            valor={c.monto}
            alCambiar={poner('monto')}
            error={errors.monto?.message}
            requerido
          />
          {porPeriodo ? null : (
            <EntradaFecha
              nombre="fechaObjetivo"
              etiqueta={c.tipo === 'anual' ? t.fechaObjetivoAnual : t.fechaObjetivo}
              valor={c.fechaObjetivo as FechaLocal}
              alCambiar={poner('fechaObjetivo')}
              error={errors.fechaObjetivo?.message}
              requerido={c.tipo === 'para_fecha'}
            />
          )}
        </GrupoCampos>
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
          textoEnviando={t.creando}
          deshabilitado={!operacion.enLinea}
          {...guardar.boton}
        >
          {t.crear}
        </Boton>
      </form>
    </PaginaFlujoDeRuta>
  );
}
