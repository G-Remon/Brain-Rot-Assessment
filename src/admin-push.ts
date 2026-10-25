import {supabase} from './supabase'
export async function adminPushRequest<T>(owner:string,action:string,payload:Record<string,unknown>={}):Promise<T>{
 if(!supabase)throw Error('login-required')
 const {data:{session}}=await supabase.auth.getSession()
 if(!session||session.user?.id!==owner)throw Error('login-required')
 const {data,error}=await supabase.functions.invoke('admin-notifications',{body:{...payload,action},headers:{Authorization:'Bearer '+session.access_token}})
 if(error)throw error
 return data as T
}
export function pushKeyBytes(base64:string){const normalized=base64.replace(/-/g,'+').replace(/_/g,'/');const raw=atob(normalized+'='.repeat((4-normalized.length%4)%4));return Uint8Array.from(raw,c=>c.charCodeAt(0))}
export type AdminActivity={id:string;kind:'signup'|'assessment_completed';name:string;email:string|null;createdAt:string}
export async function loadAdminActivity(owner:string):Promise<AdminActivity[]>{
 if(!supabase)throw Error('login-required')
 const {data,error}=await supabase.auth.getUser();if(error||data.user?.id!==owner)throw Error('login-required')
 const result=await supabase.rpc('get_admin_activity');if(result.error)throw result.error
 if(!Array.isArray(result.data))throw Error('invalid-activity')
 return result.data as AdminActivity[]
}
