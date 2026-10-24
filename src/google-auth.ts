import { authRedirectUrl } from './auth-urls'
import { supabase } from './supabase'

/** Google is the sole interactive account provider; never request Gmail or Drive scopes. */
export function googleOAuthRequest(origin: string) {
  return {
    provider: 'google' as const,
    options: {
      redirectTo: authRedirectUrl(origin, 'google'),
      scopes: 'openid email profile',
      queryParams: { prompt: 'select_account' },
    },
  }
}

/** Supabase manages the PKCE verifier, state, and token exchange automatically. */
export async function beginGoogleSignIn(origin: string): Promise<void> {
  if (!supabase) throw new Error('supabase-not-configured')
  const { error } = await supabase.auth.signInWithOAuth(googleOAuthRequest(origin))
  if (error) throw error
}
