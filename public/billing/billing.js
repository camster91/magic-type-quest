// BloomType school billing: a pure quote calculator. No network, no DOM, no state.
//
// The same file is served to the printable quote and invoice pages as
// public/billing/billing.js (test/billing.test.js checks the two stay identical).
// Edit this file, then copy it there:  cp src/billing.js public/billing/billing.js
//
// All money is handled as whole cents (integers) so totals never drift.
//
// PRICES ARE PROPOSED, OWNER TO CONFIRM (see docs/GO-TO-MARKET.md and
// docs/school/PRICING-AND-ORDERING.md). The same number is quoted in CAD for
// Canadian buyers and USD for US buyers until the owner decides otherwise.

/** Plans a school can buy. `unitPrice` is in cents per unit per year. */
export const PLANS = {
  classroom: {
    id: 'classroom',
    name: 'Classroom plan',
    unit: 'teacher',
    unitPrice: 3900,
    minimum: 0,
    description: 'One teacher, up to 40 students, 12 months: cloud class dashboard, Google Classroom sync, reports.',
  },
  school: {
    id: 'school',
    name: 'School plan',
    unit: 'school',
    unitPrice: 29900,
    minimum: 0,
    description: 'One school, all teachers, unlimited students, 12 months: admin view, ClassLink/Clever, signed DPA.',
  },
  district: {
    id: 'district',
    name: 'District plan',
    unit: 'student',
    unitPrice: 75,
    minimum: 75000,
    description: 'Per student, 12 months, $750 minimum: district admin, SSO, priority support, custom DPA.',
  },
};

/** Pilot schools get this share off their first year. Proposed, owner to confirm. */
export const PILOT_DISCOUNT = 0.5;

/** Net payment terms in days. */
export const PAYMENT_TERMS_DAYS = 30;

/**
 * Canadian sales tax by province or territory, as published by the CRA and the
 * provinces. Checked October 2026; verify before each school year.
 *
 * - `federal` lines are GST or HST, which a GST/HST registrant charges on
 *   digital services by the buyer's province (place of supply).
 * - `provincial` lines (PST, RST, QST) need a separate provincial registration.
 *   They are only charged when the caller passes `collectProvincial: true`;
 *   otherwise the quote carries a note that the buyer may need to self-assess.
 *
 * Sources: canada.ca "GST/HST rates", gov.bc.ca PST, Saskatchewan PST,
 * Manitoba RST, Revenu Québec QST. Nova Scotia HST is 14% from 1 April 2025.
 */
export const CA_TAX = {
  AB: { name: 'Alberta', lines: [{ name: 'GST', rate: 0.05, kind: 'federal' }] },
  BC: { name: 'British Columbia', lines: [{ name: 'GST', rate: 0.05, kind: 'federal' }, { name: 'BC PST', rate: 0.07, kind: 'provincial' }] },
  MB: { name: 'Manitoba', lines: [{ name: 'GST', rate: 0.05, kind: 'federal' }, { name: 'MB RST', rate: 0.07, kind: 'provincial' }] },
  NB: { name: 'New Brunswick', lines: [{ name: 'HST', rate: 0.15, kind: 'federal' }] },
  NL: { name: 'Newfoundland and Labrador', lines: [{ name: 'HST', rate: 0.15, kind: 'federal' }] },
  NS: { name: 'Nova Scotia', lines: [{ name: 'HST', rate: 0.14, kind: 'federal' }] },
  NT: { name: 'Northwest Territories', lines: [{ name: 'GST', rate: 0.05, kind: 'federal' }] },
  NU: { name: 'Nunavut', lines: [{ name: 'GST', rate: 0.05, kind: 'federal' }] },
  ON: { name: 'Ontario', lines: [{ name: 'HST', rate: 0.13, kind: 'federal' }] },
  PE: { name: 'Prince Edward Island', lines: [{ name: 'HST', rate: 0.15, kind: 'federal' }] },
  QC: { name: 'Quebec', lines: [{ name: 'GST', rate: 0.05, kind: 'federal' }, { name: 'QST', rate: 0.09975, kind: 'provincial' }] },
  SK: { name: 'Saskatchewan', lines: [{ name: 'GST', rate: 0.05, kind: 'federal' }, { name: 'SK PST', rate: 0.06, kind: 'provincial' }] },
  YT: { name: 'Yukon', lines: [{ name: 'GST', rate: 0.05, kind: 'federal' }] },
};

/** US states plus DC. No sales tax is charged: schools are usually exempt. */
export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS',
  'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC',
  'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

export const US_EXEMPTION_NOTE =
  'No sales tax charged. Schools are usually exempt: please send your tax-exemption certificate with the purchase order.';

/**
 * Tax lines for a buyer location.
 * @param {string} country 'CA' or 'US'
 * @param {string} region province, territory or state code, e.g. 'ON', 'NY'
 * @param {{ collectProvincial?: boolean }} [options]
 * @returns {{ lines: {name: string, rate: number}[], notes: string[] }}
 */
export function taxFor(country, region, { collectProvincial = false } = {}) {
  const c = String(country || '').toUpperCase();
  const r = String(region || '').toUpperCase();
  if (c === 'CA') {
    const entry = CA_TAX[r];
    if (!entry) throw new Error(`Unknown Canadian province or territory: ${region}`);
    const notes = [];
    const lines = [];
    for (const line of entry.lines) {
      if (line.kind === 'provincial' && !collectProvincial) {
        notes.push(`${line.name} (${formatRate(line.rate)}) not charged by the vendor; the buyer may need to self-assess.`);
      } else {
        lines.push({ name: line.name, rate: line.rate });
      }
    }
    return { lines, notes };
  }
  if (c === 'US') {
    if (!US_STATES.includes(r)) throw new Error(`Unknown US state: ${region}`);
    return { lines: [], notes: [US_EXEMPTION_NOTE] };
  }
  throw new Error(`Unsupported country: ${country}. Use CA or US.`);
}

/**
 * Compute a quote or invoice.
 * @param {object} input
 * @param {string} input.plan one of PLANS
 * @param {number} input.quantity teachers, schools or students (whole number >= 1)
 * @param {boolean} [input.pilot] apply the pilot discount
 * @param {string} input.country 'CA' or 'US'
 * @param {string} input.region province/territory/state code
 * @param {boolean} [input.collectProvincial] charge PST/RST/QST (vendor registered)
 */
export function computeQuote({ plan, quantity, pilot = false, country, region, collectProvincial = false }) {
  const p = PLANS[plan];
  if (!p) throw new Error(`Unknown plan: ${plan}`);
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1) throw new Error('Quantity must be a whole number of at least 1');

  const c = String(country || '').toUpperCase();
  const currency = c === 'CA' ? 'CAD' : 'USD';
  const notes = [];

  const listAmount = p.unitPrice * qty;
  const subtotal = Math.max(listAmount, p.minimum);
  if (subtotal > listAmount) notes.push(`${p.name} minimum of ${formatMoney(p.minimum, currency)} applied.`);

  const discount = pilot ? roundHalfUp(subtotal * PILOT_DISCOUNT) : 0;
  if (pilot) notes.push(`Pilot discount: ${Math.round(PILOT_DISCOUNT * 100)}% off the first year.`);
  const taxable = subtotal - discount;

  const tax = taxFor(c, region, { collectProvincial });
  const taxes = tax.lines.map((line) => ({ ...line, amount: roundHalfUp(taxable * line.rate) }));
  const taxTotal = taxes.reduce((sum, t) => sum + t.amount, 0);

  return {
    plan: p.id,
    planName: p.name,
    unit: p.unit,
    unitPrice: p.unitPrice,
    quantity: qty,
    currency,
    listAmount,
    subtotal,
    discount,
    taxable,
    taxes,
    taxTotal,
    total: taxable + taxTotal,
    notes: [...notes, ...tax.notes],
  };
}

/** Round a (possibly fractional) cent amount half up, guarding float error. */
export function roundHalfUp(cents) {
  return Math.floor(cents + 0.5 + 1e-9);
}

/** 3900 -> "$39.00 CAD". Plain formatting so output is the same everywhere. */
export function formatMoney(cents, currency = 'USD') {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const dollars = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}$${dollars}.${String(abs % 100).padStart(2, '0')} ${currency}`;
}

/** 0.09975 -> "9.975%". */
export function formatRate(rate) {
  return `${Number((rate * 100).toFixed(3))}%`;
}

/** Add days to an ISO date (YYYY-MM-DD) in UTC, e.g. the net-30 due date. */
export function addDays(isoDate, days) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate));
  if (!m) throw new Error(`Expected a YYYY-MM-DD date, got ${isoDate}`);
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days));
  return d.toISOString().slice(0, 10);
}
