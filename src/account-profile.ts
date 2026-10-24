import { supabase } from './supabase'

export function validDisplayName(value:string):string|null {
  const name=value.trim().replace(/\s+/g,' ')
  return name.length >= 2 && name.length <= 80 ? name : null
}

async function authorizedUser(userId:string) {
  if (!supabase) throw new Error('auth-unavailable')
  const {data,error}=await supabase.auth.getUser()
  if (error || !data.user || data.user.id !== userId) throw new Error('login-required')
}

export async function loadDisplayName(userId:string):Promise<string|null> {
  await authorizedUser(userId)
  const {data,error}=await supabase!.from('profiles').select('display_name').eq('id',userId).maybeSingle()
  if(error)throw error
  return data?.display_name ?? null
}

/** This stores an optional display name only, never a role or payment flag. */
export async function saveDisplayName(userId:string,value:string):Promise<string> {
  const displayName=validDisplayName(value)
  if(!displayName)throw new Error('invalid-display-name')
  await authorizedUser(userId)
  const {data,error}=await supabase!.from('profiles').select('id').eq('id',userId).maybeSingle()
  if(error)throw error
  if(data){
    const {error:updateError}=await supabase!.from('profiles')
      .update({display_name:displayName}).eq('id',userId)
    if(updateError)throw updateError
  }else{
    const {error:insertError}=await supabase!.from('profiles')
      .insert({id:userId,display_name:displayName})
    if(insertError)throw insertError
  }
  return displayName
}
