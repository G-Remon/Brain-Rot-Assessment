import { createClient } from 'npm:@supabase/supabase-js@2.118.0'
import { buildPersonalReport } from './shared/personalization.ts'
import { buildJourney, defaultConfig, exercises, tracks } from './shared/journey.ts'
import { validatedAssessment } from './shared/assessment-history.ts'
const origin='https://brain-rot-assessment.vercel.app'
const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Cache-Control':'no-store','Content-Type':'application/json','Vary':'Origin'}
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers})
Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers})
  if(req.method!=='POST')return reply({error:'method-not-allowed'},405)
  try{
    const authorization=req.headers.get('Authorization')??''
    if(!authorization.startsWith('Bearer '))return reply({error:'login-required'},401)
    const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}})
    const {data:{user},error:authError}=await client.auth.getUser(authorization.slice(7))
    if(authError||!user)return reply({error:'login-required'},401)
    const raw=await req.text();if(raw.length>10000)return reply({error:'payload-too-large'},413)
    let body;try{body=JSON.parse(raw)}catch{return reply({error:'invalid-json'},400)}
    const {data:access,error}=await client.rpc('get_my_access_context')
    if(error||!access)throw new Error('entitlement-unavailable')
    const active=true
    if(body.action==='status')return reply({active,isAdmin:access.is_admin===true,validUntil:null})
    if(body.action==='library')return reply({exercises})
    const answers=validatedAssessment(body.answers)
    if(!answers)return reply({error:'assessment-incomplete'},400)
    if(body.action==='report')return reply({report:buildPersonalReport(answers)})
    if(body.action==='journey'){
      const config=body.config??defaultConfig
      if(!['auto',...tracks.map(t=>t.id)].includes(config.track)||![10,20,30].includes(config.minutes)||!['study','work','general'].includes(config.context))return reply({error:'invalid-config'},400)
      return reply({journey:buildJourney(answers,config)})
    }
    return reply({error:'unknown-action'},400)
  }catch{
    console.error('mindreset-pro request failed')
    return reply({error:'service-unavailable'},503)
  }
})
