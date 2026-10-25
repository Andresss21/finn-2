// L4 (05 §1.7): `page`, `layout`, `default` y `not-found` son siempre Server Components.
const ARCHIVOS = new Set(['page', 'layout', 'default', 'not-found']);

export const archivosServidor = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      cliente: "L4: `'use client'` no va en `{{archivo}}`: es un Server Component (FE-05).",
    },
  },
  create(ctx) {
    const nombre = ctx.filename.replaceAll('\\', '/').split('/').pop() ?? '';
    const base = nombre.replace(/\.[^.]+$/, '');
    return {
      Program(p) {
        if (!ARCHIVOS.has(base)) return;
        for (const s of p.body)
          if (s.type === 'ExpressionStatement' && s.directive === 'use client')
            ctx.report({ node: s, messageId: 'cliente', data: { archivo: nombre } });
      },
    };
  },
};
