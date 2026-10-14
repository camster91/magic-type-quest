# BloomType pricing and ordering for schools

> **Draft for owner review.** All prices below are **proposed, owner to confirm**. They come from the October 2026 research in [GO-TO-MARKET.md](../GO-TO-MARKET.md) and have not been published. Fields shown as `[OWNER: …]` need the owner's real business details. Have an accountant check the tax section before the first invoice goes out.

BloomType stays **free and ad-free for families, homeschoolers and a single teacher using the local dashboard**. Schools and districts pay only for the adult tools.

## Price list (proposed, owner to confirm)

| Plan | Price per year | Who it's for | What's included |
|---|---|---|---|
| **Classroom** | **$39 per teacher** | One teacher, up to 40 students | Cloud class dashboard across devices, shared-device class login, Google Classroom roster sync, CSV/PDF reports, email support |
| **School** | **$299 per school** | All teachers in one school, unlimited students | Everything in Classroom, plus a school admin view, ClassLink and Clever rostering, and a signed data-privacy agreement (DPA) |
| **District** | **$0.75 per student, $750 minimum** | Several schools under one contract | Everything in School, plus a district admin view, SSO, priority support and a custom DPA |

- **Currency:** prices are quoted in **CAD for Canadian buyers and USD for US buyers**, at the same number. *Owner to confirm* whether the CAD price should be higher to match the exchange rate.
- **Term:** 12 months from the start date on the purchase order. There is **no automatic renewal**: we send a renewal quote 60 days before the end of the term.
- **Free always:** the game itself, all levels, practice, progress on the device, the parent page, the local teacher dashboard for one class, printables and the Typing Week kit.

### Pilot discount (proposed, owner to confirm)

- **Free pilot:** a school can run a free pilot for up to 8 weeks. There is no invoice and no commitment.
- **Pilot school discount:** a pilot school that buys before **30 June 2027** gets **50% off its first year** on any plan. The quote shows this as its own line, and tax is charged on the discounted amount.

### Upgrades

A school that moves from Classroom plans to the School plan during the term pays the School price minus what it has already paid for that term. Do this by hand on the next invoice; the calculator does not prorate.

## How a school orders

Schools almost never pay by card up front. The usual order is **quote → purchase order (PO) → invoice → payment in 30 days**.

1. **Quote.** The school asks for a price. Make a quote with [`public/billing/quote.html`](../../public/billing/quote.html) (for example `/magic-type-quest/billing/quote.html?no=Q-2026-001&school=Maple+PS&plan=school&country=CA&region=ON`). Pick the plan, quantity, province or state and the pilot discount if it applies. Print it or save it as a PDF and email it. A quote is valid for 30 days.
2. **Vendor set-up.** Purchasing may ask for supplier details before it can raise a PO. Send [`public/billing/vendor-info.html`](../../public/billing/vendor-info.html) as a PDF, with the tax form in the checklist below.
3. **Purchase order.** The school sends a PO that quotes the quote number. Check that the amount, plan and school name match the quote. The PO start date is the service start date.
4. **Invoice.** Make the invoice with [`public/billing/invoice.html`](../../public/billing/invoice.html), using the PO number and the quote number. It shows **net 30** terms, the due date and the remit-to details. Email the PDF to the accounts-payable address on the PO. Give each invoice a number in one sequence (for example `INV-2026-001`), and never reuse one.
5. **Switch on.** Turn on the paid features when the PO arrives. Don't wait for payment.
6. **Payment.** The school pays within 30 days. Match the payment to the invoice number, then send a receipt (the invoice marked "Paid" with the date is enough).
7. **Late payment.** Send a friendly reminder at 7 days overdue, then call the accounts-payable contact at 30 days. Do not switch off a class mid-term over a late payment without speaking to the school first.

Keep a simple register (a spreadsheet is fine) of quote number, PO number, invoice number, amount, tax, date sent and date paid. The accountant will need it for the GST/HST return.

## Accepted payment methods

| Method | Status | Notes |
|---|---|---|
| **Cheque** | Accepted | Payable to `[OWNER: legal business name]`, mailed to `[OWNER: remittance mailing address]`. |
| **EFT (Canada)** | Accepted | Canadian school boards pay by direct deposit. Give the bank details on a signed bank letter or a void cheque, not in an ordinary email. |
| **ACH or wire (US)** | Accepted | US districts pay by ACH. A Canadian bank account usually needs a wire; a USD account that accepts ACH is cheaper. See [PAYMENT-PROVIDER-OPTIONS.md](PAYMENT-PROVIDER-OPTIONS.md). |
| **Credit card / P-card** | **Later** | Many teachers and some schools pay small amounts by school purchasing card. This comes when the owner picks a card provider. |

**Fraud protection:** never change bank details because of an email. Tell schools the same, on every invoice.

## Taxes

The calculator in [`src/billing.js`](../../src/billing.js) holds the rate table below. It was checked in October 2026; **check it again each school year.**

### Canada: GST/HST by province

BloomType is a digital service, so GST or HST is charged at the rate for the **buyer's province** (where the school is).

| Province or territory | Charged by a GST/HST registrant | Provincial tax (separate registration) |
|---|---|---|
| Ontario | HST 13% | — |
| New Brunswick, Newfoundland and Labrador, Prince Edward Island | HST 15% | — |
| Nova Scotia | HST 14% (since 1 April 2025) | — |
| Alberta, Northwest Territories, Nunavut, Yukon | GST 5% | — |
| British Columbia | GST 5% | PST 7% |
| Saskatchewan | GST 5% | PST 6% |
| Manitoba | GST 5% | RST 7% |
| Quebec | GST 5% | QST 9.975% |

- **Small-supplier rule:** a business with under $30,000 of taxable sales in four consecutive quarters does not have to register for GST/HST. If BloomType is not registered, it must **not** charge GST/HST. Remove the tax lines (or register voluntarily). *Owner and accountant to decide.*
- **Provincial taxes** (PST, RST, QST) are charged only if the business has registered in that province. Each province has its own threshold for out-of-province digital sellers. The calculator leaves them off by default and prints a note that the school may need to self-assess. Tick "Charge PST/RST/QST" only after registering.
- **Public schools still pay GST/HST** on the invoice. They then claim a public service bodies' rebate themselves, so nothing changes for us.
- Put the GST/HST number on every invoice once registered: `[OWNER: GST/HST registration number]`.

### United States: sales tax

- **Usually exempt for schools.** Public schools and most private schools don't pay sales tax. **Ask the school to send its exemption certificate with the PO,** and keep a copy with the invoice.
- The calculator charges **0% for every US state** and prints the exemption note.
- A foreign seller only has to collect US sales tax in a state after passing that state's economic-nexus threshold (often $100,000 of sales a year). Revisit this if US sales grow, or if a non-exempt buyer such as a tutoring company orders.

## Vendor information checklist (W-9-style)

School procurement usually asks for these before it can raise a PO. Fill them in once on [`vendor-info.html`](../../public/billing/vendor-info.html).

- [ ] Legal business name, and operating name ("BloomType") — `[OWNER: legal business name]`
- [ ] Business type (sole proprietor or corporation) and business number
- [ ] Street address and remittance (mailing) address
- [ ] Contacts for sales, billing/accounts receivable, privacy and support
- [ ] GST/HST registration number, and QST/PST numbers if registered (or "not registered, small supplier")
- [ ] **US tax form:** US districts ask for a **W-9**, but a Canadian business is not a US person. Give a signed **IRS Form W-8BEN-E** (a corporation) or **W-8BEN** (a sole proprietor) instead, claiming the Canada–US treaty. *Owner: download it from irs.gov and fill it in; never put a made-up number on it.*
- [ ] Banking details for EFT/ACH on a signed bank letter or void cheque (never in the HTML templates)
- [ ] Certificate of insurance, if asked (general liability, and cyber liability for cloud features) — `[OWNER: insurer and limits, or "not held"]`
- [ ] Privacy summary, signed data-privacy agreement (DPA), IT/security summary and accessibility report (see the [school pack](README.md))
- [ ] Small-business or diversity status, if the school tracks it
- [ ] A signature and date certifying the information

## Refunds and cancellation (proposed, owner to confirm)

- **Change of mind:** a school can cancel within **30 days of the invoice date** for a full refund, or a cancelled invoice if it has not paid yet.
- **After 30 days:** no refund for the rest of the term, except as below. The school keeps its paid features until the end of the term.
- **If we can't deliver:** if BloomType stops a paid feature, or has a serious outage or a privacy breach that the school's DPA treats as a reason to end the contract, the school gets a **prorated refund** for the unused months.
- **No automatic renewal.** Nothing renews without a new PO.
- **Data on cancellation:** class data in the cloud is deleted on the school's request. Otherwise it is deleted on the schedule in the retention policy, which is still to be written (#132); the proposal is within 90 days of the term ending. Progress stored on the devices is unaffected (see the [privacy summary](PRIVACY-SUMMARY.md)).
- Refunds are paid back by the same method the school used to pay.

## Files

| File | What it does |
|---|---|
| [`public/billing/quote.html`](../../public/billing/quote.html) | Printable quote. Fill it in on screen or with a link (see below). |
| [`public/billing/invoice.html`](../../public/billing/invoice.html) | Printable invoice with PO number, net-30 due date and remit-to details. |
| [`public/billing/vendor-info.html`](../../public/billing/vendor-info.html) | One-page vendor information sheet for procurement. |
| [`src/billing.js`](../../src/billing.js) | The price list, pilot discount and tax table, with tests in `test/billing.test.js`. The pages load a copy at `public/billing/billing.js`; a test fails if the two differ. |

Link fields for the quote and invoice go after a `#`, for example `quote.html#plan=school&qty=1&country=CA&region=ON`. The part after `#` is never sent to the web server, so school names and contacts stay out of server logs. Fields: `no`, `date` (YYYY-MM-DD), `school`, `attn`, `address` (new lines as `%0A`), `email`, `plan` (`classroom`, `school` or `district`), `qty`, `pilot=1`, `country` (`CA` or `US`), `region` (for example `ON` or `NY`), `gst=1`, `pst=1`, `valid` (quote days), and for the invoice `po` and `quote`. A link still sits in browser history, so send schools the printed PDF rather than the link.

**GST/HST is off by default.** An unregistered small supplier must not charge GST/HST. Tick “Charge GST/HST” (or add `gst=1`) only once the business is registered with the CRA.

**Before the first real invoice, the owner must:** confirm the prices, replace every `[OWNER: …]` placeholder in the three pages, decide on GST/HST registration with an accountant, and prepare the bank letter and W-8BEN(-E).
