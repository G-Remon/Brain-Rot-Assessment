import { describe, expect, it } from 'vitest'
import { questions, totalScore } from '../src/data'
import { snapshotKey, validatedAssessment } from '../src/assessment-history'

const full = Object.fromEntries(questions.map((q,i)=>[q.id,i%5]))

describe('saving only complete assessments',()=>{
  it('accepts the 30 exact known answers and calculates a valid score',()=>{
    const clean=validatedAssessment(full)
    expect(clean).not.toBeNull()
    expect(Object.keys(clean!).length).toBe(30)
    expect(totalScore(clean!)).toBe(60)
  })
  it('rejects incomplete input',()=>{
    const partial={...full}
    delete partial.f1
    expect(validatedAssessment(partial)).toBeNull()
    expect(snapshotKey(partial)).toBeNull()
  })
  it('rejects unknown keys and prototype-based objects',()=>{
    expect(validatedAssessment({...full,secret:3})).toBeNull()
    expect(validatedAssessment(Object.assign(Object.create(null),full,{invalid:1}))).toBeNull()
    expect(validatedAssessment([])).toBeNull()
    expect(validatedAssessment(null)).toBeNull()
  })
  it('rejects tampered answer types and out-of-range values',()=>{
    for(const broken of [true,NaN,Infinity,1.3,-1,5,'3']){
      expect(validatedAssessment({...full,f1:broken})).toBeNull()
    }
  })
  it('produces stable snapshot fingerprints independent of object key order',()=>{
    const reordered=Object.fromEntries(Object.entries(full).reverse())
    expect(snapshotKey(full)).toBe(snapshotKey(reordered))
    expect(snapshotKey({...full,f1:4})).not.toBe(snapshotKey(full))
  })
})
