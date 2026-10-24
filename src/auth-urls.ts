/** Canonical origin prevents preview URLs from becoming unapproved Auth redirects. */
export const MINDRESET_URL = 'https://brain-rot-assessment.vercel.app'

export function authRedirectUrl(origin: string, action?: 'recovery' | 'google'): string {
  let target = MINDRESET_URL
  try {
    const parsed = new URL(origin)
    if (parsed.protocol === 'http:' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')) {
      target = parsed.origin
    }
  } catch {
    // Fall back to the allowlisted canonical production URL.
  }
  return action === 'recovery' ? target + '/?auth_action=recovery' : action === 'google' ? target + '/?auth_action=google' : target
}

export function isRecoveryRedirect(search: string): boolean {
  return new URLSearchParams(search).get('auth_action') === 'recovery'
}

export function clearRecoveryRedirect() {
  if (!isRecoveryRedirect(window.location.search)) return
  const url = new URL(window.location.href)
  url.searchParams.delete('auth_action')
  window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
}

/** A callback marker is UX only: access still requires a verified Supabase session. */
export function isGoogleRedirect(search: string): boolean {
  return new URLSearchParams(search).get('auth_action') === 'google'
}

export function hasGoogleAuthError(search: string): boolean {
  const params=new URLSearchParams(search)
  return isGoogleRedirect(search) && (params.has('error') || params.has('error_code'))
}

export function clearGoogleRedirect() {
  if (!isGoogleRedirect(window.location.search)) return
  const url=new URL(window.location.href)
  for(const key of ['auth_action','error','error_code','error_description'])url.searchParams.delete(key)
  window.history.replaceState(window.history.state,'',url.pathname+url.search+url.hash)
}
