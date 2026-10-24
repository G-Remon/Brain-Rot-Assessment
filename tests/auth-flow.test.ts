import { describe, expect, it } from 'vitest'
import { canResendCode, otpNotice, verifyOtpType } from '../src/auth-flow'

describe('email verification and passwordless sign-in',()=>{
  it('distinguishes signup confirmation from passwordless login OTP',()=>{
    expect(verifyOtpType('signup')).toBe('signup')
    expect(verifyOtpType('login')).toBe('email')
  })
  it('does not reveal whether the email belongs to an account',()=>{
    expect(otpNotice('login')).toContain('لو البريد مرتبط بحساب')
  })
  it('prevents repeated OTP requests within the local one-minute cooldown',()=>{
    expect(canResendCode(1000,1001)).toBe(false)
    expect(canResendCode(1000,60999)).toBe(false)
    expect(canResendCode(1000,61000)).toBe(true)
    expect(canResendCode(0,1000)).toBe(true)
  })
})
