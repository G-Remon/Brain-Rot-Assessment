import { describe, expect, it } from 'vitest'
import { buildPersonalReport, arabicVideos, questionGuides } from '../src/personalization'
import { domains, domainScore, options, questions, totalScore, type AnswerMap } from '../src/data'

const filled=(score:number):AnswerMap=>Object.fromEntries(questions.map(question=>[question.id,score]))
const mixed=():AnswerMap=>Object.fromEntries(questions.map((question,i)=>[question.id,i%5]))

describe('personalization for all 30 questions',()=>{
  it('provides exactly one guide for every question ID',()=>{
    expect(questions).toHaveLength(30)
    expect(Object.keys(questionGuides).sort()).toEqual(questions.map(q=>q.id).sort())
    expect(new Set(questions.map(q=>q.id)).size).toBe(30)
    for (const question of questions){
      const guide=questionGuides[question.id]
      expect(guide.title.length).toBeGreaterThan(4)
      expect(guide.signal.length).toBeGreaterThan(10)
      expect(guide.nextStep.length).toBeGreaterThan(10)
      expect(guide.strength.length).toBeGreaterThan(10)
    }
  })
  it('analyzes each possible answer 0–4 for each individual question',()=>{
    for(const question of questions){
      for(const value of options.map(option=>option.value)){
        const answers=filled(0)
        answers[question.id]=value
        const report=buildPersonalReport(answers)
        const reading=report.questionReadings.find(item=>item.id===question.id)
        expect(reading?.answer).toBe(value)
        expect(reading?.answerLabel).toBe(options[value].label)
        expect(reading?.observation.length).toBeGreaterThan(10)
        expect(reading?.action.length).toBeGreaterThan(10)
        if(value===0) expect(reading?.level).toBe('strength')
        else if(value===1) expect(reading?.level).toBe('light')
        else if(value===2) expect(reading?.level).toBe('noticeable')
        else expect(reading?.level).toBe('frequent')
        expect(report.plan).toHaveLength(14)
        expect(report.questionReadings).toHaveLength(30)
      }
    }
  })
  it('gives distinct frequency-sensitive explanations to all five choices',()=>{
    const outputs=[0,1,2,3,4].map(value=>{
      const answers=filled(0);answers.f1=value
      return buildPersonalReport(answers).questionReadings.find(x=>x.id==='f1')
    })
    expect(new Set(outputs.map(item=>item?.observation)).size).toBe(5)
    expect(new Set(outputs.map(item=>item?.action)).size).toBe(5)
  })
  it('stays well-formed for diverse mixed response combinations',()=>{
    let seed=7919
    for(let run=0;run<100;run++){
      const answers:Object=Object.fromEntries(questions.map(question=>{
        seed=(seed*1664525+1013904223)>>>0
        return [question.id,seed%5]
      }))
      const report=buildPersonalReport(answers as AnswerMap)
      expect(report.questionReadings).toHaveLength(30)
      expect(report.domainReadings).toHaveLength(6)
      expect(report.actions.length).toBeGreaterThan(0)
      expect(report.actions.length).toBeLessThanOrEqual(6)
      expect(report.plan).toHaveLength(14)
      for(const insight of report.questionReadings){
        expect(insight.action.trim().length).toBeGreaterThan(12)
        expect(insight.observation.trim().length).toBeGreaterThan(15)
      }
    }
  })
  it('handles zero, maximum and mixed scores without confusing domains',()=>{
    for(const score of [0,1,2,3,4]){
      const answers=filled(score)
      const report=buildPersonalReport(answers)
      expect(totalScore(answers)).toBe(score*30)
      expect(report.domainReadings).toHaveLength(6)
      expect(report.domainReadings.every(d=>d.score===score*5)).toBe(true)
      expect(report.actions.length).toBeGreaterThan(0)
      expect(report.actions.length).toBeLessThanOrEqual(6)
      expect(report.videos).toHaveLength(arabicVideos.length)
      expect(report.plan.map(d=>d.day)).toEqual(Array.from({length:14},(_,i)=>i+1))
    }
    const answers=mixed()
    const report=buildPersonalReport(answers)
    for(const domain of domains){
      expect(report.domainReadings.find(d=>d.id===domain.id)?.score).toBe(domainScore(answers,domain.id))
    }
  })
  it('recognizes linked patterns only when both specific triggers are met',()=>{
    const answers=filled(0)
    answers.s2=3;answers.s5=2
    expect(buildPersonalReport(answers).patterns.some(p=>p.id==='autopilot')).toBe(true)
    answers.s5=1
    expect(buildPersonalReport(answers).patterns.some(p=>p.id==='autopilot')).toBe(false)
  })
  it('does not invent a problem when all answers are zero',()=>{
    const report=buildPersonalReport(filled(0))
    expect(report.priorities).toHaveLength(0)
    expect(report.patterns).toHaveLength(0)
    expect(report.strengths).toHaveLength(3)
    expect(report.actions.some(action=>action.id==='maintain')).toBe(true)
  })
  it('gives different advice and plans to people with different underlying responses',()=>{
    const focus=filled(0);focus.f1=4;focus.f3=4
    const sleep=filled(0);sleep.n1=4;sleep.n2=4
    const first=buildPersonalReport(focus)
    const second=buildPersonalReport(sleep)
    expect(first.priorities[0].domain).toBe('focus')
    expect(second.priorities[0].domain).toBe('sleep')
    expect(first.actions.map(a=>a.title)).not.toEqual(second.actions.map(a=>a.title))
    expect(first.plan[1].task).not.toEqual(second.plan[1].task)
    expect(first.videos[0].id).not.toEqual(second.videos[0].id)
  })
  it('uses grounded, unique video IDs and context-specific references',()=>{
    expect(new Set(arabicVideos.map(v=>v.id)).size).toBe(arabicVideos.length)
    for(const video of arabicVideos){
      expect(video.url).toBe('https://www.youtube.com/watch?v='+video.id)
      expect(video.domains.length).toBeGreaterThan(0)
      expect(video.title.length).toBeGreaterThan(5)
    }
    for(const action of buildPersonalReport(filled(4)).actions){
      expect(['apa','who','cdc','dunlosky']).toContain(action.sourceId)
    }
  })
})
