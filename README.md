# Rental Management — Frontend

A React + Vite single-page app for managing a rental property (rooms, tenants, contracts, invoices). Migrated from Next.js to a plain React SPA with React Router.

## Tech stack

- React 19 (JavaScript / JSX)
- Vite 6 (build tool / dev server)
- React Router 7 (client-side routing)
- Tailwind CSS v4 + shadcn/ui (radix-ui)
- axios (API client), recharts (charts), lucide-react (icons)

## Getting Started

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

The backend API is expected at `http://localhost:3000` (configured in `src/lib/axios.js`).

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — build for production into `dist/`
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint

## Project structure

```
index.html              # SPA entry HTML (title, fonts, favicon)
vite.config.js          # Vite + React + Tailwind + @ alias
src/
  main.jsx              # App bootstrap (BrowserRouter)
  App.jsx               # Route definitions
  globals.css           # Tailwind + theme tokens
  layouts/
    DashboardLayout.jsx # Sidebar/header shell, auth guard, renders <Outlet />
  pages/                # Login, Dashboard, Rooms, Tenants, Contracts, Invoices, NotFound
  components/ui/        # shadcn/ui components
  lib/                  # axios instance + utils
```

## Routing

| Path         | Page             |
| ------------ | ---------------- |
| `/login`     | Login            |
| `/`          | Dashboard        |
| `/rooms`     | Rooms            |
| `/tenants`   | Tenants          |
| `/contracts` | Contracts        |
| `/invoices`  | Invoices         |
| `*`          | NotFound (404)   |

Dashboard routes are nested under `DashboardLayout`, which checks for an auth token in `localStorage` and redirects to `/login` if absent.
