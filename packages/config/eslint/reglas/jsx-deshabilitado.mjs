// L15 (05 §1.7, 10.9): `text-texto-deshabilitado` solo en elementos con `disabled` o `aria-disabled`.
const TOKEN = /(^|[\s:'"`])text-texto-deshabilitado(?![\w-])/;
const ATRIBUTOS = new Set(['disabled', 'aria-disabled']);

export const jsxDeshabilitado = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      sinAtributo:
        'L15: `text-texto-deshabilitado` exige `disabled` o `aria-disabled` en el mismo elemento (10.9).',
    },
  },
  create: (ctx) => ({
    JSXOpeningElement(n) {
      const atributos = n.attributes.filter((a) => a.type === 'JSXAttribute');
      const clase = atributos.find((a) => a.name.name === 'className');
      if (!clase?.value || !TOKEN.test(ctx.sourceCode.getText(clase.value))) return;
      if (!atributos.some((a) => ATRIBUTOS.has(String(a.name.name))))
        ctx.report({ node: clase, messageId: 'sinAtributo' });
    },
  }),
};
