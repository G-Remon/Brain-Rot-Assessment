import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from './supabase'
export type ProStatus={active:boolean;isAdmin:boolean;validUntil:string|null}
const empty:ProStatus={active:true,isAdmin:false,validUntil:null}
export async function proRequest<T>(action:string,payload:Record<string,unknown>={}):Promise<T> {
  if(!supabase)throw new Error('login-required')
  const {data:{session}}=await supabase.auth.getSession()
  if(!session)throw new Error('login-required')
  const {data,error}=await supabase.functions.invoke('mindreset-pro',{body:{...payload,action},headers:{Authorization:`Bearer ${session.access_token}`}})
  if(error)throw error
  return data as T
}
type Access={status:ProStatus;loading:boolean;error:boolean;refresh:()=>void;onUpgrade:()=>void}
const Context=createContext<Access>({status:empty,loading:true,error:false,refresh:()=>{},onUpgrade:()=>{}})
export function ProProvider({owner,onUpgrade,children}:{owner:string|undefined;onUpgrade:()=>void;children:ReactNode}) {
  const [status,setStatus]=useState<ProStatus>(empty),[loading,setLoading]=useState(true),[error,setError]=useState(false),[attempt,setAttempt]=useState(0)
  const refresh=useCallback(()=>setAttempt(n=>n+1),[])
  useEffect(()=>{
    let alive=true;setLoading(true);setError(false);setStatus(empty)
    if(!owner){setLoading(false);return}
    void proRequest<ProStatus>('status').then(value=>{if(alive)setStatus({...value,active:true,validUntil:null})}).catch(()=>{if(alive)setError(true)}).finally(()=>{if(alive)setLoading(false)})
    return()=>{alive=false}
  },[owner,attempt])

  useEffect(()=>{
    if(!status.active||!status.validUntil)return
    const remaining=Date.parse(status.validUntil)-Date.now()
    const timeout=window.setTimeout(()=>refresh(),Math.min(Math.max(remaining,0)+250,2147483647))
    return()=>window.clearTimeout(timeout)
  },[status.active,status.validUntil,refresh])
  return <Context.Provider value={{status,loading,error,refresh,onUpgrade}}>{children}</Context.Provider>
}
export const usePro=()=>useContext(Context)
export function AdminNavButton({onClick,active}:{onClick:()=>void;active:boolean}){
  const {status,loading}=usePro()
  return !loading&&status.isAdmin?<button className={active?'active admin-nav':'admin-nav'} aria-current={active?'page':undefined} onClick={onClick}>لوحة الإدارة</button>:null
}
export function AccessBadge(){const {status}=usePro();return status.isAdmin?<span className="access-badge admin">أدمن</span>:null}
export function ProLock(_props:{title?:string;description?:string}){return null}
export function ProBoundary({children}:{children:ReactNode;title?:string;fallback?:ReactNode}){return <>{children}</>}
