// @vitest-environment jsdom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {it,expect,vi} from 'vitest'
const mock=vi.hoisted(()=>({rpc:vi.fn()}))
vi.mock('../src/supabase',()=>({supabase:{auth:{getUser:async()=>({data:{user:{id:'owner'}},error:null})},rpc:mock.rpc}}))
vi.mock('../src/pro-access',()=>({usePro:()=>({status:{isAdmin:true},loading:false,error:false,refresh:()=>{}})}))
import {AdminPage} from '../src/AdminPage'
it('refreshes the accounts from the server without reloading or leaving the page',async()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
 const sample={summary:{users:1,newThisWeek:1,admins:1,savedAssessments:0,verifiedUsers:1},users:[],total:1,page:1,pageSize:20,generatedAt:'2026-10-25T12:00:00Z'}
 mock.rpc.mockResolvedValue({data:sample,error:null});const host=document.createElement('div');document.body.append(host);const root=createRoot(host)
 try{
  await act(async()=>{root.render(<AdminPage owner="owner" onOpenTools={()=>{}}/>);await new Promise(r=>setTimeout(r,0))})
  await act(async()=>{[...host.querySelectorAll('button')].find(b=>b.textContent==='الحسابات')!.click()})
  expect(host.textContent).toContain('1 حساب');mock.rpc.mockResolvedValue({data:{...sample,total:2},error:null})
  await act(async()=>{[...host.querySelectorAll('button')].find(b=>b.textContent==='تحديث الحسابات')!.click();await new Promise(r=>setTimeout(r,0))})
  expect(mock.rpc).toHaveBeenCalledTimes(2);expect(host.textContent).toContain('2 حساب');expect(host.querySelector('.admin-accounts')).not.toBeNull()
 }finally{await act(async()=>root.unmount());host.remove()}
})
