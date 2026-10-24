import { supabase } from './supabase'
import { validatePlan, type PlanRecord } from './journey'

const GUEST_KEY='mindreset-journey-v1:guest'
async function verifyOwner(owner:string) {
  if(!supabase)throw new Error('auth-unavailable')
  const {data,error}=await supabase.auth.getUser()
  if(error||data.user?.id!==owner)throw new Error('login-required')
}
export async function loadPlan(owner:string):Promise<PlanRecord|null> {
  if(owner==='guest') {
    const raw=localStorage.getItem(GUEST_KEY)
    if(!raw)return null
    const plan=validatePlan(JSON.parse(raw))
    if(!plan)throw new Error('invalid-plan')
    return plan
  }
  await verifyOwner(owner)
  const {data,error}=await supabase!.from('user_plans').select('state').eq('user_id',owner).maybeSingle()
  if(error)throw error
  if(!data)return null
  const plan=validatePlan(data.state)
  if(!plan)throw new Error('invalid-plan')
  return plan
}
export async function persistPlan(owner:string,value:PlanRecord):Promise<PlanRecord> {
  const plan=validatePlan(value)
  if(!plan)throw new Error('invalid-plan')
  if(owner==='guest'){localStorage.setItem(GUEST_KEY,JSON.stringify(plan));return plan}
  await verifyOwner(owner)
  const {data,error}=await supabase!.from('user_plans').upsert({user_id:owner,state:plan},{onConflict:'user_id'}).select('state').single()
  if(error)throw error
  const saved=validatePlan(data.state)
  if(!saved)throw new Error('invalid-plan')
  return saved
}

export async function removePlan(owner:string):Promise<void> {
  if(owner==='guest'){localStorage.removeItem(GUEST_KEY);return}
  await verifyOwner(owner)
  const {error}=await supabase!.from('user_plans').delete().eq('user_id',owner)
  if(error)throw error
}
