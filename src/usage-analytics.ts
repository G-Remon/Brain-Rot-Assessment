import {useEffect} from 'react'
import {supabase} from './supabase'
type UsageKind='page_view'|'test_started'|'test_completed'|'notification_open'
const visits=new Map<string,{id:string;at:number}>()
export async function trackUsage(owner:string|undefined,kind:UsageKind,route:string){
 if(!supabase||!owner||!['home','guide','articles','practice','quiz','results','account','library','journey','tools','science','admin'].includes(route))return
 try{
  const {data:{session}}=await supabase.auth.getSession();if(session?.user.id!==owner)return
  const key='mindreset-visit:'+owner;let visit=visits.get(owner)
  try{const parsed=JSON.parse(sessionStorage.getItem(key)||'null');if(parsed&&typeof parsed.id==='string'&&typeof parsed.at==='number')visit=parsed}catch{}
  if(!visit||Date.now()-visit.at>30*60000)visit={id:crypto.randomUUID(),at:Date.now()};else visit={...visit,at:Date.now()}
  visits.set(owner,visit);try{sessionStorage.setItem(key,JSON.stringify(visit))}catch{}
  await supabase.rpc('track_usage',{event_id:crypto.randomUUID(),visit_id:visit.id,event_kind:kind,page:route})
 }catch{/* Analytics must never interrupt the user's task. */}
}
export function useUsageAnalytics(owner:string|undefined,route:string){useEffect(()=>{void trackUsage(owner,'page_view',route);if(!owner)return;let last=Date.now();const active=()=>{if(Date.now()-last<60000)return;last=Date.now();if(document.visibilityState==='visible')void trackUsage(owner,'page_view',route)};window.addEventListener('focus',active);return()=>window.removeEventListener('focus',active)},[owner,route])}
