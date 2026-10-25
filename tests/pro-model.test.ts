import {describe,it,expect} from 'vitest'
import {addDays,emptyProState,goalSchedule,programDay,reviewCard,validProState,weeklySummary,type Goal,type ProState} from '../src/pro-model'
const goal=():Goal=>({id:'g1',title:'Build project',outcome:'Published project',baseline:'Basics complete',createdOn:'2026-10-25',deadline:'2026-10-28',minutes:20,weekdays:[0,1,2,3,4,5,6],tasks:[{id:'t1',title:'Build page',minutes:30,doneOn:null},{id:'t2',title:'Test page',minutes:30,doneOn:null}]})
describe('Pro goal planning',()=>{
 it('splits work across available days without exceeding capacity',()=>{const p=goalSchedule(goal(),'2026-10-25');expect(p.capacity).toBe(80);expect(p.totalMinutes).toBe(60);expect(p.shortfall).toBe(0);expect(p.scheduled.map(t=>t.start)).toEqual(['2026-10-25','2026-10-26'])})
 it('reports insufficient capacity rather than promising a deadline',()=>{const g=goal();g.deadline='2026-10-25';expect(goalSchedule(g,'2026-10-25').shortfall).toBe(40)})
 it('respects excluded weekdays and completed tasks',()=>{const g=goal();g.weekdays=[1];g.tasks[0].doneOn='2026-10-25';const p=goalSchedule(g,'2026-10-25');expect(p.availableDays).toBe(1);expect(p.totalMinutes).toBe(30);expect(p.shortfall).toBe(10)})
 it('handles expired deadlines',()=>expect(goalSchedule(goal(),'2026-11-01').capacity).toBe(0))
 it('handles month and leap-year transitions',()=>{expect(addDays('2026-12-31',1)).toBe('2027-01-01');expect(addDays('2028-02-28',1)).toBe('2028-02-29')})
})
describe('Pro validation and data boundaries',()=>{
 it('accepts a complete bounded workspace',()=>{const s=emptyProState();s.goals=[goal()];expect(validProState(s)).toBe(s)})
 it.each([{version:2},{goals:null},{cards:[{id:'c1',question:'q',answer:'a',due:'2026-02-30',step:0}]},{goals:[{...goal(),weekdays:[]}]},{goals:[{...goal(),weekdays:[1,1]}]},{goals:[{...goal(),minutes:-1}]},{goals:[{...goal(),outcome:' '}]},{sessions:[{id:'s',date:'2026-10-25',goalId:'',taskId:'',title:'x',seconds:Infinity,interruptions:0,output:'x'}]},{program:{days:90,startedOn:'2026-10-25',goalId:'',minutes:10,completed:[91]}},{program:{days:30,startedOn:'2026-10-25',goalId:'',minutes:10,completed:[1,1]}},{sleep:[{id:'s',date:'2026-10-25',bed:'25:00',wake:'07:00',energy:3}]}])('rejects corrupt or unbounded data %#',patch=>expect(validProState({...emptyProState(),...patch})).toBeNull())
 it('rejects duplicate identifiers',()=>{const s=emptyProState();s.goals=[goal(),goal()];expect(validProState(s)).toBeNull()})
 it('does not silently accept huge collections',()=>{const s=emptyProState();s.cards=Array.from({length:101},(_,i)=>({id:'c'+i,question:'q',answer:'a',due:'2026-10-25',step:0}));expect(validProState(s)).toBeNull()})
})
describe('Pro reviews and learning',()=>{
 it('compares adjacent seven-day periods without counting future records',()=>{const s=emptyProState();s.sessions=[{id:'s1',date:'2026-10-25',seconds:1200,goalId:'',taskId:'',title:'a',output:'x',interruptions:3},{id:'s2',date:'2026-10-18',seconds:600,goalId:'',taskId:'',title:'a',output:'x',interruptions:0},{id:'s3',date:'2026-10-26',seconds:9999,goalId:'',taskId:'',title:'a',output:'x',interruptions:0}];const r=weeklySummary(s,'2026-10-25');expect(r.minutes).toBe(20);expect(r.previousMinutes).toBe(10);expect(r.sessions).toBe(1);expect(r.advice).toContain('المشتت')})
 it('offers a light return when no sessions were saved',()=>expect(weeklySummary(emptyProState(),'2026-10-25').advice).toContain('5 دقايق'))
 it('schedules remembered cards progressively and resets forgotten ones',()=>{const card={id:'c',question:'q',answer:'a',due:'2026-10-25',step:2};expect(reviewCard(card,true,'2026-10-25').due).toBe('2026-11-01');expect(reviewCard(card,false,'2026-10-25')).toMatchObject({step:0,due:'2026-10-26'})})
 it.each([30,60,90] as const)('builds a %s-day framework with reviews and a gentle start',days=>{const s:ProState={...emptyProState(),goals:[goal()],program:{days,startedOn:'2026-10-25',goalId:'g1',minutes:30,completed:[]}};expect(programDay(s,1)?.minutes).toBe(10);expect(programDay(s,7)?.review).toBe(true);expect(programDay(s,days)?.review).toBe(true);expect(programDay(s,8)?.task).toContain('Build page')})
})
