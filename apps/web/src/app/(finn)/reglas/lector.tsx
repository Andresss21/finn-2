// Lector de `/reglas` (05 §4.1): llama a `reglas()` y pasa el DTO a la pantalla. Lo único que traduce los errores de la
// consulta es `consultar()` (CP-13). [CH-227 b] Con `?q=` deja las reglas cuyo comercio o categoría contienen el texto.
import { reglas } from '@finn/aplicacion/consultas/reglas';
import { consultar } from '../../../servidor/consultar';
import { depsDeConsulta } from '../../../servidor/consultas';
import { PantallaReglas } from './pantalla';

const normal = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es');

export async function LectorReglas({ q }: { readonly q: string }) {
  const dto = await consultar(async () => reglas(await depsDeConsulta()));
  const buscado = normal(q);
  const lista =
    buscado === ''
      ? dto.reglas
      : dto.reglas.filter(
          (r) => normal(r.patron).includes(buscado) || normal(r.categoria.nombre).includes(buscado),
        );
  return <PantallaReglas dto={{ ...dto, reglas: lista }} q={q} total={dto.reglas.length} />;
}
