'use client';
// `/ajustes/webhook` (FT-03, OPT-01; 05 §2.11): generar o cambiar el token del webhook y configurar MacroDroid. El token nuevo
// vive solo en el estado de `useOperacion`: no va al borrador, a `sessionStorage`, a la URL ni a un evento, y se suelta al
// confirmar que ya se pegó (`volverAEditar`) o al cerrar el flujo. No calcula nada (PF-3).
import { useState, useSyncExternalStore } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { formatearInstante } from '../../formato';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { ajustesWebhook as t } from '../../textos/ajustes-webhook';
import { formularios } from '../../textos/formularios';

export interface PropsConexionMacroDroid {
  readonly configurado: boolean;
  /** Instante ISO de la última rotación (`AjustesDto.webhook.rotadoEn`). */
  readonly rotadoEn?: string;
  /** La variante del cuerpo que acepta el servidor (`FINN_WEBHOOK_FORMATO`, BE-61). */
  readonly formato: 'json' | 'texto';
  /** La Server Action de OPT-01: la pasa el lector, para que este módulo se pruebe sin el servidor. */
  readonly rotar: AccionEscritura;
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

function Instrucciones({
  formato,
  url,
}: Pick<PropsConexionMacroDroid, 'formato'> & { url: string }) {
  const filas: readonly (readonly [string, string])[] = [
    t.disparador,
    t.accion,
    t.metodo,
    ['URL', url],
    [
      t.cabeceras,
      formato === 'json'
        ? `${t.cabeceraAutorizacion}\n${t.contenidoJson}`
        : `${t.cabeceraAutorizacion}\n${t.contenidoTexto}\n${t.remitenteTexto}`,
    ],
    [t.cuerpo, formato === 'json' ? t.cuerpoJson : t.cuerpoTexto],
    t.tiempo,
    t.reintentos,
  ];
  return (
    <section aria-labelledby="instrucciones" className="flex flex-col gap-3">
      <h2 id="instrucciones" className="text-titulo-seccion">
        {t.instrucciones}
      </h2>
      <dl className="flex flex-col gap-3">
        {filas.map(([nombre, valor]) => (
          <div key={nombre} className="flex flex-col gap-0.5">
            <dt className="text-sm text-texto-secundario">{nombre}</dt>
            <dd className="text-cuerpo-pequeno break-words whitespace-pre-line text-texto">
              {valor}
            </dd>
          </div>
        ))}
      </dl>
      <h2 className="text-titulo-seccion">{t.pruebaTitulo}</h2>
      <p className="text-cuerpo-pequeno text-texto">{t.prueba}</p>
    </section>
  );
}

export function PanelConexion({ configurado, rotadoEn, formato, rotar }: PropsConexionMacroDroid) {
  const operacion = useOperacion({ accion: rotar });
  const [avisando, setAvisando] = useState(false);
  const url = `${useSyncExternalStore(sinSuscripcion, origen, () => '')}/api/sms`;
  const { estado, error, enviar, volverAEditar } = operacion;
  const token =
    estado === 'listo'
      ? (operacion.exito?.valor as { token?: string } | undefined)?.token
      : undefined;

  const generar = (): void => {
    setAvisando(false);
    void enviar({});
  };

  return (
    <div className="flex flex-col gap-5">
      {token === undefined ? (
        <>
          <p className="text-cuerpo-pequeno text-texto">
            {configurado && rotadoEn !== undefined
              ? t.conToken(formatearInstante(rotadoEn))
              : t.sinToken}
          </p>
          {avisando ? (
            <AvisoEnLinea estado="advertencia" aparecioDespues>
              {t.advertenciaCambio}
            </AvisoEnLinea>
          ) : null}
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
          {configurado && !avisando ? (
            <Boton
              variante="secundaria"
              deshabilitado={!operacion.enLinea}
              {...(operacion.motivoSinEnvio === undefined
                ? {}
                : { motivoDeshabilitado: operacion.motivoSinEnvio })}
              onClick={() => {
                setAvisando(true);
              }}
            >
              {t.cambiar}
            </Boton>
          ) : (
            <div className="flex flex-col gap-3">
              <Boton
                enviando={estado === 'enviando'}
                textoEnviando={t.generando}
                deshabilitado={!operacion.enLinea}
                {...(operacion.motivoSinEnvio === undefined
                  ? {}
                  : { motivoDeshabilitado: operacion.motivoSinEnvio })}
                onClick={generar}
              >
                {configurado ? t.confirmarCambio : t.generar}
              </Boton>
              {avisando ? (
                <Boton
                  variante="discreta"
                  onClick={() => {
                    setAvisando(false);
                  }}
                >
                  {t.cancelar}
                </Boton>
              ) : null}
            </div>
          )}
        </>
      ) : (
        <>
          <AvisoEnLinea estado="advertencia" aparecioDespues>
            {t.copiaAhora}
          </AvisoEnLinea>
          <Copiable etiqueta={t.tokenEtiqueta} valor={token} id="token" />
          <Copiable etiqueta={t.urlEtiqueta} valor={url} id="url" />
          <Boton variante="secundaria" onClick={volverAEditar}>
            {t.yaLoPegue}
          </Boton>
        </>
      )}
      <Instrucciones formato={formato} url={url} />
    </div>
  );
}
