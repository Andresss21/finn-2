// `/bandeja` (05 §2.5, FT-34, FT-37): los movimientos que dejó el procesamiento de los SMS, en el orden de `bandeja()` (04 §6.8).
// Con `?vista=descartados` muestra los descartados y autodescartados, paginados por cursor, con «Restaurar».
import { bandeja } from '@finn/aplicacion/consultas/bandeja';
import type { Metadata } from 'next';
import type { MovimientoDto } from '../../../componentes/dominio/movimiento-bandeja';
import { PublicarEncabezado } from '../../../componentes/marco/proveedor-encabezado';
import { Pestanas } from '../../../componentes/navegacion/pestanas';
import { consultar } from '../../../servidor/consultar';
import { depsDeConsulta } from '../../../servidor/consultas';
import type { BusquedaDePagina } from '../../../servidor/parametros';
import { bandeja as t } from '../../../textos/bandeja';
import { ListaDescartados, type Descartado } from './descartados';
import { ListaBandeja } from './lista';

export const metadata: Metadata = { title: t.titulo };

const texto = (v: string | readonly string[] | undefined): string | undefined =>
  typeof v === 'string' && v !== '' ? v : undefined;

export default async function PaginaBandeja({
  searchParams,
}: {
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  const busqueda = await searchParams;
  const descartados = texto(busqueda.vista) === 'descartados';
  const cursor = texto(busqueda.cursor);
  const dto = await consultar(async () =>
    bandeja(
      await depsDeConsulta(),
      descartados
        ? { vista: 'descartados', ...(cursor === undefined ? {} : { cursor }) }
        : undefined,
    ),
  );
  const selector = (
    <Pestanas
      etiqueta={t.vistas.nombre}
      activas={[descartados ? 'descartados' : 'activos']}
      pestanas={[
        { id: 'activos', etiqueta: t.vistas.activos, href: '/bandeja' },
        { id: 'descartados', etiqueta: t.vistas.descartados, href: '/bandeja?vista=descartados' },
      ]}
    />
  );
  if (descartados)
    return (
      <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4">
        <PublicarEncabezado encabezado={dto} />
        <h1 className="text-titulo-pantalla">{t.titulo}</h1>
        {selector}
        <ListaDescartados
          movimientos={dto.movimientos.flatMap((m): Descartado[] =>
            m.estado === 'descartado' || m.estado === 'autodescartado'
              ? [
                  {
                    id: m.id,
                    estado: m.estado,
                    cuenta: m.cuenta?.nombre ?? null,
                    fecha: m.fecha,
                    monto: m.monto,
                    comercio: m.comercio,
                  },
                ]
              : [],
          )}
          hrefMas={
            dto.siguienteCursor === undefined
              ? undefined
              : `/bandeja?vista=descartados&cursor=${encodeURIComponent(dto.siguienteCursor)}`
          }
        />
      </main>
    );
  // La vista de activos solo trae estados con fila compacta; el filtro deja ese hecho en el tipo
  const movimientos = dto.movimientos.filter(
    (m): m is typeof m & { estado: MovimientoDto['estado'] } =>
      m.estado !== 'aprobado' && m.estado !== 'descartado' && m.estado !== 'autodescartado',
  );
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4">
      <PublicarEncabezado encabezado={dto} />
      <h1 className="text-titulo-pantalla">{t.titulo}</h1>
      {selector}
      <ListaBandeja
        contadores={dto.contadores}
        elegibles={dto.elegiblesAprobarTodos}
        movimientos={movimientos}
      />
    </main>
  );
}
