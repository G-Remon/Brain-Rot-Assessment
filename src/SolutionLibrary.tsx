import { useMemo, useState } from 'react'
import { BookOpen, ChevronLeft, Search, Target } from 'lucide-react'
import { domains, type AnswerMap, type DomainId } from './data'
import { journeySources, type Exercise } from './journey'

export function SolutionLibrary({answers,exercises}:{answers:AnswerMap|null;exercises:Exercise[]}) {
  const [filter,setFilter]=useState<DomainId|'all'>('all')
  const [search,setSearch]=useState('')
  const [recommendedOnly,setRecommendedOnly]=useState(false)
  const matches=(exercise:Exercise)=>answers?exercise.questions.filter(id=>answers[id]>=2):[]
  const visible=useMemo(()=>exercises.filter(e=>(filter==='all'||e.domain===filter)&&(!recommendedOnly||!!answers&&e.questions.some(id=>answers[id]>=2))&&`${e.title} ${e.description} ${domains.find(d=>d.id===e.domain)!.title}`.includes(search.trim())),[filter,search,recommendedOnly,answers,exercises])
  return <section className="solution-workspace" id="solutions">
    <div className="section-top"><span className="section-kicker">02 / مكتبة خطوات عملية</span><h2>مش كل حل مناسب لكل يوم</h2><p>24 تمرينًا في 6 مجالات. اختار حسب احتياجك، أو خلّي خطة الـ14 يوم ترتّب الخطوات ليك.</p></div>
    <div className="library-tools"><label className="library-search"><Search size={18}/><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="دور على تركيز، نوم، تعلّم..." aria-label="ابحث في مكتبة الحلول"/></label>{answers&&<label className="recommend-toggle"><input type="checkbox" checked={recommendedOnly} onChange={e=>setRecommendedOnly(e.target.checked)}/>المناسب لإجاباتي فقط</label>}</div>
    <div className="library-filters" aria-label="تصفية الحلول">{([{id:'all',short:'كل المجالات'},...domains] as const).map(d=><button key={d.id} aria-pressed={filter===d.id} onClick={()=>setFilter(d.id)}>{d.short}</button>)}</div>
    <p className="library-count" role="status">{visible.length} تمرين {recommendedOnly?'مرتبط بإجابات متكررة عندك':''}</p>
    <div className="solution-grid">{visible.map(exercise=>{
      const source=journeySources[exercise.source];const matched=matches(exercise)
      return <article className="solution-card" key={exercise.id}><div className="solution-meta"><span>{domains.find(d=>d.id===exercise.domain)!.short}</span>{matched.length>0&&<b><Target size={13}/> مناسب لإجاباتك</b>}</div><h3>{exercise.title}</h3><p>{exercise.description}</p><details><summary>الخطوات وطريقة القياس <ChevronLeft size={16}/></summary><div><ol>{exercise.steps.map(step=><li key={step}>{step}</li>)}</ol><div className="tiny-option"><strong>لو يومك تقيل</strong><p>{exercise.tiny}</p></div><p className="solution-measure"><strong>تقيس إيه؟ </strong>{exercise.measure}</p>{matched.length>0&&<small>ليه مناسب؟ عندك {matched.length} إجابة بدرجة «أحيانًا» أو أكتر مرتبطة بالتمرين.</small>}</div></details><a className="exercise-source" href={source.url} target="_blank" rel="noopener noreferrer"><BookOpen size={15}/><span>{source.title}<small>{source.kind}</small></span></a></article>
    })}</div>
    {!visible.length&&<div className="account-empty">مفيش تمارين مطابقة. جرّب كلمة تانية أو اعرض كل المجالات.</div>}
    <p className="library-footnote">التمارين مكتوبة خصيصًا لـMindReset. أفكار الكتب مصدر إلهام، مش بروتوكولات علاجية؛ المدد وترتيب الخطة من تصميمنا. اقتراحات التعلّم مبنية كمان على مراجعة بحثية، من غير نقل نصوص الكتب.</p>
  </section>
}
