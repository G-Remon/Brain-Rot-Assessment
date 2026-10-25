import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, ShieldQuestion, X } from 'lucide-react'
type Request={message:string;resolve:(value:boolean)=>void}
let dispatch:((request:Request)=>void)|null=null
// Fail closed before the host mounts; never fall back to a browser dialog.
export function confirmAction(message:string):Promise<boolean>{return new Promise(resolve=>{if(dispatch)dispatch({message,resolve});else resolve(false)})}
export function AppMessages(){
 const [request,setRequest]=useState<Request|null>(null)
 const current=useRef<Request|null>(null),dialog=useRef<HTMLDialogElement>(null),cancel=useRef<HTMLButtonElement>(null),restore=useRef<HTMLElement|null>(null)
 useEffect(()=>{
  const listener=(next:Request)=>{if(current.current){next.resolve(false);return}restore.current=document.activeElement as HTMLElement;current.current=next;setRequest(next)}
  dispatch=listener
  return()=>{if(dispatch===listener)dispatch=null;current.current?.resolve(false);current.current=null}
 },[])
 useEffect(()=>{if(request&&dialog.current){dialog.current.showModal();cancel.current?.focus()}},[request])
 function finish(accepted:boolean){const active=current.current;if(!active)return;current.current=null;dialog.current?.close();setRequest(null);active.resolve(accepted);restore.current?.focus()}
 return <dialog ref={dialog} className="app-dialog" aria-labelledby="app-dialog-title" aria-describedby="app-dialog-description" onCancel={event=>{event.preventDefault();finish(false)}} onClick={event=>{if(event.target===event.currentTarget)finish(false)}}><div className="app-dialog-content"><button className="app-dialog-close" aria-label="إغلاق" onClick={()=>finish(false)}><X size={20}/></button><span className="app-dialog-icon"><ShieldQuestion size={29}/></span><span className="section-kicker">خلّينا نتأكد الأول</span><h2 id="app-dialog-title">تأكيد الخطوة</h2><p id="app-dialog-description">{request?.message}</p><div className="app-dialog-actions"><button ref={cancel} className="btn btn-soft" onClick={()=>finish(false)}>إلغاء والرجوع</button><button className="btn btn-primary" onClick={()=>finish(true)}><CheckCircle2 size={18}/>تأكيد ومتابعة</button></div><small>مفيش تغيير هيحصل إلا بعد تأكيدك.</small></div></dialog>
}
