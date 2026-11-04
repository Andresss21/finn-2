// Lógica del prototipo v2 tal como corre en el canvas (clase DCLogic).
class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const screen = st.screen || 'inicio';
    const stop = (e) => { if (e && e.preventDefault) e.preventDefault(); };
    const TABS = { inicio: 0, presupuesto: 1, bandeja: 2, actividad: 3, cuentas: 4 };
    const dirFor = (from, to) => {
      if (from === to) return 'none';
      if (to === 'registrar') return 'up';
      if (from === 'registrar') return 'down';
      if (to === 'detalle' || to === 'semanal') return 'push';
      if (from === 'detalle' || from === 'semanal') return 'back';
      if (TABS[from] !== undefined && TABS[to] !== undefined) return TABS[to] > TABS[from] ? 'right' : 'left';
      return 'tab';
    };
    const go = (sc, extra) => (e) => {
      stop(e); clearTimeout(this._t);
      this.setState(Object.assign({ screen: sc, prev: screen === 'registrar' ? (st.prev || 'inicio') : screen, sheet: null, closing: false, dir: dirFor(screen, sc) }, extra || {}));
    };
    const sheet = (name) => (e) => { stop(e); clearTimeout(this._t); this.setState({ sheet: name, closing: false }); };
    const close = (e) => {
      stop(e);
      if (!st.sheet || st.closing) return;
      this.setState({ closing: true });
      clearTimeout(this._t);
      this._t = setTimeout(() => this.setState({ sheet: null, closing: false }), 200);
    };
    const set = (patch) => (e) => { stop(e); this.setState(Object.assign({ dir: 'none' }, patch)); };
    const front = st.front || 'visa';
    return {
      dir: st.dir || 'tab',
      sheetPhase: st.closing ? 'out' : 'in',
      s: { inicio: screen === 'inicio', presupuesto: screen === 'presupuesto', detalle: screen === 'detalle', bandeja: screen === 'bandeja',
           registrar: screen === 'registrar', cuentas: screen === 'cuentas', actividad: screen === 'actividad', semanal: screen === 'semanal' },
      filtroSobre: !!st.filtro, filtroTodas: !st.filtro, approved: !!st.approved, notApproved: !st.approved, saved: !!st.saved, notSaved: !st.saved,
      sheetAsignar: st.sheet === 'asignar', sheetMas: st.sheet === 'mas', sheetNotif: st.sheet === 'notif',
      notifUnread: !st.read, notifRead: !!st.read,
      frontIsVisa: front === 'visa', frontIsMc: front === 'mc',
      semOn: !!st.semTabla, semOff: !st.semTabla, histOn: !!st.histTabla, histOff: !st.histTabla,
      goInicio: go('inicio'), goPresupuesto: go('presupuesto', { filtro: false }), goPresupuestoFiltro: go('presupuesto', { filtro: true }), goDetalle: go('detalle'),
      goBandeja: go('bandeja'), goActividad: go('actividad'), goCuentas: go('cuentas'), goCuentasVisa: go('cuentas', { front: 'visa' }), goSemanal: go('semanal'),
      goRegistrar: go('registrar', { saved: false }),
      openAsignar: sheet('asignar'), openMas: sheet('mas'), openNotif: sheet('notif'), closeSheet: close,
      markRead: (e) => { stop(e); this.setState({ read: true }); },
      setTodas: set({ filtro: false }), setSobre: set({ filtro: true }),
      approve: set({ approved: true }), save: set({ saved: true }), newRegistro: set({ saved: false }),
      frontVisa: set({ front: 'visa' }), frontMc: set({ front: 'mc' }),
      semChart: set({ semTabla: false }), semTable: set({ semTabla: true }), histChart: set({ histTabla: false }), histTable: set({ histTabla: true }),
      closeRegistrar: (e) => { stop(e); this.setState({ screen: st.prev || 'inicio', sheet: null, saved: false, dir: 'down' }); },
      resetAll: (e) => { stop(e); clearTimeout(this._t); this.setState({ screen: 'inicio', prev: 'inicio', sheet: null, closing: false, filtro: false, approved: false, saved: false,
                                               read: false, front: 'visa', semTabla: false, histTabla: false, dir: 'tab' }); },
    };
  }
}
