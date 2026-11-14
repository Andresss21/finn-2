'use client';
// `/por-cobrar/condonar/[lineaId]` (FT-47, OP-32; 05 §2, §4.4): perdonar todo o parte de lo que te deben, que pasa a ser un gasto tuyo en
// la categoría que elijas. Flujo corto: desde la app se abre superpuesto. Se guarda en un solo viaje; si la fecha es de un período cerrado
// el servidor pide confirmar con AV-01. Después, AV-02 o AV-03 si la categoría queda sobregirada. No calcula montos (PF-3): el tope, el
// Disponible y la categoría propuesta son del servidor, y el rechazo por pasarse del saldo abierto llega ya compuesto.
// [C-45] El monto, la fecha y la categoría son filas de un `GrupoCampos` (CAMPOS-V3 §2 y §6): el monto con «$» y la categoría en
// la lista propia con su Disponible (el negativo en problema). «Condonar» se ve apagado mientras falte algo y dice debajo qué.
import type { FechaLocal } from '@finn/dominio/valores';
import { lazy, Suspense, useMemo, type ReactNode } from 'react';
import * as z from 'zod';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { GrupoCampos } from '../../componentes/base/campo';
import { Resultado } from '../../componentes/base/resultado';
import { SeleccionNativa } from '../../componentes/base/seleccion-nativa';
import { EntradaFecha } from '../../componentes/formularios/entrada-fecha';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import {
  CerrarFlujoAlMontar,
  PaginaFlujoDeRuta,
  SuperpuestoDeRuta,
  useCerrarFlujo,
} from '../../componentes/navegacion/flujo-de-ruta';
import { formatearMontoTexto } from '../../formato';
import { useGuardarV3 } from '../../formularios/guardar-v3';
import { esMontoPositivo, normalizarMontoEscrito } from '../../formularios/normalizar-monto';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { base } from '../../textos/base';
import { formularios } from '../../textos/formularios';
import { porCobrarCondonar as t } from '../../textos/por-cobrar-condonar';
import { PieDeHoja } from '../pie-de-hoja';

const ConfirmacionImpacto = lazy(() =>
  import('../../componentes/formularios/confirmacion-impacto-de-vista').then((m) => ({
    default: m.ConfirmacionImpactoDeVista,
  })),
);

export interface PropsFormularioCondonar {
  /** `condonar` (OP-32): la pone el lector, así el formulario se prueba sin servidor. */
  readonly accion: AccionEscritura;
  readonly lineaId: string;
  readonly deudor: string;
  /** Lo que queda abierto de la partida, ya formateado del DTO (PF-3). */
  readonly abierto: string;
  /** El abierto como texto decimal: lo que trae el campo al abrir. */
  readonly montoInicial: string;
  readonly hoy: FechaLocal;
  /** Las categorías activas con su Disponible (el archivo de una categoría la saca del catálogo). */
  readonly categorias: readonly {
    readonly id: string;
    readonly nombre: string;
    readonly disponible: string;
  }[];
  /** La categoría de la misma compra, si está activa; sin ella se pide elegir una. */
  readonly categoriaPropuesta: string | undefined;
  readonly rutaPadre: string;
  readonly superpuesto: boolean;
}

interface Campos {
  monto: string;
  fecha: string;
  categoriaId: string;
}

const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
const contrato = z.object({
  monto: z
    .string()
    .refine(esMontoPositivo, { error: base.montoMayorQueCero }),
  fecha: z.string().min(1, t.obligatorio),
  categoriaId: z.string().min(1, t.elegirCategoria),
});

function Marco({
  p,
  titulo,
  descripcion,
  children,
}: {
  readonly p: PropsFormularioCondonar;
  readonly titulo: string;
  readonly descripcion?: string;
  readonly children: ReactNode;
}) {
  const d = descripcion === undefined ? {} : { descripcion };
  return p.superpuesto ? (
    <SuperpuestoDeRuta titulo={titulo} {...d}>
      {children}
    </SuperpuestoDeRuta>
  ) : (
    <PaginaFlujoDeRuta titulo={titulo} rutaPadre={p.rutaPadre} {...d}>
      {children}
    </PaginaFlujoDeRuta>
  );
}

export function FormularioCondonar(p: PropsFormularioCondonar) {
  const { lineaId, hoy, rutaPadre, superpuesto } = p;
  const enviar: AccionEscritura = (payload) => {
    const { modo, id, revisionVista, huellaImpacto, ...escrito } = payload as Record<
      string,
      unknown
    >;
    const c = escrito as unknown as Campos;
    const normal = normalizarMontoEscrito(c.monto);
    return p.accion({
      lineaId,
      monto: normal.estado === 'valido' ? normal.texto : c.monto,
      fecha: c.fecha,
      categoriaId: c.categoriaId,
      modo,
      id,
      ...(revisionVista === undefined ? {} : { revisionVista, huellaImpacto }),
    });
  };
  const operacion = useOperacion({ accion: enviar, creacion: true });
  const formulario = useFormularioFinn<Campos>({
    contrato,
    valoresIniciales: {
      monto: p.montoInicial,
      fecha: hoy,
      categoriaId: p.categoriaPropuesta ?? '',
    },
    operacion,
  });
  const { setValue, formState } = formulario;
  const c = formulario.watch();
  const cerrar = useCerrarFlujo(rutaPadre, superpuesto);
  const { estado, error: fallo, exito } = operacion;
  const opciones = useMemo(
    () =>
      p.categorias.map((x) => ({
        valor: x.id,
        etiqueta: x.nombre,
        detalle: t.disponibleDe(x.disponible),
        // El Disponible llega formateado del DTO (PF-3): el negativo empieza con U+2212.
        negativo: x.disponible.startsWith('−'),
      })),
    [p.categorias],
  );
  const poner = (nombre: keyof Campos) => (valor: string) => {
    setValue(nombre, valor, { shouldDirty: true, shouldValidate: formState.isSubmitted });
  };
  const error = (n: keyof Campos): string | undefined => formState.errors[n]?.message;
  const monto = normalizarMontoEscrito(c.monto);
  const guardar = useGuardarV3({
    contrato,
    campos: c,
    intentos: formState.submitCount,
    motivoSinEnvio: operacion.motivoSinEnvio,
    monto: 'monto',
  });
  const titulo = t.titulo(p.deudor);

  // Terminó: sin avisos se cierra; con AV-02 o AV-03 se queda a decirlo (06 FT-47, paso 2)
  if (estado === 'listo' && exito !== undefined) {
    const avisos = exito.avisos.flatMap((a) => {
      const texto = t.avisos[a.codigo];
      return texto === undefined ? [] : [{ codigo: a.codigo, texto }];
    });
    if (avisos.length === 0)
      return <CerrarFlujoAlMontar rutaPadre={rutaPadre} superpuesto={superpuesto} />;
    return (
      <Marco p={p} titulo={t.tituloListo}>
        <div className="flex flex-col gap-4">
          <Resultado texto={t.guardado(formatearMontoTexto(c.monto), p.deudor)} />
          {avisos.map((a) => (
            <AvisoEnLinea key={a.codigo} estado="informacion" aparecioDespues>
              <span data-aviso={a.codigo}>{a.texto}</span>
            </AvisoEnLinea>
          ))}
          <Boton onClick={cerrar}>{t.listo}</Boton>
        </div>
      </Marco>
    );
  }

  const vista = (operacion.previsualizacion ?? {}) as Parameters<
    typeof ConfirmacionImpacto
  >[0]['vista'] & { readonly avisos?: readonly { readonly codigo: string }[] };

  return (
    <Marco p={p} titulo={titulo} descripcion={t.abierto(p.abierto)}>
      {estado === 'confirmando' ? (
        <Suspense fallback={null}>
          <ConfirmacionImpacto
            titulo={t.revisar}
            {...(operacion.impactoCambio ? { nota: formularios.impactoCambio } : {})}
            vista={vista}
            avisos={(vista.avisos ?? []).map((a) => t.avisos[a.codigo] ?? a.codigo)}
            textoConfirmar={t.confirmar}
            textoVolver={t.volverAEditar}
            enviando={false}
            alConfirmar={() => void operacion.confirmar()}
            alVolver={operacion.volverAEditar}
          />
        </Suspense>
      ) : (
        <form
          ref={guardar.forma}
          onSubmit={(e) => void formulario.enviar(e)}
          noValidate
          className="flex flex-col gap-5"
        >
          <GrupoCampos>
            <EntradaMonto
              nombre="monto"
              etiqueta={t.monto}
              valor={c.monto}
              alCambiar={poner('monto')}
              error={error('monto')}
              descripcion={t.hastaAbierto(p.abierto)}
              requerido
            />
            <EntradaFecha
              nombre="fecha"
              etiqueta={t.fecha}
              valor={c.fecha as FechaLocal}
              alCambiar={poner('fecha')}
              maxima={hoy}
              hoy={hoy}
              error={error('fecha')}
              requerido
            />
            <SeleccionNativa
              etiqueta={t.categoria}
              marcador={t.marcador}
              opciones={opciones}
              valor={c.categoriaId}
              alCambiar={poner('categoriaId')}
              error={error('categoriaId')}
            />
          </GrupoCampos>
          {p.categoriaPropuesta === undefined ? (
            <p data-sin-propuesta className="text-cuerpo-pequeno text-texto-secundario">
              {t.sinPropuesta}
            </p>
          ) : null}
          {estado === 'error' &&
          fallo !== undefined &&
          !Object.values(fallo.campos ?? {}).includes(fallo.mensaje) ? (
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
          <PieDeHoja rutaPadre={rutaPadre} superpuesto={superpuesto}>
            <Boton
              tipo="submit"
              enviando={estado === 'enviando'}
              textoEnviando={t.condonando}
              deshabilitado={!operacion.enLinea}
              {...guardar.boton}
            >
              {monto.estado === 'valido'
                ? t.condonarMonto(formatearMontoTexto(monto.texto))
                : t.condonar}
            </Boton>
          </PieDeHoja>
        </form>
      )}
    </Marco>
  );
}
