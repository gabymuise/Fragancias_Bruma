// Fragancias Bruma — js/events.js
document.addEventListener('click', async e => {
  const button = e.target.closest('button[data-action]');
  if (!button || busy || !ready) return;
  const {
    action,
    type,
    id
  } = button.dataset;
  try {
    if (action === 'go') {
      navigate(button.dataset.view);
    }
    if (action === 'prev-page') {
      pageNumber = Math.max(1, pageNumber - 1);
      render();
    }
    if (action === 'next-page') {
      pageNumber++;
      render();
    }
    if (action === 'add' || action === 'edit') openEditor(type, action === 'edit' ? id : null);
    if (action === 'close') document.getElementById('editor').close();
    if (action === 'backup') backup();
    if (action === 'refresh') await refreshData(true);
    if (action === 'logout') await logout();
    if (action === 'export-local') exportLocal();
    if (action === 'import') document.getElementById('importFile').click();
    if (action === 'recovery') download(`Bruma_recuperacion_${today()}.json`, rawLoaded || '', 'application/json');
    if (action === 'delete') {
      if (type === 'products' && references(data, id)) throw Error('No se puede eliminar un producto que tiene movimientos. Conservá su historial.');
      if (await confirmChange('¿Eliminar este registro? Se recalcularán el stock y las ganancias. Podés exportar un respaldo antes de continuar.')) {
        const next = clone(data);
        next[type] = next[type].filter(r => r.id !== id);
        await save(next);
      }
    }
  } catch (err) {
    toast(err.message);
  }
});
document.addEventListener('input', e => {
  if (e.target.id === 'search') {
    const pos = e.target.selectionStart;
    search = e.target.value;
    pageNumber = 1;
    document.getElementById('content').innerHTML = importNotice() + records(calculate(data));
    const input = document.getElementById('search');
    input.focus();
    input.setSelectionRange(pos, pos);
  }
});
document.addEventListener('change', e => {
  if (e.target.id === 'pageSize') {
    pageSize = Number(e.target.value);
    pageNumber = 1;
    render();
  }
  if (e.target.id === 'year') {
    const v = Number(e.target.value);
    if (Number.isInteger(v) && v >= 1900 && v <= 9999) {
      year = v;
      render();
    } else toast('Ingresá un año válido.');
  }
});
document.getElementById('importFile').addEventListener('change', async e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file || busy || !ready) return;
  try {
    if (file.size > 20 * 1024 * 1024) throw Error('El respaldo supera 20 MB.');
    const incoming = JSON.parse(await file.text());
    calculate(incoming);
    if (!(await confirmChange(`Vas a reemplazar los datos compartidos por ${incoming.products.length} productos y ${incoming.sales.length} ventas. El cambio afecta a todos los usuarios. Se descargará un respaldo previo. ¿Continuar?`))) return;
    backup();
    await save(incoming);
  } catch (err) {
    toast('No se importó: ' + err.message);
  }
});
