import { describe, expect, it } from 'vitest'
import { normalizedEmail, validEmail, validOtp, validPassword } from '../src/auth-validation'

describe('auth input safety',()=>{
  it('normalizes email before signup/login',()=>{
    expect(normalizedEmail('  User+Test@Example.COM  ')).toBe('user+test@example.com')
  })
  it('accepts only valid-looking email addresses',()=>{
    expect(validEmail('hello@example.com')).toBe(true)
    expect(validEmail('  HELLO@example.com  ')).toBe(true)
    for (const invalid of ['', 'broken', 'hello@', '@example.com', 'two words@example.com'])
      expect(validEmail(invalid)).toBe(false)
  })
  it('enforces password length on client without storing passwords',()=>{
    expect(validPassword('short')).toBe(false)
    expect(validPassword('eight000')).toBe(true)
    expect(validPassword('a'.repeat(72))).toBe(true)
    expect(validPassword('a'.repeat(73))).toBe(false)
  })
  it('accepts exactly six numeric OTP digits',()=>{
    expect(validOtp('123456')).toBe(true)
    for(const wrong of ['1234','12345','1234567','12a456','１２３４５６','123 45'])
      expect(validOtp(wrong)).toBe(false)
  })
})
