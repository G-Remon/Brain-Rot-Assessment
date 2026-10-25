import {describe,it,expect} from 'vitest'
import {validSubscription,eventPayload} from '../supabase/functions/admin-notifications/validation'
const good={endpoint:'https://fcm.googleapis.com/fcm/send/example',keys:{p256dh:'B'+'a'.repeat(86),auth:'b'.repeat(22)}}
describe('native push boundaries',()=>{
 it.each(['https://fcm.googleapis.com/fcm/send/a','https://updates.push.services.mozilla.com/wpush/a','https://web.push.apple.com/Q/a','https://foo.notify.windows.com/w/?token=abc'])('allows a supported HTTPS push provider %s',endpoint=>expect(validSubscription({...good,endpoint})).toBe(true))
 it.each(['http://fcm.googleapis.com/a','https://127.0.0.1/private','https://fcm.googleapis.com.attacker.example/a','https://evil.example/','https://user:pass@fcm.googleapis.com/a','https://fcm.googleapis.com:8443/a'])('refuses arbitrary or insecure destinations %s',endpoint=>expect(validSubscription({...good,endpoint})).toBe(false))
 it('rejects malformed encryption keys',()=>{expect(validSubscription({...good,keys:{auth:'x',p256dh:'x'}})).toBe(false);expect(validSubscription(null)).toBe(false)})
 it('shows generic lock-screen messages and a fixed admin destination',()=>{for(const kind of ['signup','assessment_completed']){const payload=eventPayload({id:'event-1',kind});expect(payload.url).toBe('/#/admin');expect(payload.tag).toBe('mindreset-event-1');expect(JSON.stringify(payload)).not.toContain('@');expect(JSON.stringify(payload)).not.toContain('answers')}})
})
