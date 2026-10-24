export type EmailOtpPurpose = 'signup' | 'login'

/** Supabase signup confirmation uses 'signup'; passwordless email login uses 'email'. */
export function verifyOtpType(purpose: EmailOtpPurpose): 'signup' | 'email' {
  return purpose === 'login' ? 'email' : 'signup'
}

export function otpNotice(purpose: EmailOtpPurpose): string {
  return purpose === 'login'
    ? 'لو البريد مرتبط بحساب، هتوصلك رسالة برمز الدخول. هتحتاج تدخل 6 أرقام من الإيميل.'
    : 'لو الرسالة وصلت، ادخل كود تأكيد حسابك المكوّن من 6 أرقام.'
}

export function canResendCode(previous: number, current: number): boolean {
  return previous <= 0 || current - previous >= 60000
}
