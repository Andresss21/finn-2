// [CH-251] «Coincide con» de una regla (E4-22): los comercios de `ReglaDto.coincideCon` tal como llegan; sin ninguno, nada.
// [CH-254] «Usada N veces»: `ReglaDto.usos` tal como llega, en la lista y en Editar regla.
import { reglas as t } from '../../textos/reglas';

export function CoincideCon({ comercios }: { readonly comercios: readonly string[] }) {
  return comercios.length === 0 ? null : (
    <p data-coincide-con className="text-cuerpo-pequeno text-texto-secundario">
      {t.coincideCon(comercios)}
    </p>
  );
}

export function UsosDeRegla({ usos }: { readonly usos: number }) {
  return (
    <span data-usos className="text-cuerpo-pequeno text-texto-secundario">
      {t.usada(usos)}
    </span>
  );
}
