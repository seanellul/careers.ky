# careers.ky - Cayman Lifestyle × Career Platform

A modern React web application for discovering career opportunities in the Cayman Islands, with a focus on lifestyle-career matching.

## Features

- 🎨 Beautiful, modern UI with Tailwind CSS
- ⚡ Hot module reloading with Vite
- 🎭 GSAP animations and scroll effects
- 💼 Live job feed from WORC (my.egov.ky)
- 🔍 Advanced filtering and search
- 📱 Fully responsive design

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

This will start the development server at `http://localhost:3000` with hot reloading enabled.

On **localhost** in development, the orange **DEV** toolbar (bottom-right) includes **New candidate → profile setup**: it signs you in as a fresh synthetic user with no Google/LinkedIn account, so you can exercise the job seeker onboarding flow repeatedly.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Environment Variables

Create a `.env.local` file based on `.env.example`. See `.env.example` for the full list (database, OAuth, cron, etc.).

**Admin:** `ADMIN_EMAIL` must match the signed-in candidate or employer account email to access `/admin`. In production, if `ADMIN_EMAIL` is unset or empty, the admin area is disabled.

Legacy docs below (some keys may differ in the Next.js app — prefer `.env.example`):

- `VITE_WORC_P_AUTH` - Authentication token for WORC API
- `VITE_WORC_PROXY` - Optional CORS proxy URL

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- shadcn/ui components
- GSAP (animations)
- Lucide React (icons)

## Project Structure

```
react_webapp/
├── src/
│   ├── components/
│   │   └── ui/          # shadcn/ui components
│   ├── lib/
│   │   └── utils.js     # Utility functions
│   ├── careers.jsx      # Main careers page component
│   ├── main.jsx         # App entry point
│   └── index.css        # Global styles
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## License

Private
