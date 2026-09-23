// Fragancias Bruma — js/pages/gastos.js
function expensesTable(c, source) {
  const type = 'expenses';
  let headers = [],
    rows = [];
  for (const r of source) {
    const a = c.p.get(r.product),
      m = c.metrics.get(r.id);
    let cells = [cell(showDate(r.date))];
    headers = ['Fecha', 'Categoría', 'Detalle', '#Importe', 'Medio de pago', 'Acciones'];
    cells.push(cell(esc(r.category)), cell(esc(r.note)), cell(money(r.amount), 'right'), cell(esc(r.payment)));
    cells.push(cell(actionButtons(type, r.id)));
    rows.push('<tr>' + cells.join('') + '</tr>');
  }
  return {
    headers,
    rows
  };
}
