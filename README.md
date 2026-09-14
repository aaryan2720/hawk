# HAWK Security Platform

HAWK is a security monitoring and vulnerability management platform for critical-sector
organisations. It watches OEM (equipment manufacturer) security advisories in real time,
matches them against the hardware and software a customer actually runs, and delivers
actionable, AI-assisted remediation guidance within minutes — without waiting for NVD.

---

## What the product does

| Capability | Description |
| --- | --- |
| System inventory | A generated WinAudit-style script (Windows PowerShell / Linux shell) collects hardware, OS, network and installed-software details and produces a JSON file the user uploads. |
| OEM detection | The uploaded inventory is parsed, manufacturers are identified, and matching advisory sources are configured automatically. |
| Advisory monitoring | Scheduled and on-demand scanning of OEM advisory pages plus CISA KEV, GitHub Security Advisories, OSV and MITRE CVE. |
| Alerting | In-app notifications and email/SMS delivery, with severity thresholds per user. |
| AI remediation | Concise problem statement plus real, verifiable fix steps, commands, verification and official references (Gemini via a Supabase Edge Function). |
| Dashboards | Alert overview, trend charts, severity distribution, scan history, reports. |
| Architecture console | Internal live-system view for `@hawk.com` (sysadmin) accounts. |

---

## Architecture at a glance

```text
┌───────────────────────────── Frontend (this repo, /src) ─────────────────────────────┐
│  React 18 + TypeScript + Vite                                                        │
│  pages/         route-level screens                                                  │
│  components/    UI + feature components (shadcn/ui primitives in components/ui)      │
│  services/      the ONLY place that talks to the backend                             │
│  hooks/         auth, tracking, motion, toast                                        │
│  integrations/  generated Supabase client + database types                           │
└──────────────────────────────────────┬───────────────────────────────────────────────┘
                                       │ supabase-js (REST, Realtime, Auth) / functions.invoke
┌──────────────────────────────────────┴───────────────────────────────────────────────┐
│  Backend (Supabase, /supabase)                                                       │
│  Postgres + Row Level Security       auth (email/password)                           │
│  functions/  Deno edge functions:                                                    │
│      ai-solution-generator   gemini-chat        ai-risk-analyzer                     │
│      scrape-vulnerabilities  oem-real-time-monitor  real-time-scraper                │
│      auto-monitor            send-notifications  enterprise-notifications            │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

**Boundary rule:** components never call Supabase directly for business logic — they call a
function in `src/services`. Edge functions hold every secret (API keys, mail credentials);
the browser only ever sees the publishable Supabase key.

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the detailed breakdown and
[`docs/DEVELOPMENT_ROADMAP.md`](./docs/DEVELOPMENT_ROADMAP.md) for the history of what was
built when.

---

## Tech stack

- **Frontend:** React 18, TypeScript 5, Vite 5, Tailwind CSS 3, shadcn/ui, Radix UI
- **Motion:** GSAP (+ ScrollTrigger) for scroll reveals, Framer Motion for component motion
- **Data:** TanStack Query, React Hook Form + Zod, Recharts
- **Backend:** Supabase (Postgres, RLS, Auth, Realtime, Deno edge functions)
- **AI:** Google Gemini (`gemini-2.0-flash`) via edge functions

---

## Getting started

```sh
npm install        # or: bun install
npm run dev        # http://localhost:8080
```

Other scripts:

```sh
npm run build      # production build
npm run preview    # preview the production build
npm run lint       # eslint
npm run typecheck  # TypeScript, no emit
npm run clean      # remove node_modules + dist
npm run reinstall  # clean install from scratch
```

### Environment

The Supabase URL and publishable key live in `src/integrations/supabase/client.ts`.
All private keys (Gemini, mail providers, etc.) are stored as **Supabase Edge Function
secrets** and are never committed or exposed to the browser.

---

## Design system

Colours, gradients and shadows are defined once as HSL tokens in `src/index.css` and mapped
in `tailwind.config.ts`. The current direction is *clean light professional*: near-white
surfaces, deep blue primary, restrained shadows, generous spacing.

Never hardcode colours (`text-white`, `bg-[#fff]`) in components — use the semantic tokens
(`bg-background`, `text-muted-foreground`, `bg-primary`, …).

Scroll motion: add `data-reveal` to a section (or `data-reveal-stagger` to a grid) and the
`useGsapReveal` hook animates it in. Reduced-motion preferences are respected automatically.

---

## Repository layout

```text
src/                 frontend application
  pages/             routed screens (composition only)
  features/          one folder per domain — auth, alerts, ai, oem, scanning,
                     notifications, enterprise, architecture, billing.
                     Each holds its own components/ services/ hooks/ utils/
  components/ui      shadcn primitives
  components/layout  navbar, footer, dashboard chrome
  hooks/             cross-feature hooks
  integrations/      Supabase client & generated types
  utils/, types/     shared helpers and domain types
supabase/functions/  Deno edge functions (backend logic + secrets)
docs/                architecture, roadmap, guides
```

---

## Status

Roughly MVP-complete: inventory intake, OEM detection, multi-source scanning, alerting,
AI remediation and dashboards all work end to end. Remaining before launch: broader test
coverage, security hardening review, error-handling polish and payment integration.
