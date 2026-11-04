// Lector de `/reglas/[reglaId]` (05 §2, §4.1): la regla de `reglas()` y las categorías del selector. Un id que no es UUID o
// que no existe es `notFound()` (7.3). Lo único que traduce los errores de la consulta es `consultar()` (CP-13).
import { reglas } from '@finn/aplicacion/consultas/reglas';
import { notFound } from 'next/navigation';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { gruposParaRegla } from '../reglas-nueva/lector';
import { FormularioReglaRegla } from './formulario';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function LectorReglasRegla({ reglaId }: { readonly reglaId: string }) {
  if (!UUID.test(reglaId)) notFound();
  const dto = await consultar(async () => reglas(await depsDeConsulta()));
  const regla = dto.reglas.find((r) => r.id === reglaId);
  if (regla === undefined) notFound();
  return (
    <FormularioReglaRegla
      regla={{
        id: regla.id,
        patron: regla.patron,
        categoriaId: regla.categoria.id,
        categoriaNombre: regla.categoria.nombre,
        categoriaArchivada: regla.categoriaArchivada,
      }}
      grupos={await gruposParaRegla()}
    />
  );
}
