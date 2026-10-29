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

- [x] **Certifications** on `credentials.html`, with Coursera verification links
- [ ] **Amedo live link** on `index.html` and `work.html` (and written permission to show the work)
- [ ] **Amedo screenshot**, to replace the drawn browser mock-up
- [ ] **Email**: `hello@startlinelab.com` appears on every page; make sure the mailbox exists
- [ ] **Domain**: add `startlinelab.com` as the custom domain in Cloudflare Pages, then redirect `startlinelab.co.za` (and `www.`) to it with a Cloudflare redirect rule (301)
- [ ] **WhatsApp**: the site's WhatsApp buttons go to 065 769 1052, so set that number up on WhatsApp Business

## Prices

The estimator's build types, add-ons and website ideas are listed in `site-src/planner.py` in the build
sources, and rendered into `pricing.html` as `data-lo`, `data-hi` and `data-add` attributes. The sliders for
each build type (what they count, how many are included and the price of each extra) are the `SIZE` table at
the top of the estimator in `assets/site.js`. The app planner on `apps.html` works the same way: platforms,
app types and features carry their prices in the HTML, and the screen price is set in `assets/site.js`.

## Deploy

Cloudflare Pages builds `main` to production. Any other branch gets its own preview address,
for example `redesign.<project>.pages.dev`. Framework preset `None`, empty build command, output `/`.
