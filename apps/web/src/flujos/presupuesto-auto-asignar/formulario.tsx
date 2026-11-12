'use client';
// `/presupuesto/auto-asignar` (FT-13, OP-17; 05 §2.3, §4.4): el flujo corto que llena las categorías según lo que piden sus metas.
// Su primera pantalla ES el impacto (FE-07): al abrir pide `modo: 'previsualizar'` con `esperado.revision` (lo que vio la
// pantalla) y muestra lo que asignaría a cada categoría y lo que quedaría sin cubrir (AV-18); confirmar envía la misma entrada
// con la huella. Con `conflicto_desactualizado` ofrece volver a calcular con la revisión actual. No calcula montos (PF-3).
// Marcado del export (07-flujos-del-presupuesto, CH-180): el período como subtítulo, una fila por categoría con «+$…» y el estado
// sin faltas como aviso positivo. El resumen «Se asigna / Listo para asignar → / Sin cubrir» del export no va (PF-3, P6-27 a).
import type { Centavos } from '@finn/dominio/valores';
import { useEffect, useState } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { ConfirmacionImpacto } from '../../componentes/formularios/confirmacion-impacto';
import {
  CerrarFlujoAlMontar,
  PaginaFlujoDeRuta,
  SuperpuestoDeRuta,
  useCerrarFlujo,
} from '../../componentes/navegacion/flujo-de-ruta';
import { formatearMonto } from '../../formato';
import { base as textosBase } from '../../textos/base';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { formularios } from '../../textos/formularios';
import { presupuestoAutoAsignar as t } from '../../textos/presupuesto-auto-asignar';

export interface PropsFormularioAutoAsignar {
  /** `autoAsignar` (OP-17): la pone el lector, así el formulario se prueba sin servidor. */
  readonly accion: AccionEscritura;
  readonly periodoInicio: string;
  /** La revisión que vio la pantalla: el `esperado` de OP-17 (el resultado depende de todo el estado). */
  readonly revision: string;
  /** El período ya formateado (subtítulo) y Listo para asignar ya formateado (introducción), los dos del DTO. */
  readonly periodo: string;
  readonly lpa: string;
  /** Nombre de cada categoría por id, para dibujar lo que trae la previsualización. */
  readonly nombres: Readonly<Record<string, string>>;
  /** Alguna meta de una categoría activa tiene falta en el período; si no, no hay nada que confirmar. */
  readonly hayFalta: boolean;
  /** La pantalla a la que vuelve la página completa al terminar (`cerrarFlujo()`, 05 §1.4). */
  readonly rutaPadre: string;
  readonly superpuesto: boolean;
}

interface Vista {
  readonly impacto?: {
    readonly deltaLpa: Centavos;
    readonly deltaDisponible: readonly { readonly categoriaId: string; readonly delta: Centavos }[];
  } | null;
  readonly avisos?: readonly {
    readonly codigo: string;
    readonly datos?: Readonly<Record<string, Centavos>>;
  }[];
  readonly rechazos?: readonly { readonly codigo: string }[];
}

const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
const RECHAZOS: Readonly<Record<string, string | undefined>> = t.rechazos;

interface PropsCuerpo {
  readonly p: PropsFormularioAutoAsignar;
  readonly revision: string;
  readonly alUsarActuales: (revision: string) => void;
}

function Cuerpo({ p, revision, alUsarActuales }: PropsCuerpo) {
  const { periodoInicio, superpuesto, rutaPadre, hayFalta, nombres } = p;
  const operacion = useOperacion({
    accion: p.accion,
    previsualizarPrimero: true,
    esperado: { revision },
  });
  const { estado, error: fallo, enviar } = operacion;
  const [confirmada, setConfirmada] = useState<Vista | undefined>();

  // La primera pantalla es la previsualización: se pide sola al abrir (y al volver a calcular, que vuelve a montar el cuerpo).
  useEffect(() => {
    if (hayFalta && estado === 'editando') void enviar({ periodoInicio });
  }, [hayFalta, estado, enviar, periodoInicio]);

  const cerrar = useCerrarFlujo(rutaPadre, superpuesto);
  const nombre = (id: string) => nombres[id] ?? id;
  const sinCubrir = (v: Vista, antes = false): string[] =>
    (v.avisos ?? [])
      .filter((a) => a.codigo === 'AV-18')
      .flatMap((a) => Object.entries(a.datos ?? {}))
      .map(([id, monto]) =>
        (antes ? t.quedaSinCubrir : t.sinCubrir)(nombre(id), formatearMonto(monto)),
      );

  const actuales = fallo?.datos?.['actuales'] as { revision?: string } | undefined;
  const conflicto = fallo?.codigo === 'conflicto_desactualizado';

  if (!hayFalta)
    return (
      <div className="flex flex-col gap-4">
        <AvisoEnLinea estado="positivo" titulo={t.nadaQueAutoAsignar}>
          {t.sinFalta}
        </AvisoEnLinea>
        <Boton variante="secundaria" onClick={cerrar}>
          {textosBase.cerrar}
        </Boton>
      </div>
    );

  if (estado === 'listo') {
    const pendientes = confirmada === undefined ? [] : sinCubrir(confirmada);
    // Después (AV-18): si algo quedó sin cubrir, se dice antes de cerrar; si no, se cierra solo.
    if (pendientes.length === 0)
      return <CerrarFlujoAlMontar rutaPadre={rutaPadre} superpuesto={superpuesto} />;
    return (
      <div className="flex flex-col gap-4">
        <p role="status">{t.listo}</p>
        {pendientes.map((texto) => (
          <AvisoEnLinea key={texto} estado="advertencia">
            {texto}
          </AvisoEnLinea>
        ))}
        <Boton onClick={cerrar}>{t.entendido}</Boton>
      </div>
    );
  }

  const vista = operacion.previsualizacion as Vista | undefined;
  if (vista !== undefined && (estado === 'confirmando' || estado === 'enviando')) {
    const rechazo = vista.rechazos?.[0];
    if (rechazo !== undefined)
      return (
        <div className="flex flex-col gap-4">
          <AvisoEnLinea estado="problema" aparecioDespues>
            {RECHAZOS[rechazo.codigo] ?? t.rechazos.otro}
          </AvisoEnLinea>
          <Boton variante="secundaria" onClick={cerrar}>
            {t.volver}
          </Boton>
        </div>
      );
    const asignaciones = (vista.impacto?.deltaDisponible ?? []).map((x) => (
      <div data-categoria={x.categoriaId} className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{nombre(x.categoriaId)}</p>
          <p className="text-cuerpo-pequeno text-texto-secundario">{t.faltaParaLaMeta}</p>
        </div>
        <span className="shrink-0 font-bold tabular-nums">
          {`${x.delta > 0 ? '+' : ''}${formatearMonto(x.delta)}`}
        </span>
      </div>
    ));
    const pendientes = sinCubrir(vista, true);
    // Con Listo para asignar en cero o negativo no se asigna nada: no hay nada que confirmar.
    if (asignaciones.length === 0)
      return (
        <section className="flex flex-col gap-4" aria-label={t.revisar}>
          <p>{t.nadaQueAsignar}</p>
          {pendientes.map((texto) => (
            <AvisoEnLinea key={texto} estado="advertencia">
              {texto}
            </AvisoEnLinea>
          ))}
          <Boton variante="secundaria" onClick={cerrar}>
            {t.volver}
          </Boton>
        </section>
      );
    const delta = vista.impacto?.deltaLpa;
    return (
      <div className="flex flex-col gap-4">
        <p>{t.intro(p.lpa)}</p>
        <ConfirmacionImpacto
          titulo={t.revisar}
          impacto={[
            ...asignaciones,
            ...(delta === undefined
              ? []
              : [t.impactoLpa(`${delta > 0 ? '+' : ''}${formatearMonto(delta)}`)]),
          ]}
          avisos={pendientes}
          textoConfirmar={
            delta === undefined
              ? t.confirmar
              : t.confirmarMonto(formatearMonto(delta).replace(/^[−-]/, ''))
          }
          textoVolver={t.cancelar}
          enviando={estado === 'enviando'}
          alConfirmar={() => {
            setConfirmada(vista);
            void operacion.confirmar();
          }}
          alVolver={cerrar}
        />
      </div>
    );
  }

  if (estado === 'error' && fallo !== undefined)
    return (
      <div className="flex flex-col gap-4">
        <AvisoEnLinea
          estado="problema"
          aparecioDespues
          {...(conflicto && actuales?.revision !== undefined
            ? {
                accion: (
                  <Boton
                    variante="secundaria"
                    onClick={() => {
                      alUsarActuales(actuales.revision as string);
                    }}
                  >
                    {t.volverACalcular}
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
        <Boton variante="secundaria" onClick={cerrar}>
          {t.volver}
        </Boton>
      </div>
    );

  return <p role="status">{t.calculando}</p>;
}

export function FormularioAutoAsignar(p: PropsFormularioAutoAsignar) {
  // "Volver a calcular": la revisión que se envía como `esperado` pasa a la actual. `useOperacion` copia `esperado` una sola vez,
  // así que el cuerpo se vuelve a montar y pide de nuevo la previsualización.
  const [base, setBase] = useState({ revision: p.revision, version: 0 });
  const cuerpo = (
    <Cuerpo
      key={base.version}
      p={p}
      revision={base.revision}
      alUsarActuales={(revision) => {
        setBase((b) => ({ revision, version: b.version + 1 }));
      }}
    />
  );
  const descripcion = t.periodo(p.periodo);
  return p.superpuesto ? (
    <SuperpuestoDeRuta titulo={t.titulo} descripcion={descripcion}>
      {cuerpo}
    </SuperpuestoDeRuta>
  ) : (
    <PaginaFlujoDeRuta titulo={t.titulo} descripcion={descripcion} rutaPadre={p.rutaPadre}>
      {cuerpo}
    </PaginaFlujoDeRuta>
  );
}
