# MindReset — Supabase database & authentication status

Project: `acofddiawbhbwhcgekrk` only (unrelated STC/iChem projects must not be touched).
Site: https://brain-rot-assessment.vercel.app

## Current active login: Google OAuth ONLY

- **User interface**: one Google login button for both signup and signin. No email password entry, OTP verification, resend flow or SMTP is needed by the current client app.
- Supabase client uses PKCE, automatic session refresh and a **publishable** API key only.
- Google OAuth callback marker: `/?auth_action=google`. Login is accepted **only with a verified Supabase session**; a URL parameter alone provides no authorization.
- Google Cloud OAuth client and Supabase hosted provider settings have **not been set through these connectors**. Do not call this "end-to-end working" before Google Cloud and Supabase settings are configured and real Google login tested.
- See **`docs/GOOGLE_SIGN_IN_SETUP.md`** for exactly which one-time external configuration is required. Do **not** copy Client Secret into the repo or client-exposed Vercel variables.
- The old `src/auth-flow.ts`, corresponding unit tests and `supabase/email-templates/*` files remain as historical/deprecated source reference, but their flows are **not exposed in the current website UI**.

## Implemented database safety

- Live migrations: `mindreset_phase1_hardened_accounts_and_entitlements` and `limit_and_verify_user_assessment_uploads`.
- Tables `public.profiles`, `public.assessments` and `public.entitlements` use own-row RLS.
- Visitors without accounts cannot read profile/results/entitlements. Browser clients cannot create or change subscription rights.
- A private invoker-rights database trigger validates exactly thirty known answer keys, whole-number values 0–4, recalculates the display-only score and caps saves at twenty per account per rolling 24 hours.
- `public.rls_auto_enable()` cannot be called by `anon` or `authenticated` roles.
- User profile display name is editable with ownership enforcement, but is never used for subscription or admin privileges.
- Frontend saves a completed assessment only when the authenticated user explicitly clicks **Save**. History and single/bulk delete operate within user ownership. Anonymous local answers are not uploaded automatically.
- Anonymous and account-specific quiz progress are stored under separate localStorage keys; localStorage is **not encrypted**.
- Synthetic RLS testing with two temporary identities in a transaction verified row isolation and database-side score recalculation. These accounts and data were rolled back. **Real Google OAuth account tests are still pending.**

## Operations and deployment

- Vercel has frontend-safe `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, and protects deployment previews.
- GitHub CI runs lockfile-pinned install, TypeScript checks, unit tests, dependency audit and CodeQL scanning.
- Branch protection still requires repository administrator approval/setup if not already configured.
- Review `SECURITY.md` for incident response and future payment constraints.
- Privacy page is deployed at `/privacy.html`. Its text must be reviewed before broad public release.
