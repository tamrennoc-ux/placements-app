# Practice Placements App

Paste your placement email; the app parses dates and shows only placement days grouped by month. Share via WhatsApp or the Web Share API.

## Local dev
```bash
npm i
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Deploy to Netlify
1. Create a new GitHub repository and push this folder.
2. Go to Netlify → **Add new site** → **Import from Git** → pick your repo.
3. Build command: `npm run build`
   Publish directory: `dist`
4. Deploy. (Or use Netlify CLI: `npm i -g netlify-cli` then `netlify deploy`.)

### Drag‑and‑drop alternative
- Build locally (`npm run build`) then drag the `dist/` folder into https://app.netlify.com/drop (no repo needed).

## Environment
No backend needed; parsing runs entirely in the browser.
