# C2C E2E Tests (Playwright)

## What it tests
- `/resources.html` loads (title/H1, filter visible)
- Quick shortcuts render; links open in new tabs
- State/Territory accordions exist
- Filter works for "uv" and "outage"
- BOM, Healthdirect, Safe Work Australia, ABCB links present
- Mobile profiles render

## Run locally
```bash
npm ci
BASE_URL="https://<your-domain>" npm run test:e2e
# or open UI:
BASE_URL="https://<your-domain>" npm run test:ui
```
