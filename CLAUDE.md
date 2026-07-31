# TEC Estate — Claude Code Instructions

> ⚡ **SESSION START:** اقرأ `knowledge-base/C-02___CURRENT_STATE_.md` + **app charter
> `knowledge-base/C-114___ESTATE_INSTITUTIONAL_CHARTER.md`** من `yasira82/tec-knowledge-base` (branch: `main`).

## What This App Is

**The Real Estate Operating System of TEC** (C-114, extended). Estate is NOT just a
property marketplace ("what do I want to buy?"). It answers a bigger question:

```
"Where do I live, and what do I own or manage in real estate?"
```

Estate manages the **complete lifecycle** of a property:
**ownership · leasing · investment · maintenance · verification · financing · protection.**

It is the coordination layer that integrates with the rest of TEC:
- **Life** (C-106) → housing goals / needs
- **Connection** (C-107) → trusted agents, owners, tenants
- **Zone** (C-120) → verification of the property, owner, and agent
- **Analytics** (C-105) → area prices, expected yield, market trends
- **FundX** (C-113) → property financing + collective investment pools
- **Insure** → property protection

Built from `tec-template-base` (Next.js 15 frontend).

**Current Phase: Estate V0 — App Scaffold & Portal Readiness.** Identity / domain /
slug / legal + Real-Estate-OS themed home + **Estate Pro payment surface** (the Pi
Portal "Process a Transaction" gate) + a **read-only sample Portfolio** (lifecycle
demo). Real transactions are NOT built (see boundary). Deployed (Mainnet) · Pi App ID registered · env set · payment live · referral growth loop wired (C-133).

---

## Pi App Identity

| Field | Value |
|-------|-------|
| **App** | TEC Estate |
| **Domain** | `https://estate.tecosystem.app` |
| **Pi App ID** | ✅ Registered (Mainnet) · Vercel `NEXT_PUBLIC_PI_APP_ID` |
| **APP_SOURCE slug** | `estate` (payment-service resolves `PI_API_KEY_ESTATE`) |
| **PI_SANDBOX** | `false` (Mainnet) |

---

## Estate-Specific Rules (C-114)

### The boundary — Estate coordinates the lifecycle; it does NOT own the money or the title
Estate **OWNS**: the property portfolio view, lifecycle management UI (leasing,
maintenance, documents), listing/discovery UI, inquiry flow, and Pi **service**
payment coordination. Estate does **NOT OWN**:
- **Full property purchase in Pi** — legal liability too high. Estate processes Pi
  **services** only (listing fees, consultation, viewing, refundable reservation
  deposits) — **never the full property value** (C-114 §4 Key Distinction, §6).
- **Legal title transfer** → external legal process.
- **Capital / payment** → tec-payment-service; **financing** → FundX (C-113).
- **Valuation truth** → external market data (present via Analytics, never assert).
- **Agent identity** → tec-kyc-service (KYC required for listing agents, not browsers).

### What Estate DOES process in Pi (services only)
```
Listing fees · Premium visibility · Consultation fees · Viewing fees ·
Refundable reservation deposits   — all Pi-denominated SERVICES, not property value.
```

### Trust + verification
Property, owner, and agent verification come from **Zone** (C-120) — Estate presents
"Zone Verified" status, it does not mint it. Agent reputation comes from **Connection**
(C-107). Prices/yield shown are **indicative** (Analytics) — never presented as truth.

### Isolation (P6)
Agent/owner identity is derived from the `tec_user` session cookie server-side —
**never from a listing/request body**. No session → fail closed.

**Reference of record:** `yasira82/tec-knowledge-base` —
`C-114___ESTATE_INSTITUTIONAL_CHARTER.md` (charter) + `C-12_Dual_Mode_Payment.md`
(payment anti-regression) + `C-123` (session/cookies).

---

## Stack

- Next.js 15 App Router + TypeScript strict · React 18
- `@yasser172/tec-ui` (design system) · `@yasser172/tec-auth` · `@yasser172/tec-sdk`
- Vitest (unit) + Playwright (e2e) · Deployment: Vercel

---

## Architecture Rules (non-negotiable)

### CSRF — middleware ONLY (P2 single source of truth)
CSRF is enforced in **`middleware.ts`** and **nowhere else**: a request is trusted
if the double-submit token matches **OR** it is first-party (Origin host === Host /
`*.tecosystem.app`).
- ❌ **NEVER** add a CSRF check inside a route handler (`csrfCookie !== csrfHeader`
  → 403). It 403's legit Mode-2 payments in Pi Browser (drops `sameSite=None`
  cookies). The CI `payment-policy` job fails the build if you do. (KB C-12 §11)
- ✅ A route may *forward* `x-csrf-token` to a downstream call; it must never *validate* it.

### ADR-007 — Dual-mode payment (Pi foreign session)
Every buy handler MUST guard before touching `window.Pi`:
```typescript
const isHubNavigation = () =>
  document.referrer.toLowerCase().includes('hub.tecosystem.app');
if (isHubNavigation() || !(window as any).Pi || !piReady) {
  redirectToHubPayment(...);   // Mode 1: Hub modal → /hub?pay=1&...
  return;
}
// Mode 2: standalone — createPaymentRecord() then createU2APayment() (src/lib/pi-payment.ts)
```
> The hub-entry signal is `__tec_hub_entry` (sessionStorage) **OR** referrer — the
> landing page (C-123 LAW 2) made referrer-alone unreliable (C-12 §3). Do not remove it.

### ADR-009 — Unified payment contract
`amount` is a **number**; gateway path is **`/api/payment/*`** (singular); the only
inter-service header is **`x-internal-key`** + `INTERNAL_SECRET`. Don't re-declare
payment Zod locally — shapes live in `@yasser172/tec-sdk`. Approve under
`PI_API_KEY_ESTATE` (never the default Hub key — the Analytics approve→502 lesson, C-12 §11).

### Two-SDK boundary
```
Client components → src/lib-client/*  (browser state, Pi hooks)
API routes (BFF)  → @yasser172/tec-sdk via /api/bff/*  (server-only)
```

### Auth / cookies (LOCKED)
SSO via Hub cookies `tec_access_token`, `tec_csrf`, `tec_user`. Never localStorage.
Identity is derived from the `tec_user` cookie server-side — **never from the request body**.

---

## Setup status + Roadmap (C-114 §10)

```
Estate V0 — App Scaffold & Portal Readiness (customized from template):
  ✅ package.json name = tec-estate · APP_SOURCE = 'estate'
  ✅ sso-callback ALLOWED_AUDIENCES → estate.tecosystem.app + tec-estate.vercel.app
  ✅ privacy + terms → TEC Estate / estate.tecosystem.app
  ✅ NEW-A: no NEXT_PUBLIC_API_GATEWAY_URL / Railway host in the client bundle
  ✅ layout Pi init is hub-entry-aware (C-12 §3 / ADR-007 foreign-session skip)
  ✅ /app themed as the Real Estate OS home + Estate Pro (real Pi U2A payment)
  ✅ read-only sample Portfolio (lifecycle demo — NO purchase, NO title transfer)

Next (before live):
  □ Register Pi App ID (Pi Developer Portal) → set Vercel NEXT_PUBLIC_PI_APP_ID +
    API_GATEWAY_URL · INTERNAL_SECRET · SSO_SECRET · PI_SANDBOX=false.
  □ payment-service: set PI_API_KEY_ESTATE on Railway (approve→502 otherwise, C-12 §11).
  □ Hub SSO: add estate.tecosystem.app + tec-estate.vercel.app to Hub /api/auth/sso
    ALLOWED_TARGETS + Hub domain registry (both in this change).
  □ Deploy (Vercel) + runtime-verify login (C-123) + a real Estate Pro payment
    Mode 1 (Hub) AND Mode 2 (standalone). Ensure Portal Linked App = MAINNET (a
    Testnet linked app on a Mainnet listing = SDK_MISSING at payment — FundX lesson).

Estate V1+ (post-Portal — C-114 §10): property listing directory (search + gallery,
  images via tec-storage-service) → Pi listing fees + inquiry → portfolio lifecycle
  (leases, maintenance, documents) → FundX financing + Insure protection + Zone
  verification integration. Real capital/title stays OUT of Estate (§6).
```

> Estate monetization (C-114 §7) is service fees (listing, premium, consultation).
> The payment scaffold + `isHubNavigation()` guard are kept for the Portal gate; any
> direct buy MUST keep the ADR-007 guard and needs `PI_API_KEY_ESTATE`.

---

## What NOT To Do

- Do NOT process a full property purchase in Pi — services only (C-114 §4/§6)
- Do NOT transfer legal title — that is an external legal process
- Do NOT hold capital or compute financing in Estate — payment-service + FundX own that
- Do NOT assert valuation/price as truth — it is indicative (Analytics)
- Do NOT mint verification — present Zone's "Verified" status, never create it
- Do NOT validate CSRF in a route handler — middleware only (CI blocks it)
- Do NOT send `amount` as a string, or use `/payments` / `x-service-secret`
- Do NOT skip the ADR-007 `isHubNavigation()` guard before `window.Pi`
- Do NOT store tokens in localStorage; do NOT derive identity from the body
- Do NOT add `NEXT_PUBLIC_*` for internal service URLs or `INTERNAL_SECRET`

---

## Commit Convention

```
feat(estate):  new lifecycle feature   fix(payment): payment flow fix (test carefully)
fix(estate):   bug fix                  chore(scope):  build/config
```

---

## Skills

Available via plugin — invoke automatically when the situation matches:

| Situation | Skill |
|-----------|-------|
| Writing new feature or fixing a bug → use TDD | `/tdd` |
| Bug, regression, or unexpected behavior | `/diagnose` |
| Writing or modifying tests | `/test-guard` |
| Writing or modifying BFF routes, payment handlers, or API contracts | `/clean-code-guard` |
| Updating docs, CLAUDE.md, or knowledge-base entries | `/docs-guard` |
| Planning a new feature or architectural decision | `/grill-with-docs` |
| Breaking down a roadmap item into GitHub Issues | `/to-issues` |
| Session is getting long or context is filling up | `/handoff` |
| Adding pre-commit hooks to this repo | `/setup-pre-commit` |
