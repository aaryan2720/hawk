# HAWK Architecture

This document explains how the frontend and backend are separated, what belongs where, and
the main data flows. Read it before adding a feature.

## 1. Two halves

| | Frontend | Backend |
| --- | --- | --- |
| Location | `/src` | `/supabase` |
| Runtime | Browser (Vite build) | Supabase: Postgres + Deno edge functions |
| Owns | rendering, routing, local state, form validation | data, auth, RLS, secrets, scraping, AI calls, mail/SMS |
| Secrets | none (publishable Supabase key only) | all (Gemini key, mail credentials, service role) |

Rule of thumb: **anything that needs a secret, a third-party HTTP call, or must be trusted
runs in an edge function.**

## 2. Frontend layers

```text
pages/            route entry points, layout + composition only
components/       feature components; components/ui = shadcn primitives
services/         backend access layer — the only place importing the supabase client
                  for business logic (oemService, oemScrapingService,
                  enterpriseOEMService, aiSolutionGenerator)
hooks/            useAuth, useArchitectureTracking, useGsapReveal, useSolutionProgress
integrations/     supabase client + generated database types
utils/            pure helpers: formatting, scoring, filtering, templates
types/            shared domain types (Alert, OEMSource, UserSystem, Notification…)
```

Data fetching goes through TanStack Query where caching matters; one-off actions call a
service function directly and surface results with the toast system.

## 3. Backend functions

| Function | Purpose |
| --- | --- |
| `ai-solution-generator` | Gemini-backed remediation: short problem statement, real fix steps, commands, verification, references. |
| `gemini-chat` | Assistant chat (model `gemini-2.0-flash`). |
| `ai-risk-analyzer` | Risk scoring / prioritisation support. |
| `scrape-vulnerabilities` | Multi-source ingestion: CISA KEV, GitHub Advisory, OSV, MITRE. |
| `oem-real-time-monitor`, `real-time-scraper`, `test-oem-scraper` | Direct OEM advisory page monitoring. |
| `auto-monitor` | Scheduled scanning per user system. |
| `send-notifications`, `enterprise-notifications` | Email/SMS delivery with provider fallback. |
| `database-functions`, `create-notification-table` | Maintenance helpers. |

Every function validates its input, uses CORS headers, and returns structured JSON
(`{ success, data | error, errorType }`).

## 4. Core data flow: inventory to alert

```text
1. User generates the audit script (Windows or Linux) in System Detection.
2. Script runs on the target machine and writes an inventory JSON file.
3. User uploads the JSON → it is parsed in the browser into hardware, software,
   network and OS sections.
4. Detected manufacturers are matched to OEM advisory sources and saved
   automatically for that user.
5. Scheduled + manual scans query OEM pages and public feeds.
6. Matching CVEs become alerts (with RLS scoping them to the owning user).
7. Critical/High alerts trigger notifications; the AI solution generator produces
   the remediation guidance shown in the alert detail view.
```

## 5. Auth and roles

- Supabase email/password auth; session handled in `hooks/useAuth`.
- Roles: `basic`, `premium`, `admin`, `architecture` (sysadmin).
- `@hawk.com` addresses are treated as the internal architecture team and get access to the
  live architecture console at `/architecture`.
- Row Level Security scopes alerts, systems, OEM sources and notifications to their owner.

## 6. Design system and motion

- Tokens: `src/index.css` (`--background`, `--primary`, `--gradient-primary`,
  `--shadow-soft`, …) mapped in `tailwind.config.ts`.
- Direction: clean light professional — near-white surfaces, deep blue primary, soft
  shadows, `0.75rem` radius.
- Scroll motion: GSAP ScrollTrigger via `useGsapReveal`; mark sections with `data-reveal`
  or grids with `data-reveal-stagger`. Component-level motion continues to use Framer
  Motion. Both respect `prefers-reduced-motion`.

## 7. Conventions

- No hardcoded colour utilities in components — semantic tokens only.
- No direct third-party API calls from the browser.
- Shared types live in `src/types`; database types are generated, do not hand-edit.
- New backend behaviour = new or extended edge function, plus a service wrapper in
  `src/services` for the frontend to call.
