import { trainingProfile, recommendedPracticalExercises } from './training-profile'
import './learning-content.css'
import { exerciseDepth } from './exercise-depth'
import { useMemo, useState } from 'react'
import { BookOpen, ChevronLeft, Search, Target } from 'lucide-react'
import { domains, type AnswerMap, type DomainId } from './data'
import { journeySources, type Exercise } from './journey'

export function SolutionLibrary({answers,exercises}:{answers:AnswerMap|null;exercises:Exercise[]}) {
  const profile=trainingProfile(answers),prescription=recommendedPracticalExercises(answers,exercises)
  const [filter,setFilter]=useState<DomainId|'all'>('all')
  const [search,setSearch]=useState('')
  const [recommendedOnly,setRecommendedOnly]=useState(false)
  const matches=(exercise:Exercise)=>answers?exercise.questions.filter(id=>answers[id]>=2):[]
  const visible=useMemo(()=>exercises.filter(e=>(filter==='all'||e.domain===filter)&&(!recommendedOnly||!!answers&&e.questions.some(id=>answers[id]>=2))&&`${e.title} ${e.description} ${domains.find(d=>d.id===e.domain)!.title}`.includes(search.trim())),[filter,search,recommendedOnly,answers,exercises])
  return <section className="solution-workspace" id="solutions">
    <div className="section-top"><span className="section-kicker">02 / مكتبة خطوات عملية</span><h2>مش كل حل مناسب لكل يوم</h2><p>{exercises.length} تمرينًا في 6 مجالات. اختار حسب احتياجك، أو خلّي خطة الـ14 يوم ترتّب الخطوات ليك.</p></div>
    <div className="practice-entry"><div><h2>تدريبات MCQ بدرجات ومستويات</h2><p>108 أسئلة، فيها رياضيات وصور وكوتشينة، مع إجابات مشروحة، ودرجة منفصلة للتدريب.</p></div><a className="btn btn-primary" href="#/practice">افتح التدريب <ChevronLeft size={17}/></a></div>
    {answers&&<div className="training-profile"><Target size={22}/><div><strong>بداية مقترحة حسب نتيجتك: {profile.score}/120 · {domains.find(d=>d.id===profile.domain)!.short}</strong><p>{profile.action}</p><small>ابدأ بنحو {profile.minutes} دقايق. نفس المجموع ممكن يخفي محاور مختلفة؛ اختار المجال المرتبط بإجاباتك.</small></div></div>}
    {!!prescription.length&&<section className="practical-prescription" aria-label="تمارين مقترحة حسب نتيجتك"><div className="section-top"><h2>ابدأ من التمارين دي</h2><p>النوع من محورك الأعلى، وحجم الخطوة من إجاباتك. ده ترشيح بداية، وباقي المكتبة متاحة تحت.</p></div><div className="advice-grid">{prescription.map(({exercise,steps,minutes})=><article className="advice-card" key={exercise.id}><span className="section-kicker">{minutes} دقايق · {profile.mode==='gentle'?'بداية خفيفة':'تثبيت وتطبيق'}</span><h3>{exercise.title}</h3><ol>{steps.map(step=><li key={step}>{step}</li>)}</ol><small>راجع: {exercise.measure}</small></article>)}</div></section>}
    <div className="library-tools"><label className="library-search"><Search size={18}/><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="دور على تركيز، نوم، تعلّم..." aria-label="ابحث في مكتبة الحلول"/></label>{answers&&<label className="recommend-toggle"><input type="checkbox" checked={recommendedOnly} onChange={e=>setRecommendedOnly(e.target.checked)}/>المناسب لإجاباتي فقط</label>}</div>
    <div className="library-filters" aria-label="تصفية الحلول">{([{id:'all',short:'كل المجالات'},...domains] as const).map(d=><button key={d.id} aria-pressed={filter===d.id} onClick={()=>setFilter(d.id)}>{d.short}</button>)}</div>
    <p className="library-count" role="status">{visible.length} تمرين {recommendedOnly?'مرتبط بإجابات متكررة عندك':''}</p>
    <div className="solution-grid">{visible.map(exercise=>{
      const source=journeySources[exercise.source];const matched=matches(exercise)
      return <article className="solution-card" key={exercise.id}><div className="solution-meta"><span>{domains.find(d=>d.id===exercise.domain)!.short}</span>{matched.length>0&&<b><Target size={13}/> مناسب لإجاباتك</b>}</div><div className="exercise-levels"><span>١ · جرّب</span><span>٢ · تعمّق</span><span>٣ · راجع</span></div><h3>{exercise.title}</h3><p>{exercise.description}</p>{matched.length>0&&<div className="personalized-exercise"><strong>{profile.mode==='gentle'?'بدايتك الخفيفة':'بداية تثبيت وتطبيق'}</strong><p>{profile.mode==='gentle'?exercise.tiny:exercise.steps[0]}</p></div>}<details><summary>الخطوات وطريقة القياس <ChevronLeft size={16}/></summary><div><ol>{exercise.steps.map(step=><li key={step}>{step}</li>)}</ol><div className="tiny-option"><strong>لو يومك تقيل</strong><p>{exercise.tiny}</p></div><div className="exercise-deep"><h4>مستوى أعمق · لما تكون جاهز</h4><p>{exerciseDepth[exercise.domain].challenge}</p><h4>سؤال المراجعة</h4><p>{exerciseDepth[exercise.domain].reflection}</p><h4>الخطوة الجاية</h4><p>{exerciseDepth[exercise.domain].next}</p></div><p className="solution-measure"><strong>تقيس إيه؟ </strong>{exercise.measure}</p>{matched.length>0&&<small>ليه مناسب؟ عندك {matched.length} إجابة بدرجة «أحيانًا» أو أكتر مرتبطة بالتمرين.</small>}</div></details><a className="exercise-source" href={source.url} target="_blank" rel="noopener noreferrer"><BookOpen size={15}/><span>{source.title}<small>{source.kind}</small></span></a></article>
    })}</div>
    {!visible.length&&<div className="account-empty">مفيش تمارين مطابقة. جرّب كلمة تانية أو اعرض كل المجالات.</div>}
    <p className="library-footnote">التمارين مكتوبة خصيصًا لـMindReset. أفكار الكتب مصدر إلهام، مش بروتوكولات علاجية؛ المدد وترتيب الخطة من تصميمنا. اقتراحات التعلّم مبنية كمان على مراجعة بحثية، من غير نقل نصوص الكتب.</p>
  </section>
}
