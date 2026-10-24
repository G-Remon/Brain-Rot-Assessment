import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, BookOpen, CalendarDays, Check, CheckCircle2, ChevronLeft, Cloud, RefreshCcw, Target } from 'lucide-react'
import { validatedAssessment, snapshotKey } from './assessment-history'
import { type AnswerMap } from './data'
import { buildJourney, contextLabels, defaultConfig, journeySources, localDate, nextPlanDay, planDayDate, recommendTrack, tracks, type PlanConfig, type PlanRecord } from './journey'
import { loadPlan, persistPlan, removePlan } from './plan-store'

export function JourneyWorkspace({owner,answers,onStartQuiz,onLogin}:{owner:string;answers:AnswerMap|null;onStartQuiz:()=>void;onLogin:()=>void}) {
  const [plan,setPlan]=useState<PlanRecord|null>(null)
  const [draft,setDraft]=useState<PlanConfig>(defaultConfig)
  const [loading,setLoading]=useState(true)
  const [pending,setPending]=useState(false)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const [selectedDay,setSelectedDay]=useState(1)
  const [note,setNote]=useState('')
  const [week,setWeek]=useState(1)
  const [reload,setReload]=useState(0)
  const [loadFailed,setLoadFailed]=useState(false)
  const requestBusy=useRef(false)
  const alive=useRef(true)
  useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[])
  useEffect(()=>{
    let current=true
    setLoading(true);setError('');setLoadFailed(false)
    void loadPlan(owner).then(saved=>{
      if(!current)return
      setPlan(saved)
      if(saved){const next=nextPlanDay(saved);setDraft(saved.config);setSelectedDay(next);setWeek(next>7?2:1);setNote(saved.notes[String(next)]??'')}
    }).catch(()=>{if(current){setLoadFailed(true);setError('تعذّر تحميل الخطة. جرّب تاني قبل ما تعمل أي تعديل عشان منستبدلش خطة محفوظة.')}}).finally(()=>{if(current)setLoading(false)})
    return()=>{current=false}
  },[owner,reload])
  const candidate=validatedAssessment(answers)
  const previewAnswers=candidate??plan?.answers??null
  const preview=useMemo(()=>previewAnswers?buildJourney(previewAnswers,draft):null,[previewAnswers,draft])
  const active=useMemo(()=>plan?buildJourney(plan.answers,plan.config):null,[plan])
  const shown=active??preview
  const day=shown?.days[selectedDay-1]
  const complete=plan?.completed_days.length??0
  const differentAssessment=!!candidate&&!!plan&&snapshotKey(candidate)!==plan.assessment_key
  const dirty=!!plan&&note!==(plan.notes[String(selectedDay)]??'')
  async function save(next:PlanRecord,message:string) {
    if(requestBusy.current)return
    requestBusy.current=true;setPending(true);setError('');setNotice('')
    try {
      const saved=await persistPlan(owner,next)
      if(alive.current){setPlan(saved);setNotice(message);return saved}
    }catch{if(alive.current)setError('التغيير ما اتحفظش. راجع اتصالك أو تسجيل الدخول وجرب تاني؛ آخر نسخة محفوظة لسه موجودة.')}
    finally{requestBusy.current=false;if(alive.current)setPending(false)}
  }
  async function start() {
    if(!previewAnswers||pending||loadFailed)return
    if(plan&&!window.confirm('بدء مسار جديد هيستبدل خطة الـ14 يوم وملاحظاتها الحالية. نتائج اختباراتك هتفضل محفوظة. تكمل؟'))return
    const next:PlanRecord={version:1,answers:previewAnswers,assessment_key:snapshotKey(previewAnswers)!,config:{...draft},started_on:localDate(),completed_days:[],notes:{}}
    const saved=await save(next,owner==='guest'?'بدأت خطتك واتحفظت على الجهاز ده.':'بدأت خطتك واتحفظت في حسابك.')
    if(saved){setSelectedDay(1);setWeek(1);setNote('')}
  }
  function chooseDay(next:number) {
    if(dirty&&!window.confirm('فيه ملاحظة لسه ما اتحفظتش. تسيبها وتفتح يوم تاني؟'))return
    setSelectedDay(next);setNote(plan?.notes[String(next)]??'');setNotice('')
  }
  async function updateDay(toggle:boolean) {
    if(!plan||pending)return
    const done=plan.completed_days.includes(selectedDay)
    const completed_days=toggle?(done?plan.completed_days.filter(d=>d!==selectedDay):[...plan.completed_days,selectedDay].sort((a,b)=>a-b)):plan.completed_days
    const notes={...plan.notes};if(note.trim())notes[String(selectedDay)]=note.trim();else delete notes[String(selectedDay)]
    const saved=await save({...plan,completed_days,notes},toggle?(done?'تم إلغاء علامة الإنجاز.':'عاش! اليوم اتسجّل ضمن خطواتك المكتملة.'):'الملاحظة اتحفظت.')
    if(saved)setNote(saved.notes[String(selectedDay)]??'')
  }
  async function clearPlan() {
    if(requestBusy.current||!window.confirm('مسح الخطة هيمسح تقدمها وملاحظاتها نهائيًا. نتائج الاختبارات هتفضل محفوظة. متأكد؟'))return
    requestBusy.current=true;setPending(true);setError('');setNotice('')
    try{await removePlan(owner);if(alive.current){setPlan(null);setNote('');setSelectedDay(1);setWeek(1);setNotice('تم مسح الخطة وملاحظاتها.')}}
    catch{if(alive.current)setError('تعذّر مسح الخطة. جرب تاني بعد مراجعة الاتصال.')}
    finally{requestBusy.current=false;if(alive.current)setPending(false)}
  }
  return <section className="journey-workspace" id="weekly-plan">
    <div className="section-top"><span className="section-kicker">03 / من الفهم للتجربة</span><h2>خطة تناسب يومك، وتقدر تكملها</h2><p>10 مسارات، 3 اختيارات للوقت، وخطوات تتحدد حسب إجاباتك. جرّب 14 يومًا، وراقب اللي ناسبك.</p></div>
    {loading&&<div className="workspace-status" role="status">بنحمّل خطتك...</div>}
    {error&&<div className="workspace-error" role="alert"><p>{error}</p>{loadFailed&&<button onClick={()=>setReload(r=>r+1)}><RefreshCcw size={16}/>إعادة التحميل</button>}</div>}
    {!loading&&!loadFailed&&<>
      {!previewAnswers?<div className="journey-empty"><Target size={32}/><h3>خطتك بتبدأ بفهم يومك</h3><p>كمّل الاختبار عشان نرشّح مسارًا من إجاباتك. وتقدر تتصفح مكتبة الحلول دلوقتي.</p><button className="btn btn-primary" onClick={onStartQuiz}>ابدأ الاختبار <ArrowLeft size={17}/></button></div>:<>
        <details className="plan-config" open={!plan}><summary><span><Target size={18}/>{plan?'تجهيز مسار جديد أو تعديل الاختيارات':'ظبط الخطة على يومك'}</span><ChevronLeft size={17}/></summary><div className="plan-config-body">
          <div className="plan-config-grid"><label>المسار<select value={draft.track} onChange={e=>setDraft(p=>({...p,track:e.target.value as PlanConfig['track']}))}><option value="auto">اختيار حسب نتيجتي</option>{tracks.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select></label><label>الوقت اليومي<select value={draft.minutes} onChange={e=>setDraft(p=>({...p,minutes:Number(e.target.value) as PlanConfig['minutes']}))}>{[10,20,30].map(n=><option key={n} value={n}>{n} دقايق يوميًا</option>)}</select></label><label>هطبّق فين؟<select value={draft.context} onChange={e=>setDraft(p=>({...p,context:e.target.value as PlanConfig['context']}))}>{Object.entries(contextLabels).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label></div>
          {preview&&<div className="plan-recommendation"><strong>{tracks.find(t=>t.id===preview.track)!.title}</strong><p>{preview.reason}</p><small>{draft.track==='auto'?`المسار التلقائي: ${tracks.find(t=>t.id===recommendTrack(previewAnswers))!.description}`:'اختيارك اليدوي يحدد مجال التطبيق؛ النتيجة الأصلية مش بتتغير.'}</small></div>}
          {differentAssessment&&<p className="plan-snapshot-note">إجاباتك الحالية مختلفة عن إجابات الخطة المحفوظة. الخطة مستمرة على نتيجتها الأصلية؛ بدء مسار جديد يستخدم الإجابات الحالية.</p>}
          <button className="btn btn-primary" disabled={pending} onClick={()=>void start()}>{pending?'جاري الحفظ...':plan?'ابدأ مسار جديد بالاختيارات دي':'ابدأ خطة الـ14 يوم'}<ArrowLeft size={17}/></button><p className="plan-consent">{owner==='guest'?'الخطة والملاحظات هيتحفظوا على الجهاز ده.':'بالضغط هنحفظ إجابات الخطة وملاحظاتك في حسابك، عشان ترجع لها من أي جهاز.'}</p>
        </div></details>
        {shown&&day&&<div className="journey-board">
          <div className="journey-board-head"><div><span className="journey-eyebrow"><CalendarDays size={16}/>{plan?'مسارك الحالي':'معاينة قبل البداية'}</span><h3>{tracks.find(t=>t.id===shown.track)!.title}</h3><p>{plan?`بدأت ${new Intl.DateTimeFormat('ar-EG',{day:'numeric',month:'long'}).format(new Date(plan.started_on+'T12:00:00'))} · ${plan.config.minutes} دقايق يوميًا`:'تقدر تشوف تفاصيل الأيام قبل ما تحفظ الخطة.'}</p></div><div className="journey-progress-number"><strong>{complete}<small>/14</small></strong><span>أيام مكتملة</span></div></div>
          <div className="journey-progress" role="progressbar" aria-label="إنجاز الخطة" aria-valuemin={0} aria-valuemax={14} aria-valuenow={complete}><span style={{width:`${complete/14*100}%`}}/></div>
          <div className="journey-layout"><div className="journey-calendar"><div className="week-switch">{[1,2].map(n=><button key={n} aria-pressed={week===n} disabled={pending} onClick={()=>setWeek(n)}>الأسبوع {n===1?'الأول':'التاني'}</button>)}</div><div className="journey-day-list">{shown.days.filter(d=>Math.ceil(d.day/7)===week).map(d=><button key={d.day} className={d.day===selectedDay?'active':''} aria-current={d.day===selectedDay?'step':undefined} onClick={()=>chooseDay(d.day)} disabled={pending}><span className={plan?.completed_days.includes(d.day)?'day-number done':'day-number'}>{plan?.completed_days.includes(d.day)?<Check size={17}/>:String(d.day).padStart(2,'0')}</span><span><small>{d.phase}</small><strong>{d.title}</strong></span><ChevronLeft size={15}/></button>)}</div></div>
            <article className="journey-day-detail"><span className="journey-eyebrow">اليوم {day.day} · {day.minutes} دقايق{plan?` · ${new Intl.DateTimeFormat('ar-EG',{day:'numeric',month:'short'}).format(new Date(planDayDate(plan.started_on,day.day)+'T12:00:00'))}`:''}</span><h4>{day.title}</h4><ol>{day.steps.map(step=><li key={step}>{step}</li>)}</ol><div className="tiny-option"><strong>لو يومك تقيل، النسخة الخفيفة كفاية</strong><p>{day.tiny}</p></div><div className="day-measure"><Target size={18}/><p><strong>مقياس النهارده</strong>{day.measure}</p></div>
              {day.source&&<a className="exercise-source" href={journeySources[day.source].url} target="_blank" rel="noopener noreferrer"><BookOpen size={15}/>{journeySources[day.source].title}</a>}
              {plan?<div className="day-checkin"><label htmlFor="day-note">ملاحظتك لليوم {selectedDay} <small>اختياري · بلاش بيانات حساسة</small></label><textarea id="day-note" maxLength={500} rows={3} value={note} onChange={e=>setNote(e.target.value)} placeholder="إيه اللي نفع؟ وإيه اللي محتاج يتغيّر؟" disabled={pending}/><div className="day-actions"><button className="btn btn-primary" disabled={pending} onClick={()=>void updateDay(true)}><CheckCircle2 size={17}/>{plan.completed_days.includes(selectedDay)?'إلغاء علامة الإنجاز':'نفّذت خطوة النهارده'}</button><button className="btn btn-soft" disabled={pending||!dirty} onClick={()=>void updateDay(false)}>احفظ الملاحظة</button></div></div>:<p className="plan-consent">ابدأ الخطة من الاختيارات فوق عشان تسجّل الإنجاز والملاحظات.</p>}
              {day.day===14&&plan&&<button className="journey-retest" onClick={onStartQuiz}>أعد الاختبار وقارن إجاباتك <ArrowLeft size={16}/></button>}
            </article></div>
          {complete===14&&<div className="journey-celebration"><CheckCircle2 size={24}/><div><strong>كملت خطوات الخطة 🎉</strong><p>راجع ملاحظاتك وحدد عادة تكمل عليها؛ الإنجاز هنا تسجيلك للتطبيق، مش دليلًا على تحسّن طبي.</p></div></div>}
          <div className="journey-sync"><Cloud size={16}/>{owner==='guest'?<span>محفوظ على الجهاز ده بعد بدء الخطة. <button onClick={onLogin}>ادخل بحسابك لخطة محفوظة على السحابة</button></span>:<span>الإنجاز والملاحظات بيتحفظوا في حسابك عند الضغط على حفظ.</span>}</div>
          {plan&&<div className="plan-delete"><button disabled={pending} onClick={()=>void clearPlan()}>مسح الخطة وملاحظاتها</button></div>}
        </div>}
      </>}
      {notice&&<div className="workspace-notice" role="status">{notice}</div>}
      <p className="plan-footnote">لو فاتك يوم، ارجع وكمل بالترتيب اللي يناسبك. الأيام إرشادية، ومفيش عقوبة أو تصفير للتقدم. ملاحظاتك وصف شخصي؛ خطط الموقع مش علاجًا أو وعدًا بتغيير خلال مدة محددة.</p>
    </>}
  </section>
}
