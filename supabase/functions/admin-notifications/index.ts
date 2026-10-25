import {createClient} from 'npm:@supabase/supabase-js@2.118.0'
import webpush from 'npm:web-push@3.6.7'
import {validSubscription,eventPayload,type Subscription} from './validation.ts'
const origin='https://brain-rot-assessment.vercel.app'
const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Cache-Control':'no-store','Content-Type':'application/json','Vary':'Origin'}
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers})
type Config={webhook_secret:string;vapid_public:string|null;vapid_private:string|null}
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers})
 if(req.method!=='POST')return reply({error:'method-not-allowed'},405)
 try{
  const raw=await req.text();if(raw.length>8192)return reply({error:'payload-too-large'},413)
  let body;try{body=JSON.parse(raw)}catch{return reply({error:'invalid-json'},400)}
  if(!body||typeof body!=='object'||Array.isArray(body))return reply({error:'invalid-request'},400)
  const system=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}})
  async function service<T>(operation:string,payload:Record<string,unknown>={}):Promise<T>{const {data,error}=await system.rpc('admin_push_service',{operation,payload});if(error)throw Error('notification-store');return data as T}
  const memberActions=['member-config','member-subscribe','member-unsubscribe','member-preferences','member-test','member-focus']
  const member=memberActions.includes(body.action)
  const dispatch=body.action==='dispatch'||body.action==='member-dispatch'
  async function members<T>(operation:string,payload:Record<string,unknown>={}):Promise<T>{const {data,error}=await system.rpc('member_push_service',{operation,payload});if(error)throw Error('notification-store');return data as T}
  let owner=''
  if(!dispatch){
   const token=(req.headers.get('Authorization')??'').replace(/^Bearer /,'');if(!token)return reply({error:'login-required'},401)
   const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:'Bearer '+token}},auth:{persistSession:false,autoRefreshToken:false}})
   const {data:{user},error}=await client.auth.getUser(token);if(error||!user)return reply({error:'login-required'},401)
   if(!member){const {data:admin,error:denied}=await client.rpc('is_site_admin');if(denied||admin!==true)return reply({error:'admin-required'},403)}
   owner=user.id
  }
  let config=await service<Config>('config')
  if(dispatch){
   const provided=req.headers.get('x-mindreset-push-secret')??''
   const hash=async(s:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))
   const a=await hash(provided),b=await hash(config.webhook_secret);let mismatch=provided.length===config.webhook_secret.length?0:1;for(let i=0;i<a.length;i++)mismatch|=a[i]^b[i]
   if(mismatch)return reply({error:'forbidden'},403)
  }
  if(!config.vapid_public||!config.vapid_private){const keys=webpush.generateVAPIDKeys();config=await service<Config>('keys',keys)}
  const send=(subscription:Subscription,payload:unknown)=>webpush.sendNotification(subscription,JSON.stringify(payload),{vapidDetails:{subject:origin,publicKey:config.vapid_public!,privateKey:config.vapid_private!},TTL:3600,timeout:5000,urgency:'normal',contentEncoding:'aes128gcm'})
  if(member){
   const operation=body.action.slice(7)
   if(operation==='subscribe'&&!validSubscription(body.subscription))return reply({error:'invalid-subscription'},400)
   if(operation==='focus'&&(!Number.isInteger(body.seconds)||body.seconds<0||body.seconds>1800||typeof body.id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(body.id)))return reply({error:'invalid-timer'},400)
   if(operation==='test'){
    const target=await members<{id:string;subscription:Subscription;name:string}|null>('test_target',{owner,endpoint:body.endpoint})
    if(!target||!validSubscription(target.subscription))return reply({error:'device-not-registered'},404)
    try{await send(target.subscription,{title:'MindReset · خطوة ليك',body:'يا '+target.name+'، إشعاراتك جاهزة. هنفكّرك بخطواتك في الوقت اللي اخترته.',url:'/#/account',tag:'mindreset-personal-test',owner});return reply({accepted:true})}catch(error){if([404,410].includes((error as {statusCode:number}).statusCode))await members('expired',{subscription:target.id});return reply({error:'push-not-accepted'},502)}
   }
   return reply({...await members<Record<string,unknown>>(operation,{...body,owner}),publicKey:config.vapid_public})
  }
  if(body.action==='member-dispatch'){
   const events=await members<Array<{id:string;payload:Record<string,unknown>;owner:string}>>('claim');let accepted=0
   for(const event of events){
    const targets=await members<Array<{id:string;subscription:Subscription;name?:string}>>('targets',{event:event.id})
    const results=await Promise.all(targets.map(async target=>{
     if(!validSubscription(target.subscription)){await members('expired',{subscription:target.id});return true}
     try{await send(target.subscription,{...event.payload,title:'MindReset · خطوتك الجاية',tag:'mindreset-'+event.id,owner:event.owner});await members('delivered',{event:event.id,subscription:target.id});accepted++;return true}catch(error){if([404,410].includes((error as {statusCode:number}).statusCode)){await members('expired',{subscription:target.id});return true}return false}
    }));await members(results.every(Boolean)?'complete':'retry',{event:event.id})
   }return reply({processed:events.length,accepted})
  }
  if(body.action==='config')return reply({publicKey:config.vapid_public,devices:await service('devices',{owner}),registered:typeof body.endpoint==='string'&&!!await service('test_target',{owner,endpoint:body.endpoint})})
  if(body.action==='subscribe'){
   if(!validSubscription(body.subscription))return reply({error:'invalid-subscription'},400)
   return reply(await service('subscribe',{owner,subscription:{endpoint:body.subscription.endpoint,keys:body.subscription.keys,expirationTime:body.subscription.expirationTime??null}}))
  }
  if(body.action==='unsubscribe')return reply(await service('unsubscribe',{owner,endpoint:typeof body.endpoint==='string'?body.endpoint:''}))
  if(body.action==='test'){
   const target=await service<{id:string;subscription:Subscription;name?:string}|null>('test_target',{owner,endpoint:body.endpoint});if(!target)return reply({error:'device-not-registered'},404)
   try{await send(target.subscription,{title:'MindReset',body:'يا '+(target.name??'صديقي')+'، إشعارات الإدارة جاهزة على الجهاز ده.',tag:'mindreset-test',url:'/#/admin'});return reply({accepted:true})}catch(error){const code=(error as {statusCode?:number}).statusCode;if(code===404||code===410)await service('expired',{subscription:target.id});return reply({error:'push-not-accepted'},502)}
  }
  if(body.action==='dispatch'){
   const events=await service<Array<{id:string;kind:string}>>('claim');let accepted=0
   for(const event of events){
    const targets=await service<Array<{id:string;subscription:Subscription;name?:string}>>('targets',{event:event.id})
    const results=await Promise.all(targets.map(async target=>{
     if(!validSubscription(target.subscription)){await service('expired',{subscription:target.id});return true}
     try{await send(target.subscription,eventPayload({...event,name:target.name}));await service('delivered',{event:event.id,subscription:target.id});accepted++;return true}catch(error){const code=(error as {statusCode?:number}).statusCode;if(code===404||code===410){await service('expired',{subscription:target.id});return true}return false}
    }))
    await service(results.every(Boolean)?'complete':'retry',{event:event.id})
   }
   return reply({processed:events.length,accepted})
  }
  return reply({error:'unknown-action'},400)
 }catch{console.error('admin notification request failed');return reply({error:'notification-unavailable'},503)}
})
