# MindReset security policy

MindReset is a self-assessment and habit-improvement website. Its results are not diagnoses. Submitted answers and identity data deserve strong privacy protections.

## Current security model (October 2026)

- Hosting: Vercel. Public canonical production domain, Vercel Authentication **Standard Protection** on previews and generated deployment URLs.
- Browser: restrictive Content Security Policy and other response headers in `vercel.json`.
- Auth: Supabase Auth using a **publishable** key in the browser. No service-role or secret API key is used in the frontend.
- Data: separate Supabase MindReset project `acofddiawbhbwhcgekrk`. Tables `profiles`, `assessments`, `entitlements` have own-row RLS. `anon` cannot read any of these tables.
- Privileged access: browser clients cannot insert/update/delete `entitlements` or invoke the preinstalled elevated RLS event-trigger function through RPC.
- Progress on shared browsers: anonymous quiz state and per-account local quiz state use separate storage keys. This **does not encrypt device storage**; visitors should use private devices for sensitive answers.
- CI: test suite, typecheck, build, production dependency audit, separate CodeQL scan. Dependabot PRs track updates.
- Current `pro` entitlement is server-owned and **no payment provider is integrated**.

## Before enabling public signups

1. Supabase Auth > URL Configuration: Site URL `https://brain-rot-assessment.vercel.app`, allowed Redirect URL `https://brain-rot-assessment.vercel.app/**`. Do not allow `*` across unrelated domains.
2. Auth > Email: keep **Confirm email** enabled. Setup a dedicated signup template using `{{ .Token }}` for 6-digit OTP; standard confirmation links still work. Configure recovery template and redirect.
3. Configure a verified SMTP sender for real traffic, email rate limits, CAPTCHA, and abuse protection. Supabase's default email sender is unsuitable for scale.
4. Test signup, confirmed/unconfirmed login, wrong/expired OTP, throttling, recovery URL, password update, logout and session refresh on desktop and phone.
5. Activate account multi-factor authentication for **project owners/admins** at GitHub, Supabase and Vercel. Review connected apps and team access.
6. Publish a plain-language privacy policy, data retention and account-deletion path before onboarding real users.
7. Test DB using **two different real test accounts**: user A must never fetch, change or delete user B's rows. Use `supabase/schema.sql` as the reviewed baseline.
8. Back up schema and data before future migrations, and test recovery steps.

## GitHub administrator actions required

The GitHub integration used for this repository cannot read or change repository branch-protection settings (403). The owner must:

- Go to `https://github.com/G-Remon/Brain-Rot-Assessment/settings/rules` and create a ruleset for `main`.
- Require PRs and passing checks (CI + CodeQL), block force pushes and deletions.
- If working alone, avoid requiring someone else's PR approval without an available reviewer. Enable reviews when adding collaborators.
- Enable secret scanning and push protection wherever offered, Dependabot alerts/security updates, and review all access tokens and installed GitHub apps.
- Keep `GITHUB_TOKEN` permissions at the minimum required; no long-lived deploy token in the repo. Don't put credentials into GitHub Issues, Actions logs or source code.

## Payment safety design (future, NOT enabled yet)

- PRO currently means no browser-side `insert`, `update` or `delete` access to `entitlements`.
- Paid content **must not be bundled as unrestricted static browser JS**; future premium endpoints must enforce access server-side with user session validation and database entitlement checks.
- A payment provider webhook must verify its signature and event authenticity, be idempotent, and update an entitlement only through a restricted backend service.
- Never trust client-submitted prices, order totals, `payment_success` flags, quiz scores, tier names or callback URLs as proof of payment.
- Store gateway API secrets and signing secrets only in Vercel server environment or Supabase Edge Function secrets. Never in `VITE_*`, frontend bundles or committed files.
- Use a private billing ledger, deduplicate webhook event IDs, handle refunds/reversals/chargebacks, subscription expiry and renewal, and log administrative changes without storing card numbers/CVV.
- Test failed/late/duplicate/out-of-order webhooks, expired plans and replay attacks before collecting money.
- Keep the 50 EGP pricing in **server-controlled configuration**, not as the sole client-side authority.

## Reporting a vulnerability

Please contact the repository owner privately. Do not open a public issue that contains credentials or personal assessment data.
