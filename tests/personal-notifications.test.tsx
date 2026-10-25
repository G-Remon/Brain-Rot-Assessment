// @vitest-environment jsdom
import {act} from 'react'
import {createRoot,type Root} from 'react-dom/client'
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest'
const mock=vi.hoisted(()=>({request:vi.fn(),permission:vi.fn(),subscribe:vi.fn()}))
vi.mock('../src/admin-push',()=>({adminPushRequest:mock.request,pushKeyBytes:()=>new Uint8Array(65)}))
import {NotificationCenter,displayFirstName,safeNotificationUrl} from '../src/notification-center'
let host:HTMLDivElement,root:Root
const config={name:'جرجس ريمون',publicKey:'test',registered:false,isAdmin:false,steps:[{label:'كارت جاهز للمراجعة',url:'/#/tools?panel=learning',kind:'recall'}],preferences:{enabled:false,hour:20,timezone:'Africa/Cairo',sound:false,admin_hourly:true,admin_daily:true}}
const sub={endpoint:'https://fcm.googleapis.com/a',toJSON:()=>({endpoint:'https://fcm.googleapis.com/a',keys:{}})}
const flush=async()=>{await act(async()=>{await new Promise(r=>setTimeout(r,0))})}
const click=async(text:string)=>{const button=[...host.querySelectorAll('button')].find(b=>b.textContent===text)!;expect(button).toBeTruthy();await act(async()=>button.click());await flush()}
beforeEach(()=>{
 vi.clearAllMocks();localStorage.clear();Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});host=document.createElement('div');document.body.append(host);root=createRoot(host)
 HTMLDialogElement.prototype.showModal=function(){this.open=true};HTMLDialogElement.prototype.close=function(){this.open=false}
 mock.request.mockImplementation(async(_owner,action)=>action==='member-subscribe'?{...config,registered:true,preferences:{...config.preferences,enabled:true}}:config)
 mock.permission.mockResolvedValue('granted');mock.subscribe.mockResolvedValue(sub)
 const reg={pushManager:{getSubscription:vi.fn().mockResolvedValue(null),subscribe:mock.subscribe}}
 Object.defineProperty(navigator,'serviceWorker',{value:{register:vi.fn().mockResolvedValue(reg),ready:Promise.resolve(reg),addEventListener:vi.fn(),removeEventListener:vi.fn()},configurable:true})
 vi.stubGlobal('Notification',{permission:'default',requestPermission:mock.permission});vi.stubGlobal('PushManager',class{})
})
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals();delete (navigator as unknown as Record<string,unknown>).serviceWorker})
describe('personal phone notifications',()=>{
 it('offers a named in-app invitation and requests OS permission only from the enable click',async()=>{
  await act(async()=>root.render(<NotificationCenter owner="owner"/>));await flush();expect(host.querySelector('dialog')?.open).toBe(true);expect(host.textContent).toContain('يا جرجس');expect(mock.permission).not.toHaveBeenCalled();await click('فعّل الإشعارات');expect(mock.permission).toHaveBeenCalledOnce();expect(mock.request).toHaveBeenCalledWith('owner','member-subscribe',{subscription:sub.toJSON(),endpoint:sub.endpoint});expect(mock.request).toHaveBeenCalledWith('owner','member-test',{endpoint:sub.endpoint});expect(host.textContent).not.toContain('ملخصات الإدارة');expect(host.querySelector('.notification-steps a')?.getAttribute('href')).toBe('/#/tools?panel=learning')
 })
 it('remembers dismissal and leaves settings available without repeated permission prompts',async()=>{
  await act(async()=>root.render(<NotificationCenter owner="owner"/>));await flush();await click('مش دلوقتي');expect(Number(localStorage.getItem('mindreset-notification-offer:owner'))).toBeGreaterThan(0);expect(mock.permission).not.toHaveBeenCalled();await act(async()=>host.querySelector<HTMLButtonElement>('.notification-launcher')!.click());await flush();expect(host.querySelector('dialog')?.open).toBe(true);expect(mock.permission).not.toHaveBeenCalled()
 })
 it('does not auto-open or request permission after a browser denial',async()=>{
  vi.stubGlobal('Notification',{permission:'denied',requestPermission:mock.permission});await act(async()=>root.render(<NotificationCenter owner="owner"/>));await flush();expect(host.querySelector('dialog')?.open).toBe(false);expect(mock.permission).not.toHaveBeenCalled()
 })
 it('cleans names and refuses external or arbitrary notification destinations',()=>{expect(displayFirstName('  جرجس\nريمون')).toBe('جرجس');expect(safeNotificationUrl('https://evil.example')).toBe('/#/account');expect(safeNotificationUrl('/#/tools?panel=learning')).toBe('/#/tools?panel=learning');expect(safeNotificationUrl('/#/admin?role=admin')).toBe('/#/account')})
})
