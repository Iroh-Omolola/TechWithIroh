# Tech with Iroh

Landing page for the *Tech with Iroh* podcast and live show.

## Getting started

```bash
npm install
npm run dev       # local dev server with hot reload
npm run build     # production build → dist/
npm run preview   # serve the production build
```

## Project structure

```
.
├── index.html                 # Page markup
├── public/                    # Static files copied as-is (favicon, logo)
└── src/
    ├── scripts/
    │   ├── main.js            # Entry: imports styles + initialises modules
    │   └── modules/           # One file per interactive feature
    │       ├── nav.js
    │       ├── waveform.js
    │       ├── episodeFilters.js
    │       ├── faq.js
    │       └── newsletter.js
    └── styles/
        ├── main.css           # Entry: imports partials in cascade order
        ├── base/              # Tokens, reset, typography, layout
        ├── components/        # Reusable UI: buttons, badges, nav, footer
        └── sections/          # One file per page section (incl. its media queries)
```

## Conventions

- **CSS:** BEM-style classes (`block__element--modifier`); state classes use `is-*`.
  Design tokens live in `src/styles/base/variables.css`.
  Breakpoints: `960px` / `720px` / `420px`.
- **JS:** behaviour hooks via `data-*` attributes, never styling classes.
- **Deploy:** any static host (Netlify, Vercel, GitHub Pages) — build command `npm run build`, output `dist/`.

## TODO

- Connect the newsletter form to an email provider (`src/scripts/modules/newsletter.js`).
- Replace `[placeholder]` content and `#` links with real values.
