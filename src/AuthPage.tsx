import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { normalizedEmail, validEmail, validOtp, validPassword } from './auth-validation'
import { authRedirectUrl } from './auth-urls'
import { supabase } from './supabase'

export type AuthMode = 'login' | 'signup' | 'otp' | 'forgot' | 'new-password'

type AuthPageProps = {
  initialMode?: AuthMode
  onDone: () => void
  onBack: () => void
}

export function AuthPage({ initialMode = 'login', onDone, onBack }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [lastResentAt, setLastResentAt] = useState(0)

  useEffect(() => { setMode(initialMode) }, [initialMode])

  function switchMode(next: AuthMode) {
    setMode(next)
    setError('')
    setNotice('')
    setOtp('')
    setPassword('')
    setConfirmPassword('')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || busy) return
    const cleanEmail = normalizedEmail(email)
    if (mode !== 'new-password' && mode !== 'otp' && !validEmail(cleanEmail)) {
      setError('اتأكد إن البريد الإلكتروني مكتوب بشكل صحيح.')
      return
    }
    if (mode === 'otp' && !validOtp(otp)) {
      setError('الكود لازم يكون 6 أرقام.')
      return
    }
    if (['signup', 'login', 'new-password'].includes(mode) && !validPassword(password)) {
      setError('كلمة المرور لازم تكون من 8 إلى 72 حرف.')
      return
    }
    if (['signup', 'new-password'].includes(mode) && password !== confirmPassword) {
      setError('كلمتا المرور مش متطابقتين.')
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      if (mode === 'signup') {
        if (name.trim().length < 2 || name.trim().length > 80) {
          setError('اكتب اسم من حرفين إلى 80 حرف.')
          return
        }
        const { data, error: authError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { display_name: name.trim() },
            emailRedirectTo: authRedirectUrl(window.location.origin),
          },
        })
        if (authError) throw authError
        if (data.session) { onDone(); return }
        setMode('otp')
        setLastResentAt(Date.now())
        setNotice('بعتنالك رسالة تأكيد على بريدك. لو وصل كود 6 أرقام اكتبه هنا، ولو وصلك رابط تأكيد افتحه.')
        return
      }
      if (mode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password })
        if (authError) throw authError
        onDone()
        return
      }
      if (mode === 'otp') {
        const { error: authError } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: otp,
          type: 'signup',
        })
        if (authError) throw authError
        onDone()
        return
      }
      if (mode === 'forgot') {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: authRedirectUrl(window.location.origin, 'recovery'),
        })
        if (authError) throw authError
        setNotice('لو البريد ده مرتبط بحساب، هتوصلك رسالة استرجاع. افتح الرابط على نفس المتصفح اللي طلبت منه الاسترجاع عشان نكمل التحقق بأمان.')
        return
      }
      if (mode === 'new-password') {
        const { error: authError } = await supabase.auth.updateUser({ password })
        if (authError) throw authError
        setNotice('كلمة المرور اتغيرت بنجاح.')
        setPassword('')
        setConfirmPassword('')
        onDone()
      }
    } catch (failure) {
      const code = failure && typeof failure === 'object' && 'code' in failure
        ? String(failure.code) : ''
      setError(code === 'email_address_not_authorized'
        ? 'خدمة البريد التجريبية لا تسمح بإرسال الرسائل للإيميل ده حاليًا. لازم تفعيل مزوّد SMTP قبل فتح التسجيل للعامة.'
        : code.includes('rate_limit') || code === 'over_email_send_rate_limit'
          ? 'تم إرسال طلبات كثيرة خلال وقت قصير. استنى شوية وحاول تاني.'
          : code === 'email_not_confirmed'
            ? 'الحساب محتاج تأكيد الإيميل قبل تسجيل الدخول. راجع رسالة التأكيد.'
            : mode === 'login'
              ? 'مش قادرين نسجل دخولك. راجع بياناتك وتأكيد الإيميل وجرب تاني.'
              : mode === 'otp'
                ? 'الكود غير صحيح أو منتهي الصلاحية. راجع الرسالة أو اطلب كود جديد.'
                : mode === 'new-password'
                  ? 'رابط الاسترجاع منتهي أو الجلسة غير صالحة. اطلب رابط جديد من شاشة نسيت كلمة المرور.'
                  : 'تعذّر إرسال الرسالة أو تنفيذ الطلب. راجع إعدادات إرسال البريد وجرب تاني.')
    } finally {
      setBusy(false)
    }
  }

  async function resend() {
    if (!supabase || busy || !validEmail(email)) return
    if (Date.now() - lastResentAt < 60000) {
      setNotice('لو لسه طلبت رسالة، استنى دقيقة قبل إعادة الإرسال عشان نتجنب حظر الطلبات.')
      return
    }
    setBusy(true); setError(''); setNotice('')
    try {
      const { error: authError } = await supabase.auth.resend({
        email: normalizedEmail(email),
        type: 'signup',
        options: { emailRedirectTo: authRedirectUrl(window.location.origin) },
      })
      if (authError) throw authError
      setLastResentAt(Date.now())
      setNotice('طلبنا إعادة إرسال الرسالة. افحص بريدك وملف Spam. تقدر تطلب رسالة تانية بعد دقيقة.')
    } catch {
      setError('مش قادرين نعيد الإرسال دلوقتي. استنى شوية وجرب تاني.')
    } finally { setBusy(false) }
  }

  return (
    <section className="auth-section container">
      <button className="auth-back" type="button" onClick={onBack}>الرجوع للموقع <ArrowLeft size={16}/></button>
      <div className="auth-card">
        <div className="auth-emblem"><UserRound size={25}/></div>
        <span className="section-kicker">حسابك في MindReset</span>
        <h1>{mode === 'signup' ? 'ابدأ رحلتك معانا' : mode === 'login' ? 'أهلاً برجوعك' : mode === 'otp' ? 'أكد بريدك الإلكتروني' : mode === 'forgot' ? 'استرجع كلمة المرور' : 'اختار كلمة مرور جديدة'}</h1>
        <p className="auth-description">{mode === 'signup' ? 'اعمل حساب واحفظ تطورك على مهل. الاختبار الأساسي مجاني بدون تسجيل.' : mode === 'otp' ? 'التأكيد بيحمي حسابك. رسالة البريد ممكن تحتوي على كود أو رابط حسب إعدادات الخدمة.' : mode === 'forgot' ? 'اكتب بريد حسابك وهنبعتلك خطوات الاسترجاع.' : mode === 'new-password' ? 'اكتب كلمة مرور قوية وجديدة لحسابك.' : 'سجّل دخولك عشان ترجع لرحلتك ونتائجك.'}</p>
        {!supabase ? <div className="auth-message error" role="alert">إعدادات الحسابات مش مفعّلة على الموقع حاليًا. الاختبار المجاني لسه متاح.</div> : (
          <form onSubmit={submit} className="auth-form">
            {mode === 'signup' && <label>اسمك <input type="text" required minLength={2} maxLength={80} autoComplete="name" value={name} onChange={event=>setName(event.target.value)} placeholder="اكتب اسمك" disabled={busy}/></label>}
            {mode !== 'new-password' && <label>البريد الإلكتروني <div className="auth-input-wrap"><Mail size={18}/><input type="email" required autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="name@example.com" dir="ltr" disabled={busy || mode==='otp'}/></div></label>}
            {['login','signup','new-password'].includes(mode) && <label>{mode==='new-password'?'كلمة المرور الجديدة':'كلمة المرور'} <div className="auth-input-wrap"><LockKeyhole size={18}/><input type={showPassword?'text':'password'} required minLength={8} maxLength={72} autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={event=>setPassword(event.target.value)} placeholder="8 أحرف على الأقل" dir="ltr" disabled={busy}/><button type="button" className="auth-eye" onClick={()=>setShowPassword(value=>!value)} aria-label={showPassword?'إخفاء كلمة المرور':'عرض كلمة المرور'}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>}
            {['signup','new-password'].includes(mode) && <label>تأكيد كلمة المرور <div className="auth-input-wrap"><KeyRound size={18}/><input type={showPassword?'text':'password'} required minLength={8} maxLength={72} autoComplete="new-password" value={confirmPassword} onChange={event=>setConfirmPassword(event.target.value)} placeholder="اكتبها مرة تانية" dir="ltr" disabled={busy}/></div></label>}
            {mode==='otp' && <label>كود التأكيد <input type="text" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" value={otp} onChange={event=>setOtp(event.target.value.replace(/\D/g,'').slice(0,6))} placeholder="000000" className="otp-input" dir="ltr" disabled={busy}/></label>}
            {error && <div className="auth-message error" role="alert">{error}</div>}
            {notice && <div className="auth-message notice" role="status">{notice}</div>}
            <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>{busy?'جاري التنفيذ...':mode==='login'?'تسجيل الدخول':mode==='signup'?'إنشاء الحساب':mode==='otp'?'تأكيد البريد':mode==='forgot'?'إرسال رابط الاسترجاع':'حفظ كلمة المرور'} <ArrowLeft size={18}/></button>
            {mode==='login'&&<button type="button" className="auth-quiet" onClick={()=>switchMode('forgot')}>نسيت كلمة المرور؟</button>}
            {mode==='otp'&&<button type="button" className="auth-quiet" onClick={resend} disabled={busy}>إعادة إرسال رسالة التأكيد</button>}
          </form>
        )}
        <div className="auth-switch">
          {mode==='signup'?<>عندك حساب بالفعل؟ <button type="button" onClick={()=>switchMode('login')}>سجّل دخول</button></>:
            mode==='login'?<>لسه معندكش حساب؟ <button type="button" onClick={()=>switchMode('signup')}>إنشاء حساب مجاني</button></>:
            <button type="button" onClick={()=>switchMode('login')}>الرجوع لتسجيل الدخول</button>}
        </div>
        <div className="auth-privacy"><ShieldCheck size={17}/><span>بيانات حسابك محمية بنظام Supabase Auth. كلمة المرور مش بنخزنها في واجهة الموقع.</span></div>
      </div>
    </section>
  )
}
