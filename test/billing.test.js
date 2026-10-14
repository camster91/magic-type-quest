import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  CA_TAX,
  PLANS,
  US_EXEMPTION_NOTE,
  addDays,
  computeQuote,
  formatMoney,
  formatRate,
  taxFor,
  GST_NOT_REGISTERED_NOTE,
  CLOUD_FEATURES_LIVE,
  PREVIEW_NOTICE,
} from '../src/billing.js';

const root = resolve(import.meta.dirname, '..');

describe('billing plans', () => {
  it('prices the classroom plan per teacher', () => {
    const q = computeQuote({ plan: 'classroom', quantity: 3, country: 'US', region: 'NY' });
    expect(q.subtotal).toBe(11700);
    expect(q.total).toBe(11700);
    expect(q.currency).toBe('USD');
  });

  it('prices the school plan per school', () => {
    const q = computeQuote({ plan: 'school', quantity: 2, country: 'US', region: 'TX' });
    expect(q.subtotal).toBe(59800);
  });

  it('applies the district minimum', () => {
    const small = computeQuote({ plan: 'district', quantity: 400, country: 'US', region: 'CA' });
    expect(small.listAmount).toBe(30000);
    expect(small.subtotal).toBe(75000);
    expect(small.notes.join(' ')).toMatch(/minimum/);
    const big = computeQuote({ plan: 'district', quantity: 2000, country: 'US', region: 'CA' });
    expect(big.subtotal).toBe(150000);
  });

  it('rejects unknown plans and bad quantities', () => {
    expect(() => computeQuote({ plan: 'family', quantity: 1, country: 'US', region: 'NY' })).toThrow(/plan/);
    expect(() => computeQuote({ plan: 'school', quantity: 0, country: 'US', region: 'NY' })).toThrow(/Quantity/);
    expect(() => computeQuote({ plan: 'school', quantity: 1.5, country: 'US', region: 'NY' })).toThrow(/Quantity/);
  });

  it('keeps every plan price in whole cents', () => {
    for (const plan of Object.values(PLANS)) expect(Number.isInteger(plan.unitPrice)).toBe(true);
  });
});

describe('pilot discount', () => {
  it('takes half off before tax', () => {
    const q = computeQuote({ plan: 'school', quantity: 1, pilot: true, country: 'CA', region: 'ON', collectFederal: true });
    expect(q.discount).toBe(14950);
    expect(q.taxable).toBe(14950);
    expect(q.taxes).toEqual([{ name: 'HST', rate: 0.13, amount: 1944 }]);
    expect(q.total).toBe(16894);
  });

  it('applies after the district minimum', () => {
    const q = computeQuote({ plan: 'district', quantity: 10, pilot: true, country: 'US', region: 'OH' });
    expect(q.subtotal).toBe(75000);
    expect(q.discount).toBe(37500);
    expect(q.total).toBe(37500);
  });
});

const GST = { collectFederal: true };

describe('Canadian tax', () => {
  it('charges no GST/HST unless the vendor is registered', () => {
    const q = computeQuote({ plan: 'school', quantity: 1, country: 'CA', region: 'ON' });
    expect(q.taxes).toEqual([]);
    expect(q.total).toBe(29900);
    expect(q.notes).toContain(GST_NOT_REGISTERED_NOTE);
  });

  it('charges Ontario HST at 13%', () => {
    const q = computeQuote({ plan: 'school', quantity: 1, country: 'CA', region: 'on', collectFederal: true });
    expect(q.currency).toBe('CAD');
    expect(q.taxTotal).toBe(3887);
    expect(q.total).toBe(33787);
  });

  it('uses the current Atlantic HST rates', () => {
    expect(taxFor('CA', 'NS', GST).lines).toEqual([{ name: 'HST', rate: 0.14 }]);
    for (const p of ['NB', 'NL', 'PE']) expect(taxFor('CA', p, GST).lines).toEqual([{ name: 'HST', rate: 0.15 }]);
  });

  it('charges only GST in GST-only provinces and territories', () => {
    for (const p of ['AB', 'NT', 'NU', 'YT']) expect(taxFor('CA', p, GST).lines).toEqual([{ name: 'GST', rate: 0.05 }]);
  });

  it('leaves provincial tax off by default with a self-assess note', () => {
    const t = taxFor('CA', 'BC', GST);
    expect(t.lines).toEqual([{ name: 'GST', rate: 0.05 }]);
    expect(t.notes[0]).toMatch(/BC PST \(7%\).*self-assess/);
  });

  it('charges PST, RST and QST when the vendor is registered', () => {
    const qc = computeQuote({ plan: 'school', quantity: 1, country: 'CA', region: 'QC', collectFederal: true, collectProvincial: true });
    expect(qc.taxes.map((t) => [t.name, t.amount])).toEqual([['GST', 1495], ['QST', 2983]]);
    const sk = computeQuote({ plan: 'classroom', quantity: 10, country: 'CA', region: 'SK', collectFederal: true, collectProvincial: true });
    expect(sk.taxes.map((t) => t.amount)).toEqual([1950, 2340]);
    const mb = taxFor('CA', 'MB', { collectFederal: true, collectProvincial: true });
    expect(mb.lines.map((l) => l.rate)).toEqual([0.05, 0.07]);
  });

  it('covers all 13 provinces and territories', () => {
    expect(Object.keys(CA_TAX).sort()).toEqual(
      ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'],
    );
  });

  it('rejects unknown regions and countries', () => {
    expect(() => taxFor('CA', 'XX')).toThrow(/province/);
    expect(() => taxFor('US', 'ON')).toThrow(/state/);
    expect(() => taxFor('GB', 'LN')).toThrow(/country/);
  });
});

describe('US tax', () => {
  it('charges no sales tax and asks for an exemption certificate', () => {
    const q = computeQuote({ plan: 'classroom', quantity: 1, country: 'US', region: 'WA' });
    expect(q.taxes).toEqual([]);
    expect(q.taxTotal).toBe(0);
    expect(q.notes).toContain(US_EXEMPTION_NOTE);
    expect(US_EXEMPTION_NOTE).toMatch(/exemption certificate/);
  });
});

describe('formatting helpers', () => {
  it('formats money with thousands separators and currency', () => {
    expect(formatMoney(3900, 'CAD')).toBe('$39.00 CAD');
    expect(formatMoney(123456789)).toBe('$1,234,567.89 USD');
    expect(formatMoney(-500)).toBe('-$5.00 USD');
  });

  it('formats rates without float noise', () => {
    expect(formatRate(0.09975)).toBe('9.975%');
    expect(formatRate(0.13)).toBe('13%');
  });

  it('computes net-30 due dates across months and leap years', () => {
    expect(addDays('2026-10-14', 30)).toBe('2026-11-13');
    expect(addDays('2028-02-15', 30)).toBe('2028-03-16');
    expect(() => addDays('14/10/2026', 30)).toThrow(/YYYY-MM-DD/);
  });
});

describe('printable billing pages', () => {
  it('serve an identical copy of the calculator', () => {
    expect(readFileSync(resolve(root, 'public/billing/billing.js'), 'utf8'))
      .toBe(readFileSync(resolve(root, 'src/billing.js'), 'utf8'));
  });

  it('make no external requests and never contain real-looking bank or tax numbers', () => {
    for (const page of ['quote.html', 'invoice.html', 'vendor-info.html']) {
      const html = readFileSync(resolve(root, 'public/billing', page), 'utf8');
      expect(html, page).not.toMatch(/(?:src|href)=["']https?:/i);
      expect(html, page).not.toMatch(/\bfetch\(|XMLHttpRequest/);
      expect(html, page).toContain('[OWNER:');
      // Long digit runs would be account, transit or tax numbers; those stay placeholders.
      expect(html.replace(/<style[\s\S]*?<\/style>/g, ''), page).not.toMatch(/\d{7,}/);
    }
  });
});

describe('cloud features gate', () => {
  it('keeps quotes and invoices in preview until the cloud features are live', () => {
    // Flip CLOUD_FEATURES_LIVE only once the plans' cloud features ship (#132, #133).
    expect(CLOUD_FEATURES_LIVE).toBe(false);
    expect(PREVIEW_NOTICE).toMatch(/not for sending/);
  });
});
