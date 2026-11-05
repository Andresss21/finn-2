'use client';
// `/actividad/[transaccionId]/estado` (FT-26, OP-30; 05 §2.6): marcar si el banco ya confirmó la transacción (`pendiente` ↔
// `confirmada`). `conciliada` no se ofrece: solo la fija OP-47. Es un valor absoluto (04 §4.6.2): se envía con el estado que se vio
// como `esperado`. Sin previsualización, porque no toca el presupuesto. No calcula montos (PF-3).
import { useCallback, useState } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Seleccion } from '../../componentes/base/seleccion';
import {
  CerrarFlujoAlMontar,
  PaginaFlujoDeRuta,
  useCerrarFlujo,
} from '../../componentes/navegacion/flujo-de-ruta';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { dominio } from '../../textos/dominio';
import { formularios } from '../../textos/formularios';
import { transaccion as t } from '../../textos/transaccion';

const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
type Elegible = 'pendiente' | 'confirmada';

export interface PropsFormularioActividadEstado {
  /** `cambiarEstadoBancario` (OP-30): la pone el lector, así el formulario se prueba sin servidor. */
  readonly accion: AccionEscritura;
  readonly transaccionId: string;
  readonly nombre: string;
  /** El estado bancario que vio la persona al abrir. */
  readonly estadoActual: Elegible | 'conciliada';
  /** El detalle al que se vuelve al terminar (con su `?volver=`). */
  readonly detalle: string;
}

export function FormularioActividadEstado(p: PropsFormularioActividadEstado) {
  const { accion, transaccionId, nombre, estadoActual, detalle } = p;
  const conciliada = estadoActual === 'conciliada';
  const [elegido, setElegido] = useState<Elegible>(conciliada ? 'confirmada' : estadoActual);
  const enviar = useCallback<AccionEscritura>(
    (payload) => accion({ ...(payload as object), transaccionId, estadoNuevo: elegido }),
    [accion, transaccionId, elegido],
  );
  const operacion = useOperacion({ accion: enviar, esperado: { estado: estadoActual } });
  const cerrar = useCerrarFlujo(detalle, false);
  const { estado, error: fallo } = operacion;

  if (estado === 'listo') return <CerrarFlujoAlMontar rutaPadre={detalle} />;

  return (
    <PaginaFlujoDeRuta titulo={t.estadoTitulo} rutaPadre={detalle}>
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (elegido === estadoActual) cerrar();
          else void operacion.enviar({});
        }}
      >
        <p className="font-semibold">{nombre}</p>
        {conciliada ? (
          <AvisoEnLinea estado="informacion">{t.estadoConciliadaNota}</AvisoEnLinea>
        ) : (
          <>
            <Seleccion
              etiqueta={t.estadoActual}
              valor={elegido}
              alCambiar={(v) => {
                setElegido(v === 'pendiente' ? 'pendiente' : 'confirmada');
              }}
              opciones={[
                {
                  valor: 'pendiente',
                  etiqueta: dominio.estadoBancario.pendiente,
                  descripcion: t.estadoPendiente,
                },
                {
                  valor: 'confirmada',
                  etiqueta: dominio.estadoBancario.confirmada,
                  descripcion: t.estadoConfirmada,
                },
              ]}
            />
            <p className="text-cuerpo-pequeno text-texto-secundario">{t.estadoConciliadaNota}</p>
          </>
        )}
        {estado === 'error' && fallo !== undefined ? (
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
        {conciliada ? null : (
          <Boton
            tipo="submit"
            enviando={estado === 'enviando'}
            textoEnviando={t.guardando}
            deshabilitado={!operacion.enLinea}
            {...(operacion.motivoSinEnvio === undefined
              ? {}
              : { motivoDeshabilitado: operacion.motivoSinEnvio })}
          >
            {t.guardarEstado}
          </Boton>
        )}
      </form>
    </PaginaFlujoDeRuta>
  );
}
