// Fragancias Bruma — js/core/calculations.js
function numeric(x, name, min = 0, integer = false) {
  if (typeof x !== 'number' || !Number.isFinite(x) || x < min || Math.abs(x) > 1e12 || (integer && !Number.isInteger(x))) throw Error(`Revisá ${name}: el valor no es válido.`);
}

function text(x, name, required = true) {
  if (typeof x !== 'string' || x.length > 2000 || (required && !x.trim())) throw Error(`Completá ${name} correctamente.`);
}

function validDate(x) {
  if (typeof x !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(x) || Number.isNaN(Date.parse(x)) || new Date(x + 'T12:00:00Z').toISOString().slice(0, 10) !== x || x < '1900-01-01' || x > today()) throw Error('Ingresá una fecha válida, no posterior a hoy.');
}

function references(d, id) {
  return ['purchases', 'sales', 'adjustments'].some(t => d[t].some(r => r.product === id)) || d.productions.some(r => [r.target, r.base, r.kit].includes(id));
}

function calculate(d) {
  if (!d || d.app !== 'Fragancias Bruma' || d.version !== 1) throw Error('El archivo no es un respaldo compatible de Fragancias Bruma.');
  for (const k of Object.values(TYPES))
    if (!Array.isArray(d[k]) || d[k].length > 100000) throw Error('El respaldo tiene registros inválidos o excede 100.000 filas por sección.');
  const p = new Map(),
    stocks = new Map(),
    codes = new Set(),
    allIds = new Set();
  for (const a of d.products) {
    text(a.id, 'identificador');
    text(a.code, 'código');
    text(a.name, 'producto');
    if (allIds.has(a.id) || codes.has(a.code.toUpperCase())) throw Error('Hay códigos o identificadores duplicados.');
    allIds.add(a.id);
    codes.add(a.code.toUpperCase());
    if (!CATS.includes(a.category) || !['unidad', 'ml'].includes(a.unit)) throw Error('Categoría o unidad inválida.');
    numeric(a.cost, 'costo');
    numeric(a.price, 'precio');
    numeric(a.initial, 'stock inicial', 0, a.unit === 'unidad');
    numeric(a.min, 'stock mínimo');
    if (a.category === 'Decant' && a.unit !== 'unidad') throw Error('Los decants se controlan por unidad.');
    p.set(a.id, a);
    stocks.set(a.id, a.initial);
  }
  const get = id => {
    if (!p.has(id)) throw Error('Un movimiento hace referencia a un producto inexistente.');
    return p.get(id);
  };
  const events = [];
  for (const t of ['purchases', 'productions', 'sales', 'expenses', 'adjustments'])
    for (const r of d[t]) {
      text(r.id, 'identificador');
      if (allIds.has(r.id)) throw Error('Hay identificadores duplicados.');
      allIds.add(r.id);
      validDate(r.date);
      if (!Number.isSafeInteger(r.order) || r.order < 0) throw Error('Orden de registro inválido.');
      text(r.note, 'detalle', false);
      events.push({
        ...r,
        type: t
      });
    }
  events.sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order || a.id.localeCompare(b.id));
  const monthly = Array.from({
    length: 12
  }, () => ({
    revenue: 0,
    cogs: 0,
    fees: 0,
    expenses: 0,
    adjustments: 0,
    profit: 0,
    purchases: 0
  }));
  const metrics = new Map();

  function move(id, qty, e) {
    const a = get(id),
      q = stocks.get(id) + qty;
    if (q < -.000001) throw Error(`Stock insuficiente de «${a.name}» (${a.code}) el ${showDate(e.date)}. Disponible: ${fmt(stocks.get(id))} ${a.unit}. Revisá fechas y movimientos anteriores.`);
    stocks.set(id, Math.abs(q) < 1e-7 ? 0 : q);
  }
  for (const r of events) {
    const m = monthly[Number(r.date.slice(5, 7)) - 1],
      inYear = Number(r.date.slice(0, 4)) === Number(year);
    let result = {};
    if (r.type === 'purchases') {
      const a = get(r.product);
      numeric(r.qty, 'cantidad comprada', .000001, a.unit === 'unidad');
      numeric(r.unitCost, 'costo de compra');
      if (Math.abs(r.unitCost - a.cost) > .000001) throw Error(`La compra de ${a.code} tiene otro costo. Creá un código/lote nuevo para conservar el historial.`);
      move(a.id, r.qty, r);
      result.total = r.qty * r.unitCost;
      if (inYear) m.purchases += result.total;
    }
    if (r.type === 'productions') {
      const a = get(r.target),
        b = get(r.base),
        k = get(r.kit);
      if (new Set([a.id, b.id, k.id]).size !== 3 || a.category !== 'Decant' || a.unit !== 'unidad' || b.category !== 'Perfume para decantar' || b.unit !== 'ml' || k.category !== 'Insumo' || k.unit !== 'unidad') throw Error('Elegí un decant, un perfume base en ml y un kit de insumo por unidad distintos.');
      numeric(r.qty, 'unidades de decant', 1, true);
      numeric(r.size, 'ml por decant', .000001);
      numeric(r.waste, 'merma');
      const ml = r.qty * r.size + r.waste,
        cost = ml * b.cost + r.qty * k.cost;
      result = {
        ml,
        total: cost,
        unitCost: cost / r.qty
      };
      if (Math.abs(a.cost - result.unitCost) > .000001) throw Error(`El costo de este lote de ${a.code} es ${money(result.unitCost)} por decant. Usá otro código de decant si ya tiene movimientos con un costo diferente.`);
      move(b.id, -ml, r);
      move(k.id, -r.qty, r);
      move(a.id, r.qty, r);
    }
    if (r.type === 'sales') {
      const a = get(r.product);
      if (['Insumo', 'Perfume para decantar'].includes(a.category)) throw Error('Registrá la venta con un perfume, cosmético, decant u otro producto terminado.');
      numeric(r.qty, 'cantidad vendida', .000001, a.unit === 'unidad');
      numeric(r.price, 'precio');
      numeric(r.discount, 'descuento');
      numeric(r.fee, 'comisión');
      numeric(r.shipping, 'envío');
      if (!CHANNELS.includes(r.channel) || r.discount > r.qty * r.price) throw Error('Revisá el canal y el descuento de la venta.');
      move(a.id, -r.qty, r);
      result = {
        revenue: r.qty * r.price - r.discount,
        cogs: r.qty * a.cost,
        fees: r.fee + r.shipping
      };
      result.profit = result.revenue - result.cogs - result.fees;
      if (inYear) {
        m.revenue += result.revenue;
        m.cogs += result.cogs;
        m.fees += result.fees;
      }
    }
    if (r.type === 'expenses') {
      numeric(r.amount, 'importe');
      if (!EXPENSES.includes(r.category) || !['Efectivo', 'Transferencia', 'Tarjeta', 'Otro'].includes(r.payment)) throw Error('Categoría o medio de pago no válido.');
      result.total = r.amount;
      if (inYear) m.expenses += r.amount;
    }
    if (r.type === 'adjustments') {
      const a = get(r.product);
      numeric(r.qty, 'cantidad de ajuste', -1e12, a.unit === 'unidad');
      if (r.qty === 0 || !REASONS.includes(r.reason)) throw Error('Ingresá un ajuste distinto de cero y un motivo válido.');
      move(a.id, r.qty, r);
      result.total = r.qty * a.cost;
      if (inYear) m.adjustments += result.total;
    }
    metrics.set(r.id, result);
  }
  for (const m of monthly) m.profit = m.revenue - m.cogs - m.fees - m.expenses + m.adjustments;
  const totals = monthly.reduce((acc, m) => {
    for (const k of Object.keys(m)) acc[k] = (acc[k] || 0) + m[k];
    return acc;
  }, {});
  return {
    p,
    stocks,
    monthly,
    metrics,
    totals,
    stockValue: d.products.reduce((n, a) => n + a.cost * stocks.get(a.id), 0),
    low: d.products.filter(a => stocks.get(a.id) <= a.min)
  };
}
