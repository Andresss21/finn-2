// Reglas propias de frontera (ADR-21, 04 §1.5 d, L20). Un plugin aparte evita que
// otra regla de `no-restricted-*` las pise al combinar configuraciones.
const esMiembro = (n, objeto, propiedad) =>
  n?.type === 'MemberExpression' &&
  n.object.type === 'Identifier' &&
  n.object.name === objeto &&
  !n.computed &&
  n.property.type === 'Identifier' &&
  n.property.name === propiedad;

const esDate = (n) => n?.type === 'Identifier' && n.name === 'Date';

const reloj = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      date: '`Date` está prohibido aquí: el reloj viene de la base (ADR-21).',
      random: '`Math.random` está prohibido aquí (ADR-21).',
      intl: '`Intl.DateTimeFormat` está prohibido aquí (ADR-21).',
    },
  },
  create: (ctx) => ({
    Identifier(n) {
      const p = n.parent;
      if (!esDate(n)) return;
      if (
        (p.type === 'MemberExpression' && p.property === n && !p.computed) ||
        (p.type === 'Property' && p.key === n)
      )
        return;
      ctx.report({ node: n, messageId: 'date' });
    },
    MemberExpression(n) {
      if (esMiembro(n, 'Math', 'random')) ctx.report({ node: n, messageId: 'random' });
      if (esMiembro(n, 'Intl', 'DateTimeFormat')) ctx.report({ node: n, messageId: 'intl' });
    },
  }),
};

const l20 = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      ahora:
        'L20: `Date.now()` está prohibido; usá el instante de la transacción o `finn.ahora()`.',
      nueva:
        'L20: `new Date()` sin argumentos está prohibido; usá el instante de la transacción o `finn.ahora()`.',
    },
  },
  create: (ctx) => ({
    CallExpression(n) {
      if (esMiembro(n.callee, 'Date', 'now')) ctx.report({ node: n, messageId: 'ahora' });
    },
    NewExpression(n) {
      if (esDate(n.callee) && n.arguments.length === 0) ctx.report({ node: n, messageId: 'nueva' });
    },
  }),
};

const dinero = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      flotante: '`{{que}}` solo se usa en los módulos de dinero y fechas (ADR-21).',
      division: '`/` sobre `Centavos` solo en el módulo de dinero (ADR-21).',
    },
  },
  create(ctx) {
    const servicios = ctx.sourceCode.parserServices;
    const conTipos = Boolean(servicios?.program && servicios.esTreeNodeToTSNodeMap);
    const esCentavos = (nodo) => {
      if (!conTipos) return false;
      const t = servicios.program
        .getTypeChecker()
        .getTypeAtLocation(servicios.esTreeNodeToTSNodeMap.get(nodo));
      return [t, ...(t.types ?? [])].some(
        (x) => x.aliasSymbol?.name === 'Centavos' || x.symbol?.name === 'Centavos',
      );
    };
    const dividir = (n) => {
      if (esCentavos(n.left) || esCentavos(n.right)) ctx.report({ node: n, messageId: 'division' });
    };
    return {
      CallExpression(n) {
        const c = n.callee;
        if (c.type === 'Identifier' && c.name === 'parseFloat')
          ctx.report({ node: n, messageId: 'flotante', data: { que: 'parseFloat' } });
        if (esMiembro(c, 'Number', 'parseFloat'))
          ctx.report({ node: n, messageId: 'flotante', data: { que: 'Number.parseFloat' } });
        if (c.type === 'MemberExpression' && !c.computed && c.property.name === 'toFixed')
          ctx.report({ node: n, messageId: 'flotante', data: { que: 'toFixed' } });
      },
      BinaryExpression: (n) => n.operator === '/' && dividir(n),
      AssignmentExpression: (n) => n.operator === '/=' && dividir(n),
    };
  },
};

// Cliente (`'use client'` o `sw/`): sin código de servidor ni valores de dominio fuera de formularios (04 §1.3, CP-6).
const cliente = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      servidor: 'El cliente no importa `{{que}}` (04 §1.3).',
      valores:
        'Fuera de los formularios, `@finn/dominio/valores` entra solo con `import type` (CP-6).',
    },
  },
  create(ctx) {
    const ruta = ctx.filename.replaceAll('\\', '/');
    let esCliente = ruta.includes('/apps/web/src/sw/');
    const formularios = /\/apps\/web\/src\/(componentes\/)?formularios\//.test(ruta);
    return {
      Program(p) {
        esCliente ||= p.body.some(
          (s) => s.type === 'ExpressionStatement' && s.directive === 'use client',
        );
      },
      ImportDeclaration(n) {
        if (!esCliente) return;
        const origen = n.source.value;
        if (origen === '@finn/aplicacion')
          ctx.report({ node: n, messageId: 'servidor', data: { que: origen } });
        if (origen === '@finn/dominio/valores' && n.importKind !== 'type' && !formularios)
          ctx.report({ node: n, messageId: 'valores' });
      },
    };
  },
};

export default { rules: { reloj, l20, dinero, cliente } };
