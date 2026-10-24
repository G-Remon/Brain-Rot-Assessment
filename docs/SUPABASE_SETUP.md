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
