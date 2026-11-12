// `/ajustes/respaldo` (05 §2.11, FT-76): cuándo fue el último respaldo y la última prueba de restauración, y si están atrasados.
// Ruta [S] sin operación (OPT-09 la hace GitHub Actions). Los avisos de atraso (36 h, 35 días) los fija el repositorio (03 §7.5):
// acá solo se muestran. No calcula nada (PF-3).
import { ajustes } from '@finn/aplicacion/consultas/ajustes';
import type { Metadata } from 'next';
import { AvisoEnLinea } from '../../../../componentes/base/aviso';
import { EnlaceFinn } from '../../../../componentes/navegacion/enlace-finn';
import { PaginaFlujoDeRuta } from '../../../../componentes/navegacion/flujo-de-ruta';
import { formatearInstante } from '../../../../formato';
import { consultar } from '../../../../servidor/consultar';
import { depsDeConsulta } from '../../../../servidor/consultas';
import { ajustesRespaldo as t } from '../../../../textos/ajustes-respaldo';

export const metadata: Metadata = { title: t.titulo };

function Estado({
  id,
  titulo,
  instante,
  atrasado,
  aviso,
}: {
  id: string;
  titulo: string;
  instante: string | undefined;
  atrasado: boolean;
  aviso: string;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-1" data-rol={id}>
      <h2 id={id} className="text-titulo-seccion">
        {titulo}
      </h2>
      <p className="text-cuerpo text-texto">
        {instante === undefined ? t.nunca : formatearInstante(instante)}
      </p>
      <p
        className={
          atrasado
            ? 'text-cuerpo-pequeno font-semibold text-problema-texto'
            : 'text-cuerpo-pequeno text-texto-secundario'
        }
      >
        {atrasado ? `${t.atrasado}. ${aviso}` : t.alDia}
      </p>
    </section>
  );
}

export default async function PaginaRespaldo() {
  const { respaldo } = await consultar(async () => ajustes(await depsDeConsulta()));
  return (
    <PaginaFlujoDeRuta titulo={t.titulo} descripcion={t.descripcion} rutaPadre="/ajustes">
      <div className="flex flex-col gap-6">
        {respaldo.ultimoRespaldoEn === undefined ? (
          // [CH-240] E5-19: todavía no hay ningún respaldo; las filas dicen «Todavía no hay».
          <AvisoEnLinea estado="advertencia" titulo={t.sinRespaldosTitulo}>
            {t.sinRespaldosTexto}
          </AvisoEnLinea>
        ) : null}
        <Estado
          id="respaldo"
          titulo={t.respaldo}
          instante={respaldo.ultimoRespaldoEn}
          atrasado={respaldo.respaldoAtrasado}
          aviso={t.respaldoAtrasado}
        />
        <Estado
          id="restauracion"
          titulo={t.restauracion}
          instante={respaldo.ultimaRestauracionEn}
          atrasado={respaldo.restauracionAtrasada}
          aviso={t.restauracionAtrasada}
        />
        <section aria-labelledby="lo-hace" className="flex flex-col gap-1">
          <h2 id="lo-hace" className="text-titulo-seccion">
            {t.loHace}
          </h2>
          <p className="text-cuerpo text-texto">{t.loHaceValor}</p>
        </section>
        <EnlaceFinn
          href="/ajustes/diagnostico"
          className="inline-flex min-h-12 min-w-11 items-center justify-center rounded-control bg-accion-tonal px-5 text-base font-semibold text-accion no-underline hover:bg-superficie-hundida focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco"
        >
          {t.verDiagnostico}
        </EnlaceFinn>
      </div>
    </PaginaFlujoDeRuta>
  );
}
