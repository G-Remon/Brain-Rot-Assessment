import { describe, it, expect } from 'vitest'
import { questions, domains, totalScore, type AnswerMap, type DomainId } from '../src/data'
import { snapshotKey } from '../src/assessment-history'
import { buildJourney, defaultConfig, exercises, localDate, nextPlanDay, planDayDate, recommendTrack, tracks, validatePlan, type PlanRecord } from '../src/journey'
const answer=(values:Partial<Record<DomainId,number>>={}):AnswerMap=>Object.fromEntries(questions.map(q=>[q.id,values[q.domain]??0]))
const record=():PlanRecord=>({version:1,answers:answer(),assessment_key:snapshotKey(answer())!,config:defaultConfig,started_on:'2026-10-24',completed_days:[],notes:{}})
describe('journey matching',()=>{
  it('keeps low-signal people on optional maintenance',()=>{expect(recommendTrack(answer())).toBe('maintain');expect(recommendTrack(answer({focus:1,scroll:1,patience:1,memory:1,sleep:1,impact:1}))).toBe('maintain')})
  it.each(domains.map(d=>[d.id,d.id==='memory'?'learning':d.id]))('matches a dominant %s domain',(id,track)=>expect(recommendTrack(answer({[id]:3}))).toBe(track))
  it('uses different paths for equal totals',()=>{
    const sleep=answer({sleep:3,focus:3}),study=answer({memory:3,focus:3})
    expect(totalScore(sleep)).toBe(totalScore(study));expect(recommendTrack(sleep)).toBe('sleep-focus');expect(recommendTrack(study)).toBe('study')
  })
  it('uses a gentle start for widespread difficulties even with a large time budget',()=>{
    const p=buildJourney(answer({focus:4,sleep:4,memory:4,impact:4}),{...defaultConfig,minutes:30})
    expect(p.track).toBe('gentle');expect(p.days.slice(0,6).every(d=>d.minutes<=10)).toBe(true)
  })
  it('does not hide a single frequent response behind low domain totals',()=>{
    const a=answer();a.i5=3;expect(recommendTrack(a)).toBe('impact')
  })
  it('ranks exercises by relevant repeated answers',()=>{
    const a=answer();a.f1=4;a.f3=4;a.f5=4
    expect(buildJourney(a,defaultConfig).days[1].exerciseId).toBe('focus-space')
  })
  it('supports manual paths and study/work contexts',()=>{
    const a=answer({sleep:4});const p=buildJourney(a,{track:'learning',minutes:20,context:'work'})
    expect(p.track).toBe('learning');expect(p.days[1].steps.join(' ')).toContain('شغلك');expect(p.days.every(d=>d.minutes<=20)).toBe(true)
  })
  it('has four distinct practical exercises per domain with source and measurements',()=>{
    expect(new Set(exercises.map(e=>e.id)).size).toBe(24)
    domains.forEach(d=>expect(exercises.filter(e=>e.domain===d.id)).toHaveLength(4))
    exercises.forEach(e=>{expect(e.steps).toHaveLength(3);expect(e.measure).toBeTruthy();expect(e.tiny).toBeTruthy()})
  })
  it('handles 1000 diverse complete answer profiles consistently',()=>{
    let seed=401;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed%5}
    for(let i=0;i<1000;i++){
      const a=Object.fromEntries(questions.map(q=>[q.id,random()]))
      const p=buildJourney(a,{...defaultConfig,minutes:([10,20,30] as const)[i%3]})
      expect(p.days).toHaveLength(14);expect(new Set(p.days.map(d=>d.day)).size).toBe(14)
      expect(p.days[6].phase).toBe('نراجع');expect(p.days[13].phase).toBe('نقارن')
      expect(p).toEqual(buildJourney(a,{...defaultConfig,minutes:([10,20,30] as const)[i%3]}))
      expect(p.days.filter(d=>d.exerciseId).every(d=>exercises.some(e=>e.id===d.exerciseId))).toBe(true)
    }
  })
  it('has valid days for all manual paths, budgets and contexts',()=>{
    for(const track of tracks)for(const minutes of [10,20,30] as const)for(const context of ['study','work','general'] as const){
      const p=buildJourney(answer({focus:3,impact:2}),{track:track.id,minutes,context})
      expect(p.days).toHaveLength(14);expect(p.days.every(d=>d.minutes<=minutes&&d.steps.length>=3)).toBe(true)
    }
  })
  it('rejects partial assessment input',()=>expect(()=>buildJourney({},defaultConfig)).toThrow())
})
describe('private plan data validation',()=>{
  it('accepts a complete frozen snapshot and optional notes',()=>{
    const p=record();p.completed_days=[1,7];p.notes={'1':'خلصت خطوة'};expect(validatePlan(p)).toEqual(p)
  })
  it.each([
    {assessment_key:'4'.repeat(30)}, {answers:{}}, {version:2}, {completed_days:[1,1]}, {completed_days:[0]}, {completed_days:[15]},
    {notes:{'15':'x'}}, {notes:{'1':'x'.repeat(501)}}, {notes:[]}, {started_on:'2026-02-30'}, {started_on:'invalid'},
    {config:{...defaultConfig,minutes:500}}, {config:{...defaultConfig,track:'unknown'}}, {config:{...defaultConfig,context:'unknown'}}
  ])('rejects malformed persisted state %j',patch=>expect(validatePlan({...record(),...patch})).toBeNull())
  it('keeps dates stable across month/year boundaries',()=>{
    expect(planDayDate('2026-12-31',2)).toBe('2027-01-01');expect(planDayDate('2028-02-28',3)).toBe('2028-03-01');expect(localDate(new Date(2026,9,24))).toBe('2026-10-24')
  })
  it('resumes the first unfinished day instead of using calendar guilt',()=>{
    const p=record();p.completed_days=[1,2,4];expect(nextPlanDay(p)).toBe(3)
  })
})
