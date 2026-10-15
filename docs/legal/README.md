# Legal drafts

> **These are drafts. They are not in force and are not published anywhere.** Do not link them from the website, the app or any listing until every step below is done.

Directory listings and marketplaces (homeschool directories, state ESA vendor lists, Google for Education, ClassLink, Clever) ask for a **terms of service URL** and a **privacy policy URL**. These drafts are the starting point for those pages.

| File | What it is |
|---|---|
| [TERMS-OF-SERVICE-DRAFT.md](TERMS-OF-SERVICE-DRAFT.md) | Plain-language terms: free family use, school plans, fair use, children under an adult, licence, local data, future cloud features, no warranty, limits of liability, Ontario law. |
| [PRIVACY-POLICY-DRAFT.md](PRIVACY-POLICY-DRAFT.md) | Public privacy policy, built only from the privacy summary, privacy operations gate, IT summary and pilot survey docs. Covers PIPEDA, Ontario MFIPPA/Bill 194, Quebec Law 25, COPPA and FERPA. |

Every decision a lawyer or the owner must make is marked `[OWNER/LEGAL: …]`. Find them all with:

```sh
grep -n "OWNER/LEGAL" docs/legal/*.md
```

## Where the facts come from

- [`docs/school/PRIVACY-SUMMARY.md`](../school/PRIVACY-SUMMARY.md)
- [`docs/PRIVACY-OPERATIONS.md`](../PRIVACY-OPERATIONS.md)
- [`docs/school/IT-SECURITY-SUMMARY.md`](../school/IT-SECURITY-SUMMARY.md)
- [`docs/school/PRICING-AND-ORDERING.md`](../school/PRICING-AND-ORDERING.md)
- [`docs/GO-TO-MARKET.md`](../GO-TO-MARKET.md)
- [`docs/pilot/PILOT-SURVEY.md`](../pilot/PILOT-SURVEY.md)
- `landing.html` and `parents.html`

If any of these change (for example, cloud features are switched on), update the drafts too.

## Before publishing: checklist

### 1. Owner fills in the facts
- [ ] Legal business name, business type and mailing address.
- [ ] Privacy officer name and title.
- [ ] Web host, server location and what the web server logs (and for how long).
- [ ] Whether any cookies are set.
- [ ] Retention periods for emails, pilot feedback and business records.
- [ ] Service providers (email, hosting, accountant; Supabase later).
- [ ] Final school prices, refund and cancellation rules (still "proposed").
- [ ] Fix the repository `LICENSE` file (it has unfilled placeholders) and decide what is open source and what is not (code vs. art, audio, voice, brand).
- [ ] Which regions are in scope (Canada, US, Quebec, elsewhere) and whether a French version is needed.

### 2. Legal review
- [ ] A Canadian lawyer with privacy and education-technology experience reviews both drafts.
- [ ] Check consumer-law limits on the warranty and liability sections (Ontario Consumer Protection Act, 2002; Quebec if in scope).
- [ ] Confirm the COPPA, FERPA, PIPEDA, MFIPPA/Bill 194 and Law 25 sections.
- [ ] Confirm governing law and venue work for US school districts.
- [ ] Decide whether schools need a separate school agreement, and how it ranks against the order form and DPA.
- [ ] Every `[OWNER/LEGAL: …]` placeholder is resolved or removed.

### 3. Connect to the other paperwork
- [ ] The DPA template, parental-consent wording and retention policy are done (#132), and the drafts link to them.
- [ ] The privacy policy still matches `PRIVACY-SUMMARY.md` and `parents.html` word for word on the facts.

### 4. Publish
- [ ] Remove the DRAFT banners.
- [ ] Set the "Last updated" dates.
- [ ] Create public pages (for example `terms.html` and `privacy.html`), translated into French and Spanish like the other pages.
- [ ] Link them from the landing page, parent page and teacher page footers.
- [ ] Use the public URLs in directory and marketplace listings.
- [ ] Keep a dated copy of each published version.
