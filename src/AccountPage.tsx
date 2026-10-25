import { confirmAction } from './app-messages'
import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { ArrowLeft, BookOpenCheck, CalendarDays, CheckCircle2, CloudUpload, History, LogOut, Mail, Pencil, RefreshCcw, ShieldCheck, Trash2, UserRound } from 'lucide-react'
import { domains, domainScore, getBand, type AnswerMap } from './data'
import { deleteSavedAssessment, listSavedAssessments, saveAssessment, snapshotKey, type SavedAssessment } from './assessment-history'
import { ProBoundary } from './pro-access'
import { supabase } from './supabase'
import { loadDisplayName, saveDisplayName, validDisplayName } from './account-profile'

type AccountPageProps = {
  user: User
  onJourney: () => void
  onBack: () => void
  onViewSaved: (snapshot: SavedAssessment) => void
  currentCandidate: AnswerMap | null
  guestCandidate: AnswerMap | null
}

function formatDate(timestamp:string) {
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime())
    ? 'تاريخ غير متاح'
    : new Intl.DateTimeFormat('ar-EG',{day:'numeric',month:'long',year:'numeric'}).format(date)
}

export function AccountPage({user,onBack,onViewSaved,onJourney,currentCandidate,guestCandidate}:AccountPageProps) {
  const [records,setRecords]=useState<SavedAssessment[]>([])
  const [loading,setLoading]=useState(true)
  const [pending,setPending]=useState('')
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const [editingName,setEditingName]=useState(false)
  const [displayName,setDisplayName]=useState<string>('')
  const [draftName,setDraftName]=useState<string>('')


  const userId=user.id
  useEffect(()=>{
    let mounted=true
    const metadata = user.user_metadata ?? {}
    // Google OAuth returns "full_name" or "name", while manual profiles use "display_name".
    // These are display-only values, never authorization or subscription claims.
    const suggested = [metadata.display_name,metadata.full_name,metadata.name]
      .find(value=>typeof value==='string' && value.trim().length>0)
    const fallback = typeof suggested==='string' ? suggested.trim().slice(0,80) : ''
    setDisplayName(fallback)
    setDraftName(fallback)
    void loadDisplayName(userId).then(name=>{
      if(!mounted||!name)return
      setDisplayName(name)
      setDraftName(name)
    }).catch(()=>{/* The account remains usable if the optional profile row is missing. */})
    return ()=>{mounted=false}
  },[userId])
  useEffect(()=>{
    let alive=true
    setRecords([])
    setLoading(true)
    setError('')
    void listSavedAssessments(userId).then(items=>{
      if(alive) setRecords(items)
    }).catch(()=>{
      if(alive) setError('مش قادرين نحمّل سجل الاختبارات دلوقتي. راجع الاتصال أو جرّب تحديث السجل.')
    }).finally(()=>{if(alive) setLoading(false)})
    return ()=>{alive=false}
  },[userId])

  const stats=useMemo(()=>{
    if (!records.length) return null
    const oldest=records[records.length-1]
    const latest=records[0]
    const difference=latest.total_score-oldest.total_score
    return {latest:latest.total_score,difference,count:records.length}
  },[records])

  async function saveName() {
    if(pending) return
    const cleaned=validDisplayName(draftName)
    if(!cleaned) {
      setError('اسم الحساب لازم يكون بين حرفين و80 حرف.')
      return
    }
    setPending('name');setError('');setNotice('')
    try{
      const saved=await saveDisplayName(userId,cleaned)
      setDisplayName(saved)
      setDraftName(saved)
      setEditingName(false)
      setNotice('اسمك اتحدث على حسابك بنجاح.')
    }catch{
      setError('تعذّر تحديث الاسم. اتأكد من الاتصال وتسجيل الدخول وجرب تاني.')
    }finally{setPending('')}
  }

  async function deleteProData() {
    if(pending||!await confirmAction('هتمسح كل الأهداف والجلسات والملاحظات والخطط وبيانات أدواتك من حسابك نهائيًا. نتائج الاختبارات هتفضل موجودة. متأكد؟'))return
    setPending('pro-delete');setError('');setNotice('')
    try{if(!supabase)throw new Error('login-required');const {error}=await supabase.rpc('delete_my_pro_data');if(error)throw error;setNotice('بيانات أدواتك وخططها اتمسحت من حسابك.')}
    catch{setError('تعذّر مسح بياناتك. جرب تاني بعد مراجعة الاتصال.')}
    finally{setPending('')}
  }

  async function deleteAllRecords() {
    if(pending || records.length===0 || !await confirmAction('هتمسح كل نتائج الاختبارات المحفوظة على السحابة من حسابك نهائيًا. ده مش بيمسح إجابات جهازك. متأكد؟'))return
    setPending('delete-all');setError('');setNotice('')
    try {
      if(!supabase)throw new Error('auth-unavailable')
      const {data,error:identityError}=await supabase.auth.getUser()
      if(identityError || data.user?.id!==userId)throw new Error('login-required')
      const {error:deleteError}=await supabase.rpc('delete_my_assessment_history')
      if(deleteError)throw deleteError
      setRecords([])
      setNotice('تم مسح كل النتائج المحفوظة من حسابك.')
    }catch{
      setError('تعذّر مسح النتائج. لم نعتبر العملية ناجحة؛ جرب تحديث السجل.')
    }finally{setPending('')}
  }

  async function refresh() {
    if (pending) return
    setPending('refresh')
    setError('')
    try {
      setRecords(await listSavedAssessments(userId))
      setNotice('تم تحديث سجل نتائجك.')
    } catch {
      setError('تعذر تحديث السجل. جرب مرة تانية.')
    } finally {setPending('')}
  }

  async function saveCandidate(source:'current'|'guest') {
    const answers=source==='guest'?guestCandidate:currentCandidate
    if(!answers||pending) return
    const key=snapshotKey(answers)
    if(records.some(record=>snapshotKey(record.answers)===key)){
      setNotice('الإجابات دي محفوظة بالفعل في حسابك. تقدر تشوفها في سجل النتائج.')
      return
    }
    setPending(source)
    setError('');setNotice('')
    try {
      const saved=await saveAssessment(userId,answers)
      setRecords(previous=>[saved,...previous])
      setNotice(source==='guest'
        ? 'تم حفظ نتيجة اختبارك السابق في حسابك بعد موافقتك.'
        : 'نتيجتك اتحفظت في حسابك بنجاح، وتقدر ترجع لها من أي جهاز بعد تسجيل الدخول.')
    }catch{
      setError('حفظ النتيجة ما نجحش. اتأكد من تسجيل الدخول والاتصال بالإنترنت وجرب تاني.')
    }finally{setPending('')}
  }

  async function deleteRecord(record:SavedAssessment) {
    if(pending || !await confirmAction('متأكد إنك عايز تمسح النتيجة دي نهائيًا من حسابك؟ مش هتقدر تسترجعها.'))return
    setPending(record.id);setError('');setNotice('')
    try {
      await deleteSavedAssessment(userId,record.id)
      setRecords(previous=>previous.filter(item=>item.id!==record.id))
      setNotice('النتيجة اتمسحت من حسابك.')
    }catch{setError('مش قادرين نمسح النتيجة دلوقتي. جرب تاني.')}finally{setPending('')}
  }

  async function logout(){
    if(!supabase||pending)return
    setPending('logout');setError('');setNotice('')
    try{
      const {error:signOutError}=await supabase.auth.signOut()
      if(signOutError)throw signOutError
      onBack()
    }catch{setError('حصلت مشكلة أثناء تسجيل الخروج. جرب تاني.')}finally{setPending('')}
  }

  const readableName=displayName||'مستخدم MindReset'
  const currentSaved=currentCandidate && records.some(record=>snapshotKey(record.answers)===snapshotKey(currentCandidate))
  const guestSaved=guestCandidate && records.some(record=>snapshotKey(record.answers)===snapshotKey(guestCandidate))

  return <section className="account-dashboard container" aria-label="لوحة حسابي">
    <button type="button" className="auth-back" onClick={onBack}>الرجوع للموقع <ArrowLeft size={17}/></button>
    <div className="account-banner">
      <div className="account-avatar"><UserRound size={25}/></div>
      <div className="account-banner-copy">
        <span className="section-kicker">مساحتك الشخصية</span>
        <h1>أهلاً بيك، {readableName}</h1>
        <p>نتائجك محفوظة في حسابك فقط لما تختار حفظها بنفسك.</p>
        <div className="account-email"><Mail size={15}/><span dir="ltr">{user.email}</span>{user.email_confirmed_at && <CheckCircle2 size={16} aria-label="البريد مؤكد"/>}</div>
      </div>
      <div className="account-banner-icon"><ShieldCheck size={30}/><span>بيانات خاصة</span></div>
    </div>

    <div className="account-profile-line">
      {!editingName ? <><span>الاسم الظاهر في حسابك: <strong>{readableName}</strong></span><button type="button" className="account-profile-edit-btn" disabled={!!pending} onClick={()=>{setDraftName(displayName);setEditingName(true)}}><Pencil size={15}/> تعديل الاسم</button></> :
      <div className="account-profile-form"><label htmlFor="account-edit-name">اسم الحساب</label><input id="account-edit-name" autoComplete="name" maxLength={80} value={draftName} onChange={event=>setDraftName(event.target.value)} disabled={!!pending}/><button type="button" disabled={!!pending} onClick={()=>void saveName()}>حفظ</button><button type="button" disabled={!!pending} onClick={()=>setEditingName(false)}>إلغاء</button></div>}
    </div>
    <ProBoundary title="خطتك والأهداف والمتابعة"><div className="account-journey-banner"><div><span className="section-kicker">خطوتك الجاية</span><h2>كمّل خطتك، يوم بيوم</h2><p>ارجع لمسارك وملاحظاتك، أو جهّز خطة من آخر اختبار عملته.</p></div><button className="btn btn-primary" onClick={onJourney}><CalendarDays size={18}/> افتح خطتي</button></div></ProBoundary>
    <div className="account-overview-grid">
      <div className="account-stat"><History size={20}/><span>نتائج محفوظة</span><strong>{loading?'—':records.length}</strong></div>
      <div className="account-stat"><BookOpenCheck size={20}/><span>آخر نتيجة محفوظة</span><strong>{stats?stats.latest+'/120':'—'}</strong></div>
      <div className="account-stat"><CalendarDays size={20}/><span>التغير بين أقدم وآخر نتيجة بالسجل</span><strong>{stats&&stats.count>1?(stats.difference>0?'+':'')+stats.difference:'—'}</strong><small>فرق وصفي في إجاباتك، مش مقياس طبي</small></div>
    </div>

    {records.length>1&&<section className="account-comparison"><div className="account-section-head"><span className="section-kicker">التغيّر في كل محور</span><h2>المجموع مش الصورة كلها</h2><p>مقارنة أقدم وآخر نتيجة في السجل المعروض. الرقم الأقل يعني تكرارًا أقل في إجاباتك، ومش دليلًا وحده على تحسّن طبي.</p></div><div className="comparison-grid">{domains.map(domain=>{
      const before=domainScore(records[records.length-1].answers,domain.id),after=domainScore(records[0].answers,domain.id),delta=after-before
      return <article key={domain.id}><h3>{domain.short}</h3><div><span>{before}<small>قبل</small></span><ArrowLeft size={17}/><span>{after}<small>الأحدث</small></span></div><b className={delta<0?'decreased':delta>0?'increased':'unchanged'}>{delta<0?`أقل بـ${-delta}`:delta>0?`أعلى بـ${delta}`:'نفس الدرجة'}</b></article>
    })}</div></section>}

    {(currentCandidate || guestCandidate) && <div className="account-save-section">
      <div className="account-section-head"><span className="section-kicker">اختياري بالكامل</span><h2>احفظ نتيجتك في حسابك</h2><p>هنحفظ إجابات الأسئلة الـ30 ودرجتك، عشان تقدر تراجع تقدمك فيما بعد. مش بنرفع أي إجابات من غير ما تضغط حفظ.</p></div>
      <div className="account-save-actions">
        {currentCandidate && <button type="button" className="btn btn-primary" disabled={!!pending||!!currentSaved} onClick={()=>void saveCandidate('current')}><CloudUpload size={18}/>{currentSaved?'النتيجة الحالية محفوظة':pending==='current'?'جاري الحفظ...':'احفظ نتيجة الاختبار الحالية'}</button>}
        {guestCandidate && !guestSaved && <button type="button" className="btn btn-soft" disabled={!!pending} onClick={()=>void saveCandidate('guest')}><CloudUpload size={18}/>{pending==='guest'?'جاري الحفظ...':'احفظ نتيجة اختبارك قبل تسجيل الدخول'}</button>}
      </div>
    </div>}

    {notice && <div className="auth-message notice account-feedback" role="status">{notice}</div>}
    {error && <div className="auth-message error account-feedback" role="alert">{error}</div>}

    <div className="account-pro-privacy"><p>تقدر تمسح بيانات أدواتك وخططها في أي وقت.</p><button className="pro-delete" disabled={!!pending} onClick={()=>void deleteProData()}>مسح بيانات الأدوات والخطط</button></div>
    <div className="account-history-section">
      <div className="account-section-head account-history-heading">
        <div><span className="section-kicker">سجل التطور</span><h2>اختباراتك المحفوظة</h2><p>تقدر تفتح كل نتائجك السابقة وتقارن المحاور مجانًا.</p></div>
        <button className="account-refresh" type="button" disabled={!!pending} onClick={()=>void refresh()}><RefreshCcw size={16}/> تحديث</button>
      </div>
      {loading ? <div className="account-empty">جاري تحميل النتائج المحفوظة...</div> :
        records.length===0 ? <div className="account-empty"><CloudUpload size={27}/><strong>لسه مفيش نتائج محفوظة</strong><p>الاختبار مجاني، ولما تخلصه تقدر تختار حفظ نتيجتك هنا.</p></div> :
        <div className="account-history-list">{records.map(record=>{
          const band=getBand(record.total_score)
          return <article className="account-history-item" key={record.id}>
            <div className="account-history-score"><strong>{record.total_score}</strong><span>/120</span></div>
            <div className="account-history-info"><h3>{band.title}</h3><span><CalendarDays size={14}/>{formatDate(record.created_at)}</span></div>
            <div className="account-history-actions">
              <button type="button" className="account-history-open" onClick={()=>onViewSaved(record)}>عرض التحليل <ArrowLeft size={15}/></button>
              <button type="button" className="account-history-delete" disabled={!!pending} aria-label={'حذف نتيجة '+formatDate(record.created_at)} onClick={()=>void deleteRecord(record)}><Trash2 size={17}/></button>
            </div>
          </article>
        })}</div>
      }
      {records.length===40&&<p className="account-list-note">بيظهر آخر 40 نتيجة محفوظة حاليًا.</p>}
      {records.length>0 && <div className="account-bulk-delete">
        <span>لو حابب تبدأ بسجل فاضي، تقدر تمسح كل نتائجك المحفوظة على السحابة.</span>
        <button type="button" disabled={!!pending} onClick={()=>void deleteAllRecords()}><Trash2 size={15}/>{pending==='delete-all'?'جاري المسح...':'مسح كل النتائج المحفوظة'}</button>
      </div>}
    </div>

    <div className="account-privacy-bar"><ShieldCheck size={19}/><span>كل نتائجك مربوطة بحسابك. قواعد RLS على قاعدة البيانات بتمنع حساب تاني من الاطلاع عليها. التخزين على جهازك منفصل عن السحابة.</span></div>
    <div className="account-bottom-actions"><button type="button" className="account-logout" disabled={!!pending} onClick={()=>void logout()}><LogOut size={18}/>{pending==='logout'?'جاري الخروج...':'تسجيل الخروج'}</button></div>
  </section>
}

