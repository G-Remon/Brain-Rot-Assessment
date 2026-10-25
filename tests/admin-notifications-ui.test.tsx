// @vitest-environment jsdom
import {act} from 'react'
import {createRoot,type Root} from 'react-dom/client'
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest'
const mock=vi.hoisted(()=>({request:vi.fn(),activity:vi.fn()}))
vi.mock('../src/admin-push',()=>({adminPushRequest:mock.request,loadAdminActivity:mock.activity,pushKeyBytes:()=>new Uint8Array(65)}))
import {AdminNotifications} from '../src/AdminNotifications'
let host:HTMLDivElement,root:Root
const flush=async()=>{await act(async()=>{await new Promise(r=>setTimeout(r,0))})}
const click=async(text:string)=>{const button=[...host.querySelectorAll('button')].find(b=>b.textContent===text)!;expect(button).toBeTruthy();await act(async()=>button.click());await flush()}
beforeEach(()=>{vi.clearAllMocks();Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});host=document.createElement('div');document.body.append(host);root=createRoot(host);mock.activity.mockResolvedValue([]);mock.request.mockResolvedValue({publicKey:'test',registered:false,devices:[]})})
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals()})
describe('phone notification activation',()=>{
 it('explains unsupported devices without requesting permission',async()=>{vi.stubGlobal('Notification',undefined);await act(async()=>root.render(<AdminNotifications owner="owner"/>));await flush();expect(host.textContent).toContain('إضافة إلى الشاشة الرئيسية');expect(mock.request).toHaveBeenCalledWith('owner','config',{endpoint:''})})
 it('requests permission only after a click and registers the real subscription',async()=>{
  const permission=vi.fn().mockResolvedValue('granted'),subscription={endpoint:'https://fcm.googleapis.com/a',toJSON:()=>({endpoint:'https://fcm.googleapis.com/a',keys:{}})}
  const manager={getSubscription:vi.fn().mockResolvedValue(null),subscribe:vi.fn().mockResolvedValue(subscription)};const reg={pushManager:manager};const register=vi.fn().mockResolvedValue(reg)
  Object.defineProperty(navigator,'serviceWorker',{value:{register,ready:Promise.resolve(reg)},configurable:true});vi.stubGlobal('PushManager',class{});vi.stubGlobal('Notification',{requestPermission:permission})
  await act(async()=>root.render(<AdminNotifications owner="owner"/>));await flush();expect(permission).not.toHaveBeenCalled();await click('فعّل إشعارات الجهاز ده');expect(permission).toHaveBeenCalledOnce();expect(manager.subscribe).toHaveBeenCalledWith({userVisibleOnly:true,applicationServerKey:expect.any(Uint8Array)});expect(mock.request).toHaveBeenCalledWith('owner','subscribe',{subscription:subscription.toJSON()})
 })
})
