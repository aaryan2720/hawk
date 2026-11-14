# HAWK: What to Build Next and How to Deploy on Vercel

## Recommended next feature

Do not expand the feature set before closing the security and data-persistence checks. The most useful next product feature is **equipment history and change detection**: save each machine's inventory over time, show what changed, connect matching high/critical advisories to that machine, and let the user mark a verified fix as complete. This supports HAWK's goal of helping critical-sector organisations fix serious equipment flaws and makes the weekly “high/critical alerts fixed” outcome measurable.

## Before building that feature

- [ ] Review the security scan findings. Confirm which public-read rules are intentional; restrict enterprise configuration and tracking data to the right signed-in users/roles.
- [ ] Resolve or explicitly review the high-severity dependency advisories reported for `zod` and `@sendgrid/mail`'s redirect dependency.
- [ ] Run a real signed-in workflow: sign up/sign in → upload a real inventory JSON → verify the machine and OEM sources are saved → confirm a matching alert appears → open remediation → mark the alert fixed → reload and confirm the saved state remains.
- [ ] Add automated tests for inventory parsing, OEM matching, user data separation, and the fixed-alert workflow.
- [ ] Re-run the security reviews and dependency scan after fixes; do not treat an unverified public policy or an untested flow as production-ready.

## Deploy this app to Vercel

HAWK is a Vite + React frontend. Vercel detects Vite, runs the production build, and serves the generated `dist/` folder; no Vercel-specific build adapter is needed. The app's database, sign-in, and server-side functions are on the connected Supabase project and are not moved to Vercel by deploying the frontend. [Vercel's Vite guide](https://vercel.com/docs/frameworks/frontend/vite)

### Option A — upload a folder or ZIP

1. Use **Vercel Drop** and upload the **project folder** or a ZIP of the project. Do not upload only this Markdown file: Vercel needs the app source and `package.json` to build HAWK.
2. Include the project files such as `package.json`, `package-lock.json`, `index.html`, `src/`, `public/`, and `vite.config.ts`. Do not include `.env`, `node_modules/`, or `dist/`.
3. In the Vercel project settings, add these environment variables for the deployment environments you use:
   - `VITE_SUPABASE_URL` — the Supabase project URL.
   - `VITE_SUPABASE_ANON_KEY` — the Supabase publishable/anon key.
4. Keep Gemini, service-role, and other private keys out of Vercel's browser-facing `VITE_` variables. Gemini belongs in Supabase Edge Function secrets; never put a service-role key in frontend settings.
5. Confirm Vercel's build command is `npm run build` and its output directory is `dist` (Vercel normally detects these for Vite).
6. After deployment, add the Vercel site URL to Supabase Authentication's allowed site/redirect URLs, then test sign-in, sign-out, and password reset on the deployed domain.
7. Test the main signed-in workflow before sharing the production URL. Vercel Drop supports deploying a project folder or ZIP; use Git integration if you want future pushes to deploy automatically. [Vercel Drop guide](https://vercel.com/docs/drop)

### Option B — deploy from the project folder with commands

Open a terminal in the folder containing `package.json`, then run:

```bash
npm install
npm run typecheck
npm run build
npx vercel
```

The first `npx vercel` run will ask you to sign in and link/create a Vercel project; it creates a preview deployment. After adding the environment variables and checking the preview, publish to production with:

```bash
npx vercel --prod
```

Vercel CLI deploys from the current project directory. [Vercel CLI deployment guide](https://vercel.com/docs/cli/deploying-from-cli)

## Simple pre-deployment checklist

- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] Required Supabase environment variables are set in Vercel.
- [ ] No private keys or `.env` file are uploaded.
- [ ] Authentication and the inventory-to-alert workflow work on the Vercel preview.
- [ ] Security and dependency findings have been reviewed and addressed before production.