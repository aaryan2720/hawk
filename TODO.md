# HAWK — Product To-Do List

A single place to track what is left to build. Nothing here is implemented yet unless
marked done. Edit freely — tick boxes, move items between levels, add notes.

Levels:
- **Level 1 — must have before launch** (blocks hosting / paying customers)
- **Level 2 — makes it a real product** (retention, differentiation)
- **Level 3 — growth & scale** (nice to have, later)

Priority tags: `[HIGH]` `[MED]` `[LOW]`

---

## Level 1 — Before we go live

### Security & access
- [ ] `[HIGH]` Proper roles table (`basic` / `premium` / `admin` / `architecture`) with a
      security-definer role check — stop relying on email-domain checks in the app layer.
- [ ] `[HIGH]` Review every table's row-level security; confirm one user can never read
      another user's systems, alerts, OEM sources or notifications.
- [ ] `[HIGH]` Lock the architecture console behind the real role, not the `@hawk.com` email.
- [ ] `[MED]` Rate-limit the AI and scanning edge functions (per user, per hour).
- [ ] `[MED]` Audit log: who logged in, who ran a scan, who changed settings.

### Reliability
- [ ] `[HIGH]` Friendly error states everywhere — right now failures show raw messages.
- [ ] `[HIGH]` Retry + fallback when an OEM advisory page is down or changes layout.
- [ ] `[MED]` Empty states and skeleton loaders on every dashboard panel.
- [ ] `[MED]` Global error boundary so one broken panel can't blank the whole page.

### Accounts & billing
- [ ] `[HIGH]` Paid plans (Free / Pro / Enterprise) with real checkout.
- [ ] `[HIGH]` Plan limits enforced server-side: number of machines, scans per month,
      AI solutions per month.
- [ ] `[MED]` Billing page: current plan, usage this month, upgrade/downgrade, invoices.
- [ ] `[LOW]` 14-day trial on Pro, no card required.

### Onboarding
- [ ] `[HIGH]` Guided first-run: generate script → run it → upload JSON → first scan,
      as four visible steps with progress.
- [ ] `[MED]` Sample inventory file so a visitor can see results without installing anything.
- [ ] `[MED]` Email verification + password reset flows checked end to end.

---

## Level 2 — What makes it a product people keep paying for

### Monitoring depth
- [ ] `[HIGH]` Scheduled automatic scans (daily / weekly) per machine, not just manual.
- [ ] `[HIGH]` Multiple machines per account with grouping (site, department, criticality).
- [ ] `[HIGH]` Agent or scheduled task option so inventory refreshes itself instead of
      needing a manual upload each time.
- [ ] `[MED]` Diff view: "what changed on this machine since last scan".
- [ ] `[MED]` Wider OEM coverage — add the next 20 manufacturers by request volume.
- [ ] `[MED]` Firmware/BIOS version tracking, not just installed software.
- [ ] `[LOW]` Network device support (switches, firewalls, PLCs).

### Alerting
- [ ] `[HIGH]` Alert workflow: acknowledge, assign, snooze, mark fixed, reopen.
- [ ] `[MED]` Slack and Microsoft Teams delivery alongside email/SMS.
- [ ] `[MED]` Digest mode — one summary a day instead of a flood.
- [ ] `[MED]` Per-machine severity thresholds.
- [ ] `[LOW]` Webhook out, so customers can push alerts into their own tools.

### AI
- [ ] `[HIGH]` Verify every AI fix step against the official advisory before showing it;
      never show an unverified command.
- [ ] `[MED]` "Explain this to my boss" mode — plain-language risk summary, no jargon.
- [ ] `[MED]` Ask-a-question box on each alert with the alert as context.
- [ ] `[MED]` Cache generated solutions per CVE so we don't pay twice for the same answer.
- [ ] `[LOW]` Suggested patch order across all machines (what to fix first, and why).

### Reporting
- [ ] `[HIGH]` Exportable PDF report: posture summary, open risks, what was fixed.
- [ ] `[MED]` Compliance-flavoured views (ISO 27001 / NIS2 / IEC 62443 mapping).
- [ ] `[MED]` Monthly emailed report to the account owner.
- [ ] `[LOW]` Scheduled report delivery to a list of stakeholders.

---

## Level 3 — Growth and scale

### Teams
- [ ] `[MED]` Organisations: invite colleagues, shared machines, per-seat pricing.
- [ ] `[MED]` Roles inside an org (owner, analyst, viewer).
- [ ] `[LOW]` SSO (Google / Microsoft) for business accounts.
- [ ] `[LOW]` Partner/MSP mode — one console managing many client organisations.

### Platform
- [ ] `[MED]` Public API + API keys.
- [ ] `[LOW]` Mobile-friendly alert view / push notifications.
- [ ] `[LOW]` Data retention controls and export-everything button.
- [ ] `[LOW]` Status page and uptime monitoring.

### Quality
- [ ] `[MED]` Test coverage on the inventory parser and OEM matcher — these are the
      riskiest parts and the hardest to eyeball.
- [ ] `[MED]` End-to-end test of the signup → upload → alert path.
- [ ] `[LOW]` Performance pass: split the JS bundle, lazy-load charts.

---

## Marketing & positioning (not code, but decide before launch)

- [ ] `[HIGH]` Landing page leads with the real differentiator: we see manufacturer
      advisories **before** they reach the public CVE databases.
- [ ] `[HIGH]` Free first scan of one machine, no card — the main acquisition hook.
- [ ] `[MED]` Target small manufacturing, healthcare and utility firms with no security team.
- [ ] `[MED]` Case study / before-after: "flaw found 19 days before public disclosure".
- [ ] `[MED]` Pricing page with three clear tiers and a comparison table.
- [ ] `[LOW]` Trust page: how we handle inventory data, where it is stored, who can see it.
- [ ] `[LOW]` Changelog page — shows the product is alive.

---

## Suggested order for tomorrow

1. Roles table + access review (Level 1, security).
2. Paid plans with enforced limits (Level 1, billing).
3. Guided onboarding (Level 1, onboarding).
4. Scheduled automatic scans (Level 2, the biggest retention lever).
5. Alert workflow (acknowledge / assign / fix).

Everything below that can wait.
