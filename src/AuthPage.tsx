import './auth-help.css'
import { useEffect, useState } from 'react'
import { ArrowLeft, HelpCircle, LockKeyhole, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { beginGoogleSignIn } from './google-auth'

// MindReset never receives a Google password or one-time code.
type AuthPageProps = {
  required?: boolean
  forQuiz?: boolean
  onBack: () => void
  oauthError?: boolean
}

export function AuthPage({ onBack, required = false, oauthError = false, forQuiz = false }: AuthPageProps) {
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
      await beginGoogleSignIn(window.location.origin,forQuiz)
      // Supabase redirects the browser to Google; sign-in finishes after return.
    }catch{
      setError('تعذّر فتح تسجيل الدخول بحساب Google. راجع الاتصال وحاول مرة تانية بعد شوية.')
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
        <h1>{forQuiz?'سجّل دخولك عشان تبدأ الاختبار':'ابدأ بحسابك'}</h1>
        <p className="auth-description">
          {forQuiz?'بعد الدخول هترجع للاختبار مباشرة. التصفح والمكتبة متاحين من غير حساب؛ الاختبار وبياناتك الشخصية مرتبطين بحسابك.':'تقدر تتصفح الموقع والمكتبة من غير حساب. سجّل دخول أو اعمل حساب مجاني عشان تبدأ الاختبار وتتابع خطتك.'} هتختار حساب Google، من غير كلمة مرور جديدة أو أكواد OTP من MindReset.
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
        <details className="auth-signin-help">
          <summary><HelpCircle size={18}/><span>ناسي باسورد Google؟</span></summary>
          <div>
            <p>ممكن تقدر تدخل من غير كتابة الباسورد، حسب إعدادات حسابك والجهاز:</p>
            <ol>
              <li>اضغط «المتابعة باستخدام Google». لو حسابك مفتوح على الجهاز، اختاره وكمّل؛ ممكن ما يطلبش الباسورد.</li>
              <li>لو Google طلب الباسورد، دور على «جرّب طريقة أخرى» أو «Try another way» واضغط عليها لو ظهرت.</li>
              <li>لو ظهر خيار مفتاح المرور (Passkey)، اتبع رسالة الجهاز لاستخدام البصمة أو رمز قفل التليفون.</li>
            </ol>
            <p className="auth-signin-help-note">الخيارات دي بتحددها Google ومش بتظهر لكل حساب أو جهاز. اكتب رمز قفل التليفون في رسالة النظام فقط، مش في خانة باسورد Google أو داخل MindReset.</p>
            <a href="https://support.google.com/accounts/answer/7682439?hl=ar" target="_blank" rel="noopener noreferrer">مفيش طريقة مناسبة؟ افتح إرشادات استرداد الحساب من Google</a>
          </div>
        </details>
        <div className="auth-google-benefits">
          <span><ShieldCheck size={17}/> Google بيتحقق من حسابك بنفسه</span>
          <span><LockKeyhole size={17}/> مش بنستقبل كلمة مرور Google</span>
          <span><Sparkles size={17}/> التصفح متاح · الاختبار بعد الدخول</span>
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

