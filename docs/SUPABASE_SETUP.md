# MindReset • live Supabase project setup

Project: `acofddiawbhbwhcgekrk` (separate from STC/iChem).

## Implemented and verified
- Connected the Gerges Supabase account to this project.
- Applied `supabase/schema.sql` through Supabase migration `mindreset_phase1_hardened_accounts_and_entitlements`.
- Created `public.profiles`, `public.assessments`, and `public.entitlements`.
- All 3 tables use RLS; anonymous users cannot select them. Rows belong to `auth.uid()`.
- `entitlements` is read-only for browsers. PRO must require nonexpired, server-trusted entitlements.
- Removed `anon`/`authenticated` EXECUTE grants from elevated function `public.rls_auto_enable()`. Security advisors show zero findings.
- Set Vercel public env settings `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. No server keys in frontend.
- Vercel previews/deployment URLs require Vercel login. Canonical production website remains public.
- React UI includes signup/login/email confirmation/forgot password and logout.

## Email templates and recovery (code deployed; hosted Auth templates NOT yet applied)

- Production redirect target in frontend is strictly `https://brain-rot-assessment.vercel.app`; recovery links use `/?auth_action=recovery`.
- Email subject suggestion: `MindReset | كود تأكيد حسابك`.
- Signup confirmation HTML: `supabase/email-templates/confirm-signup.html` (requires `{{ .Token }}` in hosted Supabase's `Confirm signup` email template).
- Password reset HTML: `supabase/email-templates/reset-password.html` (uses `{{ .ConfirmationURL }}`).
- Signup OTP verifier uses `type: 'signup'`, not Magic Link's `type: 'email'`.
- Resend button throttles additional frontend requests for 60 seconds, **in addition** to Supabase's server-side rate limits.
- React recovery flow detects `PASSWORD_RECOVERY` and the allowlisted callback marker. Users must open PKCE recovery links in the same browser that requested them.
- GitHub files and Vercel variables alone **cannot configure Supabase hosted Email Templates, Site URL, provider settings, CAPTCHA, rate limits or SMTP**. The current Supabase connector exposes database/migration functions but not hosted Auth Management API mutations.
- As long as Supabase's restricted built-in SMTP remains active, emails to ordinary outside users may be rejected. Do not launch a public signup campaign before provider configuration and inbox tests.
- Never configure CAPTCHA in Supabase until frontend sends `captchaToken`; otherwise login/signup may fail.
- Never put management access tokens, SMTP API passwords or service role keys into GitHub code, `VITE_*` variables, conversation messages or user-editable tables.

## Manual account/email configuration not yet confirmed

1. Dashboard > Authentication > URL Configuration:
   - Site URL: `https://brain-rot-assessment.vercel.app`
   - Additional Redirect URLs: `https://brain-rot-assessment.vercel.app/**`
2. Dashboard > Authentication > Providers > Email: enable password sign-up and **Confirm email**.
3. Authentication > Email Templates > Confirm signup: include `{{ .Token }}` to deliver six-digit signup OTP; keep the verification link if desired.
4. Authentication > Email Templates > Reset Password: ensure recovery links redirect to the allowed website URL.
5. Enable verified SMTP, abuse protection/CAPTCHA and configured rate limits before public onboarding.
6. Confirm sign-up -> OTP -> sign-in -> recovery and logout with real test email inbox. Automated build tests alone do not prove delivered emails.
7. Run browser test with two distinct accounts for access isolation and account deletion.

## Next safe product task

Implement an explicit **Save my results to my account** action, with user's permission, and show history via authenticated RLS queries. Do not silently upload anonymous local answers. Assessments from the frontend are subjective self-reports, not trusted payment claims.

See `SECURITY.md` for mandatory GitHub branch protection and future payment requirements.

## Account dashboard & saved results (phase 1.2)

- Results are NOT automatically uploaded. A user must explicitly choose **Save result** inside their account. A pre-sign-in guest test must be explicitly imported by the user.
- `src/assessment-history.ts` checks all 30 answer keys and each response (0 to 4) before saving, rechecks identity, retrieves the user's most recent 40 saved results, and supports opening/deleting results.
- The cloud history uses `public.assessments` with RLS on `user_id = auth.uid()`. A private PostgreSQL trigger validates server-side: 30 known answers, 0–4 whole number responses, recomputes the score, and limits an account to 20 new saves per rolling 24-hour period.
- `src/account-profile.ts` supports editing the user's display name only. It cannot update a PRO flag or modify another user's profile.
- Users can delete one cloud assessment or all of them. They can review saved score history without overwriting their local quiz; opening a historical score asks before replacing unfinished work.
- App data remains in browser local storage until the user consents to the save action; local storage is not encrypted. Avoid claiming that deleting cloud history deletes local data.
- Test with two distinct **real authenticated** test users before public release. No user accounts currently exist in the dedicated project, so real end-to-end email/OTP/RLS isolation flows remain unverified.
- OTP signup templates and custom SMTP are still configured only as source files. Supabase Hosted Auth requires management-level controls absent from the available connector. Do not tell users live email OTP works before a test inbox receives and confirms the code.

## Passwordless login via email OTP — code complete, provider activation pending

- `AuthPage` now offers **Email code instead of password** to existing accounts.
- It calls `supabase.auth.signInWithOtp({email, options:{shouldCreateUser:false}})`. It does not allow account creation through the sign-in-only flow.
- Login OTP confirmation uses `supabase.auth.verifyOtp({email,token,type:'email'})`; signup confirmation uses `type:'signup'`. Unit tests cover this separation and the resend cooldown.
- The **Magic Link** hosted email template must contain `{{ .Token }}` for a 6-digit code. Source-ready template is `supabase/email-templates/magic-link-otp.html`. Using the default `{{ .ConfirmationURL }}` template instead sends a clickable login link, not a code.
- Signup confirmation template uses `supabase/email-templates/confirm-signup.html`.
- Reset password template uses `supabase/email-templates/reset-password.html`.
- When updating the hosted Auth templates, do **not** paste passwords, service keys or management API credentials into this repository or chat.
- The connected Supabase plugin only supports project SQL/schema/Edge Functions, NOT hosted Auth configuration mutations. As a result, hosted Site URL, email template changes, Confirm Email, rate limits and SMTP have **not** been verified or changed.
- Public email registration is NOT end-to-end verified. The built-in email sender may reject addresses outside the Supabase project's authorized team; use an SMTP provider with a verified sender domain before public launch.
- A successful CodeQL/TypeScript/CI check means the code builds and unit tests pass; it does **not** prove OTP mail arrived.

### RLS integration test evidence

The system was tested with two temporary Postgres identities inside a single rolled-back transaction: user A could only select their own profile, could not update user B's profile, could update their own, and a submitted score of 0 was recomputed to 60 based on 30 answers set to 2. No test users or results remained in `auth.users`/`profiles`/`assessments` after rollback. This is a database authorization integration test, not a real Auth email-inbox acceptance test.
