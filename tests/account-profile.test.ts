import { describe, expect, it } from 'vitest'
import { validDisplayName } from '../src/account-profile'

describe('profile name validation',()=>{
  it('accepts a reasonable name without HTML processing or script execution',()=>{
    expect(validDisplayName('  Gerges   Remon  ')).toBe('Gerges Remon')
    expect(validDisplayName('جرجس ريمون')).toBe('جرجس ريمون')
  })
  it('rejects short or excessive profile text',()=>{
    expect(validDisplayName(' ')).toBeNull()
    expect(validDisplayName('a')).toBeNull()
    expect(validDisplayName('a'.repeat(81))).toBeNull()
  })
})
