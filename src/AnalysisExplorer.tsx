import { useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, ChevronLeft, Lightbulb, Target } from 'lucide-react'
import { domains, questions, sources, type AnswerMap, type DomainId } from './data'
import type { PersonalReport } from './personalization'
import { rankDomains, recommendTrack, tracks } from './journey'

const domainGuides:Record<DomainId,{meaning:string;watch:string;metric:string}>={
  focus:{meaning:'المحور بيرصد إحساسك بالمقاطعات والاستمرار في المهمة، مش بيقيس قدرتك العقلية أو يشخّص ADHD.',watch:'شوف إمتى التشتت بيظهر: بداية المهمة، المحتوى الطويل، ولا أثناء القراءة. السياق أهم من لوم نفسك.',metric:'جلسة واحدة: المدة الفعلية وعدد المقاطعات والناتج اللي خلص.'},
  scroll:{meaning:'المحور بيراجع الاستخدام التلقائي وصعوبة الوقوف؛ عدد ساعات الشاشة لوحده مش حكم على الاستخدام.',watch:'فرّق بين استخدام مقصود للشغل أو التواصل، وفتح من غير غرض؛ راجع المحفز قبل التصفح.',metric:'وقت جلسة تصفح مخطط له مقابل الوقت الفعلي.'},
  patience:{meaning:'المحور بيوصف تجربتك مع الانتظار والأنشطة الهادية، مش «مستوى الدوبامين» أو مقياسًا لشخصيتك.',watch:'ابدأ بوقت قصير ومريح؛ مش مطلوب تتضايق أو تمنع الترفيه عشان تتحسن.',metric:'الرغبة في فتح الشاشة قبل وبعد انتظار قصير من 1 إلى 5.'},
  memory:{meaning:'إجاباتك هنا انطباع ذاتي عن التعلّم والتذكر، مش اختبار ذاكرة موضوعي أو دليل على تدهور.',watch:'فرّق بين عدم فهم الفكرة أصلًا وصعوبة استرجاعها بعد وقت. جرّب سؤالًا صغيرًا وصححه.',metric:'عدد الإجابات الصحيحة من 3 أسئلة قبل مراجعة المصدر.'},
  sleep:{meaning:'المحور بيراجع تداخل التصفح مع روتين النوم والطاقة؛ التعب له أسباب متعددة والاستبيان ما يحددهاش.',watch:'راقب المواعيد والظروف عدة أيام. لو المشكلة مستمرة ومؤثرة، التقييم المتخصص أنسب من افتراض سبب واحد.',metric:'وقت النوم والاستيقاظ ونهاية التصفح والطاقة صباحًا.'},
  impact:{meaning:'المحور بيركز على أثر الاستخدام على مسؤولياتك وعلاقاتك وأهدافك، وده مهم حتى لو المجموع قليل.',watch:'اختار موقفًا واحدًا له أثر حقيقي، وابدأ بتغيير بسيط. لو الأثر واضح ومستمر اطلب مساعدة مناسبة.',metric:'مسؤولية بدأت في ميعادها أو لقاء قلّت فيه المقاطعات.'},
}
export function AnalysisExplorer({answers,report}:{answers:AnswerMap;report:PersonalReport}) {
  const ranked=useMemo(()=>rankDomains(answers),[answers])
  const [selected,setSelected]=useState<DomainId>(ranked[0].id)
  const domain=report.domainReadings.find(d=>d.id===selected)!
  const readings=report.questionReadings.filter(q=>q.domain===selected)
  const frequent=readings.filter(q=>q.answer>=2).sort((a,b)=>b.answer-a.answer)
  const isolated=report.questionReadings.filter(q=>q.answer>=3 && (ranked.find(d=>d.id===q.domain)?.score??0)<=7)
  const track=tracks.find(t=>t.id===recommendTrack(answers))!
  const allEqual=ranked.every(d=>d.score===ranked[0].score)
  return <section className="analysis-workspace" id="analysis">
    <div className="section-top"><span className="section-kicker">01 / افهم الصورة كاملة</span><h2>تقريرك، من الصورة الكبيرة للتفاصيل</h2><p>30 إجابة و6 محاور. نفس المجموع ممكن يطلع من أنماط مختلفة، وعشان كده بنراجع كل إجابة لوحدها كمان.</p></div>
    <div className="report-summary-grid">
      <article className="report-lead"><span className="journey-eyebrow"><Target size={16}/> نقطة البداية المقترحة</span><h3>{track.title}</h3><p>{allEqual?'درجات المحاور متساوية؛ الترتيب هنا للتنظيم فقط، مش معناه إن فيه محور أسوأ.':`أعلى جانب حسب إجاباتك: ${ranked[0].title} (${ranked[0].score}/20)، وبعده ${ranked[1].title} (${ranked[1].score}/20).`}</p><a href="#/journey">شوف المسار المناسب <ArrowLeft size={16}/></a></article>
      <article className="report-facts"><div><strong>{report.questionReadings.filter(q=>q.answer>=2).length}<small>/30</small></strong><span>مواقف اخترت فيها «أحيانًا» أو أكتر</span></div><div><strong>{report.questionReadings.filter(q=>q.answer<=1).length}<small>/30</small></strong><span>مواقف قليلة التكرار تقدر تحافظ عليها</span></div><p>الأرقام تلخص التكرار اللي وصفته، ومش نسب مرض أو مقارنة بمستخدمين تانيين.</p></article>
    </div>
    {isolated.length>0&&<div className="isolated-signal"><Lightbulb size={20}/><p><strong>تفصيلة المجموع ممكن يخفيها: </strong>{isolated.map(q=>`${q.title} (${q.answerLabel})`).join('، ')}. دي إجابات متكررة داخل محاور مجموعها قليل؛ تستحق الملاحظة لو مؤثرة عليك.</p></div>}
    <div className="domain-switcher" aria-label="اختار محور التحليل">{domains.map(d=><button type="button" key={d.id} aria-pressed={d.id===selected} onClick={()=>setSelected(d.id)}><span>{d.short}</span><b>{ranked.find(r=>r.id===d.id)!.score}<small>/20</small></b></button>)}</div>
    <article className="domain-deep-dive" key={selected}>
      <div className="deep-dive-heading"><div><span className="section-kicker">المحور بالتفصيل</span><h3>{domain.title}</h3></div><span className={'signal-pill '+(domain.positive?'positive':'needs-attention')}>{domain.label} · {domain.score}/20</span></div>
      <p className="domain-meaning">{domainGuides[selected].meaning}</p>
      <div className="domain-observation"><strong>{frequent.length?`ظهر تكرار في ${frequent.length} من 5 مواقف`:'إجاباتك في المواقف الخمسة قليلة التكرار'}</strong><p>{frequent.length?`أبرزها: ${frequent.slice(0,2).map(r=>`${r.title} — ${r.answerLabel}`).join('، ')}.`:'مفيش سبب نعتبر المحور ده مشكلة من إجاباتك الحالية. حافظ على اللي مناسبك.'} {domainGuides[selected].watch}</p></div>
      <div className="reading-list">{readings.map(item=><details className="reading-item" key={item.id}><summary><span><i className={item.answer>=2?'reading-dot frequent':'reading-dot'}/>{item.title}</span><span>{item.answerLabel}<ChevronLeft size={15}/></span></summary><div><small className="reading-question">السؤال: {questions.find(q=>q.id===item.id)!.text}</small><p>{item.observation}</p><div className="reading-next"><Lightbulb size={16}/>{item.action}</div><a href={sources.find(s=>s.id===item.sourceId)!.url} target="_blank" rel="noopener noreferrer">مرجع عام للمجال</a></div></details>)}</div>
      <div className="domain-metric"><Target size={19}/><div><strong>راقب التقدم بطريقة عملية</strong><p>{domainGuides[selected].metric}</p></div></div>
    </article>
    <div className="patterns-heading"><span className="section-kicker">لما الإجابات تظهر مع بعض</span><h3>الأنماط المشتركة في إجاباتك</h3><p>دي روابط وصفية بقواعد واضحة، مش استنتاجات عن السبب.</p></div>
    {report.patterns.length?<div className="pattern-detail-grid">{report.patterns.map(pattern=><details className="pattern-detail" key={pattern.id}><summary><span>{pattern.title}</span><ChevronLeft size={16}/></summary><div><p>{pattern.description}</p><small>ظهر لأنك اخترت «أحيانًا» أو أكتر في: {pattern.questionIds.map(id=>report.questionReadings.find(q=>q.id===id)!.title).join(' + ')}.</small><div className="reading-next"><Lightbulb size={16}/>{pattern.action}</div></div></details>)}</div>:<div className="strength-box"><CheckCircle2 size={21}/><p>مفيش نمط مشترك من القواعد اللي بنراجعها انطبق على إجاباتك. ممكن تختار تحسين بسيط من المكتبة.</p></div>}
    <div className="analysis-boundary">التقرير مش معتمد على بيانات ناس تانية، ومش أداة تشخيصية معتمدة. كل اقتراح قابل للتعديل حسب ظروفك؛ لو صعوبة النوم أو التركيز أو أثر الاستخدام واضح ومستمر، استعن بمختص.</div>
  </section>
}
