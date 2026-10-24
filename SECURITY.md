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

## Before enabling public Google sign-in

1. Create a **Google Cloud OAuth Web client** for the MindReset brand: use only basic identity scopes (`openid email profile`); the callback URI must be exactly `https://acofddiawbhbwhcgekrk.supabase.co/auth/v1/callback`.
2. **Enter the Google Client ID and Client Secret directly into Supabase Authentication > Providers > Google.** The secret must never be exposed to browser code or committed to GitHub.
3. Set Supabase Auth **Site URL** to `https://brain-rot-assessment.vercel.app`; allow only the canonical `https://brain-rot-assessment.vercel.app/?auth_action=google` callback (and strictly required same-origin routes). No open wildcards or arbitrary preview URLs.
4. Keep OAuth nonce checks enabled and PKCE flow active. Google OAuth provider configuration and live real-account sign-in are **not verified yet**.
5. Google OAuth replaces MindReset email/password/OTP interface. No SMTP is needed for this login method; enable other Auth providers only with a clear reason and a security review.
6. Use **External** audience in Google Cloud for regular Gmail users; when in Testing mode, only authorized test users should sign in. Publish only after a real-device/login/logout/security test.
7. Turn on MFA for project owners at Google, GitHub, Supabase and Vercel. Review third-party app access and team permissions.
8. Publish a clear privacy policy at `https://brain-rot-assessment.vercel.app/privacy.html`, including contact and deletion process. Review the text for legal suitability before public launch.
9. Test saved-assessment row isolation with at least two real user accounts: user A cannot read, edit or delete user B's rows. PostgreSQL synthetic RLS tests aren't a substitute for live OAuth.
10. Back up schema and data and document recovery. Before adding payment, enforce all paid features on trusted backend functions, never just client-side Google login.

Read `docs/GOOGLE_SIGN_IN_SETUP.md` for the exact setup steps.

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
