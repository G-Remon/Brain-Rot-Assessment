// @vitest-environment jsdom
import {act} from 'react'
import {createRoot,type Root} from 'react-dom/client'
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest'
import {questions,type AnswerMap} from '../src/data'
import {buildPersonalReport} from '../src/personalization'
import {buildJourney,exercises,defaultConfig} from '../src/journey'
import {emptyProState} from '../src/pro-model'
const mock=vi.hoisted(()=>({getUser:vi.fn(),invoke:vi.fn(),loadPlan:vi.fn(),persistPlan:vi.fn(),readWorkspace:vi.fn(),saveAssessment:vi.fn()}))
vi.mock('../src/supabase',()=>({supabase:{auth:{getUser:mock.getUser,getSession:async()=>({data:{session:{access_token:'test-only'}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe:()=>{}}}})},functions:{invoke:mock.invoke}}}))
vi.mock('../src/plan-store',()=>({loadPlan:mock.loadPlan,persistPlan:mock.persistPlan,removePlan:vi.fn()}))
vi.mock('../src/pro-store',()=>({readProState:mock.readWorkspace,writeProState:vi.fn()}))
vi.mock('../src/account-profile',()=>({loadDisplayName:async()=>null,validDisplayName:(s:string)=>s,saveDisplayName:async()=>''}))
vi.mock('../src/assessment-history',async original=>({...await original<typeof import('../src/assessment-history')>(),listSavedAssessments:async()=>[],saveAssessment:mock.saveAssessment}))
import {App} from '../src/main'
import {AppMessages,confirmAction} from '../src/app-messages'
import {JourneyWorkspace} from '../src/JourneyWorkspace'
import {Focus} from '../src/pro/Focus'
let root:Root,host:HTMLDivElement
const full=Object.fromEntries(questions.map(q=>[q.id,2])) as AnswerMap
const flush=async()=>{await act(async()=>{await new Promise(resolve=>setTimeout(resolve,0))})}
function button(text:string,scope:ParentNode=host){const b=[...scope.querySelectorAll('button')].find(b=>b.textContent?.trim()===text);if(!b)throw Error('Missing button '+text);return b}
async function click(element:HTMLElement){await act(async()=>{element.click()});await flush()}
async function render(element:React.ReactNode){await act(async()=>{root.render(element)});await flush()}
beforeEach(()=>{
 vi.clearAllMocks();window.history.replaceState(null,'','/');localStorage.clear()
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
 window.scrollTo=vi.fn();Element.prototype.scrollIntoView=vi.fn()
 HTMLDialogElement.prototype.showModal=function(){this.open=true}
 HTMLDialogElement.prototype.close=function(){this.open=false}
 mock.getUser.mockResolvedValue({data:{user:{id:'audit-owner',user_metadata:{},email:'audit@example.invalid'}},error:null})
 mock.loadPlan.mockResolvedValue(null);mock.persistPlan.mockImplementation(async(_owner,plan)=>plan);mock.readWorkspace.mockResolvedValue({state:emptyProState(),updatedAt:null})
 mock.invoke.mockImplementation(async(_name:string,{body}:{body:{action:string;answers:AnswerMap;config:typeof defaultConfig}})=>({data:body.action==='status'?{active:true,isAdmin:false,validUntil:null}:body.action==='library'?{exercises}:body.action==='report'?{report:buildPersonalReport(body.answers)}:{journey:buildJourney(body.answers,body.config)},error:null}))
 host=document.createElement('div');document.body.append(host);root=createRoot(host)
})
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks()})
describe('actual application navigation and failure states',()=>{
 it('opens all member routes and keeps administration private',async()=>{
  await render(<App/>);
  for(const name of ['الحلول','خطتي','أدواتي','الرئيسية'])await click(button(name,host.querySelector('nav')!))
  expect(host.querySelector('h1')?.textContent).toContain('الموبايل')
  await act(async()=>{window.location.hash='#/admin';window.dispatchEvent(new HashChangeEvent('hashchange'))});await flush()
  expect(host.textContent).toContain('الحساب الحالي مش عنده صلاحية أدمن')
 })
 it('completes all 30 answers and opens the plan from the detailed report',async()=>{
  await render(<App/>);await click(button('الاختبار',host.querySelector('nav')!))
  for(let i=0;i<30;i++){await click(host.querySelectorAll<HTMLButtonElement>('.answer-option')[2]);await click(button(i===29?'شوف نتيجتك':'التالي'))}
  expect(host.querySelector('.results-page')).not.toBeNull()
  await click(button('التحليل المفصّل',host.querySelector('.report-navigation')!));expect(host.querySelector('#analysis')?.closest('details')?.open).toBe(true)
  const link=host.querySelector<HTMLAnchorElement>('.report-lead a')!;expect(link.getAttribute('href')).toBe('#/journey')
  await click(link);expect(host.querySelector('.journey-workspace')).not.toBeNull()
 })
 it('opens the guide from navigation and returns from the score explanation to the real plan',async()=>{
  localStorage.setItem('mindreset-assessment-v1:user:audit-owner',JSON.stringify(full));await render(<App/>);
  await click(button('إرشادات',host.querySelector('nav')!));expect(window.location.hash).toBe('#/guide');expect(host.querySelector('.user-guide')).not.toBeNull();
  await click(button('افهم نتيجتي'));expect(host.querySelector('.result-orientation')?.textContent).toContain('الدرجة الأقل = صعوبات أقل');
  await click(button('ابدأ بخطة الـ14 يوم'));expect(window.location.hash).toBe('#/journey');expect(host.querySelector('.journey-workspace')).not.toBeNull();expect(host.querySelector('.section-help')).not.toBeNull();
 })
 it('includes optional result details when printing and restores the reading view afterward',async()=>{
  localStorage.setItem('mindreset-assessment-v1:user:audit-owner',JSON.stringify(full));window.history.replaceState(null,'','/#/results');await render(<App/>);
  const details=[...host.querySelectorAll<HTMLDetailsElement>('details.guided-details')];expect(details.length).toBe(3);expect(details.every(d=>!d.open)).toBe(true);
  await click(button('التحليل المفصّل',host.querySelector('.report-navigation')!));const openBefore=details.map(d=>d.open);
  window.dispatchEvent(new Event('beforeprint'));expect(details.every(d=>d.open)).toBe(true);window.dispatchEvent(new Event('afterprint'));expect(details.map(d=>d.open)).toEqual(openBefore);
 })
 it('does not replace the page route with an orphan section hash',async()=>{
  localStorage.setItem('mindreset-assessment-v1:user:audit-owner',JSON.stringify(full));window.history.replaceState(null,'','/#/results')
  await render(<App/>);const nav=host.querySelector('.report-navigation')!;const target=[...nav.querySelectorAll<HTMLElement>('a,button')].find(e=>e.textContent==='الكتب والمصادر')!;await click(target)
  expect(window.location.hash).toBe('#/results');expect(host.querySelector<HTMLDetailsElement>('#resources')?.open).toBe(true)
 })
 it('keeps the app usable if browser storage is full or disabled',async()=>{
  vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new DOMException('Quota exceeded','QuotaExceededError')})
  await render(<App/>);expect(host.querySelector('h1')?.textContent).toContain('الموبايل');expect(host.textContent).toContain('الحفظ على الجهاز مش متاح')
 })
 it('shows a recoverable error when Google returns without a verified session',async()=>{
  window.history.replaceState(null,'','/?auth_action=google');mock.getUser.mockResolvedValue({data:{user:null},error:Error('invalid callback')});await render(<App/>);
  expect(host.textContent).toContain('تسجيل الدخول عبر Google ما اكتملش');expect(host.querySelector('.nav-links')).toBeNull();expect(window.location.search).toBe('')
 })
 it('restores the correct page when moving back and forward through navigation',async()=>{
  await render(<App/>);await click(button('الحلول',host.querySelector('nav')!));await click(button('أدواتي',host.querySelector('nav')!));
  await act(async()=>{window.history.back();await new Promise(r=>setTimeout(r,30))});await flush();expect(host.querySelector('.solution-workspace')).not.toBeNull();expect(window.location.hash).toBe('#/library');
  await act(async()=>{window.history.forward();await new Promise(r=>setTimeout(r,30))});await flush();expect(host.querySelector('.pro-dashboard')).not.toBeNull();expect(window.location.hash).toBe('#/tools')
 })
 it('offers a working retry after the plan service fails',async()=>{
  mock.invoke.mockRejectedValueOnce(Error('offline'))
  await render(<JourneyWorkspace owner="audit-owner" answers={full} onStartQuiz={()=>{}} onLogin={()=>{}}/>);
  expect(host.textContent).toContain('تعذّر تحميل خطوات الخطة')
  await click(button('إعادة التحميل'));expect(host.querySelector('.journey-board')).not.toBeNull();expect(host.textContent).not.toContain('تعذّر تحميل خطوات الخطة')
 })
 it('does not count a focus interruption that failed to save',async()=>{
  const save=vi.fn().mockResolvedValue(false);await render(<Focus state={emptyProState()} busy={false} save={save}/>);
  // Enable the session by entering a task using the native input setter.
  const input=host.querySelector('input')!;await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,'مهمة للاختبار');input.dispatchEvent(new Event('input',{bubbles:true}))});
  await click(button('ابدأ الجلسة'));await click(button('اتشتت · 0'));expect(host.textContent).toContain('اتشتت · 0')
 })
})
describe('in-app destructive-action confirmations',()=>{
 it('cancels safely, rejects overlapping prompts, and resolves confirmation once',async()=>{
  await render(<AppMessages/>);let first!:Promise<boolean>,second!:Promise<boolean>;
  await act(async()=>{first=confirmAction('مسح بيانات الاختبار؟');second=confirmAction('طلب تاني')})
  expect(await second).toBe(false);expect(host.querySelector('dialog')?.open).toBe(true)
  await click(button('إلغاء والرجوع'));expect(await first).toBe(false)
  await act(async()=>{first=confirmAction('مسح؟')});await click(button('تأكيد ومتابعة'));expect(await first).toBe(true)
 })
 it('cancels on Escape and when the owning app unmounts',async()=>{
  await render(<AppMessages/>);let result!:Promise<boolean>;await act(async()=>{result=confirmAction('مسح؟')});
  await act(async()=>{host.querySelector('dialog')!.dispatchEvent(new Event('cancel',{cancelable:true}))});expect(await result).toBe(false)
  await act(async()=>{result=confirmAction('مسح؟')});await render(<div/>);expect(await result).toBe(false)
 })
})
