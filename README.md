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
- Save.
Cloudflare will deploy previews for PRs and production on `main`.

## Daily workflow
1. Create a branch, make changes in `site/` (e.g., edit `docs.html`).
2. Commit, open PR.
3. CI runs: HTML lint + broken-link check + WhatsApp link sanity.
4. If ✅, merge to main → Cloudflare auto-deploys.
5. If ❌, fix and push again.

## Files in this repo
- `.github/workflows/ci.yml` — CI checks (HTMLHint + Linkinator)
- `.github/PULL_REQUEST_TEMPLATE.md` — human checklist before merging
- `.github/CODEOWNERS` — required reviewers
- `.htmlhintrc` — HTML rules
- `_redirects` — keeps pretty paths working on Cloudflare (served from `site/`)

## Notes
- Don’t put secrets in the repo.
- WhatsApp numbers in templates: `61466873332` (update in one place if you change it).
- Stripe links live only on the Pricing page; Docs Hub has **no billing** (subs cover docs).
