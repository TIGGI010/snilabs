# Startline Labs

The website for Startline Labs — a digital studio in Johannesburg building websites, apps and
business systems for South African businesses.

One hand-written static page. No framework, no build step, no dependencies to install.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The whole site: markup, styles and script in one file |
| `404.html` | Not-found page, served automatically by Cloudflare Pages |
| `favicon.svg` | The S monogram used as the browser tab icon |
| `robots.txt` | Lets search engines index everything, points at the sitemap |
| `sitemap.xml` | One URL for now; add entries as pages are added |

## Deploy to Cloudflare Pages

1. Sign in at **dash.cloudflare.com** and go to **Workers & Pages → Create → Pages →
   Connect to Git**.
2. Authorise GitHub and pick the **snilabs** repository.
3. Set the project name to **startline-labs** (this becomes `startline-labs.pages.dev`, so
   it does not have to match the repository name).
4. Build settings: **framework preset `None`**, leave the build command **empty**, and set the
   build output directory to **`/`**. There is nothing to compile.
5. Click **Save and Deploy**. The first deploy takes about a minute.

Every push to `main` redeploys automatically.

## Point the domain at it

1. Buy `startlinelabs.co.za` (HOSTAFRICA, R49 for the first year) and `startlinelabs.com`.
2. In Cloudflare, **Add a site**, enter the domain, choose the **Free** plan, and copy the two
   nameservers it gives you.
3. At the registrar, replace the existing nameservers with those two. Propagation usually takes
   a few hours.
4. Back in the Pages project: **Custom domains → Set up a custom domain**, enter the domain, and
   Cloudflare creates the DNS record and the SSL certificate itself.

## Before it goes public

Search `index.html` for `class="ph"`. Every placeholder is marked with that class and renders in
orange on the page, so nothing can be missed:

- [ ] WhatsApp number
- [ ] Email address (`hello@startlinelabs.com` is a placeholder until the mailbox exists)
- [ ] Certification list in the credentials section
- [ ] Amedo screenshot, replacing the empty frame in the Work section (get written permission first)

Other things to set before launch:

- [ ] Prices: the estimator reads from the `<option value="low|high|includedPages">` attributes on
      the `#base` select, plus `data-add` on each add-on checkbox and `EXTRA_PAGE` /
      `PER_10_PRODUCTS` near the bottom of the script.
- [ ] `og:url` and `canonical` in the `<head>` if the primary domain ends up being the `.com`.
- [ ] An Open Graph preview image (1200×630) once there is a screenshot worth sharing.

## Local preview

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.
