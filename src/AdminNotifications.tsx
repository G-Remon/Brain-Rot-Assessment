import {useEffect,useRef,useState} from 'react'
import {Bell,BellOff,RefreshCcw,Send,Smartphone} from 'lucide-react'
import {adminPushRequest,loadAdminActivity,pushKeyBytes,type AdminActivity} from './admin-push'
type Config={publicKey:string;registered:boolean;devices:Array<{id:string;createdAt:string}>}
export function AdminNotifications({owner}:{owner:string}){
 const [config,setConfig]=useState<Config|null>(null),[registration,setRegistration]=useState<ServiceWorkerRegistration|null>(null),[active,setActive]=useState(false),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState(''),[events,setEvents]=useState<AdminActivity[]>([]),[attempt,setAttempt]=useState(0)
 const alive=useRef(true)
 const supported=typeof window!=='undefined'&&'Notification'in window&&'serviceWorker'in navigator&&'PushManager'in window
 useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[])
 useEffect(()=>{
  let current=true;setLoading(true);setError('')
  async function load(){
   const activity=loadAdminActivity(owner)
   const settings=(async()=>{
    let reg:ServiceWorkerRegistration|null=null,subscription:PushSubscription|null=null
    if(supported){await navigator.serviceWorker.register('/admin-sw.js',{scope:'/'});reg=await navigator.serviceWorker.ready;subscription=await reg.pushManager.getSubscription()}
    const data=await adminPushRequest<Config>(owner,'config',{endpoint:subscription?.endpoint??''})
    if(current){setRegistration(reg);setConfig(data);setActive(!!subscription&&data.registered)}
   })()
   const [items]=await Promise.all([activity,settings]);if(current)setEvents(items)
  }
  void load().catch(()=>{if(current)setError('تعذّر تحميل إعدادات الإشعارات. راجع الاتصال وحاول تاني.')}).finally(()=>{if(current)setLoading(false)})
  return()=>{current=false}
 },[owner,attempt,supported])
 async function enable(){
  if(!registration||!config||busy)return
  setBusy(true);setError('');setNotice('')
  try{
   // Permission must be requested directly from this user-initiated click.
   const permission=await Notification.requestPermission()
   if(permission!=='granted'){setError(permission==='denied'?'الإشعارات مقفولة للجهاز ده. افتح إعدادات الموقع في المتصفح واسمح بالإشعارات، وبعدها جرّب تاني.':'لسه ما سمحتش بالإشعارات. تقدر تفعّلها في أي وقت.');return}
   const subscription=await registration.pushManager.getSubscription()??await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:pushKeyBytes(config.publicKey)})
   await adminPushRequest(owner,'subscribe',{subscription:subscription.toJSON()})
   if(alive.current){setActive(true);setNotice('الجهاز اتربط بالإشعارات. اضغط «إشعار تجريبي» للتأكد من ظهوره على الموبايل.');setAttempt(n=>n+1)}
  }catch{if(alive.current)setError('ربط الجهاز ما اكتملش. اتأكد من سماح الإشعارات واتصال الإنترنت، وجرب تاني.')}finally{if(alive.current)setBusy(false)}
 }
 async function disable(){
  if(!registration||busy)return;setBusy(true);setError('');setNotice('')
  try{const subscription=await registration.pushManager.getSubscription();if(subscription){await adminPushRequest(owner,'unsubscribe',{endpoint:subscription.endpoint})}if(alive.current){setActive(false);setNotice('إشعارات الجهاز ده اتوقفت.');setAttempt(n=>n+1)}}catch{if(alive.current)setError('تعذّر إيقاف الإشعارات. حاول تاني.')}finally{if(alive.current)setBusy(false)}
 }
 async function test(){
  if(!registration||busy)return;setBusy(true);setError('');setNotice('')
  try{const subscription=await registration.pushManager.getSubscription();if(!subscription)throw Error('missing-device');await adminPushRequest(owner,'test',{endpoint:subscription.endpoint});if(alive.current)setNotice('خدمة الإشعارات قبلت الرسالة التجريبية. راقب إشعارات الموبايل، وتأكد إن وضع عدم الإزعاج مش مانعها.')}catch{if(alive.current)setError('الرسالة التجريبية ما اتقبلتش. جرّب إيقاف إشعارات الجهاز وإعادة تفعيلها.')}finally{if(alive.current)setBusy(false)}
 }
 return <section className="admin-notifications"><div className="admin-push-card"><span className="feature-icon"><Bell size={26}/></span><h2>إشعار على موبايلك وقت ما حد يسجّل أو يكمّل الاختبار</h2><p>اربط الجهاز ده مرة واحدة. الإشعارات بتوصل من نظام الموبايل حتى لو الموقع مش مفتوح، حسب سماح الجهاز وإعداداته.</p><div className="push-device-state"><Smartphone size={19}/>{active?'الجهاز ده مربوط بالإشعارات':'الجهاز ده لسه مش مربوط'}</div>{!supported&&<div className="workspace-notice">المتصفح ده مش بيدعم إشعارات الموقع حاليًا. لو iPhone: افتح الموقع في Safari، اختار مشاركة ثم «إضافة إلى الشاشة الرئيسية»، وافتحه من الأيقونة وارجع للصفحة دي. يلزم iOS 16.4 أو أحدث.</div>}<div className="pro-actions"><button className="btn btn-primary" disabled={!supported||loading||busy||!registration||!config||active} onClick={()=>void enable()}><Bell size={17}/>{busy?'لحظة...':active?'الإشعارات مفعّلة':'فعّل إشعارات الجهاز ده'}</button>{active&&<><button className="btn btn-soft" disabled={loading||busy} onClick={()=>void test()}><Send size={17}/>إشعار تجريبي</button><button className="pro-text-button" disabled={loading||busy} onClick={()=>void disable()}><BellOff size={16}/>إيقاف على الجهاز ده</button></>}<button className="btn btn-soft" disabled={loading||busy} onClick={()=>setAttempt(n=>n+1)}><RefreshCcw size={16}/>تحديث الإشعارات</button></div><p className="pro-muted">الإشعار على شاشة القفل عامّ؛ تفاصيل الحساب بتظهر داخل لوحة الإدارة فقط. تقدر تربط لحد 5 أجهزة. إيقاف جهاز مش بيوقف الأجهزة التانية.</p></div>{loading&&<div className="workspace-status" role="status">بنحمّل الإشعارات...</div>}{error&&<div className="workspace-error" role="alert">{error}</div>}{notice&&<div className="workspace-notice" role="status">{notice}</div>}<div className="section-top"><h2>آخر نشاط في الموقع</h2><p>آخر 50 تسجيلًا أو اختبارًا مكتملًا منذ تفعيل النظام. مفيش إجابات أو درجات هنا.</p></div><div className="admin-activity-list">{events.map(event=><article key={event.id}><span className="feature-icon"><Bell size={18}/></span><div><strong>{event.kind==='signup'?'تسجيل حساب جديد':'اختبار مكتمل'}</strong><p>{event.name} {event.email&&<span dir="ltr">· {event.email}</span>}</p><time dateTime={event.createdAt}>{new Intl.DateTimeFormat('ar-EG',{dateStyle:'medium',timeStyle:'short',timeZone:'Africa/Cairo'}).format(new Date(event.createdAt))}</time></div></article>)}{!loading&&!events.length&&<p className="account-empty">لسه مفيش نشاط مسجّل من وقت تفعيل الإشعارات.</p>}</div></section>
}
