// Fills a printable BloomType quote or invoice from URL query parameters.
// No network: everything comes from the URL and ./billing.js. All text is set
// with textContent, so nothing in the URL is ever treated as HTML.
//
// Parameters (all optional):
//   no, date (YYYY-MM-DD), school, attn, address (new lines as %0A), email,
//   plan (classroom|school|district), qty, pilot (1), country (CA|US),
//   region (ON, BC, NY...), gst (1 = vendor charges GST/HST), pst (1 = vendor charges PST/RST/QST),
//   valid (quote validity in days), po and quote (invoice only).
import { PLANS, PAYMENT_TERMS_DAYS, addDays, computeQuote, formatMoney, formatRate } from './billing.js';

const kind = document.body.dataset.doc; // 'quote' or 'invoice'
const form = document.getElementById('fill');
const DEFAULTS = { plan: 'school', qty: '1', country: 'CA', region: 'ON', valid: '30' };

function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function readParams() {
  // Details live in the #fragment, which browsers never send to the server.
  const params = new URLSearchParams(location.hash.slice(1));
  const values = { ...DEFAULTS, date: today() };
  for (const [key, value] of params) values[key] = value;
  return values;
}

function setText(name, value) {
  document.querySelectorAll(`[data-field="${name}"]`).forEach((el) => {
    el.textContent = value;
    el.classList.toggle('blank', !value);
  });
}

function show(name, visible) {
  document.querySelectorAll(`[data-show="${name}"]`).forEach((el) => { el.hidden = !visible; });
}

function render(values) {
  const error = document.getElementById('error');
  error.hidden = true;

  setText('no', values.no || '');
  setText('date', values.date || '');
  setText('school', values.school || '');
  setText('attn', values.attn || '');
  setText('address', values.address || '');
  setText('email', values.email || '');
  setText('po', values.po || '');
  setText('quote', values.quote || '');
  show('quote', Boolean(values.quote));

  try {
    if (kind === 'invoice') setText('due', values.date ? addDays(values.date, PAYMENT_TERMS_DAYS) : '');
    if (kind === 'quote') setText('valid-until', values.date ? addDays(values.date, Number(values.valid) || 30) : '');

    const q = computeQuote({
      plan: values.plan,
      quantity: Number(values.qty),
      pilot: values.pilot === '1',
      country: values.country,
      region: values.region,
      collectFederal: values.gst === '1',
      collectProvincial: values.pst === '1',
    });
    const money = (cents) => formatMoney(cents, q.currency);

    setText('plan-name', q.planName);
    setText('plan-desc', PLANS[q.plan].description);
    setText('qty', `${q.quantity} ${q.unit}${q.quantity === 1 ? '' : 's'}`);
    setText('unit-price', money(q.unitPrice));
    setText('list', money(q.subtotal));
    setText('discount', `-${money(q.discount)}`);
    show('discount', q.discount > 0);
    setText('subtotal', money(q.taxable));
    setText('total', money(q.total));
    setText('currency', q.currency);
    setText('buyer-region', `${String(values.region).toUpperCase()}, ${String(values.country).toUpperCase()}`);

    const taxBody = document.getElementById('tax-rows');
    taxBody.replaceChildren();
    for (const t of q.taxes) {
      const row = document.createElement('tr');
      const label = document.createElement('td');
      label.colSpan = 3;
      label.textContent = `${t.name} (${formatRate(t.rate)})`;
      const amount = document.createElement('td');
      amount.className = 'num';
      amount.textContent = money(t.amount);
      row.append(label, amount);
      taxBody.append(row);
    }
    if (q.taxes.length === 0) {
      const row = document.createElement('tr');
      const label = document.createElement('td');
      label.colSpan = 3;
      label.textContent = 'Sales tax';
      const amount = document.createElement('td');
      amount.className = 'num';
      amount.textContent = money(0);
      row.append(label, amount);
      taxBody.append(row);
    }

    const notes = document.getElementById('calc-notes');
    notes.replaceChildren(...q.notes.map((n) => {
      const li = document.createElement('li');
      li.textContent = n;
      return li;
    }));
  } catch (e) {
    error.textContent = `Check the details: ${e.message}`;
    error.hidden = false;
  }
}

function syncForm(values) {
  if (!form) return;
  for (const el of form.elements) {
    if (!el.name) continue;
    if (el.type === 'checkbox') el.checked = values[el.name] === '1';
    else el.value = values[el.name] ?? '';
  }
}

function fromForm() {
  const params = new URLSearchParams();
  for (const el of form.elements) {
    if (!el.name) continue;
    const value = el.type === 'checkbox' ? (el.checked ? '1' : '') : el.value.trim();
    if (value) params.set(el.name, value);
  }
  history.replaceState(null, '', `${location.pathname}#${params}`);
  return readParams();
}

const initial = readParams();
syncForm(initial);
render(initial);
form?.addEventListener('input', () => render(fromForm()));
// Editing the #details in the address bar doesn't reload the page.
window.addEventListener('hashchange', () => {
  const values = readParams();
  syncForm(values);
  render(values);
});
document.getElementById('print')?.addEventListener('click', () => window.print());
