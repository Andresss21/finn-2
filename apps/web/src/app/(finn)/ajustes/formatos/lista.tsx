'use client';
// La página completa de `/ajustes/formatos` (FT-73; 05 §2.11): cada formato con su institución, el tipo, los usos y el último uso, el
// inactivo marcado, y los enlaces a crear uno y a Instituciones. Los conteos los hace el servidor (`ajustes()`): no se calcula nada (PF-3).
import { EnlaceFinn } from '../../../../componentes/navegacion/enlace-finn';
import { VolverEnTitulo } from '../../../../componentes/navegacion/volver-en-titulo';
import { Vacio } from '../../../../componentes/base/vacio';
import { formatearInstante } from '../../../../formato';
import { navegacion } from '../../../../textos/navegacion';
import { ajustesFormatos as t } from '../../../../textos/ajustes-formatos';

export interface FormatoDeLista {
  readonly id: string;
  readonly institucion: { readonly nombre: string };
  readonly nombre: string;
  readonly tipoMovimiento: string;
  readonly activo: boolean;
  readonly usos: number;
  readonly ultimoUso?: string;
}

const tipoDe = (tipo: string): string => (t.tipos as Record<string, string>)[tipo] ?? tipo;
const ENLACE = 'inline-flex min-h-11 items-center font-semibold text-enlace underline';
const BOTON =
  'inline-flex min-h-12 w-full items-center justify-center rounded-control bg-accion-tonal px-5 text-base font-semibold text-accion hover:bg-superficie-hundida focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

export function ListaFormatos({ formatos }: { readonly formatos: readonly FormatoDeLista[] }) {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-5 px-5 py-4">
      <div className="-ml-2 flex items-center gap-1">
        <VolverEnTitulo
          href="/ajustes"
          etiqueta={navegacion.volverA(navegacion.secciones.ajustes)}
        />
        <h1 className="min-w-0 flex-1 text-titulo-pantalla">{t.titulo}</h1>
      </div>
      <p className="text-cuerpo-pequeno text-texto-secundario">{t.descripcion}</p>
      <div className="flex flex-col gap-5">
        {formatos.length === 0 ? (
          <Vacio titulo={t.vacio.titulo} texto={t.vacio.texto} icono="x" tono="neutro" />
        ) : (
          <ul className="overflow-hidden rounded-contenedor bg-superficie shadow-elevacion-1">
            {formatos.map((f) => (
              <li key={f.id} data-formato className="border-b border-borde-sutil last:border-b-0">
                <EnlaceFinn
                  href={`/ajustes/formatos/${f.id}`}
                  className="flex min-h-14 flex-col gap-0.5 px-4 py-3"
                >
                  <span
                    className={
                      f.activo ? 'font-semibold text-texto' : 'font-semibold text-texto-secundario'
                    }
                  >
                    {`${f.institucion.nombre} · ${f.nombre}`}
                  </span>
                  <span className="text-cuerpo-pequeno text-texto-secundario">
                    {`${tipoDe(f.tipoMovimiento)} · `}
                    {f.ultimoUso === undefined
                      ? t.sinUsos
                      : t.usos(f.usos, formatearInstante(f.ultimoUso))}
                    {f.activo ? null : ` · ${t.inactivo}`}
                  </span>
                </EnlaceFinn>
              </li>
            ))}
          </ul>
        )}
        <EnlaceFinn href="/ajustes/formatos/nuevo" className={BOTON}>
          {t.nuevo}
        </EnlaceFinn>
        <EnlaceFinn href="/ajustes/instituciones" className={ENLACE}>
          {t.instituciones}
        </EnlaceFinn>
      </div>
    </main>
  );
}
