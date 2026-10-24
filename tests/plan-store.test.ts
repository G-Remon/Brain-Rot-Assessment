import { beforeEach, describe, expect, it, vi } from 'vitest'
import { questions } from '../src/data'
import { defaultConfig, type PlanRecord } from '../src/journey'
const mock=vi.hoisted(()=>({getUser:vi.fn(),from:vi.fn()}))
vi.mock('../src/supabase',()=>({supabase:{auth:{getUser:mock.getUser},from:mock.from}}))
import { loadPlan, persistPlan, removePlan } from '../src/plan-store'
const plan:PlanRecord={version:1,answers:Object.fromEntries(questions.map(q=>[q.id,0])),assessment_key:'0'.repeat(30),config:defaultConfig,started_on:'2026-10-24',completed_days:[],notes:{}}
beforeEach(()=>{vi.clearAllMocks();mock.getUser.mockResolvedValue({data:{user:{id:'owner'}},error:null})})
describe('plan account boundaries and save failures',()=>{
  it.each([loadPlan,removePlan])('rejects a different session before any query',async action=>{await expect(action('other-user')).rejects.toThrow('login-required');expect(mock.from).not.toHaveBeenCalled()})
  it('rejects writing for a different user before any query',async()=>{await expect(persistPlan('other-user',plan)).rejects.toThrow('login-required');expect(mock.from).not.toHaveBeenCalled()})
  it('does not report a failed cloud save as successful',async()=>{
    mock.from.mockReturnValue({upsert:()=>({select:()=>({single:async()=>({data:null,error:new Error('network')})})})})
    await expect(persistPlan('owner',plan)).rejects.toThrow('network')
  })
  it('validates server data before showing an active plan',async()=>{
    mock.from.mockReturnValue({select:()=>({eq:()=>({maybeSingle:async()=>({data:{state:{...plan,completed_days:[99]}},error:null})})})})
    await expect(loadPlan('owner')).rejects.toThrow('invalid-plan')
  })
  it('validates malformed state before any cloud operation',async()=>{await expect(persistPlan('owner',{...plan,assessment_key:'bad'})).rejects.toThrow('invalid-plan');expect(mock.from).not.toHaveBeenCalled()})
})
