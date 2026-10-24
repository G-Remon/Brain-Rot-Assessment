# MindReset — enable Google sign-in (one-time platform setup)

**Client implementation:** deployed. **Google OAuth provider:** needs an admin to create a Google Cloud OAuth client and enter its credentials **directly in the hosted Supabase Auth dashboard**. The GitHub/Supabase connectors used by ChatGPT do not expose Google Cloud client creation or Supabase Auth settings mutation. Never represent this document as proof that Google sign-in is live.

## Why this replaces email OTP

The site now uses one **Continue with Google** button for both new and returning accounts. No MindReset password, email OTP, SMTP service, or owned custom domain is required for Google OAuth. The public quiz still works without an account. User results upload to Supabase only when the user explicitly clicks Save from their account.

## 1. Create a Google Cloud OAuth client

Open https://console.cloud.google.com/auth/overview and create/select a Google Cloud project.

1. Set up **Branding** with app name **MindReset**, support email, and developer contact email, as required by Google.
2. **Audience**: choose **External** to support regular Gmail accounts. When in Testing mode, only explicitly added test users can sign in. Start with your own test Google account.
3. **Data Access**: choose only the normal login identity scopes: `openid`, `userinfo.email`, and `userinfo.profile`. Never request Gmail, Drive, contacts or other user data scopes.
4. Go to https://console.cloud.google.com/auth/clients. Create OAuth Client ID of type **Web application**.
5. Under **Authorized JavaScript origins**, add **exactly**:
   `https://brain-rot-assessment.vercel.app`
6. Under **Authorized redirect URIs**, add **exactly**:
   `https://acofddiawbhbwhcgekrk.supabase.co/auth/v1/callback`
7. Save the **Client ID** and **Client Secret** privately. **Do not put the Client Secret in GitHub, Vercel `VITE_*` variables or chat.**

Reference: https://supabase.com/docs/guides/auth/social-sign-in/auth-google

## 2. Enable Google in the correct Supabase project

Open https://supabase.com/dashboard/project/acofddiawbhbwhcgekrk/auth/providers

- Find **Google** and enable it.
- Paste the OAuth Client ID and Client Secret from Google Cloud directly into Supabase.
- Leave **Skip nonce checks** OFF / false if it appears.
- Save. Do not change the existing RLS policies or database for OAuth.

## 3. Verify Supabase redirect configuration

Open https://supabase.com/dashboard/project/acofddiawbhbwhcgekrk/auth/url-configuration

- **Site URL:** `https://brain-rot-assessment.vercel.app`
- **Redirect URLs:** add `https://brain-rot-assessment.vercel.app/?auth_action=google` exactly. Keep the base `https://brain-rot-assessment.vercel.app` in the allowlist if required.
- A wildcard `https://brain-rot-assessment.vercel.app/**` is supported for this same host; do not use an open redirect `https://**`.
- Only authorize `http://localhost:5173/?auth_action=google` if actively testing locally. Never authorize arbitrary unrelated domains or Vercel preview hosts.

## 4. Test with two genuine Google users

Visit https://brain-rot-assessment.vercel.app and click **دخول بـ Google** → **المتابعة باستخدام Google**.

For each genuine test account:
- Ensure it sees the Google account chooser and appropriate consent screen.
- Ensure the browser returns to the website signed in and shows the right name and email.
- Confirm logout and a fresh login work on desktop/mobile.
- Confirm account A can save a complete test result, that account B cannot read or edit A's saved results, and that deletion from A works.
- Confirm the anonymous 30-question quiz still works.
- If Google Cloud OAuth app remains in Testing, register these emails as **Test users** on the Google Audience screen. Publish to production only after security/privacy review.

### Security requirements

- Google OAuth only verifies identity. **Premium/payment entitlements must still be checked server-side against `public.entitlements`**.
- **Never use `user_metadata` as role, payment or subscription authority.**
- Do not read Google provider access tokens or request extra scopes.
- Protect Google Cloud, Supabase, Vercel, GitHub accounts using MFA and least-privilege team membership.
- Once Google login is working, disable obsolete email/password sign-up in Supabase if Google's the sole sign-in method.
- Google Cloud OAuth client configuration and hosted Supabase Auth provider setting changes **have not yet been performed** by the available integration.
