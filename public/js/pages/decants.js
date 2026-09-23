// Fragancias Bruma — js/pages/decants.js
function productionsTable(c, source) {
  const type = 'productions';
  let headers = [],
    rows = [];
  for (const r of source) {
    const a = c.p.get(r.product),
      m = c.metrics.get(r.id);
    let cells = [cell(showDate(r.date))];
    headers = ['Fecha', 'Decant', '#Unidades', '#ml consumidos', 'Perfume base', 'Kit', '#Costo por decant', '#Costo lote', 'Acciones'];
    cells.push(cell(productLabel(c.p.get(r.target))), cell(fmt(r.qty), 'right'), cell(fmt(m.ml), 'right'), cell(esc(c.p.get(r.base).code)), cell(esc(c.p.get(r.kit).code)), cell(money(m.unitCost), 'right'), cell(money(m.total), 'right'));
    cells.push(cell(actionButtons(type, r.id)));
    rows.push('<tr>' + cells.join('') + '</tr>');
  }
  return {
    headers,
    rows
  };
}
