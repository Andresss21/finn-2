'use client';
// `/cuentas/[cuentaId]/archivar` (FT-53, OP-04; 05 §2.7): el flujo corto de archivar una cuenta. Con bloqueos (saldo, deuda,
// reserva) los explica en texto y no deja continuar; en una tarjeta ofrece devolver las asignaciones futuras de su categoría de
// pago. No calcula montos (PF-3): todo sale del detalle.
import type { Centavos } from '@finn/dominio/valores';
import { useCallback, useState } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Seleccion } from '../../componentes/base/seleccion';
import { CerrarFlujoAlMontar, PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { formatearMonto } from '../../formato';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { cuentasGestion } from '../../textos/cuentas-gestion';
import { formularios } from '../../textos/formularios';

const t = cuentasGestion.archivar;
const ENLACE = 'inline-flex min-h-11 items-center font-bold text-enlace underline';
const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
const DEVOLVER = 'devolver';

export interface PropsFormularioCuentasArchivar {
  /** `archivarCuenta` (OP-04): la pone el lector, así el formulario se prueba sin servidor. */
  readonly accion: AccionEscritura;
  readonly cuentaId: string;
  readonly nombre: string;
  readonly esTarjeta: boolean;
  readonly saldo: Centavos;
  readonly deuda: Centavos | undefined;
  readonly reservado: Centavos | undefined;
  /** `acciones.bloqueosArchivo` del detalle: códigos de 04 §7.5. */
  readonly bloqueos: readonly string[];
}

/** El mensaje de cada bloqueo, armado con los números del detalle. */
function textoDeBloqueo(codigo: string, p: PropsFormularioCuentasArchivar): string {
  const money = (c: Centavos | undefined) => formatearMonto((c ?? 0) as Centavos);
  switch (codigo) {
    case 'cuenta_con_saldo':
      return t.bloqueos.cuenta_con_saldo(p.nombre, money(p.saldo));
    case 'tarjeta_con_deuda':
      return t.bloqueos.tarjeta_con_deuda(p.nombre, money(p.deuda));
    case 'reserva_tarjeta_no_cero':
      return t.bloqueos.reserva_tarjeta_no_cero(p.nombre, money(p.reservado));
    default:
      return t.bloqueos.cuenta_ya_archivada(p.nombre);
  }
}

export function FormularioCuentasArchivar(p: PropsFormularioCuentasArchivar) {
  const { accion, cuentaId, esTarjeta, bloqueos } = p;
  const rutaPadre = `/cuentas/${cuentaId}`;
  const [futuras, setFuturas] = useState(DEVOLVER);
  const enviar = useCallback<AccionEscritura>(
    (payload) =>
      accion({
        ...(payload as object),
        cuentaId,
        ...(esTarjeta ? { devolverAsignacionesFuturas: futuras === DEVOLVER } : {}),
      }),
    [accion, cuentaId, esTarjeta, futuras],
  );
  const operacion = useOperacion({ accion: enviar });
  const { estado, error: fallo } = operacion;

  if (estado === 'listo')
    return (
      <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre={rutaPadre}>
        <CerrarFlujoAlMontar rutaPadre={rutaPadre} />
      </PaginaFlujoDeRuta>
    );
  return (
    <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre={rutaPadre}>
      <div className="flex flex-col gap-5">
        {bloqueos.length > 0 ? (
          <>
            <ul className="flex flex-col gap-2" data-bloqueos>
              {bloqueos.map((b) => (
                <li key={b}>
                  <AvisoEnLinea estado="problema">{textoDeBloqueo(b, p)}</AvisoEnLinea>
                </li>
              ))}
            </ul>
            <EnlaceFinn href={rutaPadre} className={ENLACE}>
              {t.volver}
            </EnlaceFinn>
          </>
        ) : (
          <>
            <p>{t.pregunta(p.nombre)}</p>
            {esTarjeta ? (
              <Seleccion
                etiqueta={t.futuras}
                opciones={[
                  { valor: DEVOLVER, etiqueta: t.devolver },
                  { valor: 'dejar', etiqueta: t.dejar },
                ]}
                valor={futuras}
                alCambiar={setFuturas}
              />
            ) : null}
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
            <Boton
              enviando={estado === 'enviando'}
              textoEnviando={t.archivando}
              deshabilitado={!operacion.enLinea}
              {...(operacion.motivoSinEnvio === undefined
                ? {}
                : { motivoDeshabilitado: operacion.motivoSinEnvio })}
              onClick={() => void operacion.enviar({})}
            >
              {t.archivar}
            </Boton>
          </>
        )}
      </div>
    </PaginaFlujoDeRuta>
  );
}
