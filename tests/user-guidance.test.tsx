import {describe,it,expect,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {domains,questions,type AnswerMap} from '../src/data'
import {describeDomainScore,resultPriorities,domainGuidance,toolGuides} from '../src/user-guidance'
import {ResultOrientation,UserGuide} from '../src/UserGuide'
const answers=(value:number)=>Object.fromEntries(questions.map(q=>[q.id,value])) as AnswerMap
describe('clear score interpretation and a single next step',()=>{
 it('explains the direction of the score and gives a working next action',()=>{const html=renderToStaticMarkup(<ResultOrientation answers={answers(2)} onPlan={vi.fn()} onGuide={vi.fn()}/>);expect(html).toContain('الدرجة الأقل = صعوبات أقل');expect(html).toContain('مش نسبة تركيز أو ذكاء');expect(html).toContain('ابدأ بخطة الـ14 يوم');expect(html).toContain('مش مطلوب تستخدم كل الأدوات')})
 it('keeps a high individual difficulty visible even with a low total score',()=>{const input=answers(0);for(const q of questions.filter(q=>q.domain==='focus'))input[q.id]=4;const summary=resultPriorities(input);expect(summary.priority.id).toBe('focus');expect(summary.priority.score).toBe(20);expect(summary.allLow).toBe(false);expect(summary.strengths.map(d=>d.id)).not.toContain('focus')})
 it('does not invent an area of strength for uniformly high answers',()=>{const summary=resultPriorities(answers(4));expect(summary.strengths).toHaveLength(0);const html=renderToStaticMarkup(<ResultOrientation answers={answers(4)} onPlan={()=>{}} onGuide={()=>{}}/>);expect(html).toContain('مش مطلوب تصلّح كل حاجة مرة واحدة');expect(html).not.toContain('إجاباتك في الجوانب دي بتوصف صعوبات أقل')})
 it('uses maintenance guidance when all reported difficulties are low',()=>{expect(resultPriorities(answers(0)).allLow).toBe(true);const html=renderToStaticMarkup(<ResultOrientation answers={answers(0)} onPlan={()=>{}} onGuide={()=>{}}/>);expect(html).toContain('حافظ على عادة مفيدة واحدة')})
 it.each([[0,'low'],[6,'low'],[7,'mid'],[11,'mid'],[12,'high'],[20,'high']])('matches the existing descriptive score display at %s', (value,tone)=>expect(describeDomainScore(value as number).tone).toBe(tone))
 it.each([-1,21,1.5,NaN])('refuses an impossible domain score %s',value=>expect(()=>describeDomainScore(value)).toThrow())
 it('provides a domain-specific explanation and an action for every domain',()=>{for(const d of domains){expect(domainGuidance[d.id].meaning.length).toBeGreaterThan(20);expect(domainGuidance[d.id].action.length).toBeGreaterThan(20)}})
 it('covers every tool with purpose, ordered instructions and expected outcome',()=>{expect(Object.keys(toolGuides)).toEqual(['goals','focus','program','habits','learning','review']);for(const guide of Object.values(toolGuides)){expect(guide.steps).toHaveLength(3);expect(guide.purpose).toBeTruthy();expect(guide.finish).toBeTruthy()}})
 it('explains score examples and separates completing from optional saving',()=>{const html=renderToStaticMarkup(<UserGuide hasResult={false} onQuiz={()=>{}} onResult={()=>{}} onPlan={()=>{}}/>);expect(html).toContain('6/20');expect(html).toContain('16/20');expect(html).toContain('حفظ نسخة في سجل حسابك اختياري');expect(html).toContain('ابدأ الاختبار');expect(html).not.toContain('افهم نتيجتي');for(const panel of Object.keys(toolGuides))expect(html).toContain(`#/tools?panel=${panel}`)})
})
