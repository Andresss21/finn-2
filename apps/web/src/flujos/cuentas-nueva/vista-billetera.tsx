'use client';
// «Así se va a ver» (E2-12): la billetera como la dibuja la lista de Cuentas, con lo escrito en el formulario. Es una vista
// previa: el monto es el texto que escribió la persona con formato (como «Se entiende como…»), sin calcular nada (PF-3). Se carga
// solo al elegir «Billetera» (05 §13.3).
import { Icono } from '../../componentes/base/icono';
import { identidadEfectivo } from '../../componentes/dominio/identidad-cuenta';
import { formatearMontoTexto } from '../../formato';
import { normalizarMontoEscrito } from '../../formularios/normalizar-monto';
import { cuentasNuevaBilletera as t } from '../../textos/cuentas-nueva-billetera';

export function VistaBilletera({
  nombre,
  saldo,
}: {
  readonly nombre: string;
  readonly saldo: string;
}) {
  const id = identidadEfectivo('billetera');
  const r = normalizarMontoEscrito(saldo);
  return (
    <section data-vista-billetera aria-label={t.titulo} className="flex flex-col gap-3">
      <h2 className="text-rotulo text-texto-secundario uppercase">{t.titulo}</h2>
      <article
        data-identidad="efectivo"
        data-subtipo="billetera"
        className={`relative flex min-h-42 max-w-80 flex-col gap-3 overflow-hidden rounded-identidad p-4 text-texto ${id.fondo}`}
      >
        {id.motivo}
        <span className="relative flex size-9.5 flex-none items-center justify-center rounded-xl bg-cuenta-disco">
          <Icono nombre={id.icono} tamano={20} />
        </span>
        <div className="relative mt-auto flex flex-col gap-0.5">
          <p className="text-cuerpo font-bold">{nombre.trim() === '' ? '—' : nombre.trim()}</p>
          <p className="text-cuerpo-pequeno text-texto-secundario">{t.detalle}</p>
          {r.estado === 'valido' ? (
            <p className="text-cifra">{formatearMontoTexto(r.texto)}</p>
          ) : null}
        </div>
      </article>
    </section>
  );
}
