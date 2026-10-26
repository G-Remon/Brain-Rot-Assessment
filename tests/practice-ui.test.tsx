// @vitest-environment jsdom
import {act} from 'react'
import {createRoot,type Root} from 'react-dom/client'
import {beforeEach,afterEach,it,expect,vi} from 'vitest'
const mock=vi.hoisted(()=>({load:vi.fn(),save:vi.fn()}))
vi.mock('../src/practice-store',()=>({loadPracticeAttempts:mock.load,savePracticeAttempt:mock.save}))
import {PracticePage} from '../src/PracticePage'
import {practiceQuestions} from '../src/practice-model'
let root:Root,host:HTMLDivElement
const flush=async()=>{await act(async()=>{await new Promise(r=>setTimeout(r,0))})}
async function click(text:string){const button=[...host.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent?.trim()===text)!;expect(button).toBeTruthy();await act(async()=>button.click());await flush()}
beforeEach(()=>{vi.clearAllMocks();sessionStorage.clear();window.scrollTo=vi.fn();Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});host=document.createElement('div');document.body.append(host);root=createRoot(host);mock.load.mockResolvedValue([]);mock.save.mockResolvedValue(undefined)})
afterEach(async()=>{await act(async()=>root.unmount());host.remove()})
it('grades four answers once, saves one owned attempt and unlocks the next level',async()=>{
 await act(async()=>root.render(<PracticePage owner="owner" answers={null} onQuiz={()=>{}}/>));await flush();await click('ابدأ التدريب');const items=practiceQuestions('focus',1)
 for(let i=0;i<4;i++){const options=host.querySelectorAll<HTMLButtonElement>('.practice-options button');await act(async()=>options[items[i].answer].click());await click('تأكيد الإجابة');expect(host.querySelector('.practice-feedback')?.textContent).toContain(items[i].explanation);await click(i===3?'شوف درجة التدريب':'السؤال التالي')}
 expect(host.querySelector('.practice-result h2')?.textContent).toBe('100/100');expect(mock.save).toHaveBeenCalledOnce();expect(mock.save).toHaveBeenCalledWith('owner',expect.objectContaining({domain:'focus',level:1,correct:4,total:4}));expect(host.querySelector('.practice-solutions')?.textContent).toContain('الإجابة الصحيحة');const levels=host.querySelectorAll<HTMLButtonElement>('.practice-levels button');expect(levels[1].disabled).toBe(false);expect(levels[2].disabled).toBe(true);await click('جهّز المستوى التالي');expect(host.querySelector('.practice-result')).toBeNull();expect(host.querySelectorAll('.practice-levels button')[1].getAttribute('aria-pressed')).toBe('true');await click('ابدأ التدريب');expect(host.querySelector('.practice-question-meta')?.textContent).toContain('مستوى 2')
})
it('requires a memory attempt before displaying recall choices and does not create a cloud record for guests',async()=>{
 await act(async()=>root.render(<PracticePage owner={undefined} answers={null} onQuiz={()=>{}}/>));await flush();const select=host.querySelector('select')!;await act(async()=>{select.value='memory';select.dispatchEvent(new Event('change',{bubbles:true}))});await click('ابدأ التدريب');expect(host.querySelector('.practice-options')).toBeNull();expect(host.querySelector('.practice-stimulus')).not.toBeNull();await click('اخفِ المعلومات وابدأ السؤال');expect(host.querySelector('.practice-stimulus')).toBeNull();expect(host.querySelectorAll('.practice-options button')).toHaveLength(4);expect(mock.save).not.toHaveBeenCalled();expect(mock.load).not.toHaveBeenCalled()
})
it('retries saving with the same attempt ID and leaves locked levels closed until save succeeds',async()=>{
 mock.save.mockRejectedValueOnce(Error('offline'));await act(async()=>root.render(<PracticePage owner="owner" answers={null} onQuiz={()=>{}}/>));await flush();await click('ابدأ التدريب');const items=practiceQuestions('focus',1)
 for(let i=0;i<4;i++){await act(async()=>host.querySelectorAll<HTMLButtonElement>('.practice-options button')[items[i].answer].click());await click('تأكيد الإجابة');await click(i===3?'شوف درجة التدريب':'السؤال التالي')}
 expect(host.querySelector('.workspace-error')?.textContent).toContain('الدرجة ما اتحفظتش');const id=mock.save.mock.calls[0][1].id;expect(host.querySelectorAll<HTMLButtonElement>('.practice-levels button')[1].disabled).toBe(true);await click('إعادة الحفظ');expect(mock.save).toHaveBeenCalledTimes(2);expect(mock.save.mock.calls[1][1].id).toBe(id);expect(host.querySelectorAll<HTMLButtonElement>('.practice-levels button')[1].disabled).toBe(false)
})
