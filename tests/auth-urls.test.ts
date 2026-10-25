import { describe, expect, it } from 'vitest'
import { authRedirectUrl, isRecoveryRedirect, isGoogleRedirect, hasGoogleAuthError, MINDRESET_URL } from '../src/auth-urls'

describe('allowlisted authentication redirects', () => {
  it('recognizes provider failures in either query or fragment without trusting a login marker',()=>{expect(hasGoogleAuthError('?auth_action=google','#error=access_denied')).toBe(true);expect(hasGoogleAuthError('?auth_action=google&error_code=bad_code')).toBe(true);expect(hasGoogleAuthError('?auth_action=google','#/home')).toBe(false)})
  it('uses production origin for preview or unexpected origins', () => {
    expect(authRedirectUrl('https://fake-login.example')).toBe(MINDRESET_URL)
    expect(authRedirectUrl('https://some-branch.vercel.app')).toBe(MINDRESET_URL)
    expect(authRedirectUrl('oops')).toBe(MINDRESET_URL)
  })
  it('supports safe local testing', () => {
    expect(authRedirectUrl('http://localhost:5173')).toBe('http://localhost:5173')
    expect(authRedirectUrl('http://127.0.0.1:5173','recovery')).toBe('http://127.0.0.1:5173/?auth_action=recovery')
  })
  it('generates a Google callback on the exact allowed origin', () => {
    expect(authRedirectUrl('https://unsafe-preview.vercel.app','google')).toBe(MINDRESET_URL+'/?auth_action=google')
    expect(isGoogleRedirect('?auth_action=google')).toBe(true)
    expect(isGoogleRedirect('?auth_action=login')).toBe(false)
  })
  it('routes recovery explicitly without passing email/password in the URL', () => {
    expect(authRedirectUrl('https://fake-login.example','recovery'))
      .toBe(MINDRESET_URL+'/?auth_action=recovery')
    expect(isRecoveryRedirect('?auth_action=recovery')).toBe(true)
    expect(isRecoveryRedirect('?auth_action=login')).toBe(false)
    expect(isRecoveryRedirect('')).toBe(false)
  })
})
