import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { BrainCircuit, ShieldCheck } from 'lucide-react'
import { AuthPage } from './AuthPage'

/** No application content mounts until the initial identity check has finished. */
export function AccountGate({user,loading,oauthError,children}:{user:User|null;loading:boolean;oauthError:boolean;children:ReactNode}) {
  if(!loading&&user)return <>{children}</>
  return <div className="account-gate" dir="rtl">
    <header className="gate-brand"><span className="brand-icon"><BrainCircuit size={27}/></span><span>mind<span>reset</span></span></header>
    {loading?<main className="gate-loading" role="status"><ShieldCheck size={32}/><h1>بنجهّز مساحتك الشخصية</h1><p>بنتأكد من تسجيل الدخول...</p></main>:<main><AuthPage required onBack={()=>undefined} oauthError={oauthError}/></main>}
    <footer className="gate-footer">MindReset · افهم عاداتك، وابدأ خطوة تناسبك.</footer>
  </div>
}
