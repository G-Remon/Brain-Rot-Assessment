/** Canonical origin prevents preview URLs from becoming unapproved Auth redirects. */
export const MINDRESET_URL = 'https://brain-rot-assessment.vercel.app'

export function authRedirectUrl(origin: string, action?: 'recovery'): string {
  let target = MINDRESET_URL
  try {
    const parsed = new URL(origin)
    if (parsed.protocol === 'http:' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')) {
      target = parsed.origin
    }
  } catch {
    // Fall back to the allowlisted canonical production URL.
  }
  return action === 'recovery' ? target + '/?auth_action=recovery' : target
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
