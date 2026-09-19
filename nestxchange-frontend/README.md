# NestXchange web client

React 19 + Vite + Tailwind CSS v4 single-page client for the NestXchange API.

See the [root README](../README.md) for the full project, including how to run
the API this talks to.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Runs on http://localhost:5173 and expects the API on
`VITE_API_BASE_URL` (default `http://localhost:8081/api/v1`).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint, including the React hooks rules |

## Layout

```
src/
├── api/          client.js (axios, auth header, 401 handling) and endpoints.js
├── components/
│   ├── auth/       Sign-in dialog, route guard
│   ├── layout/     Navbar, footer, error boundary, scroll restoration
│   ├── marketing/  Hero search and the reusable landing-page sections
│   ├── property/   Cards, filters, form, gallery, map, pagination
│   └── ui/         Icons, fields, modal, toasts, empty states
├── context/      Auth, theme and toast providers (hooks live in contexts.js)
├── hooks/        useAsync, useFavorites, usePageMeta
├── lib/          Formatting, shared constants, map helpers
└── pages/        One component per route
```

## Conventions

**Styling** is Tailwind v4 with design tokens declared in `src/index.css`.
Reach for the component classes (`.surface`, `.btn-primary`, `.field`, `.chip`)
before writing new utility soup, and never hardcode a brand hex value — use the
`brand-*`, `accent-*` and `ink-*` scales.

**Dark mode** is class-based. The theme is applied by an inline script in
`index.html` before first paint, so there is no flash; `ThemeProvider` only
keeps it in sync afterwards.

**Data fetching** goes through `useAsync`, which derives its loading flag rather
than calling `setState` synchronously inside an effect.

**Search filters** are stored in the URL, not in component state, so a result
set can be shared and survives the back button.

**Accessibility** is not optional here: every interactive element must be a real
button or link, every input needs a label, dialogs trap focus and close on
Escape, and icons are `aria-hidden` with the accessible name on the control.
