import { describe, expect, it } from 'vitest'
import { googleOAuthRequest } from '../src/google-auth'
import { hasGoogleAuthError, isGoogleRedirect } from '../src/auth-urls'

describe('Google OAuth configuration', () => {
  it('uses Google with allowlisted return URL and only basic identity scopes', () => {
    const request=googleOAuthRequest('https://random-preview.vercel.app')
    expect(request.provider).toBe('google')
    expect(request.options.redirectTo).toBe('https://brain-rot-assessment.vercel.app/?auth_action=google')
    expect(request.options.scopes).toBe('openid email profile')
    expect(request.options.queryParams).toEqual({prompt:'select_account'})
  })
  it('allows local development while avoiding attacker-controlled redirect hosts', () => {
    const request=googleOAuthRequest('http://localhost:5173')
    expect(request.options.redirectTo).toBe('http://localhost:5173/?auth_action=google')
    expect(googleOAuthRequest('https://evil.example').options.redirectTo)
      .toBe('https://brain-rot-assessment.vercel.app/?auth_action=google')
  })
  it('recognizes OAuth callbacks but never treats an URL marker as authentication proof',()=>{
    expect(isGoogleRedirect('?auth_action=google')).toBe(true)
    expect(isGoogleRedirect('?auth_action=login')).toBe(false)
    expect(hasGoogleAuthError('?auth_action=google&error=access_denied')).toBe(true)
    expect(hasGoogleAuthError('?auth_action=google&error_code=unexpected_failure')).toBe(true)
    expect(hasGoogleAuthError('?auth_action=google&code=auth-code')).toBe(false)
  })
})
