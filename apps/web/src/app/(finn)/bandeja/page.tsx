// `/bandeja` (05 §2.5, FT-34): los movimientos que dejó el procesamiento de los SMS, en el orden de `bandeja()` (04 §6.8).
// Esta página solo muestra el resultado (FT-34); aprobar, descartar y resolver son de FT-35 a FT-38. Sin `?vista=`: la
// vista de descartados es de FT-37.
import { bandeja } from '@finn/aplicacion/consultas/bandeja';
import type { Metadata } from 'next';
import type { MovimientoDto } from '../../../componentes/dominio/movimiento-bandeja';
import { PublicarEncabezado } from '../../../componentes/marco/proveedor-encabezado';
import { consultar } from '../../../servidor/consultar';
import { depsDeConsulta } from '../../../servidor/consultas';
import { bandeja as t } from '../../../textos/bandeja';
import { ListaBandeja } from './lista';

export const metadata: Metadata = { title: t.titulo };

export default async function PaginaBandeja() {
  const dto = await consultar(async () => bandeja(await depsDeConsulta()));
  // La vista de activos solo trae estados con fila compacta; el filtro deja ese hecho en el tipo
  const movimientos = dto.movimientos.filter(
    (m): m is typeof m & { estado: MovimientoDto['estado'] } =>
      m.estado !== 'aprobado' && m.estado !== 'descartado' && m.estado !== 'autodescartado',
  );
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4">
      <PublicarEncabezado encabezado={dto} />
      <h1 className="text-titulo-pantalla">{t.titulo}</h1>
      <ListaBandeja contadores={dto.contadores} movimientos={movimientos} />
    </main>
  );
}
