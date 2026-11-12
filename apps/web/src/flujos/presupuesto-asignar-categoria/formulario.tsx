'use client';
// `/presupuesto/asignar/[categoriaId]` (FT-10, OP-14; 05 §2.3, §4.4, §4.7): el flujo corto de cambiar lo asignado a una categoría
// en un período activo o futuro. Muestra lo que trae el servidor y envía el valor absoluto con `esperado` (lo que vio al abrir).
// AV-11 llega como `REQUIERE_CONFIRMACION`; `conflicto_desactualizado` ofrece el valor actual. No calcula montos (PF-3).
import type { Centavos } from '@finn/dominio/valores';
import { useCallback, useState, type ReactNode } from 'react';
import * as z from 'zod';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { ErrorDeFlujo } from '../../componentes/formularios/error-de-flujo';
import { Boton } from '../../componentes/base/boton';
import { ConfirmacionImpacto } from '../../componentes/formularios/confirmacion-impacto';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import { Monto } from '../../componentes/dominio/monto';
import {
  CerrarFlujoAlMontar,
  PaginaFlujoDeRuta,
  SuperpuestoDeRuta,
} from '../../componentes/navegacion/flujo-de-ruta';
import { centavosATextoDecimal, formatearMonto } from '../../formato';
import { aplicarSigno, normalizarMontoEscrito } from '../../formularios/normalizar-monto';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { asignarEnCategoria, asignarRapido } from '../../servidor/acciones/presupuesto';
import { formularios } from '../../textos/formularios';
import { presupuestoAsignar as t } from '../../textos/presupuesto-asignar';
import { PieDeHoja } from '../pie-de-hoja';
import { CampoConFoco } from './campo-con-foco';
import { OpcionesRapidas, type DatosRapida, type VarianteRapida } from './rapida';

export interface PropsFormularioAsignar {
  readonly categoriaId: string;
  readonly categoria: string;
  readonly archivada: boolean;
  readonly periodoInicio: string;
  readonly asignado: Centavos;
  readonly disponible: Centavos;
  readonly asignadoEsperado: Centavos;
  readonly meta?: { readonly pedido: Centavos; readonly falta: Centavos };
  /** `contexto.rapida` (04 §6.14.4): lo que ofrece la asignación rápida de FT-12. */
  readonly rapida?: DatosRapida;
  /** La pantalla a la que vuelve la página completa al terminar (`cerrarFlujo()`, 05 §1.4). */
  readonly rutaPadre: string;
  readonly superpuesto: boolean;
}

const CONTRATO = z.object({
  monto: z
    .string()
    .refine((v) => normalizarMontoEscrito(v).estado === 'valido', { error: t.obligatorio }),
  signo: z.enum(['positivo', 'negativo']),
});
type Campos = z.infer<typeof CONTRATO>;
type Cruda = Partial<Campos> & {
  /** Con `variante` el envío es OP-16 (asignación rápida); sin ella, OP-14 con lo escrito. */
  variante?: VarianteRapida;
  modo: string;
  esperado?: Record<string, unknown>;
  revisionVista?: string;
  huellaImpacto?: string;
};
interface Vista {
  readonly impacto?: { readonly deltaLpa: Centavos } | null;
  readonly avisos?: readonly {
    readonly codigo: string;
    readonly datos?: { readonly lpa?: Centavos };
  }[];
}
const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];

/** Lo que el servidor guarda como Asignado, escrito como lo teclea la persona: el valor absoluto y su signo. */
const camposDe = (asignado: Centavos): Campos => ({
  monto: centavosATextoDecimal(Math.abs(asignado) as Centavos),
  signo: asignado < 0 ? 'negativo' : 'positivo',
});

interface PropsCuerpo {
  readonly p: PropsFormularioAsignar;
  readonly esperado: Centavos;
  readonly inicial: Campos;
  readonly alUsarActual: (actual: Centavos, escrito: Campos) => void;
}

function Cifra({
  rotulo,
  campo,
  aviso = false,
  children,
}: {
  readonly rotulo: string;
  readonly campo: string;
  readonly aviso?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-rotulo text-texto-secundario">{rotulo}</dt>
      <dd data-campo={campo} className={aviso ? 'font-bold text-advertencia-texto' : 'font-bold'}>
        {children}
      </dd>
    </div>
  );
}

function Cuerpo({ p, esperado, inicial, alUsarActual }: PropsCuerpo) {
  const { categoriaId, periodoInicio, superpuesto, rutaPadre } = p;
  const enviarAsignacion = useCallback<AccionEscritura>(
    (payload) => {
      const { modo, esperado: e, revisionVista, huellaImpacto, variante } = payload as Cruda;
      const { monto = '', signo = 'positivo' } = payload as Cruda;
      const confirmacion = revisionVista === undefined ? {} : { revisionVista, huellaImpacto };
      // OP-16: el valor lo calcula el servidor; solo viaja la variante y lo que vio la persona (`esperado`).
      if (variante !== undefined)
        return asignarRapido({
          categoriaId,
          periodoInicio,
          variante,
          esperado: e,
          modo,
          ...confirmacion,
        });
      const normal = normalizarMontoEscrito(monto);
      return asignarEnCategoria({
        categoriaId,
        periodoInicio,
        montoNuevo: aplicarSigno(normal.estado === 'valido' ? normal.texto : monto, signo),
        esperado: e,
        modo,
        ...confirmacion,
      });
    },
    [categoriaId, periodoInicio],
  );
  const operacion = useOperacion({
    accion: enviarAsignacion,
    esperado: { monto: centavosATextoDecimal(esperado) },
  });
  const formulario = useFormularioFinn<Campos>({
    contrato: CONTRATO,
    valoresIniciales: inicial,
    operacion,
  });
  const { estado, error: fallo } = operacion;
  const c = formulario.watch();
  const vista = (operacion.previsualizacion ?? {}) as Vista;
  const actual = (fallo?.datos?.['actuales'] as { monto?: Centavos } | undefined)?.monto;
  const conflicto = fallo?.codigo === 'conflicto_desactualizado' && actual !== undefined;

  // Terminó: `cerrarFlujo()` (05 §1.4) con los números nuevos en la pantalla de origen.
  if (estado === 'listo')
    return (
      <>
        <p role="status">{t.listo}</p>
        <CerrarFlujoAlMontar rutaPadre={rutaPadre} superpuesto={superpuesto} />
      </>
    );
  if (estado === 'confirmando')
    return (
      <ConfirmacionImpacto
        titulo={t.revisar}
        impacto={
          vista.impacto
            ? [
                t.impactoLpa(
                  `${vista.impacto.deltaLpa > 0 ? '+' : ''}${formatearMonto(vista.impacto.deltaLpa)}`,
                ),
              ]
            : []
        }
        avisos={(vista.avisos ?? []).map((a) =>
          a.codigo === 'AV-11' && a.datos?.lpa !== undefined
            ? t.avisos['AV-11'](formatearMonto(a.datos.lpa))
            : a.codigo,
        )}
        textoConfirmar={t.confirmar}
        textoVolver={t.volverAEditar}
        enviando={false}
        alConfirmar={() => void operacion.confirmar()}
        alVolver={operacion.volverAEditar}
      />
    );
  return (
    <form onSubmit={(e) => void formulario.enviar(e)} noValidate className="flex flex-col gap-5">
      {p.meta === undefined ? null : (
        <p className="text-cuerpo-pequeno text-texto-secundario">
          {t.metaPide} <Monto centavos={p.meta.pedido} />
        </p>
      )}
      <dl data-resumen-asignar className="grid grid-cols-3 gap-2">
        <Cifra rotulo={t.asignado} campo="asignado">
          <Monto centavos={p.asignado} />
        </Cifra>
        <Cifra rotulo={t.disponible} campo="disponible">
          <Monto centavos={p.disponible} />
        </Cifra>
        {p.meta === undefined ? null : (
          <Cifra rotulo={t.metaFalta} campo="meta-falta" aviso>
            <Monto centavos={p.meta.falta} />
          </Cifra>
        )}
      </dl>
      {p.archivada ? <AvisoEnLinea estado="informacion">{t.archivada}</AvisoEnLinea> : null}
      {p.rapida === undefined ? null : (
        <OpcionesRapidas
          rapida={p.rapida}
          {...(p.meta === undefined ? {} : { faltaDeLaMeta: p.meta.falta })}
          deshabilitado={!operacion.enLinea || estado === 'enviando'}
          alElegir={(variante) => void operacion.enviar({ variante })}
        />
      )}
      <CampoConFoco>
        <EntradaMonto
          nombre="monto"
          etiqueta={t.nuevoAsignado}
          valor={c.monto}
          alCambiar={(v) => {
            formulario.setValue('monto', v, {
              shouldDirty: true,
              shouldValidate: formulario.formState.isSubmitted,
            });
          }}
          conSigno
          sinVistaPrevia
          signo={c.signo}
          alCambiarSigno={(s) => {
            formulario.setValue('signo', s, { shouldDirty: true });
          }}
          error={formulario.formState.errors.monto?.message}
          requerido
        />
      </CampoConFoco>
      {estado === 'error' && fallo !== undefined && !conflicto ? (
        <ErrorDeFlujo tipo="corto" error={fallo} alReintentar={() => void operacion.reintentar()} />
      ) : null}
      {estado === 'error' && fallo !== undefined && conflicto ? (
        <AvisoEnLinea
          estado="problema"
          aparecioDespues
          {...(conflicto
            ? {
                accion: (
                  <Boton
                    variante="secundaria"
                    onClick={() => {
                      alUsarActual(actual, formulario.getValues());
                    }}
                  >
                    {t.usarValorActual}
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
          {conflicto ? ` ${t.valorActual(formatearMonto(actual))}` : ''}
        </AvisoEnLinea>
      ) : null}
      <PieDeHoja rutaPadre={rutaPadre} superpuesto={superpuesto}>
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
      </PieDeHoja>
    </form>
  );
}

export function FormularioAsignar(p: PropsFormularioAsignar) {
  // "Usar el valor actual" (05 §4.7): `esperado` pasa a lo que hay ahora y se conserva lo escrito. `useOperacion` copia
  // `esperado` una sola vez, así que el cuerpo se vuelve a montar con la copia nueva.
  const [base, setBase] = useState<{ esperado: Centavos; inicial: Campos; version: number }>({
    esperado: p.asignadoEsperado,
    inicial: camposDe(p.asignado),
    version: 0,
  });
  const cuerpo = (
    <Cuerpo
      key={base.version}
      p={p}
      esperado={base.esperado}
      inicial={base.inicial}
      alUsarActual={(actual, escrito) => {
        setBase((b) => ({ esperado: actual, inicial: escrito, version: b.version + 1 }));
      }}
    />
  );
  const titulo = t.tituloDe(p.categoria);
  return p.superpuesto ? (
    <SuperpuestoDeRuta titulo={titulo}>{cuerpo}</SuperpuestoDeRuta>
  ) : (
    <PaginaFlujoDeRuta titulo={titulo} rutaPadre={p.rutaPadre}>
      {cuerpo}
    </PaginaFlujoDeRuta>
  );
}
