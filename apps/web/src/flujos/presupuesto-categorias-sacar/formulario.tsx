'use client';
// `/presupuesto/categorias/[categoriaId]/sacar` (FT-19, OP-11; 05 §2.3, §4.4, §4.7): el flujo corto de sacar el dinero de una
// archivada hacia Listo para asignar o hacia otra categoría. Abre con la propuesta de AV-14 (todo el Disponible a Listo para
// asignar) y envía `esperado` con las asignaciones que vio al abrir (CP-10a). `conflicto_desactualizado` ofrece los valores actuales.
// No calcula montos (PF-3): el Disponible y los topes los dice el servidor.
import type { Centavos } from '@finn/dominio/valores';
import { useCallback, useState } from 'react';
import * as z from 'zod';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Seleccion, type Opcion } from '../../componentes/base/seleccion';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import {
  CerrarFlujoAlMontar,
  PaginaFlujoDeRuta,
  SuperpuestoDeRuta,
} from '../../componentes/navegacion/flujo-de-ruta';
import { centavosATextoDecimal, formatearMonto } from '../../formato';
import { normalizarMontoEscrito } from '../../formularios/normalizar-monto';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { categoriasArchivar } from '../../textos/categorias-archivar';
import { formularios } from '../../textos/formularios';

const t = categoriasArchivar.sacar;

export interface PropsFormularioSacar {
  /** `sacarDisponible` (OP-11): la pone el lector, así el formulario se prueba sin servidor. */
  readonly accion: AccionEscritura;
  readonly categoriaId: string;
  readonly categoria: string;
  readonly asignado: Centavos;
  readonly disponible: Centavos;
  readonly destinos: readonly {
    readonly id: string;
    readonly nombre: string;
    readonly asignado: Centavos;
    readonly disponible: Centavos;
  }[];
  /** La pantalla a la que vuelve la página completa al terminar (`cerrarFlujo()`, 05 §1.4). */
  readonly rutaPadre: string;
  readonly superpuesto: boolean;
}

const LPA = 'lpa';
const CONTRATO = z.object({
  destino: z.string().min(1),
  monto: z
    .string()
    .refine((v) => normalizarMontoEscrito(v).estado === 'valido', { error: t.obligatorio }),
});
type Campos = z.infer<typeof CONTRATO>;
type Cruda = Campos & { modo: string };
const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];

interface Actuales {
  readonly asignacionOrigen?: Centavos;
  readonly asignacionDestino?: Centavos;
}

interface PropsCuerpo {
  readonly p: PropsFormularioSacar;
  readonly asignados: Readonly<Record<string, Centavos>>;
  readonly inicial: Campos;
  readonly alUsarActuales: (
    campos: Campos,
    origen: Centavos,
    destino: Centavos | undefined,
  ) => void;
}

function Cuerpo({ p, asignados, inicial, alUsarActuales }: PropsCuerpo) {
  const { accion, categoriaId, superpuesto, rutaPadre } = p;
  const enviar = useCallback<AccionEscritura>(
    (payload) => {
      const { modo, destino, monto } = payload as Cruda;
      const normal = normalizarMontoEscrito(monto);
      return accion({
        categoriaId,
        monto: normal.estado === 'valido' ? normal.texto : monto,
        destino: destino === LPA ? LPA : { categoriaId: destino },
        esperado: {
          asignacionOrigen: centavosATextoDecimal(asignados[categoriaId] as Centavos),
          ...(destino === LPA
            ? {}
            : { asignacionDestino: centavosATextoDecimal(asignados[destino] as Centavos) }),
        },
        modo,
      });
    },
    [accion, categoriaId, asignados],
  );
  const operacion = useOperacion({ accion: enviar });
  const formulario = useFormularioFinn<Campos>({
    contrato: CONTRATO,
    valoresIniciales: inicial,
    operacion,
  });
  const { estado, error: fallo } = operacion;
  const c = formulario.watch();
  const actuales = fallo?.datos?.['actuales'] as Actuales | undefined;
  const conflicto = fallo?.codigo === 'conflicto_desactualizado' && actuales !== undefined;

  if (estado === 'listo')
    return (
      <>
        <p role="status">{t.listo}</p>
        <CerrarFlujoAlMontar rutaPadre={rutaPadre} superpuesto={superpuesto} />
      </>
    );

  const opciones: readonly Opcion[] = [
    { valor: LPA, etiqueta: categoriasArchivar.lpa },
    ...p.destinos.map((d) => ({
      valor: d.id,
      etiqueta: categoriasArchivar.categoriaConDisponible(d.nombre, formatearMonto(d.disponible)),
    })),
  ];
  const errores = formulario.formState.errors;
  return (
    <form onSubmit={(e) => void formulario.enviar(e)} noValidate className="flex flex-col gap-5">
      <p>{t.disponible(p.categoria, formatearMonto(p.disponible))}</p>
      <Seleccion
        etiqueta={t.destino}
        opciones={opciones}
        valor={c.destino}
        alCambiar={(v) => {
          formulario.setValue('destino', v, { shouldDirty: true });
        }}
      />
      <EntradaMonto
        nombre="monto"
        etiqueta={t.monto}
        valor={c.monto}
        alCambiar={(v) => {
          formulario.setValue('monto', v, {
            shouldDirty: true,
            shouldValidate: formulario.formState.isSubmitted,
          });
        }}
        error={errores.monto?.message}
        requerido
      />
      {estado === 'error' && fallo !== undefined ? (
        <AvisoEnLinea
          estado="problema"
          aparecioDespues
          {...(conflicto && actuales.asignacionOrigen !== undefined
            ? {
                accion: (
                  <Boton
                    variante="secundaria"
                    onClick={() => {
                      alUsarActuales(
                        formulario.getValues(),
                        actuales.asignacionOrigen as Centavos,
                        actuales.asignacionDestino,
                      );
                    }}
                  >
                    {t.usarValoresActuales}
                  </Boton>
                ),
              }
            : REINTENTABLES.includes(fallo.categoria)
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
        textoEnviando={t.sacando}
        deshabilitado={!operacion.enLinea}
        {...(operacion.motivoSinEnvio === undefined
          ? {}
          : { motivoDeshabilitado: operacion.motivoSinEnvio })}
      >
        {t.sacar}
      </Boton>
    </form>
  );
}

export function FormularioSacar(p: PropsFormularioSacar) {
  // "Usar los valores actuales": las asignaciones que se envían como `esperado` pasan a lo que hay ahora y se conserva lo escrito.
  // `useOperacion` copia la entrada una sola vez, así que el cuerpo se vuelve a montar.
  const [base, setBase] = useState<{
    asignados: Readonly<Record<string, Centavos>>;
    inicial: Campos;
    version: number;
  }>({
    asignados: {
      [p.categoriaId]: p.asignado,
      ...Object.fromEntries(p.destinos.map((d) => [d.id, d.asignado])),
    },
    inicial: { destino: LPA, monto: centavosATextoDecimal(p.disponible) },
    version: 0,
  });
  const cuerpo = (
    <Cuerpo
      key={base.version}
      p={p}
      asignados={base.asignados}
      inicial={base.inicial}
      alUsarActuales={(campos, origen, destino) => {
        setBase((b) => ({
          asignados: {
            ...b.asignados,
            [p.categoriaId]: origen,
            ...(destino === undefined ? {} : { [campos.destino]: destino }),
          },
          inicial: campos,
          version: b.version + 1,
        }));
      }}
    />
  );
  const titulo = categoriasArchivar.sacar.titulo;
  return p.superpuesto ? (
    <SuperpuestoDeRuta titulo={titulo}>{cuerpo}</SuperpuestoDeRuta>
  ) : (
    <PaginaFlujoDeRuta titulo={titulo} rutaPadre={p.rutaPadre}>
      {cuerpo}
    </PaginaFlujoDeRuta>
  );
}
