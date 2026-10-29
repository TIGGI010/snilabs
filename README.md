# Startline Labs

The website for Startline Labs, a software studio in Johannesburg building websites, apps and
business systems for South African businesses.

Six hand-written static pages sharing one stylesheet and one script. No framework, no build step
on Cloudflare, nothing to install.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home: hero, projects, what we build, process, pricing, credentials |
| `services.html` | The five services in detail |
| `pricing.html` | Tiers, the live project estimator, care plans and questions |
| `work.html` | Apps in development and client websites |
| `credentials.html` | Qualifications, certifications and how I work |
| `contact.html` | Phone, WhatsApp, and a brief that turns into a WhatsApp message |
| `404.html` | Served automatically for unknown addresses |
| `assets/styles.css`, `assets/site.js` | Shared styles and behaviour |
| `og.png`, `apple-touch-icon.png`, `favicon.svg` | Share preview, home-screen icon, tab icon |

Cloudflare Pages serves `/services` from `services.html`, so links use clean addresses.

## Still to fill in

Search the HTML for `data-todo`:

- [ ] **Certifications** on `credentials.html`: name, issuer and year for each
- [ ] **Amedo live link** on `index.html` and `work.html` (and written permission to show the work)
- [ ] **Amedo screenshot**, to replace the drawn browser mock-up
- [ ] **Email**: `hello@startlinelabs.com` appears on every page; make sure the mailbox exists

## Prices

The estimator reads its numbers from the HTML in `pricing.html`: `data-lo`, `data-hi` and
`data-inc` on each build option, `data-add` on each add-on, and the care plan values. Extra pages
(R350 each) and products (R180 per 10) are set at the top of the estimator in `assets/site.js`.

## Deploy

Cloudflare Pages builds `main` to production. Any other branch gets its own preview address,
for example `redesign.<project>.pages.dev`. Framework preset `None`, empty build command, output `/`.
