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
