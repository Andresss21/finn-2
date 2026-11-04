/* FinnRuntime — reemplazo mínimo del runtime del canvas para abrir el prototipo sin él.
   Soporta lo que usa la plantilla del prototipo:
   - <sc-if value="{{ruta}}"> … </sc-if>  → monta o desmonta su contenido (al montar, las animaciones CSS corren igual que en el canvas);
   - onClick="{{manejador}}"               → escucha el evento y llama a la función devuelta por renderVals();
   - atributos con {{ruta}} intercalado     → por ejemplo class="fz-scr fz-d-{{dir}}", se actualizan en su lugar.
   La clase Component extiende DCLogic: this.state, this.setState(parcial), renderVals(). Lo que no cambia queda montado,
   como en el canvas (React), así que las animaciones de entrada solo corren cuando algo aparece. */
class DCLogic {
  constructor() { this.props = {}; this.state = undefined; }
  setState(parcial) {
    const prev = this.state || {};
    const next = typeof parcial === 'function' ? parcial(prev) : parcial;
    this.state = Object.assign({}, prev, next);
    if (this.__programar) this.__programar();
  }
  forceUpdate() { if (this.__programar) this.__programar(); }
}

const FinnRuntime = (() => {
  const HUECO = /\{\{\s*([\w.$]+)\s*\}\}/g;
  const UNO = /\{\{\s*([\w.$]+)\s*\}\}/;
  let vals = {};
  const leer = (ruta) => {
    if (ruta === 'true') return true;
    if (ruta === 'false') return false;
    return ruta.split('.').reduce((o, k) => (o == null ? o : o[k]), vals);
  };

  function compilar(nodo, enlaces) {
    for (const el of [...nodo.childNodes]) {
      if (el.nodeType !== 1) continue;
      if (el.tagName === 'SC-IF') {
        const m = UNO.exec(el.getAttribute('value') || '');
        const ancla = document.createComment('sc-if ' + (m ? m[1] : ''));
        const molde = document.createDocumentFragment();
        while (el.firstChild) molde.appendChild(el.firstChild);
        el.replaceWith(ancla);
        enlaces.push({ tipo: 'si', ancla, molde, ruta: m ? m[1] : 'false', montado: null });
        continue;
      }
      for (const a of [...el.attributes]) {
        if (!a.value.includes('{{')) continue;
        if (a.name.startsWith('on')) {
          const m = UNO.exec(a.value);
          const evento = a.name.slice(2);
          el.removeAttribute(a.name);
          el.addEventListener(evento, (e) => { const f = leer(m[1]); if (typeof f === 'function') f(e); });
        } else {
          enlaces.push({ tipo: 'attr', el, nombre: a.name, molde: a.value });
        }
      }
      compilar(el, enlaces);
    }
  }

  function actualizar(enlaces) {
    for (const e of enlaces) {
      if (e.tipo === 'attr') {
        const v = e.molde.replace(HUECO, (_, r) => { const x = leer(r); return x == null ? '' : String(x); });
        if (e.el.getAttribute(e.nombre) !== v) e.el.setAttribute(e.nombre, v);
        continue;
      }
      const on = !!leer(e.ruta);
      if (on && !e.montado) {
        const frag = e.molde.cloneNode(true);
        const hijos = [];
        compilar(frag, hijos);
        actualizar(hijos);
        const nodos = [...frag.childNodes];
        e.ancla.parentNode.insertBefore(frag, e.ancla.nextSibling);
        e.montado = { nodos, hijos };
      } else if (on && e.montado) {
        actualizar(e.montado.hijos);
      } else if (!on && e.montado) {
        desmontar(e);
      }
    }
  }

  // Quita primero los bloques internos montados después (quedan como hermanos de su ancla) y luego los nodos propios.
  function desmontar(e) {
    for (const h of e.montado.hijos) if (h.tipo === 'si' && h.montado) desmontar(h);
    e.montado.nodos.forEach((n) => n.remove());
    e.montado = null;
  }

  function montar(Clase, opciones) {
    const plantilla = document.getElementById((opciones && opciones.plantilla) || 'finn-tpl');
    const raiz = document.getElementById((opciones && opciones.raiz) || 'finn-root');
    const comp = new Clase();
    const frag = plantilla.content.cloneNode(true);
    const enlaces = [];
    compilar(frag, enlaces);
    let pendiente = false;
    const render = () => { vals = comp.renderVals() || {}; actualizar(enlaces); };
    comp.__programar = () => { if (pendiente) return; pendiente = true; queueMicrotask(() => { pendiente = false; render(); }); };
    vals = comp.renderVals() || {};
    actualizar(enlaces);
    raiz.appendChild(frag);
    if (typeof comp.componentDidMount === 'function') comp.componentDidMount();
    window.FinnApp = comp; // para depurar: FinnApp.state
    return comp;
  }
  return { montar };
})();
