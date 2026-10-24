# MindReset • Phase 1 Supabase setup

This is a project-specific checklist for `https://acofddiawbhbwhcgekrk.supabase.co`.
Do not reuse the company's existing Supabase project.

## Implemented in React
- Email/password sign-up.
- Email/password sign-in and sign-out.
- Email confirmation with a six-digit OTP (when the Supabase confirmation email template uses `{{ .Token }}`), or its standard confirmation link.
- Resend confirmation email.
- Forgot password using Supabase recovery email; set new password.
- User account summary. Anonymous quiz remains available.
- Public Vercel env vars use `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- No secret or service-role API keys in browser or GitHub.

## Required Supabase configuration before public release
1. Connect the **Supabase account/organization that owns the MindReset project** to ChatGPT (or invite the connected Supabase account with project-level edit access). Until then, database changes cannot be applied or validated from the connector.
2. Supabase Dashboard > Authentication > URL Configuration:
   - Site URL: `https://brain-rot-assessment.vercel.app`
   - Allowed Redirect URLs: `https://brain-rot-assessment.vercel.app/**`
   - Optional local dev: `http://localhost:5173/**`
3. Authentication > Providers > Email: enable email/password sign-up and require email confirmation.
4. For 6-digit signup OTP, Authentication > Email Templates > Confirm signup should contain the `{{ .Token }}` variable (and a clear explanation). If left unchanged, the app also supports Supabase's standard confirmation link. Never disable confirmation just to bypass OTP testing.
5. Authentication > Email Templates > Reset Password should redirect to the configured Site URL. The React app handles the Supabase `PASSWORD_RECOVERY` event.
6. For real traffic, configure verified SMTP, correct sending domain, abuse protection/CAPTCHA and appropriate email rate limits. Supabase's default mail sender may be unsuitable for production volume.
7. Run `supabase/schema.sql` **only after inspecting the new project's tables**, in the MindReset project. Enable RLS and grants exactly as provided. The frontend currently does not claim that cloud sync is active.
8. Verify RLS with two separate test users: User A cannot read or modify user B's profile, assessments, or entitlements. Authenticated clients cannot write entitlements.
9. Test sign-up, confirmation email and OTP, sign-in, sign-out, forgotten password and direct visits to recovery links, both on desktop and phone.

## Later phase
Implement explicit opt-in to upload the current browser-local assessment to the user's own cloud account. Never silently attach anonymous browsing data to a different user account. Add profile/deletion UI, subscription policy, and goal tracking in separate reviewed stages.
