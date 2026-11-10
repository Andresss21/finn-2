// `/programadas` (FT-40; 05 §2; 06-identidad-visual, entrega 2 del diseño): los pagos que vienen, los atrasados, el aviso de cuota sin
// modelo y todas las programadas con su estado. Dibuja lo que trae `programadas()`: no calcula montos (PF-3). El horizonte vive en la
// URL (`?horizonte=7|30`, 30 por defecto, el máximo que calcula el motor, BE-37).
import type { ProgramadasDto } from '@finn/aplicacion/consultas/programadas';
import { AvisoEnLinea } from '../../../componentes/base/aviso';
import { Icono } from '../../../componentes/base/icono';
import { InterruptorEnlace } from '../../../componentes/base/interruptor-enlace';
import { Vacio } from '../../../componentes/base/vacio';
import { Monto } from '../../../componentes/dominio/monto';
import { PublicarEncabezado } from '../../../componentes/marco/proveedor-encabezado';
import { EnlaceFinn } from '../../../componentes/navegacion/enlace-finn';
import { formatearFechaTexto } from '../../../formato';
import { gestionarProgramada } from '../../../servidor/acciones/programadas';
import { programadas as t } from '../../../textos/programadas';
import { Activar } from './activar';
import { InsigniaDeFecha } from '../../../componentes/dominio/insignia-fecha';

const FOCO = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const CONTENEDOR =
  'flex flex-col divide-y divide-borde-sutil overflow-hidden rounded-contenedor bg-superficie shadow-elevacion-1';
const FILA = `flex min-h-17 items-center gap-3 px-4 py-3 ${FOCO}`;
const BOTON = `inline-flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-control bg-superficie-hundida px-4 font-semibold text-texto ${FOCO}`;

export function PantallaProgramadas({
  dto,
  horizonte,
}: {
  readonly dto: ProgramadasDto;
  readonly horizonte: 7 | 30;
}) {
  const atrasadas = dto.programadas.flatMap((p) =>
    p.activa ? p.atrasadas.map((fecha) => ({ p, fecha })) : [],
  );
  const proximos = dto.proximosPagos.filter((o) => !o.atrasada);
  const sinModelo = dto.programadas.filter((p) => p.activa && p.avisoSinModelo);
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-4">
      <PublicarEncabezado encabezado={dto} />
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-titulo-pantalla">{t.titulo}</h1>
        <EnlaceFinn href="/programadas/nueva" className={BOTON}>
          <Icono nombre="plus" tamano={18} />
          {t.nueva}
        </EnlaceFinn>
      </div>
      {dto.programadas.length === 0 ? (
        <Vacio
          titulo={t.vacioTitulo}
          texto={t.vacioTexto}
          accion={
            <EnlaceFinn href="/programadas/nueva" className={BOTON}>
              {t.crearUna}
            </EnlaceFinn>
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-x-6" role="group" aria-label={t.horizonte}>
            <InterruptorEnlace
              href="/programadas?horizonte=7"
              activo={horizonte === 7}
              etiqueta={t.horizontes['7']}
            />
            <InterruptorEnlace
              href="/programadas?horizonte=30"
              activo={horizonte === 30}
              etiqueta={t.horizontes['30']}
            />
          </div>
          {atrasadas.length === 0 ? null : (
            <ul className="flex flex-col gap-2" data-seccion="atrasadas">
              {atrasadas.map(({ p, fecha }) => (
                <li key={`${p.id}-${fecha}`} data-atrasada={p.id}>
                  <AvisoEnLinea
                    estado="advertencia"
                    titulo={t.atrasada}
                    accion={
                      <EnlaceFinn
                        href={`/programadas/${p.id}/ocurrencias/${fecha}`}
                        className={FOCO}
                      >
                        {t.registrar}
                      </EnlaceFinn>
                    }
                  >
                    {t.atrasadaTexto(p.comercio, formatearFechaTexto(fecha))}
                  </AvisoEnLinea>
                </li>
              ))}
            </ul>
          )}
          <section
            aria-label={t.proximos(String(horizonte))}
            data-seccion="proximos"
            className="flex flex-col gap-2.5"
          >
            <h2 className="text-titulo-seccion">{t.proximos(String(horizonte))}</h2>
            {proximos.length === 0 ? (
              <p className="text-cuerpo-pequeno text-texto-secundario">{t.sinProximos}</p>
            ) : (
              <ul className={CONTENEDOR}>
                {proximos.map((o) => (
                  <li key={`${o.programada.id}-${o.fechaEsperada}`} data-proximo={o.programada.id}>
                    <EnlaceFinn
                      href={`/programadas/${o.programada.id}/ocurrencias/${o.fechaEsperada}`}
                      className={FILA}
                    >
                      <InsigniaDeFecha fecha={o.fechaEsperada} />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-semibold text-texto">
                          {o.programada.nombre}
                        </span>
                        <span className="text-cuerpo-pequeno text-texto-secundario">
                          {o.cuenta.nombre}
                          {o.registroAutomatico ? ` · ${t.seRegistraSola}` : ''}
                        </span>
                      </span>
                      <Monto centavos={o.monto} rol="cifra" presentacion="salida" />
                    </EnlaceFinn>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section aria-label={t.titulo} data-seccion="todas" className="flex flex-col gap-2.5">
            <h2 className="text-titulo-seccion">{t.titulo}</h2>
            <ul className={CONTENEDOR}>
              {dto.programadas.map((p) => (
                <li key={p.id} data-programada={p.id} className="flex flex-col">
                  <EnlaceFinn href={`/programadas/${p.id}`} className={FILA}>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-semibold text-texto">{p.comercio}</span>
                      <span className="text-cuerpo-pequeno text-texto-secundario">
                        {p.cuenta.nombre}
                        {p.activa ? '' : ` · ${t.desactivada}`}
                      </span>
                    </span>
                    <Monto centavos={p.monto} rol="cifra" presentacion="salida" />
                  </EnlaceFinn>
                  <div className="px-4 pb-3">
                    <Activar
                      programadaId={p.id}
                      nombre={p.comercio}
                      activa={p.activa}
                      accion={gestionarProgramada}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
          {sinModelo.map((p) => (
            <AvisoEnLinea key={p.id} estado="informacion" titulo={t.sinModeloTitulo}>
              {t.sinModeloTexto(p.comercio)}
            </AvisoEnLinea>
          ))}
        </>
      )}
    </main>
  );
}
