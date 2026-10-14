# BloomType school pack

Documents a school, district or homeschool co-op asks for before saying yes. Each one is a **draft for the owner to approve** before it goes on the website or to a buyer.

| Document | Who reads it | Status |
|---|---|---|
| [Privacy summary](PRIVACY-SUMMARY.md) | Parents, principals, privacy officers | Draft: owner and legal review |
| [IT and security summary](IT-SECURITY-SUMMARY.md) | School IT staff | Draft: owner review |
| [Accessibility conformance report (VPAT-style)](ACCESSIBILITY-REPORT.md) | Purchasing and accessibility staff | Draft: needs a manual screen-reader pass |
| [Standards map](STANDARDS-MAP.md) | Teachers and curriculum leads | Draft: standards wording to confirm |
| [Teacher quick start](TEACHER-QUICK-START.md) | Teachers | Ready to share |
| [Typing Week kit](TYPING-WEEK-KIT.md) | Teachers | Ready to share |
| [Homeschool typing guide](../homeschool/CURRICULUM-GUIDE.md) | Homeschool families and co-ops | Ready to share |
| [Pricing and ordering](PRICING-AND-ORDERING.md) | Principals, purchasing and accounts payable | Draft: prices proposed, owner to confirm |
| [Payment provider options](PAYMENT-PROVIDER-OPTIONS.md) | The owner (card-payment decision) | Owner decision needed |

### Billing templates

Printable pages with no server and no payment provider. Fill them in on screen or through the link, then print or save as a PDF. Replace every `[OWNER: …]` placeholder before sending one.

- [Quote](../../public/billing/quote.html) (`/billing/quote.html` on the site)
- [Invoice](../../public/billing/invoice.html) with PO number and net-30 terms (`/billing/invoice.html`)
- [Vendor information sheet](../../public/billing/vendor-info.html) for school procurement (`/billing/vendor-info.html`)

Keep these in step with the code. When a feature changes what is stored, update the privacy summary in the same pull request.
