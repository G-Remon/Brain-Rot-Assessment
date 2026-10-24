import { useEffect, useState } from 'react'
import { ArrowLeft, LockKeyhole, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { beginGoogleSignIn } from './google-auth'

// MindReset never receives a Google password or one-time code.
type AuthPageProps = {
  required?: boolean
  onBack: () => void
  oauthError?: boolean
}

export function AuthPage({ onBack, required = false, oauthError = false }: AuthPageProps) {
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState(oauthError
    ? 'تسجيل الدخول عبر Google ما اكتملش. جرّب تاني من الزر اللي تحت.'
    : '')

  useEffect(()=>{
    if(oauthError)setError('تسجيل الدخول عبر Google ما اكتملش. جرّب تاني من الزر اللي تحت.')
  },[oauthError])

  async function signIn() {
    if(busy)return
    setError('')
    setBusy(true)
    try {
      await beginGoogleSignIn(window.location.origin)
      // Supabase redirects the browser to Google; sign-in finishes after return.
    }catch{
      setError('تعذّر فتح تسجيل الدخول بحساب Google. راجع تفعيل Google في إعدادات Authentication أو حاول مرة تانية.')
    }finally{
      setBusy(false)
    }
  }

  return (
    <section className="auth-section container" aria-label="تسجيل الدخول">
      {!required&&<button className="auth-back" type="button" onClick={onBack}>
        الرجوع للموقع <ArrowLeft size={16}/>
      </button>}
      <div className="auth-card auth-google-card">
        <div className="auth-emblem"><UserRound size={25}/></div>
        <span className="section-kicker">مساحتك الشخصية في MindReset</span>
        <h1>ابدأ بحسابك</h1>
        <p className="auth-description">
          سجّل دخول أو اعمل حساب مجاني بنفس الزر. هتختار حساب Google وتكمل فورًا،
          من غير كلمة مرور جديدة أو أكواد OTP من MindReset. لازم تدخل بحسابك الأول عشان تفتح الاختبار والمكتبة وخطتك.
        </p>
        {error && <div className="auth-message error" role="alert">{error}</div>}
        {!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
          ? <div className="auth-message error" role="alert">
              تسجيل الدخول غير متاح حاليًا. جرّب مرة تانية بعد شوية.
            </div>
          : <button type="button" className="auth-google-button"
              disabled={busy} onClick={()=>void signIn()}>
              <span className="google-letter" aria-hidden="true">G</span>
              <span>{busy ? 'جاري فتح Google...' : 'المتابعة باستخدام Google'}</span>
              <ArrowLeft size={18} aria-hidden="true"/>
            </button>}
        <div className="auth-google-benefits">
          <span><ShieldCheck size={17}/> Google بيتحقق من حسابك بنفسه</span>
          <span><LockKeyhole size={17}/> مش بنستقبل كلمة مرور Google</span>
          <span><Sparkles size={17}/> الاختبار وخطتك متاحين بعد الدخول</span>
        </div>
        <div className="auth-privacy">
          <ShieldCheck size={17}/>
          <span>
            هنعرف اسمك وبريدك الإلكتروني من Google لتشغيل حسابك فقط.
            حفظ نتائجك اختياري، وبدء خطة بيحفظ إعداداتها وتقدمك في حسابك.
          </span>
        </div>
        <a className="auth-policy-link" href="/privacy.html">اقرأ سياسة الخصوصية</a>
      </div>
    </section>
  )
}

