import { GuideDock } from './GuideDock'
import { consumeLoginIntent } from './login-intent'
import { VisitorJourney, VisitorTools } from './VisitorPages'
import { UserGuide, ResultOrientation } from './UserGuide'
import { describeDomainScore, domainGuidance } from './user-guidance'
import { NotificationCenter } from './notification-center'
import { trackUsage, useUsageAnalytics } from './usage-analytics'
import { enqueueAssessmentEvent, useAssessmentEvents } from './assessment-events'
import { AppMessages } from './app-messages'
import { confirmAction } from './app-messages'
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { User } from '@supabase/supabase-js'
import { createRoot } from 'react-dom/client'
import { Activity, ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronLeft, Clock3, Copy, Download, ExternalLink, Heart, Lightbulb, LockKeyhole, Menu, Moon, RotateCcw, Share2, ShieldCheck, Smartphone, Sparkles, Target, X, BrainCircuit, Play, UserRound } from 'lucide-react'
import { domains, questions, options, domainScore, totalScore, getBand, recommendBooks, prioritizedRecommendations, sources, type AnswerMap } from './data'
import { arabicVideos } from './personalization'
import { AccountGate } from './AccountGate'
import { PremiumContent } from './PremiumContent'
import { ProProvider, ProBoundary, AdminNavButton, AccessBadge } from './pro-access'
import { ProDashboard } from './ProDashboard'
import { AdminPage } from './AdminPage'
import { LibraryPage, JourneyPage } from './FeaturePages'
import { screenFromHash, routeHash, type AppScreen } from './app-routing'
import { AuthPage } from './AuthPage'
import { AccountPage } from './AccountPage'
import { snapshotKey, validatedAssessment, type SavedAssessment } from './assessment-history'
import { supabase } from './supabase'
import { clearGoogleRedirect, hasGoogleAuthError, isGoogleRedirect } from './auth-urls'
import './style.css'
import './ui-polish.css'

const ArticlesPage=lazy(()=>import('./ArticlesPage').then(module=>({default:module.ArticlesPage})))
const PracticePage=lazy(()=>import('./PracticePage').then(module=>({default:module.PracticePage})))
type Screen = AppScreen
const KEY = 'mindreset-assessment-v1'
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
function storageKey(key: string, owner: string): string {
  // Never display the previous signed-in person's local quiz to the next account.
  return owner === 'guest' ? key : `${key}:user:${owner}`
}
function readStored(owner: string): AnswerMap {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey(KEY,owner)) || '{}')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(Object.entries(parsed).filter(([id,value]) => questions.some(q=>q.id===id) && typeof value==='number' && Number.isInteger(value) && value>=0 && value<=4))
  } catch { return {} }
}
export function App() {
  const [screen,setScreen]=useState<Screen>(()=>isGoogleRedirect(window.location.search)?'auth':screenFromHash(window.location.hash)??'home')
  const [user,setUser]=useState<User|null>(null)
  const [authChecking,setAuthChecking]=useState(true)
  const [oauthError,setOauthError]=useState(()=>hasGoogleAuthError(window.location.search,window.location.hash))
  const [storageOwner,setStorageOwner]=useState('guest')
  const storageOwnerRef=useRef('guest')
  const [answers,setAnswers]=useState<AnswerMap>({})
  const [index,setIndex]=useState(0)
  const [showMenu,setShowMenu]=useState(false)
  const [feedback,setFeedback]=useState('')
  const [storageWarning,setStorageWarning]=useState('')
  useAssessmentEvents(user?.id)
  useUsageAnalytics(user?.id,screen)
  useEffect(()=>{
    if (!supabase) {setAuthChecking(false);return}
    let mounted = true
    const syncUser=(nextUser:User|null)=>{
      if (!mounted) return
      const owner=nextUser?.id ?? 'guest'
      if (storageOwnerRef.current !== owner) {
        storageOwnerRef.current=owner
        setStorageOwner(owner)
        setAnswers(nextUser?readStored(owner):{})
        setIndex(0)
      }
      setUser(nextUser)
      // The callback URL alone proves nothing. Only a verified Supabase
      // session permits entry into the personal dashboard.
      if (nextUser && isGoogleRedirect(window.location.search)) {
        setOauthError(false)
        setScreen(consumeLoginIntent())
        clearGoogleRedirect()
      }
    }
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event,session)=>{
      syncUser(session?.user ?? null)
    })
    void supabase.auth.getUser().then(({data})=>{
      if(!mounted)return
      syncUser(data.user ?? null)
      setAuthChecking(false)
      if (hasGoogleAuthError(window.location.search,window.location.hash)||(!data.user&&isGoogleRedirect(window.location.search))) {
        setOauthError(true)
        setScreen('auth')
        clearGoogleRedirect()
      }
    }).catch(()=>{
      if(!mounted)return
      syncUser(null);setAuthChecking(false)
      if (isGoogleRedirect(window.location.search)) {
        setOauthError(true)
        setScreen('auth')
        clearGoogleRedirect()
      }
    })
    return ()=>{mounted=false;subscription.unsubscribe()}
  },[])
  useEffect(()=>{if(storageOwner==='guest')return;try{localStorage.setItem(storageKey(KEY,storageOwner),JSON.stringify(answers));setStorageWarning('')}catch{setStorageWarning('الحفظ على الجهاز مش متاح. تقدر تكمّل الاختبار، لكن احفظ النتيجة في حسابك قبل ما تقفل الصفحة.')}},[answers,storageOwner])
  useEffect(()=>{window.scrollTo({top:0,behavior:'instant'})},[screen,index])
  useEffect(()=>{
    const fromHistory=()=>{const next=screenFromHash(window.location.hash);if(next)setScreen(next);else if(!window.location.hash)setScreen('home');setShowMenu(false)}
    window.addEventListener('popstate',fromHistory);window.addEventListener('hashchange',fromHistory)
    return()=>{window.removeEventListener('popstate',fromHistory);window.removeEventListener('hashchange',fromHistory)}
  },[])
  useEffect(()=>{
    if(authChecking||screen==='auth')return
    const next=routeHash(screen)
    if(window.location.hash!==next&&!window.location.hash.startsWith(next+'?')&&!(screen==='home'&&!window.location.hash))window.history.pushState({mindresetScreen:screen},'',window.location.pathname+window.location.search+next)
    const heading=document.querySelector<HTMLElement>('#main-content h1')
    if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true})}
  },[screen,authChecking,user?.id])
  useEffect(()=>{if(!showMenu)return;const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setShowMenu(false)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[showMenu])

  const answered=Object.keys(answers).length
  const question=questions[index]
  const score=totalScore(answers)
  const band=getBand(score)
  const ranked=useMemo(()=>[...domains].map(d=>({...d,score:domainScore(answers,d.id)})).sort((a,b)=>b.score-a.score),[answers])
  const suggestedSteps=useMemo(()=>prioritizedRecommendations(answers).slice(0,3),[answers])
  const videos=arabicVideos
  const booksForYou=useMemo(()=>recommendBooks(answers),[answers])
  const allAnswered=answered===questions.length
  const currentCandidate = allAnswered ? validatedAssessment(answers) : null
  const guestCandidate = user ? validatedAssessment(readStored('guest')) : null
  function openAccount() {
    if (user) setScreen('account')
    else { setOauthError(false); setScreen('auth') }
    setShowMenu(false)
  }
  async function viewSavedAssessment(snapshot: SavedAssessment) {
    const savedAnswers = validatedAssessment(snapshot.answers)
    if (!savedAnswers || snapshot.user_id !== user?.id) {
      setFeedback('تعذّر فتح النتيجة القديمة. جرّب تحديث السجل.')
      return
    }
    if (Object.keys(answers).length && snapshotKey(answers) !== snapshotKey(savedAnswers) &&
      !await confirmAction('فتح النتيجة القديمة هيستبدل إجابات اختبارك الحالي وخطة متابعتك على الجهاز فقط. النسخ المحفوظة في حسابك هتفضل زي ما هي. تكمل؟')) return
    setAnswers(savedAnswers)
    setScreen('results')
    setFeedback('دي نتيجة محفوظة من اختبار سابق. تقدر تشوف تحليل إجاباتك بالكامل.')
  }
  function startQuiz() {
    void trackUsage(user?.id,'test_started','quiz')
    const missing=questions.findIndex(q=>answers[q.id]===undefined)
    setIndex(missing>=0?missing:0)
    setScreen('quiz')
  }
  // Selection only updates the current question. Never switch questions from a choice click:
  // automatic transitions can register a second tap on the next question on touch screens.
  function selectAnswer(questionId: string, value: number) {
    setAnswers(previous=>({...previous,[questionId]:value}))
  }
  function goNext() {
    if (answers[question.id] === undefined) return
    if (index < questions.length - 1) {
      setIndex(current=>Math.min(current+1,questions.length-1))
      return
    }
    // A complete response is required even if the user skipped questions previously.
    const missing=questions.findIndex(item=>answers[item.id]===undefined)
    if (missing>=0) {
      setIndex(missing)
      return
    }
    if(user){enqueueAssessmentEvent(user.id);void trackUsage(user.id,'test_completed','results')}
    setScreen('results')
  }
  async function reset(){
    if(!await confirmAction('متأكد إنك عايز تبدأ من جديد؟ إجاباتك الحالية هتتمسح.'))return
    setAnswers({});setIndex(0);setScreen('quiz')
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
  function openReportSection(id:string){const target=document.getElementById(id);const details=target?.closest('details');if(details)details.open=true;target?.scrollIntoView({behavior:'smooth'})}
  useEffect(()=>{
    const previous=new Map<HTMLDetailsElement,boolean>()
    const before=()=>{document.querySelectorAll<HTMLDetailsElement>('details.guided-details').forEach(item=>{if(!previous.has(item))previous.set(item,item.open);item.open=true})}
    const after=()=>{previous.forEach((open,item)=>{item.open=open});previous.clear()}
    window.addEventListener('beforeprint',before);window.addEventListener('afterprint',after)
    return()=>{window.removeEventListener('beforeprint',before);window.removeEventListener('afterprint',after);after()}
  },[])
  async function copy(){
    try { await navigator.clipboard.writeText(shareText);setFeedback('اتنسخت النتيجة بنجاح') }
    catch { setFeedback('النسخ مش متاح في المتصفح ده. جرب مشاركة النتيجة.') }
  }
  return (
    <AccountGate user={user} loading={authChecking} oauthError={oauthError} required={['quiz','results','admin'].includes(screen)} forQuiz={screen==='quiz'} onBack={()=>{consumeLoginIntent();setScreen('home')}}><ProProvider key={user?.id} owner={user?.id} onUpgrade={()=>{setScreen('tools');setShowMenu(false)}}><div className="app-shell"><AppMessages/><GuideDock screen={screen} onGuide={()=>setScreen('guide')}/>{user&&<NotificationCenter key={user.id} owner={user.id}/>}
      <a className="skip-link" href="#main-content" onClick={event=>{event.preventDefault();document.getElementById('main-content')?.focus()}}>انتقل للمحتوى</a>
      <header className="site-header">
        <div className="container nav">
          <button className="brand" onClick={()=>setScreen('home')} aria-label="الصفحة الرئيسية">
            <span className="brand-icon"><BrainCircuit size={23}/></span>
            <span>mind<span className="brand-accent">reset</span><small>افهم عاداتك الرقمية</small></span>
          </button>
          <nav id="main-navigation" className={showMenu?'nav-links open':'nav-links'} aria-label="القائمة الرئيسية">
            <button onClick={()=>{setScreen('home');setShowMenu(false)}} aria-current={screen==='home'?'page':undefined} className={screen==='home'?'active':''}>الرئيسية</button>
            <button onClick={async()=>{if(allAnswered)setScreen('results');else startQuiz();setShowMenu(false)}} aria-current={screen==='results'||screen==='quiz'?'page':undefined} className={screen==='results'||screen==='quiz'?'active':''}>{allAnswered?'نتيجتي':'الاختبار'}</button>
            <button onClick={()=>{setScreen('library');setShowMenu(false)}} aria-current={screen==='library'?'page':undefined} className={screen==='library'?'active':''}>الحلول</button>
            <button onClick={()=>{setScreen('journey');setShowMenu(false)}} aria-current={screen==='journey'?'page':undefined} className={screen==='journey'?'active':''}>خطتي</button>
            <button className={screen==='tools'?'active pro-nav':'pro-nav'} onClick={()=>{setScreen('tools');setShowMenu(false)}} aria-current={screen==='tools'?'page':undefined}>أدواتي</button>
            <button onClick={()=>{setScreen('guide');setShowMenu(false)}} aria-current={screen==='guide'?'page':undefined} className={screen==='guide'?'active':''}>إرشادات</button>
            <button onClick={()=>{setScreen('articles');setShowMenu(false)}} aria-current={screen==='articles'?'page':undefined} className={screen==='articles'?'active':''}>مقالات</button>
            <AdminNavButton active={screen==='admin'} onClick={()=>{setScreen('admin');setShowMenu(false)}}/>
          </nav>
          <div className="nav-actions">
            <button className="nav-start" onClick={startQuiz}>{answered>0 && !allAnswered?'كمّل اختبارك':'ابدأ الاختبار'} <ArrowLeft size={17}/></button>
            <button className="nav-account" onClick={openAccount} aria-label={user?'حسابي':'تسجيل الدخول'}><UserRound size={17}/><span>{user?'حسابي':'دخول بـ Google'}</span><AccessBadge/></button>
            <button className="menu-toggle" aria-controls="main-navigation" aria-expanded={showMenu} onClick={()=>setShowMenu(p=>!p)} aria-label={showMenu?'قفل القائمة':'افتح القائمة'}>{showMenu?<X/>:<Menu/>}</button>
          </div>
        </div>
        {showMenu&&<button className="nav-backdrop" aria-label="إغلاق القائمة" onClick={()=>setShowMenu(false)}/>}
      </header>
      <main id="main-content" className={'main-content page-'+screen} tabIndex={-1}>
        {storageWarning&&<div className="container workspace-error" role="status">{storageWarning}</div>}
        {screen==='articles'&&<Suspense fallback={<div className="container workspace-status" role="status">بنحمّل المقالات...</div>}><ArticlesPage/></Suspense>}
        {screen==='practice'&&<Suspense fallback={<div className="container workspace-status" role="status">بنحمّل التدريب...</div>}><PracticePage key={user?.id??'guest'} owner={user?.id} answers={currentCandidate} onQuiz={startQuiz}/></Suspense>}
        {screen==='guide'&&<UserGuide hasResult={allAnswered} onQuiz={startQuiz} onResult={()=>setScreen('results')} onPlan={()=>setScreen('journey')}/>}
        {screen==='home' && <>
          <section className="hero container">
            <div className="hero-copy">
              <span className="eyebrow"><span className="pulse-dot"/> وقت تعرف علاقتك بالموبايل بوضوح</span>
              <h1>الموبايل في إيدك...<br/><span className="highlight">ولا واخد وقتك؟</span></h1>
              <p className="hero-lead">بتتشتت بسرعة؟ بتفتح الريلز من غير ما تحس؟ ولا بس عايز تطمّن على عاداتك؟ جاوب على شوية أسئلة بسيطة، وهنساعدك تفهم الصورة.</p>
              <div className="hero-actions">
                <button className="btn btn-primary" onClick={startQuiz}>{answered>0 && !allAnswered?'كمّل من مكانك':'يلا نبدأ الاختبار'} <ArrowLeft size={20}/></button>
                <button className="btn btn-soft" onClick={()=>setScreen('guide')}>أبدأ منين؟ <ChevronLeft size={19}/></button>
              </div>
              <div className="hero-proof"><span><Clock3 size={16}/> حوالي 5 دقايق</span><span><LockKeyhole size={16}/> التصفح من غير حساب</span><span><CheckCircle2 size={16}/> نتيجتك فورًا</span></div>
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
            <div className="section-top"><span className="section-kicker">ببساطة شديدة</span><h2>3 خطوات وتكون فاهم نفسك أكتر</h2><p>تصفّح براحتك من غير حساب. التسجيل مطلوب عند بدء الاختبار، وكل المميزات مجانية.</p></div>
            <div className="steps-grid">{steps.map((step,i)=><div className="step-card" key={step}><span className="step-number">0{i+1}</span><div className="step-symbol">{i===0?<Target/>:i===1?<Activity/>:<Lightbulb/>}</div><h3>{step}</h3><p>{['30 سؤال قصير، على قد يومك الحقيقي.','نقاط قوتك والحاجات اللي ممكن تحسنها.','نصايح واقعية مناسبة لإجاباتك.'][i]}</p></div>)}</div>
          </section>
          <section className="container domains-section">
            <div className="section-top"><span className="section-kicker">هنبص على إيه؟</span><h2>مش كله «وقت شاشة» وبس</h2><p>6 جوانب تساعدك تفهم نمط استخدامك — من غير أحكام مسبقة.</p></div>
            <div className="domain-grid">{domains.map(d=><div className="domain-tile" key={d.id}><div className="domain-icon"><IconFor name={d.icon}/></div><strong>{d.title}</strong><p>{d.description}</p></div>)}</div>
          </section>
          <section className="container final-cta"><div><span className="section-kicker">جاهز تجرّب؟</span><h2>5 دقايق ممكن يفتحوا عينك على عاداتك</h2><p>بدل ما تحكم على نفسك، افهم نفسك الأول.</p></div><button onClick={startQuiz} className="btn btn-primary">ابدأ دلوقتي <ArrowLeft size={20}/></button></section>
        </>}
        {screen==='quiz' && <section className="quiz-layout container">
          <div className="quiz-topline"><button className="quiet-button" onClick={()=>setScreen('home')}><X size={18}/> {storageWarning?'خروج من الاختبار':'خروج وحفظ التقدم'}</button><button className="quiet-button quiz-restart" onClick={reset}><RotateCcw size={15}/> ابدأ من الأول</button></div>
          <div className="quiz-card">
            <div className="quiz-heading"><span className="section-kicker">{domains.find(d=>d.id===question.domain)?.title}</span><span className="question-counter">سؤال <b>{index+1}</b> من {questions.length}</span></div>
            <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={index+1} aria-label="تقدم الاختبار"><span style={{width:`${((index+1)/questions.length)*100}%`}}/></div>
            <h1 className="question-title">{question.text}</h1>
            <p className="quiz-help">فكّر في آخر 14 يوم، واختار أقرب إجابة ليك. بعدها اضغط «التالي».</p>
            <div className="answer-list" key={question.id}>{options.map((o,i)=><button type="button" aria-pressed={answers[question.id]===o.value} className={answers[question.id]===o.value?'answer-option selected':'answer-option'} key={`${question.id}-${o.value}`} onClick={()=>selectAnswer(question.id,o.value)}><span className="answer-index">{['أ','ب','ج','د','هـ'][i]}</span><span>{o.label}</span><span className="radio-circle">{answers[question.id]===o.value?<Check size={16}/>:null}</span></button>)}</div>
            <div className="quiz-footer"><button type="button" className="quiz-back" disabled={index===0} onClick={()=>setIndex(n=>n-1)}><ArrowRight size={18}/> السابق</button><button type="button" className="quiz-next" disabled={answers[question.id]===undefined} onClick={goNext}>{index===questions.length-1?'شوف نتيجتك':'التالي'} <ArrowLeft size={19}/></button></div>
          </div>
          <p className="quiz-bottom-note">خد وقتك. كل إجابة بتساعدنا نديك تحليل أقرب لعاداتك.</p>
        </section>}
        {screen==='results' && allAnswered && <div className="container results-page">
          <div className="results-intro"><span className="section-kicker">خلصت! عاش إنك كملت 👏</span><h1>نتيجتك</h1><p>النتيجة بتلخّص إجاباتك عن آخر 14 يوم، مش بتحدد ذكاءك أو «نسبة ضرر دماغك».</p></div>
          <div className="results-grid">
            <article className="score-card"><span className="card-eyebrow">مجموع مؤشرات الصعوبات في إجاباتك</span><div className="score-ring" style={{'--amount':`${score/120*100}%`} as CSSProperties}><div><strong>{score}</strong><span>من 120</span></div></div><p className="score-explanation"><strong>الأقل يعني صعوبات أقل، مش قدرة أقل.</strong></p><div className="band-pill">{band.title}</div><p>{band.note}</p><small>تصنيفات وصفية من تصميم الموقع، مش حدود تشخيصية معتمدة.</small></article>
            <article className="breakdown-card"><div className="card-heading"><h2>تفصيل المحاور</h2><span>0–20 · الأعلى = صعوبات أكثر</span></div>{ranked.map(d=><div className="score-line" key={d.id}><div className="score-name"><span><IconFor name={d.icon} size={17}/>{d.title}</span><b>{d.score}<small>/20</small></b></div><div className="bar-track"><span style={{width:`${d.score*5}%`}} className={d.score>=12?'bar-high':d.score>=7?'bar-mid':'bar-low'}/></div><p className="score-explanation"><span className={'score-status '+describeDomainScore(d.score).tone}>{describeDomainScore(d.score).label}</span> {domainGuidance[d.id].meaning}</p></div>)}</article>
          </div>

          <div className="result-next-action"><p>الدرجة الأقل تعني صعوبات أقل في إجاباتك.<br/>جاهز تبدأ؟ خطوة واحدة من خطتك كفاية النهارده.</p><button className="btn btn-primary" onClick={()=>setScreen('journey')}>ابدأ بخطة الـ14 يوم <ArrowLeft size={17}/></button></div>
          <div className="result-shortcuts"><button className="result-save-shortcut" onClick={openAccount}><LockKeyhole size={16}/>احفظ نسخة من نتيجتك · اختياري</button></div>
          <nav className="report-navigation" aria-label="أقسام التقرير"><button onClick={()=>openReportSection('report-analysis')}>التحليل المفصّل</button><button onClick={()=>openReportSection('resources')}>الكتب والمصادر</button></nav>
          <details className="guided-details" id="result-next-steps"><summary>افهم نتيجتك واختار أول خطوة<small>شرح إضافي حسب إجاباتك، افتحه وقت ما تحتاجه.</small></summary><div className="guided-details-body">
          <ResultOrientation answers={answers} onPlan={()=>setScreen('journey')} onGuide={()=>setScreen('guide')}/>          </div></details>
          <details className="guided-details"><summary>أفكار إضافية لما تحتاجها<small>اختار فكرة واحدة؛ مش مطلوب تعملهم كلهم.</small></summary><section className="free-actions guided-details-body" id="free-actions"><div className="section-top"><span className="section-kicker">خطواتك الأولى</span><h2>3 خطوات تقدر تجربها</h2></div><div className="advice-grid">{suggestedSteps.map(step=><article className="advice-card" key={step.title}><h3>{step.title}</h3><p>{step.description}</p><div className="reading-next">{step.action}</div></article>)}</div></section></details>
          <details className="guided-details" id="report-analysis"><summary>افتح التحليل المفصّل لإجاباتك<small>تفسير كل إجابة والأنماط المشتركة، لو حابب تتعمّق.</small></summary><div className="guided-details-body"><ProBoundary title="افتح تفسير كل إجابة والأنماط المشتركة"><PremiumContent key={snapshotKey(answers)} kind="report" answers={answers}/></ProBoundary></div></details>
          <details className="guided-details" id="resources"><summary>فيديوهات وكتب ومصادر إضافية<small>اختياري. تقدر تبدأ خطتك من غير ما تقرأ أو تشوف كل ده.</small></summary><section className="more-help-section">
            <div className="section-top">
              <span className="section-kicker">لو حابب تتعمق شوية</span>
              <h2>فيديو وكتب تساعدك تكمل</h2>
              <p>اختيارات تساعدك تفهم عاداتك وتجرب حلول بسيطة، مش بديل عن تقييم متخصص لو عندك مشكلة مستمرة.</p>
            </div>

            <div className="video-library">
              {videos.map((video,i)=><a className={'video-resource '+(i===0?'featured-video':'')} key={video.id} href={video.url} target="_blank" rel="noopener noreferrer">
                <div className="video-poster">
                  <img src={'https://i.ytimg.com/vi/'+video.id+'/hqdefault.jpg'} loading="lazy" alt={'صورة فيديو '+video.title} />
                  <div className="video-play"><Play size={i===0?24:20} fill="currentColor" aria-hidden="true"/></div>
                  <span className="video-youtube">YouTube</span>
                </div>
                <div className="video-description">
                  <span className="video-eyebrow"><Sparkles size={15}/>{i===0?'للتوعية والتجربة':'فيديو عربي إضافي'}</span>
                  <h3>{video.title}</h3>
                  <small className="video-creator">{video.creator}</small>
                  <p>{video.description}</p>
                  <span className="video-link">افتح الفيديو <ExternalLink size={16}/></span>
                  <small className="video-note">{video.note}</small>
                </div>
              </a>)}
            </div>
            <p className="video-education-note">الفيديوهات للتثقيف والتحفيز فقط؛ المحتوى المرئي مش بديل عن الأبحاث، ومش كل الكلام عن «الدوبامين ديتوكس» دقيق علميًا.</p>
            <div className="recommended-books-header">
              <div><span className="section-kicker">على حسب إجاباتك</span><h3>كتب ممكن تفيدك</h3></div>
              <span>ابدأ بكتاب واحد بس</span>
            </div>
            <div className="recommended-book-grid">
              {booksForYou.map((book,i)=><a className="recommended-book-card" key={book.id} href={book.url} target="_blank" rel="noopener noreferrer">
                <div className={`recommended-book-cover book-cover-${book.color}`} aria-hidden="true">
                  <BookOpen size={24} />
                  <span className="cover-rule"/>
                  <strong dir="ltr">{book.title}</strong>
                  <small dir="ltr">{book.author.split(',')[0]}</small>
                </div>
                <div className="recommended-book-info">
                  <span className="recommended-book-label">{i===0?'ترشيحنا الأول':'مناسب ليك'} · {book.label}</span>
                  <h4 dir="ltr">{book.title}</h4>
                  <small dir="ltr">{book.author}</small>
                  <p>{book.why}</p>
                  <span className="book-mini-action"><CheckCircle2 size={14}/>{book.tryThis}</span>
                  <span className="book-details-link">اعرف أكتر عن الكتاب <ExternalLink size={14}/></span>
                </div>
              </a>)}
            </div>
            <p className="resources-footnote">الكتب دي ترشيحات قراءة، مش علاج علمي مُعتمد. اختيارها حسب المحاور الأعلى في إجاباتك، مش تشخيص لحالتك.</p>
          </section>
          </details><div className="quick-start"><div><h2>خطوتك الجاية: جرّب حاجة واحدة</h2><p>جهّز خطة من إجاباتك، أو اختار تمرينًا من المكتبة، أو ابدأ جلسة تركيز.</p></div><div className="pro-actions"><button className="btn btn-primary" onClick={()=>setScreen('journey')}>جهّز خطتي</button><button className="btn btn-soft" onClick={()=>setScreen('tools')}>افتح أدواتي</button></div></div>
          <div className="results-actions"><button className="btn btn-soft" onClick={share}><Share2 size={18}/> شارك نتيجتك</button><button className="btn btn-soft" onClick={copy}><Copy size={18}/> انسخ الملخص</button><button className="btn btn-soft" onClick={()=>window.print()}><Download size={18}/> احفظ PDF</button><button className="btn btn-outline" onClick={reset}><RotateCcw size={17}/> إعادة الاختبار</button></div>
          {feedback && <p className="feedback" role="status">{feedback}</p>}
          <p className="results-disclaimer"><ShieldCheck size={17}/> لو صعوبات التركيز أو النوم مؤثرة على حياتك بشكل واضح ومستمر، الأفضل تكلم مختص. الاختبار مش بديل عن تقييم طبي أو نفسي.</p>
        </div>}
        {screen==='results' && !allAnswered && <section className="container empty-result"><h1>لسه عندك شوية أسئلة</h1><p>كمّل الاختبار الأول عشان يطلعلك التقرير.</p><button className="btn btn-primary" onClick={startQuiz}>كمّل الأسئلة <ArrowLeft size={18}/></button></section>}
        {screen==='auth' && <AuthPage oauthError={oauthError} onBack={()=>{clearGoogleRedirect();consumeLoginIntent();setOauthError(false);setScreen('home')}}/>}
        {screen==='account' && (user ? <AccountPage user={user} onBack={()=>setScreen('home')} onViewSaved={viewSavedAssessment} onJourney={()=>setScreen('journey')} currentCandidate={currentCandidate} guestCandidate={guestCandidate}/> : <AuthPage onBack={()=>setScreen('home')}/>)}
        {screen==='library' && <LibraryPage publicView={!user} answers={currentCandidate} onQuiz={startQuiz}/>}
        {screen==='journey' && !user && <VisitorJourney onQuiz={startQuiz}/>}
        {screen==='journey' && user && <JourneyPage owner={storageOwner} answers={currentCandidate} onQuiz={()=>allAnswered?reset():startQuiz()} onLogin={openAccount}/>}
        {screen==='tools' && !user && <VisitorTools onQuiz={startQuiz}/>}
        {screen==='tools' && user && <ProBoundary><ProDashboard key={user.id} owner={user.id}/></ProBoundary>}
        {screen==='admin' && user && <AdminPage owner={user.id} onOpenTools={()=>setScreen('tools')}/>}
        {screen==='science' && <div className="container science-page">
          <span className="section-kicker">من الآخر، وبوضوح</span><h1>الموقع ده مبني على إيه؟</h1>
          <p className="science-lead">مصطلح «تعفن الدماغ» أو Brain Rot تعبير منتشر، مش اسم مرض أو تشخيص طبي. عشان كده هنا بنقيّم عادات وسلوكيات بيبلغ عنها الشخص بنفسه، مش بنقيس صحة دماغه.</p>
          <section className="books-feature" aria-labelledby="books-title">
            <div className="books-heading"><span className="section-kicker">منين جت أفكار الحلول؟</span><h2 id="books-title">كتب استلهمنا منها خطوات بسيطة</h2><p>اختارنا أفكار عملية من الكتب دي عشان تساعدك في التركيز وتنظيم وقتك والتعلّم بشكل أفضل.</p></div>
            <div className="books-grid">{books.map(book=><article className="book-card" key={book.title}><div className="book-visual"><span>{book.mark}</span><BookOpen size={30}/></div><div className="book-detail"><span className="book-tag">{book.tag}</span><h3 lang="en" dir="ltr">{book.title}</h3><strong>{book.subtitle}</strong><small lang="en" dir="ltr">{book.author}</small><p>{book.description}</p></div></article>)}</div>
          </section>
          <div className="science-grid"><div className="science-info"><Target/><h3>إيه اللي بنقيسه؟</h3><p>تصورك الشخصي عن التركيز، والتصفح، والملل، والتعلّم، والنوم، وتأثير الاستخدام على يومك خلال آخر 14 يوم.</p></div><div className="science-info"><Activity/><h3>إزاي بتتحسب النتيجة؟</h3><p>كل إجابة من 0 إلى 4. خمس أسئلة لكل محور (0–20)، والإجمالي 0–120. كل ما النتيجة زادت، الصعوبات المبلّغ عنها زادت. دي مش نسبة مئوية لتلف الدماغ.</p></div><div className="science-info"><Heart/><h3>إزاي بنقترح حلول؟</h3><p>بنبدأ بالجوانب اللي جابت درجات أعلى ونختار خطوات عملية، مع روابط للمراجع. النتيجة مش بتقدر تحدد أسباب المشكلة أو تستبعد أي حالة طبية.</p></div><div className="science-info"><LockKeyhole/><h3>خصوصيتك</h3><p>إجاباتك محفوظة محليًا في متصفحك لاستكمال الاختبار. إجاباتك بتفضل على جهازك، إلا لو اخترت تحفظ النتيجة أو تبدأ خطة في حسابك. مشاركة النتيجة برضه باختيارك.</p></div></div>
          <div className="sources-section"><div className="section-top"><span className="section-kicker">القراءة والمصادر</span><h2>دراسات ومصادر للنصايح</h2><p>ومع الكتب، بنرجع لأبحاث ومصادر موثوقة تدعم بعض التوصيات. مش معنى كده إن أسئلة الاختبار نفسها مقياس معتمد.</p></div>{sources.map(s=><a className="source-row" href={s.url} target="_blank" rel="noopener noreferrer" key={s.id}><div className="source-icon"><BookOpen size={20}/></div><div><strong>{s.title}</strong><small>{s.by}</small><p>{s.summary}</p></div><ExternalLink size={17}/></a>)}</div>
          <div className="science-bottom"><h2>خلينا نفهم عاداتك من غير أحكام.</h2><button className="btn btn-primary" onClick={startQuiz}>ابدأ الاختبار <ArrowLeft size={18}/></button></div>
        </div>}
      </main>
      <footer className="footer"><div className="container footer-inner"><div className="footer-brand"><BrainCircuit size={21}/> <strong>mindreset</strong><span>افهم عاداتك. اختار براحتك.</span></div><div className="footer-links"><button onClick={()=>setScreen('articles')}>مقالات عن التعفن</button><button onClick={()=>setScreen('practice')}>تدريبات MCQ</button><button onClick={()=>setScreen('guide')}>إرشادات الاستخدام</button><button onClick={()=>setScreen('science')}>العلم والمصادر</button><button onClick={()=>setScreen('home')}>الرئيسية</button><a href="/privacy.html">سياسة الخصوصية</a></div><div className="footer-credit"><p>تقييم ذاتي للتوعية فقط — مش تشخيص طبي. © {new Date().getFullYear()} MindReset</p><span>Developed by <strong>Gerges Remon</strong></span></div></div></footer>
    </div></ProProvider></AccountGate>
  )
}
const mount=document.getElementById('root')
if(mount)createRoot(mount).render(<App/>)

