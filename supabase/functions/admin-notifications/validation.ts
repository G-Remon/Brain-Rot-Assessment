export type Subscription={endpoint:string;keys:{p256dh:string;auth:string};expirationTime?:number|null}
export function validSubscription(value:unknown):value is Subscription{
 if(!value||typeof value!=='object')return false
 const s=value as Subscription
 if(typeof s.endpoint!=='string'||s.endpoint.length>2048||!s.keys||!/^B[A-Za-z0-9_-]{86}$/.test(s.keys.p256dh??'')||!/^[A-Za-z0-9_-]{22}$/.test(s.keys.auth??''))return false
 try{const u=new URL(s.endpoint);return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&(u.hostname==='fcm.googleapis.com'||u.hostname==='push.services.mozilla.com'||u.hostname.endsWith('.push.services.mozilla.com')||u.hostname==='web.push.apple.com'||u.hostname.endsWith('.push.apple.com')||u.hostname.endsWith('.notify.windows.com'))}catch{return false}
}
export function eventPayload(event:{id:string;kind:string;name?:string}){
 return {title:'MindReset',body:(event.name?'يا '+event.name+'، ':'')+(event.kind==='signup'?'حساب جديد سجّل في موقعك. افتح لوحة الإدارة للتفاصيل.':'مستخدم أكمل اختبارًا جديدًا. افتح لوحة الإدارة للتفاصيل.'),tag:'mindreset-'+event.id,url:'/#/admin'}
}
