import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { createRoot } from 'react-dom/client'
import { Activity, ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronLeft, Clock3, Copy, Download, ExternalLink, Heart, Lightbulb, LockKeyhole, Menu, Moon, RotateCcw, Share2, ShieldCheck, Smartphone, Sparkles, Target, X, Zap, BrainCircuit } from 'lucide-react'
import { domains, questions, options, domainScore, totalScore, getBand, prioritizedRecommendations, sources, type AnswerMap } from './data'
import './style.css'

type Screen = 'home' | 'quiz' | 'results' | 'science'
const KEY = 'mindreset-assessment-v1'
const PLAN_KEY = 'mindreset-plan-v1'
const steps = ['افهم عاداتك', 'شوف تحليلك', 'ابدأ بخطوة بسيطة']
const books = [
  { title: 'Deep Work', subtitle: 'الشغل بتركيز ومن غير مقاطعات', author: 'Cal Newport', tag: 'التركيز', mark: '01', description: 'استلهمنا منه أفكار تنظيم جلسات الشغل العميق وتقليل المشتتات.' },
  { title: 'Digital Minimalism', subtitle: 'استخدم التكنولوجيا بإرادتك', author: 'Cal Newport', tag: 'العادات الرقمية', mark: '02', description: 'أفكار تساعدك تختار التطبيقات اللي ليها فايدة فعلية في يومك.' },
  { title: 'Make It Stick', subtitle: 'اتعلم بطريقة تفضل معاك', author: 'Peter C. Brown, Henry L. Roediger III & Mark A. McDaniel', tag: 'التعلّم', mark: '03', description: 'منه استلهمنا الاسترجاع النشط والمراجعة المتباعدة بدل القراءة المتكررة.' }
]

function IconFor({ name, size = 20 }: { name: string; size?: number }) {
  const shared = { size, strokeWidth: 2 }
  switch (name) {
    case 'target': return <Target {...shared}/>
    case 'smartphone': return <Smartphone {...shared}/>
    case 'hourglass': return <Clock3 {...shared}/>
    case 'book-open': return <BookOpen {...shared}/>
    case 'moon': return <Moon {...shared}/>
    default: return <Activity {...shared}/>
  }
}
function readStored(): AnswerMap {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) || '{}')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(Object.entries(parsed).filter(([id,value]) => questions.some(q=>q.id===id) && typeof value==='number' && Number.isInteger(value) && value>=0 && value<=4))
  } catch { return {} }
}
function App() {
  const [screen,setScreen]=useState<Screen>('home')
  const [answers,setAnswers]=useState<AnswerMap>(readStored)
  const [index,setIndex]=useState(0)
  const [showMenu,setShowMenu]=useState(false)
  const [feedback,setFeedback]=useState('')
  const [completed,setCompleted]=useState<Record<number,boolean>>(()=>{
    try { const value=JSON.parse(localStorage.getItem(PLAN_KEY)||'{}');return value && typeof value==='object' && !Array.isArray(value) ? value : {} }catch{return {}}
  })
  useEffect(()=>{localStorage.setItem(KEY,JSON.stringify(answers))},[answers])
  useEffect(()=>{localStorage.setItem(PLAN_KEY,JSON.stringify(completed))},[completed])
  useEffect(()=>{window.scrollTo({top:0,behavior:'instant'})},[screen])
  const answered=Object.keys(answers).length
  const question=questions[index]
  const score=totalScore(answers)
  const band=getBand(score)
  const ranked=useMemo(()=>[...domains].map(d=>({...d,score:domainScore(answers,d.id)})).sort((a,b)=>b.score-a.score),[answers])
  const recs=useMemo(()=>prioritizedRecommendations(answers),[answers])
  const mainAreas=ranked.filter(d=>d.score>=5).slice(0,3)
  const allAnswered=answered===questions.length
  function startQuiz() {
    const missing=questions.findIndex(q=>answers[q.id]===undefined)
    setIndex(missing>=0?missing:0)
    setScreen('quiz')
  }
  function selectAnswer(value:number) {
    setAnswers(p=>({...p,[question.id]:value}))
    if(index<questions.length-1) setTimeout(()=>setIndex(n=>n===index ? n+1 : n),180)
    else setTimeout(()=>setScreen('results'),240)
  }
  function reset(){
    if(!window.confirm('متأكد إنك عايز تبدأ من جديد؟ إجاباتك الحالية هتتمسح.'))return
    setAnswers({});setIndex(0);setCompleted({});setScreen('quiz')
  }
  const shareText=`نتيجتي في MindReset (تقييم ذاتي غير طبي): ${score}/120 — ${band.title}\n${ranked.map(d=>`${d.title}: ${d.score}/20`).join('\n')}\nالدرجات وصفية ومش مقياس لضرر الدماغ.`
  async function share() {
    try {
      if(navigator.share) { await navigator.share({title:'نتيجتي في MindReset',text:shareText,url:window.location.origin});return }
      await navigator.clipboard.writeText(shareText);setFeedback('النتيجة اتنسخت! تقدر تبعتها للي تحبه.')
    } catch (error) {
      if(error instanceof DOMException && error.name==='AbortError') return
      setFeedback('لو المشاركة مش مدعومة، استخدم زر نسخ النتيجة.')
    }
  }
  async function copy(){
    try { await navigator.clipboard.writeText(shareText);setFeedback('اتنسخت النتيجة بنجاح') }
    catch { setFeedback('النسخ مش متاح في المتصفح ده. جرب مشاركة النتيجة.') }
  }
  const plan=[
    {title:'حدد وقتك',text:'اكتب أهم مهمة عندك، وإمتى هتبدأها.'},
    {title:'وقت تركيز',text:'اشتغل 25 دقيقة على مهمة واحدة من غير إشعارات.'},
    {title:'استرجع اللي اتعلمته',text:'اقفل الشرح واكتب 3 معلومات من ذاكرتك.'},
    {title:'لاحظ عادة',text:'دوّن إمتى مسكت الموبايل تلقائيًا.'},
    {title:'اهتم بنومك',text:'جرب روتين هادي قبل النوم.'},
    {title:'كرر الأنسب ليك',text:'اختار أكتر خطوة نفعتك وكررها.'},
    {title:'راجع من غير جلد ذات',text:'لاحظ اللي اتحسن وإيه محتاج تغييره الأسبوع الجاي.'}
  ]
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container nav">
          <button className="brand" onClick={()=>setScreen('home')} aria-label="الصفحة الرئيسية">
            <span className="brand-icon"><BrainCircuit size={23}/></span>
            <span>mind<span className="brand-accent">reset</span><small>افهم عاداتك الرقمية</small></span>
          </button>
          <nav className={showMenu?'nav-links open':'nav-links'} aria-label="القائمة الرئيسية">
            <button onClick={()=>{setScreen('home');setShowMenu(false)}} className={screen==='home'?'active':''}>الرئيسية</button>
            <button onClick={()=>{setScreen('science');setShowMenu(false)}} className={screen==='science'?'active':''}>ورا الاختبار إيه؟</button>
            <button onClick={()=>{if(allAnswered)setScreen('results');else startQuiz();setShowMenu(false)}}> {allAnswered?'نتيجتك':'الاختبار'}</button>
          </nav>
          <div className="nav-actions">
            <button className="nav-start" onClick={startQuiz}>{answered>0 && !allAnswered?'كمّل اختبارك':'ابدأ الاختبار'} <ArrowLeft size={17}/></button>
            <button className="menu-toggle" onClick={()=>setShowMenu(p=>!p)} aria-label={showMenu?'قفل القائمة':'افتح القائمة'}>{showMenu?<X/>:<Menu/>}</button>
          </div>
        </div>
      </header>
      <main>
        {screen==='home' && <>
          <section className="hero container">
            <div className="hero-copy">
              <span className="eyebrow"><span className="pulse-dot"/> وقت تعرف علاقتك بالموبايل بوضوح</span>
              <h1>الموبايل في إيدك...<br/><span className="highlight">ولا واخد وقتك؟</span></h1>
              <p className="hero-lead">بتتشتت بسرعة؟ بتفتح الريلز من غير ما تحس؟ ولا بس عايز تطمّن على عاداتك؟ جاوب على شوية أسئلة بسيطة، وهنساعدك تفهم الصورة.</p>
              <div className="hero-actions">
                <button className="btn btn-primary" onClick={startQuiz}>{answered>0 && !allAnswered?'كمّل من مكانك':'يلا نبدأ الاختبار'} <ArrowLeft size={20}/></button>
                <button className="btn btn-soft" onClick={()=>setScreen('science')}>الاختبار ده إيه؟ <ChevronLeft size={19}/></button>
              </div>
              <div className="hero-proof"><span><Clock3 size={16}/> حوالي 5 دقايق</span><span><LockKeyhole size={16}/> من غير حساب</span><span><CheckCircle2 size={16}/> نتيجتك فورًا</span></div>
              <p className="hero-disclaimer">ده تقييم ذاتي استرشادي، مش تشخيص طبي ولا مقياس لتلف الدماغ.</p>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="ambient ambient-a"/><div className="ambient ambient-b"/>
              <div className="floating-tag tag-one"><span className="tag-emoji">✦</span> خد بالك من تركيزك</div>
              <div className="floating-tag tag-two"><CheckCircle2 size={17}/> خطوة صغيرة تفرق</div>
              <div className="brain-orbit orbit-one"/><div className="brain-orbit orbit-two"/>
              <div className="brain-core"><BrainCircuit size={120} strokeWidth={1.15}/></div>
              <div className="mini-card mini-card-top"><span className="mini-dot lime"/><span>وقت لنفسك</span><strong>+ تركيز</strong></div>
              <div className="mini-card mini-card-bottom"><span className="mini-dot violet"/><span>مش لازم تكون مثالي</span><strong>ابدأ بس</strong></div>
            </div>
          </section>
          <section className="container quick-section">
            <div className="section-top"><span className="section-kicker">ببساطة شديدة</span><h2>3 خطوات وتكون فاهم نفسك أكتر</h2><p>مفيش تسجيل، مفيش أسئلة شخصية حساسة، ومفيش لف ودوران.</p></div>
            <div className="steps-grid">{steps.map((step,i)=><div className="step-card" key={step}><span className="step-number">0{i+1}</span><div className="step-symbol">{i===0?<Target/>:i===1?<Activity/>:<Lightbulb/>}</div><h3>{step}</h3><p>{['30 سؤال قصير، على قد يومك الحقيقي.','نقاط قوتك والحاجات اللي ممكن تحسنها.','نصايح واقعية مناسبة لإجاباتك.'][i]}</p></div>)}</div>
          </section>
          <section className="container domains-section">
            <div className="section-top"><span className="section-kicker">هنبص على إيه؟</span><h2>مش كله «وقت شاشة» وبس</h2><p>6 جوانب تساعدك تفهم نمط استخدامك — من غير أحكام مسبقة.</p></div>
            <div className="domain-grid">{domains.map(d=><div className="domain-tile" key={d.id}><div className="domain-icon"><IconFor name={d.icon}/></div><strong>{d.title}</strong><p>{d.description}</p></div>)}</div>
          </section>
          <section className="container final-cta"><div><span className="section-kicker">جاهز تجرّب؟</span><h2>5 دقايق ممكن يفتحوا عينك على عاداتك</h2><p>بدل ما تحكم على نفسك، افهم نفسك الأول.</p></div><button onClick={startQuiz} className="btn btn-primary">ابدأ دلوقتي <ArrowLeft size={20}/></button></section>
        </>}
        {screen==='quiz' && <section className="quiz-layout container">
          <div className="quiz-topline"><button className="quiet-button" onClick={()=>setScreen('home')}><X size={18}/> خروج وحفظ التقدم</button><span className="privacy-line"><ShieldCheck size={16}/> إجاباتك على جهازك بس</span></div>
          <div className="quiz-card">
            <div className="quiz-heading"><span className="section-kicker">{domains.find(d=>d.id===question.domain)?.title}</span><span className="question-counter">سؤال <b>{index+1}</b> من {questions.length}</span></div>
            <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={index+1} aria-label="تقدم الاختبار"><span style={{width:`${((index+1)/questions.length)*100}%`}}/></div>
            <h1 className="question-title">{question.text}</h1>
            <p className="quiz-help">فكّر في آخر 14 يوم، واختار أقرب إجابة ليك.</p>
            <div className="answer-list">{options.map((o,i)=><button className={answers[question.id]===o.value?'answer-option selected':'answer-option'} key={o.value} onClick={()=>selectAnswer(o.value)}><span className="answer-index">{['أ','ب','ج','د','هـ'][i]}</span><span>{o.label}</span><span className="radio-circle">{answers[question.id]===o.value?<Check size={16}/>:null}</span></button>)}</div>
            <div className="quiz-footer"><button className="quiet-button" disabled={index===0} onClick={()=>setIndex(n=>n-1)}><ArrowRight size={18}/> اللي قبله</button><span>مفيش إجابة صح وغلط 🤍</span><button className="quiet-button" disabled={index>=questions.length-1 || answers[question.id]===undefined} onClick={()=>setIndex(n=>n+1)}>اللي بعده <ArrowLeft size={18}/></button></div>
          </div>
          <p className="quiz-bottom-note">خد وقتك. كل إجابة بتساعدنا نديك تحليل أقرب لعاداتك.</p>
        </section>}
        {screen==='results' && allAnswered && <div className="container results-page">
          <div className="results-intro"><span className="section-kicker">خلصت! عاش إنك كملت 👏</span><h1>دي صورتك الحالية...<br/><span className="highlight">مش حكم عليك.</span></h1><p>النتيجة بتلخّص إجاباتك عن آخر 14 يوم، مش بتحدد ذكاءك أو «نسبة ضرر دماغك».</p></div>
          <div className="result-shortcuts"><button onClick={()=>document.getElementById('solutions')?.scrollIntoView({behavior:'smooth'})}>شوف الحلول اللي تناسبك <ArrowLeft size={16}/></button><button onClick={()=>document.getElementById('weekly-plan')?.scrollIntoView({behavior:'smooth'})}>خطة الأسبوع <ChevronLeft size={16}/></button></div>
          <div className="results-grid">
            <article className="score-card"><span className="card-eyebrow">مجموع الإجابات</span><div className="score-ring" style={{'--amount':`${score/120*100}%`} as CSSProperties}><div><strong>{score}</strong><span>من 120</span></div></div><div className="band-pill">{band.title}</div><p>{band.note}</p><small>تصنيفات وصفية من تصميم الموقع، مش حدود تشخيصية معتمدة.</small></article>
            <article className="breakdown-card"><div className="card-heading"><h2>تفصيل المحاور</h2><span>من 20 لكل محور</span></div>{ranked.map(d=><div className="score-line" key={d.id}><div className="score-name"><span><IconFor name={d.icon} size={17}/>{d.title}</span><b>{d.score}<small>/20</small></b></div><div className="bar-track"><span style={{width:`${d.score*5}%`}} className={d.score>=12?'bar-high':d.score>=7?'bar-mid':'bar-low'}/></div></div>)}</article>
          </div>
          <section className="insight-card"><div className="insight-symbol"><Sparkles size={28}/></div><div><span className="section-kicker">إيه اللي لفت نظرنا؟</span><h2>{mainAreas.length ? `أكتر جانب محتاج اهتمام: ${mainAreas[0].title}` : 'إجاباتك بتشير لصعوبات قليلة نسبيًا'}</h2><p>{mainAreas.length? `إجاباتك في ${mainAreas.map(d=>d.title).join('، ')} كانت أعلى نسبيًا من باقي المحاور. خلّينا نبدأ بعادة بسيطة بدل محاولة تغيير كل حاجة مرة واحدة.`:'حلو إن معظم المؤشرات قليلة. تقدر تركز على الحفاظ على العادات اللي بتساعدك في التعلم والنوم.'}</p></div></section>
          <section className="advice-section" id="solutions"><div className="section-top"><span className="section-kicker">خطوات مناسبة لإجاباتك</span><h2>تقدر تبدأ بإيه من النهارده؟</h2><p>اقتراحات عملية مرتبطة بالجوانب الأعلى في إجاباتك، مش وصفة علاجية.</p></div><div className="advice-grid">{recs.map((r,i)=><article className="advice-card" key={r.title}><span className="advice-count">{String(i+1).padStart(2,'0')}</span><h3>{r.title}</h3><p>{r.description}</p><div className="advice-action"><Zap size={17}/><span>{r.action}</span></div><div className="evidence"><BookOpen size={15}/>{r.evidence} <a href={sources.find(s=>s.id===r.sourceId)?.url} target="_blank" rel="noopener noreferrer">المصدر <ExternalLink size={12}/></a></div></article>)}</div></section>
          <section className="plan-section" id="weekly-plan"><div className="section-top"><span className="section-kicker">خطة خفيفة</span><h2>تحدي 7 أيام — على راحتك</h2><p>اختار كل يوم خطوة صغيرة. لو فاتك يوم، كمل عادي.</p></div><div className="plan-list">{plan.map((d,i)=><label key={d.title} className={completed[i]?'plan-row completed':'plan-row'}><input type="checkbox" checked={!!completed[i]} onChange={e=>setCompleted(p=>({...p,[i]:e.target.checked}))}/><span className="plan-check"><Check size={17}/></span><span className="plan-text"><strong>اليوم {i+1} — {d.title}</strong><small>{d.text}</small></span></label>)}</div></section>
          <div className="results-actions"><button className="btn btn-primary" onClick={share}><Share2 size={18}/> شارك نتيجتك</button><button className="btn btn-soft" onClick={copy}><Copy size={18}/> انسخ الملخص</button><button className="btn btn-soft" onClick={()=>window.print()}><Download size={18}/> احفظ PDF</button><button className="btn btn-outline" onClick={reset}><RotateCcw size={17}/> إعادة الاختبار</button></div>
          {feedback && <p className="feedback" role="status">{feedback}</p>}
          <p className="results-disclaimer"><ShieldCheck size={17}/> لو صعوبات التركيز أو النوم مؤثرة على حياتك بشكل واضح ومستمر، الأفضل تكلم مختص. الاختبار مش بديل عن تقييم طبي أو نفسي.</p>
        </div>}
        {screen==='results' && !allAnswered && <section className="container empty-result"><h1>لسه عندك شوية أسئلة</h1><p>كمّل الاختبار الأول عشان يطلعلك التقرير.</p><button className="btn btn-primary" onClick={startQuiz}>كمّل الأسئلة <ArrowLeft size={18}/></button></section>}
        {screen==='science' && <div className="container science-page">
          <span className="section-kicker">من الآخر، وبوضوح</span><h1>الموقع ده مبني على إيه؟</h1>
          <p className="science-lead">مصطلح «تعفن الدماغ» أو Brain Rot تعبير منتشر، مش اسم مرض أو تشخيص طبي. عشان كده هنا بنقيّم عادات وسلوكيات بيبلغ عنها الشخص بنفسه، مش بنقيس صحة دماغه.</p>
          <section className="books-feature" aria-labelledby="books-title">
            <div className="books-heading"><span className="section-kicker">منين جت أفكار الحلول؟</span><h2 id="books-title">كتب استلهمنا منها خطوات بسيطة</h2><p>اختارنا أفكار عملية من الكتب دي عشان تساعدك في التركيز وتنظيم وقتك والتعلّم بشكل أفضل.</p></div>
            <div className="books-grid">{books.map(book=><article className="book-card" key={book.title}><div className="book-visual"><span>{book.mark}</span><BookOpen size={30}/></div><div className="book-detail"><span className="book-tag">{book.tag}</span><h3 lang="en" dir="ltr">{book.title}</h3><strong>{book.subtitle}</strong><small lang="en" dir="ltr">{book.author}</small><p>{book.description}</p></div></article>)}</div>
          </section>
          <div className="science-grid"><div className="science-info"><Target/><h3>إيه اللي بنقيسه؟</h3><p>تصورك الشخصي عن التركيز، والتصفح، والملل، والتعلّم، والنوم، وتأثير الاستخدام على يومك خلال آخر 14 يوم.</p></div><div className="science-info"><Activity/><h3>إزاي بتتحسب النتيجة؟</h3><p>كل إجابة من 0 إلى 4. خمس أسئلة لكل محور (0–20)، والإجمالي 0–120. كل ما النتيجة زادت، الصعوبات المبلّغ عنها زادت. دي مش نسبة مئوية لتلف الدماغ.</p></div><div className="science-info"><Heart/><h3>إزاي بنقترح حلول؟</h3><p>بنبدأ بالجوانب اللي جابت درجات أعلى ونختار خطوات عملية، مع روابط للمراجع. النتيجة مش بتقدر تحدد أسباب المشكلة أو تستبعد أي حالة طبية.</p></div><div className="science-info"><LockKeyhole/><h3>خصوصيتك</h3><p>إجاباتك محفوظة محليًا في متصفحك لاستكمال الاختبار. مفيش حساب ولا سيرفر بيستقبل الإجابات في النسخة دي. المشاركة بتحصل فقط لو إنت اخترتها.</p></div></div>
          <div className="sources-section"><div className="section-top"><span className="section-kicker">القراءة والمصادر</span><h2>دراسات ومصادر للنصايح</h2><p>ومع الكتب، بنرجع لأبحاث ومصادر موثوقة تدعم بعض التوصيات. مش معنى كده إن أسئلة الاختبار نفسها مقياس معتمد.</p></div>{sources.map(s=><a className="source-row" href={s.url} target="_blank" rel="noopener noreferrer" key={s.id}><div className="source-icon"><BookOpen size={20}/></div><div><strong>{s.title}</strong><small>{s.by}</small><p>{s.summary}</p></div><ExternalLink size={17}/></a>)}</div>
          <div className="science-bottom"><h2>خلينا نفهم عاداتك من غير أحكام.</h2><button className="btn btn-primary" onClick={startQuiz}>ابدأ الاختبار <ArrowLeft size={18}/></button></div>
        </div>}
      </main>
      <footer className="footer"><div className="container footer-inner"><div className="footer-brand"><BrainCircuit size={21}/> <strong>mindreset</strong><span>افهم عاداتك. اختار براحتك.</span></div><div className="footer-links"><button onClick={()=>setScreen('science')}>العلم والمصادر</button><button onClick={()=>setScreen('home')}>الرئيسية</button></div><p>تقييم ذاتي للتوعية فقط — مش تشخيص طبي. © {new Date().getFullYear()} MindReset</p></div></footer>
    </div>
  )
}
createRoot(document.getElementById('root')!).render(<App/>)
