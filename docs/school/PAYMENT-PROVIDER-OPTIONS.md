# Card payment provider: options for the owner

> **Owner decision needed.** The invoice and purchase-order path in [PRICING-AND-ORDERING.md](PRICING-AND-ORDERING.md) works today with no provider at all: cheque, EFT and ACH. This page is only about adding **card payment later**. Fees below are from memory of the public price pages in 2026 and change often. **Check each provider's current pricing page before deciding.**

## What we need

- **Schools pay by PO and invoice, not checkout.** The provider must handle invoices with a PO number, net-30 terms and payment by bank transfer as well as card.
- **Small card payments.** A teacher with a school purchasing card (P-card) buying one $39 Classroom plan.
- **A Canadian seller** with Canadian and US school buyers, in CAD and USD.
- **Simple tax.** We charge GST/HST in Canada; US schools are almost always tax-exempt. See the tax section in [PRICING-AND-ORDERING.md](PRICING-AND-ORDERING.md).
- **No child data.** Only adult billing contacts ever reach the provider.

## Comparison

| | **Stripe Invoicing** | **Paddle** | **Lemon Squeezy** |
|---|---|---|---|
| **Model** | Payment processor. *We* are the seller and handle tax. | Merchant of record (MoR). *Paddle* is the seller and handles sales tax, VAT and GST worldwide. | Merchant of record, now owned by Stripe (bought in 2024). |
| **Card fees (approx.)** | About 2.9% + C$0.30 for Canadian cards; more for US and international cards and currency conversion. | About 5% + $0.50 per transaction, tax handling included. | About 5% + $0.50 per transaction, plus extra for international cards and PayPal. |
| **Invoice fee (approx.)** | About 0.4–0.5% per paid invoice on top of payment fees. | Included. | No real invoicing product. |
| **Bank transfer / ACH (approx.)** | US ACH direct debit about 0.8% capped at $5; Canadian pre-authorized debit and bank-transfer options are also available. | Bank transfer is supported on Paddle invoices. | Card and PayPal checkout only. |
| **Tax** | We set the rates ourselves, or add Stripe Tax for about 0.5% per transaction. | Done for us, including registration and filing. | Done for us. |
| **School PO support** | Good: hosted invoices with custom fields for a PO number, net terms, card or bank payment, and cheques marked "paid outside Stripe". | Fair: Paddle can issue B2B invoices with terms, but **Paddle is the vendor of record**, so the school must set up Paddle (not us) as its supplier. Some boards won't. | Poor: built for self-serve checkout of digital products; no PO or net-terms flow. |
| **Canadian sellers** | Yes. Stripe operates in Canada and pays out in CAD and USD. | Yes, Paddle accepts Canadian businesses. | Yes in principle, but its future is uncertain as Stripe folds it into its own products. |
| **Approval** | Quick sign-up. | Paddle reviews the product and website before you can sell. | Quick sign-up. |

## Recommendation

**Use Stripe Invoicing when card payment is needed. Keep the manual invoice path as the default until then.**

- **School buying runs on POs and invoices.** Stripe's invoices fit that flow and are issued in BloomType's own name, so the vendor on the PO, the invoice and the payment all match. Paddle as merchant of record puts a third company in the middle of every school PO, which works against us with procurement teams.
- **Our tax is simple enough to handle ourselves.** We charge GST/HST by province (the table already exists in `src/billing.js`), and US schools are exempt. Paying a merchant of record about 5% per sale to handle tax we barely owe costs more than it saves.
- **It's the cheapest for small P-card payments,** and Stripe can add ACH and Canadian debit for larger invoices later.
- **Lemon Squeezy is not a good fit:** it has no PO or net-terms support, and its long-term future is unclear.

**When to look again at Paddle:** if BloomType starts selling to many non-exempt buyers abroad (for example tutoring centres in the EU or UK). At that point, registering for VAT in several countries makes a merchant of record worth its higher fee.

## Owner steps

1. Check the current fees on each provider's pricing page and update this page.
2. Decide on GST/HST registration with an accountant. This must happen before Stripe invoices charge tax.
3. Choose a provider and open the account in the business's legal name. **Don't put API keys in this repository.** A card checkout would need a small server-side piece, which comes after the cloud project in Phase 3.
