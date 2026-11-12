'use client';
// `/ajustes/webhook/token` (FT-03, OPT-01; 05 §2.11; CH-E5-3, E5-18): el flujo corto que genera el token del webhook. Con un token
// ya configurado empieza por la advertencia «El token actual deja de funcionar» y se confirma con el botón de peligro; después, en
// el lugar, muestra el token **completo** una sola vez, con «Copiar». El token vive solo en el estado de `useOperacion`: no va al
// borrador, a `sessionStorage`, a la URL ni a un evento, y se suelta al cerrar la hoja (desmontar). No calcula nada (PF-3) ni
// importa Next: `alCerrar` lo pone la página.
import { useState, useSyncExternalStore } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Resultado } from '../../componentes/base/resultado';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { ajustesWebhook as t } from '../../textos/ajustes-webhook';
import { formularios } from '../../textos/formularios';

export interface PropsPanelToken {
  /** `true` si ya hay un token (`AjustesDto.webhook.configurado`): la hoja advierte antes de rotarlo. */
  readonly configurado: boolean;
  /** La Server Action de OPT-01: la pasa el lector, para que este módulo se pruebe sin el servidor. */
  readonly rotar: AccionEscritura;
  /** `cerrarFlujo()` (05 §1.4): «Cancelar» y «Listo». */
  readonly alCerrar: () => void;
}

const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
const sinSuscripcion = () => () => undefined;
/** El dominio de esta misma página (solo existe en el navegador): `https://<dominio>/api/sms`. */
const origen = (): string => window.location.origin;

function Copiable({ etiqueta, valor, id }: { etiqueta: string; valor: string; id: string }) {
  const [estado, setEstado] = useState<'nada' | 'copiado' | 'fallo'>('nada');
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-texto-secundario">{etiqueta}</span>
      <div className="flex items-center justify-between gap-3">
        <code className="font-mono text-base break-all text-texto" data-testid={id} translate="no">
          {valor}
        </code>
        <Boton
          variante="secundaria"
          aria-label={`${t.copiar}: ${etiqueta}`}
          onClick={() => {
            void navigator.clipboard
              .writeText(valor)
              .then(() => {
                setEstado('copiado');
              })
              .catch(() => {
                setEstado('fallo');
              });
          }}
        >
          {t.copiar}
        </Boton>
      </div>
      <p role="status" className="min-h-5 text-sm text-texto-secundario">
        {estado === 'copiado' ? t.copiado : estado === 'fallo' ? t.noSePudoCopiar : ''}
      </p>
    </div>
  );
}

export function PanelToken({ configurado, rotar, alCerrar }: PropsPanelToken) {
  const operacion = useOperacion({ accion: rotar });
  const url = `${useSyncExternalStore(sinSuscripcion, origen, () => '')}/api/sms`;
  const { estado, error } = operacion;
  const token =
    estado === 'listo'
      ? (operacion.exito?.valor as { token?: string } | undefined)?.token
      : undefined;

  if (token !== undefined)
    return (
      <div className="flex flex-col gap-5">
        <Resultado texto={configurado ? t.hoja.listoNuevo : t.hoja.listoPrimero} />
        <Copiable etiqueta={t.tokenEtiqueta} valor={token} id="token" />
        <AvisoEnLinea estado="advertencia" titulo={t.hoja.copialoAhora} aparecioDespues>
          {t.hoja.ocultoAlCerrar}
        </AvisoEnLinea>
        <Copiable etiqueta={t.urlEtiqueta} valor={url} id="url" />
        <Boton onClick={alCerrar}>{t.hoja.listo}</Boton>
      </div>
    );

  return (
    <div className="flex flex-col gap-5">
      {configurado ? (
        <AvisoEnLinea estado="advertencia" titulo={t.hoja.advertenciaTitulo}>
          {t.hoja.advertencia}
        </AvisoEnLinea>
      ) : (
        <p className="text-cuerpo-pequeno text-texto">{t.hoja.primero}</p>
      )}
      {estado === 'error' && error !== undefined ? (
        <AvisoEnLinea
          estado="problema"
          aparecioDespues
          {...(REINTENTABLES.includes(error.categoria)
            ? {
                accion: (
                  <Boton variante="secundaria" onClick={() => void operacion.reintentar()}>
                    {formularios.intentarDeNuevo}
                  </Boton>
                ),
              }
            : {})}
        >
          {error.mensaje}
        </AvisoEnLinea>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <Boton variante="secundaria" onClick={alCerrar}>
          {t.cancelar}
        </Boton>
        <Boton
          variante={configurado ? 'peligro' : 'principal'}
          enviando={estado === 'enviando'}
          textoEnviando={t.generando}
          deshabilitado={!operacion.enLinea}
          {...(operacion.motivoSinEnvio === undefined
            ? {}
            : { motivoDeshabilitado: operacion.motivoSinEnvio })}
          onClick={() => {
            void operacion.enviar({});
          }}
        >
          {configurado ? t.generarNuevo : t.generar}
        </Boton>
      </div>
    </div>
  );
}
