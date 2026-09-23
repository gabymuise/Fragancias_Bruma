// Fragancias Bruma — js/pages/ajustes.js
function adjustmentsTable(c, source) {
  const type = 'adjustments';
  let headers = [],
    rows = [];
  for (const r of source) {
    const a = c.p.get(r.product),
      m = c.metrics.get(r.id);
    let cells = [cell(showDate(r.date))];
    headers = ['Fecha', 'Producto / lote', 'Motivo', '#Cantidad', '#Efecto en ganancia', 'Detalle', 'Acciones'];
    cells.push(cell(productLabel(a)), cell(esc(r.reason)), cell(fmt(r.qty), 'right'), cell(money(m.total), 'right ' + (m.total < 0 ? 'neg' : '')), cell(esc(r.note)));
    cells.push(cell(actionButtons(type, r.id)));
    rows.push('<tr>' + cells.join('') + '</tr>');
  }
  return {
    headers,
    rows
  };
}
