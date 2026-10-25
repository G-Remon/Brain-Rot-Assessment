import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Crown, Goal, Moon, Timer, BookOpen, ChartNoAxesCombined, RefreshCcw } from 'lucide-react'
import { localDate } from './journey'
import { emptyProState, type ProState } from './pro-model'
import { readProState, writeProState } from './pro-store'
import { usePro } from './pro-access'
import { Goals } from './pro/Goals'
import { Focus } from './pro/Focus'
import { Habits } from './pro/Habits'
import { Learning } from './pro/Learning'
import { Review } from './pro/Review'
import { Program } from './pro/Program'
const tabs=[{id:'goals',title:'هدفي',icon:Goal},{id:'focus',title:'تركيز',icon:Timer},{id:'program',title:'برنامجي',icon:CalendarDays},{id:'habits',title:'عاداتي',icon:Moon},{id:'learning',title:'تعلّم',icon:BookOpen},{id:'review',title:'أسبوعي',icon:ChartNoAxesCombined}] as const
export function ProDashboard({owner}:{owner:string}){
 const [state,setState]=useState<ProState>(emptyProState),[loading,setLoading]=useState(true),[loadFailed,setLoadFailed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[tab,setTab]=useState<typeof tabs[number]['id']>('goals'),[retry,setRetry]=useState(0)
 const [liteRequest,setLiteRequest]=useState(0)
 const lastSession=state.sessions.map(s=>s.date).filter(d=>d<=localDate()).sort().at(-1)
 const returnGap=lastSession?Math.floor((Date.parse(localDate())-Date.parse(lastSession))/86400000):null
 const revision=useRef<string|null>(null)
 const mounted=useRef(true),inFlight=useRef(false);const {refresh}=usePro()
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false}},[])
 useEffect(()=>{let alive=true;setLoading(true);setError('');setLoadFailed(false);void readProState(owner).then(data=>{if(alive){setState(data.state);revision.current=data.updatedAt}}).catch(()=>{if(alive){setLoadFailed(true);setError('تعذّر تحميل بياناتك. جرّب التحديث قبل أي تعديل.')}}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[owner,retry])
 async function save(next:ProState,message='التغيير اتحفظ.'){
  if(inFlight.current||loading||loadFailed)return false
  inFlight.current=true;setBusy(true);setError('');setNotice('')
  try{const saved=await writeProState(owner,next,revision.current);if(mounted.current){setState(saved.state);revision.current=saved.updatedAt;setNotice(message)}return true}catch(error){if(mounted.current)setError(error instanceof Error&&error.message==='conflict'?'بياناتك اتعدلت من جهاز أو تبويب تاني. حدّث المساحة قبل ما تحفظ عشان منستبدلش التغيير.':'التغيير ما اتحفظش. راجع الاتصال وتسجيل الدخول وجرب تاني.');return false}finally{inFlight.current=false;if(mounted.current)setBusy(false)}
 }
 const props={state,busy,save}
 return <div className="container pro-dashboard"><header className="pro-hero"><span className="pro-mark"><Crown size={19}/> مساحتك اليومية</span><h1>هدف واضح.<br/><span>وخطوة تقدر تكملها.</span></h1><p>كل أدواتك في مساحة واحدة؛ اختار أداة تخدم يومك، مش لازم تستخدمهم كلهم.</p><small>كل الأدوات مجانية · تقدمك محفوظ في حسابك</small></header>{!loading&&(returnGap===null||returnGap>=3)&&<div className="pro-return-banner"><div><strong>{returnGap===null?'ابدأ بداية خفيفة':`آخر جلسة محفوظة من ${returnGap} أيام`}</strong><p>مش محتاج تعوّض كل اللي فات. اختار خطوة واحدة و5 دقايق كبداية.</p></div><button className="btn btn-soft" disabled={busy} onClick={()=>{setLiteRequest(n=>n+1);setTab('focus')}}>جلسة رجوع خفيفة</button></div>}<div className="quick-start"><div><h2>ابدأ دلوقتي في 5 دقايق</h2><p>اختار مهمة واحدة. مفيش داعي تجهّز هدف أو برنامج الأول.</p></div><button className="btn btn-primary" disabled={loading||loadFailed||busy} onClick={()=>{setLiteRequest(n=>n+1);setTab('focus')}}>ابدأ جلسة بسيطة</button></div><nav className="pro-tabs" aria-label="أدواتك">{tabs.map(t=><button key={t.id} aria-pressed={tab===t.id} disabled={busy} onClick={()=>{setTab(t.id);setNotice('')}}><t.icon size={18}/>{t.title}</button>)}</nav>{loading&&<div role="status" className="workspace-status">بنحمّل مساحتك...</div>}{error&&<div role="alert" className="workspace-error">{error}<button onClick={()=>{setRetry(n=>n+1);refresh()}}><RefreshCcw size={16}/>تحديث</button></div>}{notice&&<div role="status" className="workspace-notice">{notice}</div>}{!loading&&!loadFailed&&<div className="pro-panels"><section className="pro-panel" hidden={tab!=='goals'}><Goals {...props}/></section><section className="pro-panel" hidden={tab!=='focus'}><Focus {...props} liteRequest={liteRequest}/></section><section className="pro-panel" hidden={tab!=='program'}><Program {...props}/></section><section className="pro-panel" hidden={tab!=='habits'}><Habits {...props}/></section><section className="pro-panel" hidden={tab!=='learning'}><Learning {...props}/></section><section className="pro-panel" hidden={tab!=='review'}><Review {...props}/></section></div>}<p className="pro-muted">ملاحظاتك خاصة بحسابك. متكتبش بيانات حساسة. الأدوات للتنظيم والمتابعة، مش تقييمًا طبيًا. بنحتفظ بآخر 200 جلسة و200 موقف تشتت و120 ملاحظة نوم.</p></div>
}
