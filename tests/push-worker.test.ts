import {readFileSync} from 'node:fs'
import {runInNewContext} from 'node:vm'
import {expect,it,vi} from 'vitest'
it('renders real titles with a separate badge and opens only same-origin allowed routes',async()=>{
 const handlers:Record<string,(event:unknown)=>void>={},show=vi.fn().mockResolvedValue(undefined),open=vi.fn(),post=vi.fn()
 runInNewContext(readFileSync('public/admin-sw.js','utf8'),{URL,self:{location:{origin:'https://example.com'},addEventListener:(name:string,handler:(event:unknown)=>void)=>handlers[name]=handler,registration:{showNotification:show},clients:{matchAll:async()=>[{postMessage:post,url:'https://example.com',navigate:open,focus:()=>{}}],openWindow:open}}})
 let pending:Promise<unknown>|undefined
 handlers.push({data:{json:()=>({title:'خطوتك الجاية',body:'يا جرجس، خطوة صغيرة',url:'/#/tools?panel=learning'})},waitUntil:(value:Promise<unknown>)=>pending=value});await pending
 expect(show).toHaveBeenCalledWith('خطوتك الجاية',expect.objectContaining({badge:'/icons/mindreset-badge-96.png',data:{url:'https://example.com/#/tools?panel=learning'}}))
 handlers.notificationclick({notification:{close:()=>{},data:{url:'https://evil.example/#/admin'}},waitUntil:(value:Promise<unknown>)=>pending=value});await pending;expect(open).toHaveBeenCalledWith('https://example.com/#/account')
})
