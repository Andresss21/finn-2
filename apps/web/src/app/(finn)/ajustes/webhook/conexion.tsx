'use client';
// `/ajustes/webhook` (FT-03, 05 §2.11; CH-E5-3, E5-18): pantalla [S] con el estado de la conexión y las instrucciones de MacroDroid.
// Finn guarda solo el SHA-256 del token: acá no hay ningún sufijo ni «Copiar»; generar un token nuevo es el flujo corto
// `/ajustes/webhook/token`. No calcula nada (PF-3).
import { useSyncExternalStore } from 'react';
import { AvisoEnLinea } from '../../../../componentes/base/aviso';
import { EnlaceFinn } from '../../../../componentes/navegacion/enlace-finn';
import { formatearInstante } from '../../../../formato';
import { ajustesWebhook as t } from '../../../../textos/ajustes-webhook';

export interface PropsConexionMacroDroid {
  readonly configurado: boolean;
  /** Instante ISO de la última rotación (`AjustesDto.webhook.rotadoEn`). */
  readonly rotadoEn?: string;
  /** [CH-227] Instante ISO del último SMS recibido (`AjustesDto.webhook.ultimoSmsEn`). */
  readonly ultimoSmsEn?: string;
  /** El día de hoy (`AjustesDto.hoy`, `AAAA-MM-DD`): para decir «hoy a las …» sin reloj propio (L20). */
  readonly hoy: string;
  /** La variante del cuerpo que acepta el servidor (`FINN_WEBHOOK_FORMATO`, BE-61). */
  readonly formato: 'json' | 'texto';
}

/** «hoy a las 12:41» si el SMS llegó hoy (el día de la interfaz); si no, «el 04/02/2027 a las 04:07». Solo parte el texto ya formateado. */
function cuandoLlego(iso: string, hoy: string): string {
  const [fecha = '', hora = ''] = formatearInstante(iso).split(' ');
  const [dia = '', mes = '', anio = ''] = fecha.split('/');
  return `${anio}-${mes}-${dia}` === hoy ? t.llegadaHoy(hora) : t.llegadaOtroDia(fecha, hora);
}
const sinSuscripcion = () => () => undefined;
/** El dominio de esta misma página (solo existe en el navegador): `https://<dominio>/api/sms`. */
const origen = (): string => window.location.origin;
const BOTON =
  'inline-flex min-h-12 w-full items-center justify-center rounded-control bg-accion-tonal px-5 text-base font-semibold text-accion no-underline hover:bg-superficie-hundida focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco md:w-auto';

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

export function PanelConexion({
  configurado,
  rotadoEn,
  ultimoSmsEn,
  hoy,
  formato,
}: PropsConexionMacroDroid) {
  const url = `${useSyncExternalStore(sinSuscripcion, origen, () => '')}/api/sms`;
  return (
    <div className="flex flex-col gap-5">
      {configurado ? (
        // [CH-227] A27: conectado, con la fecha del último SMS si ya llegó alguno.
        <div data-conexion>
          <AvisoEnLinea estado="positivo">
            {ultimoSmsEn === undefined
              ? t.conectado
              : t.conectadoConSms(cuandoLlego(ultimoSmsEn, hoy))}
          </AvisoEnLinea>
        </div>
      ) : null}
      <section aria-labelledby="token-macrodroid" className="flex flex-col gap-2">
        <h2 id="token-macrodroid" className="text-titulo-seccion">
          {t.tarjetaToken}
        </h2>
        <p className="text-cuerpo-pequeno text-texto">
          {configurado && rotadoEn !== undefined
            ? t.conToken(formatearInstante(rotadoEn))
            : t.sinToken}
        </p>
        {configurado ? (
          <p className="text-cuerpo-pequeno text-texto-secundario">{t.noGuardado}</p>
        ) : null}
      </section>
      <EnlaceFinn href="/ajustes/webhook/token" className={BOTON}>
        {configurado ? t.generarNuevo : t.generar}
      </EnlaceFinn>
      <Instrucciones formato={formato} url={url} />
    </div>
  );
}
