import { supabase } from './supabase'
import { emptyProState, validProState, type ProState } from './pro-model'
async function verify(owner:string){if(!supabase)throw new Error('login-required');const {data,error}=await supabase.auth.getUser();if(error||data.user?.id!==owner)throw new Error('login-required')}
export async function readProState(owner:string){await verify(owner);const {data,error}=await supabase!.from('pro_workspace').select('state,updated_at').eq('user_id',owner).maybeSingle();if(error)throw error;if(!data)return {state:emptyProState(),updatedAt:null};const state=validProState(data.state);if(!state)throw new Error('invalid-state');return {state,updatedAt:data.updated_at as string}}
export async function writeProState(owner:string,state:ProState,updatedAt:string|null){
 if(!validProState(state))throw new Error('invalid-state');await verify(owner)
 const query=updatedAt===null?supabase!.from('pro_workspace').insert({user_id:owner,state}):supabase!.from('pro_workspace').update({state}).eq('user_id',owner).eq('updated_at',updatedAt)
 const {data,error}=await query.select('state,updated_at').maybeSingle()
 if(error){if(error.code==='23505')throw new Error('conflict');throw error}
 if(!data)throw new Error('conflict')
 const saved=validProState(data.state);if(!saved)throw new Error('invalid-state')
 return {state:saved,updatedAt:data.updated_at as string}
}
