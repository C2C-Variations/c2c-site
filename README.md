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
