// [CH-251] «Coincide con» de una regla (E4-22): los comercios de `ReglaDto.coincideCon` tal como llegan; sin ninguno, nada.
import { reglas as t } from '../../textos/reglas';

export function CoincideCon({ comercios }: { readonly comercios: readonly string[] }) {
  return comercios.length === 0 ? null : (
    <p data-coincide-con className="text-cuerpo-pequeno text-texto-secundario">
      {t.coincideCon(comercios)}
    </p>
  );
}
