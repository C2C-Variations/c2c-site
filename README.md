# C2C Variations — Repo Baseline

This repo is your **source of truth** for the website. No more random ZIPs.
- **main branch** = last known good
- **PRs** = all changes. CI will test HTML + links before you merge.
- Cloudflare Pages deploys **only from main**.

## How to seed this repo (1st time)
1. Download your current working bundle (the Cloudflare one with `_redirects` + Docs→WhatsApp).
2. Unzip it and **copy all files into `site/`** (keep `_redirects` at root of `site/`).
3. Commit and push to GitHub.

## Connect Cloudflare Pages (one-time)
- Create a new Pages project → **Connect to Git** → choose this repo.
- **Build command:** (leave empty)
- **Build output directory:** `site`
# C2C Site

This repository contains the C2C Variations website.

## Structure
- index.html → main landing page
- about.html → about page
- pricing.html → service pricing
- partners.html → partner/trust logos
- docs.html → resources and documentation
- privacy.html, terms.html → legal pages
- testimonials.html → client reviews
- 404.html → fallback error page
- assets/ → images, CSS, and static files
- site-mobile.css → mobile styles
- _redirects → Cloudflare redirect rules
- .gitignore → ignored files

## Deployment
- Hosted on Cloudflare Pages
- Main branch = production
- Feature branches = development

## Notes
- Always commit changes on a feature branch first
- Merge to main only after testing in Cloudflare preview

```
{
  "scripts": {
    "linkcheck": "node scripts/link_check.mjs --base=https://www.c2cvariations.com.au --json=data/resources.json --html=resources.html"
  }
}
```

### Resources link validation (manual)

You can validate all outbound links listed in `data/resources.json` (and any hard-coded links in `resources.html`) with a manual GitHub Action:

1. Go to **Actions → Resources link check → Run workflow**.
2. (Optional) Change the inputs:
   - **base_url** – used to resolve any relative links (default: `https://www.c2cvariations.com.au`)
   - **json_path** – path to the JSON (default: `data/resources.json`)
   - **html_path** – path to the HTML (default: `resources.html`)
   - **timeout_ms**, **concurrency** – network tuning
3. Click **Run workflow**. When it finishes, download the `link_audit` artifact – it contains `link_audit.csv` with:  
   `original_url, final_url, method_used, status, ok, error`

Notes:
- HEAD is tried first; if blocked, the checker falls back to GET and follows redirects.
- Script is dependency-free (Node 20+ only).
