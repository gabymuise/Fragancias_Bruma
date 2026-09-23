// Fragancias Bruma — js/components/forms.js
function field(name, label, type = 'text', value = '', options = {}) {
  const attrs = `id="f-${name}" name="${name}" ${options.disabled?'disabled':''} ${options.required===false?'':'required'}`;
  let control;
  if (type === 'select') control = `<select ${attrs}><option value="">Seleccionar…</option>${options.choices.map(o=>{const [v,l]=Array.isArray(o)?o:[o,o];return `<option value="${esc(v)}" ${String(v)===String(value)?'selected':''}>${esc(l)}</option>`;}).join('')}</select>`;
  else control = `<input ${attrs} type="${type}" value="${esc(value)}" ${type==='number'?`step="${options.step||'any'}" min="${options.min??0}" max="1000000000000"`:''} ${type==='date'?`min="1900-01-01" max="${today()}"`:''} ${type==='text'?'maxlength="300"':''}>`;
  return `<label class="field ${options.wide?'wide':''}" for="f-${name}">${label}${control}${options.help?`<small>${esc(options.help)}</small>`:''}</label>`;
}

function openEditor(type, id = null) {
  const r = id ? data[type].find(x => x.id === id) : {};
  if (!r) return;
  editing = {
    type,
    id
  };
  document.getElementById('dialogTitle').textContent = (id ? 'Editar ' : 'Registrar ') + LABELS[type];
  const c = calculate(data),
    locked = type === 'products' && id && references(data, id);
  const choices = filter => data.products.filter(filter || (() => true)).map(a => [a.id, `${a.code} · ${a.name} (${fmt(c.stocks.get(a.id))} ${a.unit})`]);
  let f = [];
  const F = (...args) => f.push(field(...args));
  if (type === 'products') {
    F('code', 'Código / lote', 'text', r.code || '');
    F('name', 'Nombre y presentación', 'text', r.name || '');
    F('category', 'Categoría', 'select', r.category || 'Perfume', {
      choices: CATS
    });
    F('unit', 'Unidad de stock', 'select', r.unit || 'unidad', {
      choices: ['unidad', 'ml'],
      disabled: locked
    });
    F('cost', 'Costo unitario (ARS)', 'number', r.cost ?? 0, {
      disabled: locked,
      help: 'Decant nuevo sin stock: el costo se fija al preparar.'
    });
    F('price', 'Precio de venta sugerido (ARS)', 'number', r.price ?? 0);
    F('initial', 'Stock inicial', 'number', r.initial ?? 0, {
      disabled: locked
    });
    F('min', 'Stock mínimo', 'number', r.min ?? 0);
  } else {
    F('date', 'Fecha', 'date', r.date || today());
    if (type === 'productions') {
      F('target', 'Decant terminado', 'select', r.target || '', {
        choices: choices(a => a.category === 'Decant'),
        wide: true
      });
      F('base', 'Perfume base en ml', 'select', r.base || '', {
        choices: choices(a => a.category === 'Perfume para decantar' && a.unit === 'ml'),
        wide: true
      });
      F('kit', 'Kit de envase', 'select', r.kit || '', {
        choices: choices(a => a.category === 'Insumo' && a.unit === 'unidad'),
        wide: true
      });
      F('qty', 'Cantidad de decants', 'number', r.qty ?? 1, {
        min: 1,
        step: 1
      });
      F('size', 'ml por decant', 'number', r.size ?? 5, {
        min: .000001
      });
      F('waste', 'Merma total (ml)', 'number', r.waste ?? 0);
    } else if (type !== 'expenses') {
      F('product', 'Producto / lote', 'select', r.product || '', {
        choices: choices(a => type !== 'sales' || !['Insumo', 'Perfume para decantar'].includes(a.category)),
        wide: true
      });
      F('qty', type === 'adjustments' ? 'Cantidad (+ entrada / − salida)' : 'Cantidad', 'number', r.qty ?? (type === 'adjustments' ? -1 : 1), {
        min: type === 'adjustments' ? -1e12 : .000001
      });
    }
    if (type === 'purchases') F('unitCost', 'Costo unitario real (ARS)', 'number', r.unitCost ?? 0, {
      help: 'Debe coincidir con el costo de este código/lote.'
    });
    if (type === 'sales') {
      F('channel', 'Canal de venta', 'select', r.channel || 'WhatsApp', {
        choices: CHANNELS
      });
      F('price', 'Precio unitario (ARS)', 'number', r.price ?? 0);
      F('discount', 'Descuento total (ARS)', 'number', r.discount ?? 0);
      F('fee', 'Comisión total (ARS)', 'number', r.fee ?? 0);
      F('shipping', 'Envío a cargo de Bruma (ARS)', 'number', r.shipping ?? 0);
    }
    if (type === 'expenses') {
      F('category', 'Categoría', 'select', r.category || 'Publicidad', {
        choices: EXPENSES
      });
      F('amount', 'Importe (ARS)', 'number', r.amount ?? 0);
      F('payment', 'Medio de pago', 'select', r.payment || 'Transferencia', {
        choices: ['Efectivo', 'Transferencia', 'Tarjeta', 'Otro']
      });
    }
    if (type === 'adjustments') F('reason', 'Motivo', 'select', r.reason || 'Rotura', {
      choices: REASONS
    });
    F('note', type === 'sales' ? 'Pedido / cliente' : type === 'purchases' ? 'Proveedor / comprobante' : 'Detalle / referencia', 'text', r.note || '', {
      required: type === 'expenses',
      wide: true
    });
  }
  document.getElementById('fields').innerHTML = f.join('');
  document.getElementById('formError').textContent = '';
  document.getElementById('estimate').textContent = '';
  document.getElementById('editor').showModal();
  updateEstimate();
}

function updateEstimate() {
  if (!editing) return;
  const form = document.getElementById('entryForm'),
    f = Object.fromEntries(new FormData(form)),
    type = editing.type;
  let msg = '';
  const p = id => data.products.find(a => a.id === id);
  if (type === 'productions') {
    const b = p(f.base),
      k = p(f.kit),
      a = p(f.target),
      q = Number(f.qty),
      ml = q * Number(f.size) + Number(f.waste);
    if (a && b && k && q > 0 && ml > 0) {
      const cost = ml * b.cost + q * k.cost;
      msg = `Consumo: ${fmt(ml)} ml y ${fmt(q)} kits. Costo del lote: ${money(cost)}. Costo por decant: ${money(cost/q)}.`;
    }
  }
  if (type === 'sales' && p(f.product)) {
    const a = p(f.product),
      q = Number(f.qty),
      net = q * Number(f.price) - Number(f.discount),
      profit = net - q * a.cost - Number(f.fee) - Number(f.shipping);
    msg = `Venta neta: ${money(net)}. Costo vendido: ${money(q*a.cost)}. Ganancia directa: ${money(profit)}.`;
  }
  if (type === 'purchases' && p(f.product)) msg = `Total compra: ${money(Number(f.qty)*Number(f.unitCost))}. Costo del código elegido: ${money(p(f.product).cost)}.`;
  if (type === 'products' && editing.id && references(data, editing.id)) msg = 'Este producto ya tiene movimientos. Costo, unidad y stock inicial están bloqueados para conservar el historial.';
  document.getElementById('estimate').textContent = msg;
}
document.getElementById('entryForm').addEventListener('input', updateEstimate);
document.getElementById('entryForm').addEventListener('change', e => {
  if (e.target.name === 'product') {
    const a = data.products.find(x => x.id === e.target.value);
    if (a) {
      if (editing.type === 'purchases') document.getElementById('f-unitCost').value = a.cost;
      if (editing.type === 'sales') document.getElementById('f-price').value = a.price;
    }
  }
  if (editing.type === 'products' && e.target.name === 'category' && !document.getElementById('f-unit').disabled) {
    document.getElementById('f-unit').value = e.target.value === 'Perfume para decantar' ? 'ml' : 'unidad';
  }
  updateEstimate();
});
async function commitEntry(type, id, fields) {
  const next = clone(data),
    old = id ? next[type].find(a => a.id === id) : null;
  const record = {
    ...(old || {}),
    ...fields,
    id: id || uid()
  };
  if (type !== 'products') {
    record.order = old?.order ?? Math.max(Date.now(), ...Object.values(TYPES).filter(t => t !== 'products').flatMap(t => next[t].slice(-1).map(x => x.order + 1)));
    record.note = record.note || '';
  }
  const nums = {
    products: ['cost', 'price', 'initial', 'min'],
    purchases: ['qty', 'unitCost'],
    productions: ['qty', 'size', 'waste'],
    sales: ['qty', 'price', 'discount', 'fee', 'shipping'],
    expenses: ['amount'],
    adjustments: ['qty']
  };
  for (const k of nums[type]) {
    if (record[k] === '' || record[k] === undefined) throw Error('Completá todos los importes y cantidades.');
    record[k] = Number(record[k]);
  }
  for (const k of Object.keys(record))
    if (typeof record[k] === 'string') record[k] = record[k].trim();
  if (type === 'products') {
    record.code = record.code.toUpperCase();
    if (id && references(data, id))
      for (const k of ['cost', 'initial', 'unit'])
        if (record[k] !== old[k]) throw Error('No se puede cambiar el costo, stock inicial o unidad de un producto con movimientos.');
  }
  if (type === 'productions') {
    const a = next.products.find(p => p.id === record.target),
      b = next.products.find(p => p.id === record.base),
      k = next.products.find(p => p.id === record.kit);
    if (a && b && k && record.qty > 0 && !references(data, a.id) && a.initial === 0) a.cost = ((record.qty * record.size + record.waste) * b.cost + record.qty * k.cost) / record.qty;
  }
  if (id) next[type][next[type].findIndex(x => x.id === id)] = record;
  else next[type].push(record);
  await save(next);
}
document.getElementById('entryForm').addEventListener('submit', async e => {
  e.preventDefault();
  if (busy) return;
  try {
    await commitEntry(editing.type, editing.id, Object.fromEntries(new FormData(e.target)));
    document.getElementById('editor').close();
  } catch (err) {
    document.getElementById('formError').textContent = err.message;
  }
});
