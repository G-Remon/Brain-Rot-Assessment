import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { User } from '@supabase/supabase-js'
import { AccountGate } from '../src/AccountGate'
const user={id:'test-user'} as User
const render=(identity:User|null,loading:boolean)=>renderToStaticMarkup(<AccountGate user={identity} loading={loading} oauthError={false}><div>PRIVATE_APP_CONTENT</div></AccountGate>)
describe('account before all application content',()=>{
  it('shows only account entry without an identity',()=>{const html=render(null,false);expect(html).not.toContain('PRIVATE_APP_CONTENT');expect(html).toContain('ابدأ بحسابك');expect(html).not.toContain('الرجوع للموقع')})
  it('does not flash application content during session verification',()=>{expect(render(user,true)).not.toContain('PRIVATE_APP_CONTENT');expect(render(null,true)).toContain('بنتأكد من تسجيل الدخول')})
  it('opens the app after verification and closes it on sign-out',()=>{expect(render(user,false)).toContain('PRIVATE_APP_CONTENT');expect(render(null,false)).not.toContain('PRIVATE_APP_CONTENT')})
})
