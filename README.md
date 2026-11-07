# Lineup

A responsive event management website built for the K Explore Web Designing task. Lineup lets users explore upcoming campus events, search and filter them by category, open full event details, and register through a validated form. Registrations are saved to the browser with Local Storage, so users can return later and see their tickets without an account.

Live site: https://lineup-sristees-projects.vercel.app
Repository: https://github.com/srshriv/lineup

## Features

Core requirements

- Hero section introducing the platform, with a live countdown to the next upcoming event
- Featured events section and a full upcoming events grid
- Event cards showing name, date, venue, image, category and a short description
- Search across event names, venues and descriptions, with results updating as you type
- Category filters (Tech, Music, Sports, Arts, Workshop)
- Event detail view opened in a slide-in panel with full description, date, time, venue and capacity
- Registration form collecting name, email, phone number and selected event
- JavaScript validation for every field, with inline error messages and a check against duplicate registrations
- Confirmation message with a ticket reference on successful submission
- Fully responsive layout across mobile, tablet and desktop, including a mobile menu and a bottom-sheet detail panel on small screens

Bonus challenge

- Dark and light mode, with the choice persisted in Local Storage and the system preference respected on first visit
- Live countdown timers on the hero, on every event card and inside the event detail panel, switching to "Happening now" and "Ended" automatically
- Animations: a single orchestrated hero reveal on page load, a scrolling ticker of upcoming dates, panel slide-in, form shake on invalid submit, and a pop-in confirmation
- Local Storage based registration management: a "My registrations" section lists saved tickets, marks registered events with a badge, and allows cancellation

Accessibility and quality

- Semantic HTML5 landmarks, labelled form controls and ARIA roles for the dialog, timer and status regions
- Keyboard support: cards open with Enter, the panel closes with Escape, focus is trapped inside the panel and returned on close
- Visible focus styles and a skip link
- `prefers-reduced-motion` respected for all animation

## Tech stack

Only the allowed languages are used.

- HTML5
- CSS3 (custom properties, grid, flexbox, media queries, keyframe animation)
- Vanilla JavaScript (ES2015+), no frameworks, no build step

Fonts are loaded from Google Fonts (Syne for display, Work Sans for body). Event artwork is generated as inline SVG by `js/data.js`, so the site has no external image dependencies.

## Project structure

```
lineup/
├── index.html        Page structure and all sections
├── css/
│   └── style.css     Design tokens, themes, layout, components, responsive rules
├── js/
│   ├── data.js       Event data, category list and the SVG artwork generator
│   └── app.js        Rendering, search and filter, countdowns, drawer, validation, storage, theme
└── README.md
```

## How it works

Rendering. `app.js` reads the `EVENTS` array from `data.js`, sorts it by date and renders the featured grid, the main grid and the hero ticket using small template functions. Re-rendering after a search, filter or registration change keeps the UI in sync with state.

Search and filter. A `state` object holds the current query and category. `matches()` checks each event against both, and the grid re-renders on every input (debounced) and chip click. An empty state with a clear button appears when nothing matches.

Event details. Clicking a card or its button calls `openDrawer(id)`, which builds the detail panel, including the countdown block and either the registration form or, if the user is already registered, a confirmation with a cancel option.

Validation. Each field has a validator: name (letters and basic punctuation, minimum 3 characters), email (standard pattern), phone (valid 10 digit Indian mobile number, optional +91) and event (must exist and must not already be registered). Validation runs on blur and on submit; the first invalid field receives focus.

Local Storage. Two keys are used: `lineup.theme` for the colour mode and `lineup.registrations` for an array of ticket objects (`ticketId`, `eventId`, `name`, `email`, `phone`, `registeredAt`). All reads and writes are wrapped in try/catch so the site still works if storage is unavailable.

Countdowns. A single one second interval updates every element with a `data-countdown` or `data-countdown-block` attribute, which keeps all timers in sync and avoids one interval per card.

Theming. Colours are CSS custom properties on `:root`, overridden under `[data-theme="dark"]`. The toggle flips the attribute and saves the choice.

## Run locally

No build step is needed. Either open `index.html` directly in a browser, or serve the folder:

```bash
# Python 3
python -m http.server 8000
# then open http://localhost:8000
```

## Deployment

The site is static, so it deploys to GitHub Pages, Netlify or Vercel without configuration. For GitHub Pages: push to the `main` branch, open Settings > Pages, choose "Deploy from a branch", select `main` and `/ (root)`, and save.

## Customising events

Edit the `EVENTS` array in `js/data.js`. Each event needs an `id`, `name`, `category` (one of the values in `CATEGORIES`), `date` and `endDate` in ISO format, `venue`, `short`, `description`, `featured`, `capacity`, a `hue` (0 to 360) and a `pattern` (`grid`, `rings`, `stripes` or `dots`) for the generated artwork.
