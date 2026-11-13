'use client';
// Lista de `/ajustes` (06 FT-72 a FT-77; export de diseño, pantalla 11 «Índice»): una tarjeta con una fila por sección: círculo
// de ícono de 40, el nombre y la flecha. Solo enlaza a las secciones que existen; cada una conserva el texto de su catálogo.
// [CH-242] Debajo, «Salir» en su propia tarjeta (entrega 3, `16-salir/ajustes-indice`); Apariencia lleva `sun` (GLO-107).
// [CH-251] Cada fila con su resumen de `ajustes()` (AJU-01): solo formatea lo que trae el DTO. El nombre accesible del
// enlace es todo su texto visible, título y después resumen o aviso (axe `label-content-name-mismatch`, WCAG 2.5.3).
import { useInstalacion } from '../../../cliente/instalacion';
import { Icono, type NombreIcono } from '../../../componentes/base/icono';
import { EnlaceFinn } from '../../../componentes/navegacion/enlace-finn';
import { formatearInstante } from '../../../formato';
import { ajustesIndice as ti } from '../../../textos/ajustes-indice';
import { Salir } from '../../../componentes/navegacion/navegacion-app';
import { ajustesApariencia } from '../../../textos/ajustes-apariencia';
import { ajustesCiclo } from '../../../textos/ajustes-ciclo';
import { ajustesDiagnostico } from '../../../textos/ajustes-diagnostico';
import { ajustesExportar } from '../../../textos/ajustes-exportar';
import { ajustesFormatos } from '../../../textos/ajustes-formatos';
import { ajustesRespaldo } from '../../../textos/ajustes-respaldo';
import { ajustesWebhook } from '../../../textos/ajustes-webhook';
import { notificaciones } from '../../../textos/notificaciones';
import { salir } from '../../../textos/salir';
import { seguridad } from '../../../textos/seguridad';

const FILAS: readonly { href: string; icono: NombreIcono; texto: string }[] = [
  { href: '/ajustes/ciclo', icono: 'cal', texto: ajustesCiclo.enlace },
  { href: '/ajustes/webhook', icono: 'sms', texto: ajustesWebhook.titulo },
  { href: '/ajustes/formatos', icono: 'list', texto: ajustesFormatos.enlace },
  { href: '/ajustes/instituciones', icono: 'bank', texto: ajustesFormatos.instituciones },
  { href: '/ajustes/notificaciones', icono: 'bell', texto: notificaciones.enlace },
  { href: '/ajustes/seguridad', icono: 'lock', texto: seguridad.titulo },
  { href: '/ajustes/exportar', icono: 'send', texto: ajustesExportar.titulo },
  { href: '/ajustes/respaldo', icono: 'refresh', texto: ajustesRespaldo.enlace },
  { href: '/ajustes/diagnostico', icono: 'activity', texto: ajustesDiagnostico.enlace },
  { href: '/ajustes/apariencia', icono: 'sun', texto: ajustesApariencia.enlace },
];

/** [CH-251] Lo que el índice resume de `AjustesDto` (04 §6.11). */
export interface ResumenAjustes {
  readonly diaInicio: number;
  readonly webhook: { readonly configurado: boolean; readonly ultimoSmsEn?: string };
  readonly formatosActivos: number;
  readonly instituciones: number;
  readonly erroresSieteDias: number;
}

const resumenes = (r: ResumenAjustes): Readonly<Record<string, string>> => ({
  '/ajustes/ciclo': ti.ciclo(r.diaInicio),
  '/ajustes/webhook': !r.webhook.configurado
    ? ti.sinConectar
    : r.webhook.ultimoSmsEn === undefined
      ? ti.conectado
      : ti.conectadoUltimo(formatearInstante(r.webhook.ultimoSmsEn)),
  '/ajustes/formatos': ti.activos(r.formatosActivos),
  '/ajustes/instituciones': String(r.instituciones),
  '/ajustes/exportar': ti.exportar,
  '/ajustes/diagnostico': ti.errores(r.erroresSieteDias),
});

/** `respaldoAtrasado`: `AjustesDto.respaldo` (CA-76.1); sin él, la fila de Respaldo no avisa nada. */
export function ListaAjustes({
  respaldoAtrasado = false,
  resumen,
  correo,
}: {
  respaldoAtrasado?: boolean;
  resumen?: ResumenAjustes;
  /** El correo de la sesión: subtítulo de «Salir» (entrega 3). */
  correo?: string | undefined;
}) {
  const textos = resumen === undefined ? {} : resumenes(resumen);
  // E5-17: en un iPhone sin instalar, la fila de Notificaciones dice por qué todavía no se puede activar.
  const iosSinInstalar = useInstalacion().oferta === 'ios';
  const lista = (
    <ul
      data-rol="lista-ajustes"
      className="flex flex-col divide-y divide-borde-sutil overflow-hidden rounded-contenedor bg-superficie shadow-elevacion-1"
    >
      {FILAS.map((f) => {
        const resumenFila = textos[f.href];
        const atrasado = respaldoAtrasado && f.href === '/ajustes/respaldo';
        const ios = iosSinInstalar && f.href === '/ajustes/notificaciones';
        const conDescripcion = resumenFila !== undefined || atrasado || ios;
        return (
          <li key={f.href}>
            <EnlaceFinn
              href={f.href}
              className="grid min-h-14 grid-cols-[40px_minmax(0,1fr)_16px] items-center gap-3 px-4 py-3 no-underline"
            >
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-pastilla bg-superficie-hundida text-texto-secundario"
              >
                <Icono nombre={f.icono} tamano={20} />
              </span>
              <span className="flex flex-col">
                <span className="text-cuerpo font-semibold text-texto">{f.texto}</span>
                {conDescripcion ? (
                  <span className="flex flex-col">
                    {resumenFila === undefined ? null : (
                      <span data-resumen className="text-cuerpo-pequeno text-texto-secundario">
                        {resumenFila}
                      </span>
                    )}
                    {atrasado ? (
                      <span className="text-cuerpo-pequeno font-semibold text-problema-texto">
                        {ajustesRespaldo.atrasadoEnIndice}
                      </span>
                    ) : null}
                    {ios ? (
                      <span className="text-cuerpo-pequeno text-texto-secundario">
                        {notificaciones.filaIosSinInstalar}
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </span>
              <Icono nombre="chevR" tamano={16} className="text-texto-secundario" />
            </EnlaceFinn>
          </li>
        );
      })}
    </ul>
  );
  return (
    <>
      {lista}
      <div className="overflow-hidden rounded-contenedor bg-superficie shadow-elevacion-1">
        <Salir
          variante="tarjeta"
          subtitulo={
            correo === undefined ? salir.esteDispositivo : salir.correoEnDispositivo(correo)
          }
        />
      </div>
    </>
  );
}
