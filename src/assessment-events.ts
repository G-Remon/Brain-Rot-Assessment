import {useEffect} from 'react'
import {supabase} from './supabase'
const queues=new Map<string,string[]>(),busy=new Set<string>()
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const key=(owner:string)=>'mindreset-completion-queue-v1:'+owner
function read(owner:string){
 try{const value:unknown=JSON.parse(localStorage.getItem(key(owner))??'[]');if(Array.isArray(value))return [...new Set([...value.filter((id):id is string=>typeof id==='string'&&uuid.test(id)),...(queues.get(owner)??[])])].slice(-50)}catch{/* Memory fallback keeps the current session usable. */}
 return queues.get(owner)??[]
}
function write(owner:string,ids:string[]){queues.set(owner,ids);try{localStorage.setItem(key(owner),JSON.stringify(ids))}catch{/* Retry from memory while this page stays open. */}}
export async function flushAssessmentEvents(owner:string){
 if(!supabase||busy.has(owner)||!read(owner).length)return
 busy.add(owner)
 try{
  const {data,error}=await supabase.auth.getUser();if(error||data.user?.id!==owner)return
  for(const id of read(owner)){
   const {error}=await supabase.rpc('record_assessment_completed',{completion_id:id})
   if(error)return
   write(owner,read(owner).filter(value=>value!==id))
  }
 }catch{/* Keep the same event ID for an idempotent retry. */}finally{busy.delete(owner)}
}
export function enqueueAssessmentEvent(owner:string,id=crypto.randomUUID()){
 if(!uuid.test(id))return
 write(owner,[...new Set([...read(owner),id])].slice(-50));void flushAssessmentEvents(owner)
}
export function useAssessmentEvents(owner:string|undefined){
 useEffect(()=>{if(!owner)return;const retry=()=>void flushAssessmentEvents(owner);retry();window.addEventListener('online',retry);const timer=window.setInterval(retry,30000);return()=>{window.removeEventListener('online',retry);window.clearInterval(timer)}},[owner])
}
