import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { Crown, LockKeyhole, RefreshCcw } from 'lucide-react'
import { supabase } from './supabase'
export type ProStatus={active:boolean;validUntil:string|null;priceEgp:number;months:number;paymentReady:boolean}
const empty:ProStatus={active:false,validUntil:null,priceEgp:50,months:3,paymentReady:false}
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
    void proRequest<ProStatus>('status').then(value=>{if(alive)setStatus(value)}).catch(()=>{if(alive)setError(true)}).finally(()=>{if(alive)setLoading(false)})
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
export function ProLock({title='افتح كل مميزات MindReset Pro',description='التحليل التفصيلي والخطط والمتابعة والأهداف في مكان واحد.'}:{title?:string;description?:string}){
  const {onUpgrade}=usePro()
  return <div className="pro-lock"><span className="pro-mark"><LockKeyhole size={19}/> PRO</span><h3>{title}</h3><p>{description}</p><button className="btn btn-primary" onClick={onUpgrade}><Crown size={17}/> اعرف مميزات Pro</button></div>
}
export function ProBoundary({children,title}:{children:ReactNode;title?:string}){
  const {status,loading,error,refresh}=usePro()
  if(loading)return <div className="workspace-status" role="status">بنتأكد من صلاحيات حسابك...</div>
  if(error)return <div className="workspace-error" role="alert">تعذّر التحقق من الاشتراك. <button onClick={refresh}><RefreshCcw size={16}/>جرّب تاني</button></div>
  return status.active?<>{children}</>:<ProLock title={title}/>
}
