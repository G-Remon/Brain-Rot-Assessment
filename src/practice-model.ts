import {domains,type DomainId} from './data'
import {practiceBank,type PracticeLevel} from './practice-bank'
export type PracticeAttempt={id:string;domain:DomainId;level:PracticeLevel;correct:number;total:number;completedAt:string}
export function practiceQuestions(domain:DomainId,level:PracticeLevel){return practiceBank.filter(q=>q.domain===domain&&q.level===level)}
export function percent(correct:number,total:number){return total>0?Math.round(correct/total*100):0}
export function unlockedLevel(attempts:PracticeAttempt[],domain:DomainId):PracticeLevel{
 let level:PracticeLevel=1
 if(attempts.some(a=>a.domain===domain&&a.level===1&&percent(a.correct,a.total)>=75))level=2
 if(level===2&&attempts.some(a=>a.domain===domain&&a.level===2&&percent(a.correct,a.total)>=75))level=3
 return level
}
export function validAttempt(value:unknown):value is PracticeAttempt{if(!value||typeof value!=='object')return false;const a=value as PracticeAttempt;return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(a.id)&&domains.some(d=>d.id===a.domain)&&[1,2,3].includes(a.level)&&Number.isInteger(a.correct)&&a.total===4&&a.correct>=0&&a.correct<=a.total&&typeof a.completedAt==='string'&&!Number.isNaN(Date.parse(a.completedAt))}

export function bestAttempts(values:PracticeAttempt[]){const best=new Map<string,PracticeAttempt>();for(const a of values){const key=a.domain+':'+a.level,old=best.get(key);if(!old||a.correct>old.correct||a.correct===old.correct&&a.completedAt>old.completedAt)best.set(key,a)}return [...best.values()].sort((a,b)=>b.completedAt.localeCompare(a.completedAt))}
