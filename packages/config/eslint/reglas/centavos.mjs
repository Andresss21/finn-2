// L3 (05 §1.7): ningún operador aritmético sobre `Centavos` en la interfaz (PF-3, ADR-21).
const OPERADORES = new Set(['+', '-', '*', '/', '%', '+=', '-=', '*=', '/=', '%=']);

export const centavos = {
  meta: {
    type: 'problem',
    schema: [],
    messages: { operador: 'L3: sin `{{op}}` sobre `Centavos`; usá @finn/dominio/valores (PF-3).' },
  },
  create(ctx) {
    const { program, esTreeNodeToTSNodeMap: mapa } = ctx.sourceCode.parserServices ?? {};
    const esCentavos = (nodo) => {
      if (!program || !mapa) return false;
      const t = program.getTypeChecker().getTypeAtLocation(mapa.get(nodo));
      return [t, ...(t.types ?? [])].some(
        (x) => x.aliasSymbol?.name === 'Centavos' || x.symbol?.name === 'Centavos',
      );
    };
    const revisar = (n) => {
      if (OPERADORES.has(n.operator) && (esCentavos(n.left) || esCentavos(n.right)))
        ctx.report({ node: n, messageId: 'operador', data: { op: n.operator } });
    };
    return { BinaryExpression: revisar, AssignmentExpression: revisar };
  },
};
