export function normalizedEmail(value: string): string {
  return value.trim().toLowerCase()
}
export function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail(value))
}
export function validPassword(value: string): boolean {
  return value.length >= 8 && value.length <= 72
}
export function validOtp(value: string): boolean {
  return /^\d{6}$/.test(value)
}
