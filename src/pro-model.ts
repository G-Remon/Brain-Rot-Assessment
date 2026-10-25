import { localDate } from './journey'
export type GoalTask={id:string;title:string;minutes:number;doneOn:string|null}
export type Goal={id:string;title:string;outcome:string;baseline:string;deadline:string;minutes:number;weekdays:number[];tasks:GoalTask[];createdOn:string}
export type FocusSession={id:string;date:string;goalId:string;taskId:string;title:string;seconds:number;interruptions:number;output:string}
export type Distraction={id:string;date:string;hour:number;reason:string;context:string}
export type SleepEntry={id:string;date:string;bed:string;wake:string;energy:number}
export type RecallCard={id:string;question:string;answer:string;due:string;step:number}
export type Review={id:string;date:string;helpful:string;hard:string;next:string}
export type Challenge={id:string;title:string;startedOn:string;completed:number[]}
export type Experiment={id:string;title:string;metric:string;before:number;after:number|null;note:string}
export type LongProgram={days:30|60|90;startedOn:string;goalId:string;minutes:5|10|20|30;completed:number[]}
export type ProState={version:1;goals:Goal[];sessions:FocusSession[];distractions:Distraction[];sleep:SleepEntry[];cards:RecallCard[];reviews:Review[];challenges:Challenge[];experiments:Experiment[];program:LongProgram|null}
export const emptyProState=():ProState=>({version:1,goals:[],sessions:[],distractions:[],sleep:[],cards:[],reviews:[],challenges:[],experiments:[],program:null})
const text=(v:unknown,max=500):v is string=>typeof v==='string'&&v.length<=max
const number=(v:unknown,min:number,max:number):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max
const date=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))&&localDate(new Date(v+'T12:00:00'))===v
const id=(v:unknown)=>text(v,80)&&/^[a-zA-Z0-9_-]+$/.test(v)
const time=(v:unknown)=>typeof v==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v)
const list=<T>(v:unknown,max:number,test:(entry:T)=>boolean):v is T[]=>Array.isArray(v)&&v.length<=max&&v.every(e=>e&&typeof e==='object'&&test(e))&&new Set(v.map(e=>e.id)).size===v.length
export function validProState(input:unknown):ProState|null {
  if(!input||typeof input!=='object')return null
  const s=input as ProState
  if(s.version!==1)return null
  if(!list<Goal>(s.goals,5,g=>id(g.id)&&text(g.title,120)&&!!g.title.trim()&&text(g.outcome,500)&&!!g.outcome.trim()&&text(g.baseline,500)&&!!g.baseline.trim()&&date(g.deadline)&&date(g.createdOn)&&number(g.minutes,5,120)&&Array.isArray(g.weekdays)&&g.weekdays.length>=1&&g.weekdays.length<=7&&g.weekdays.every(d=>Number.isInteger(d)&&d>=0&&d<=6)&&new Set(g.weekdays).size===g.weekdays.length&&list<GoalTask>(g.tasks,60,t=>id(t.id)&&text(t.title,200)&&!!t.title.trim()&&number(t.minutes,5,600)&&(t.doneOn===null||date(t.doneOn)))))return null
  if(!list<FocusSession>(s.sessions,200,e=>id(e.id)&&date(e.date)&&text(e.goalId,80)&&text(e.taskId,80)&&text(e.title,200)&&number(e.seconds,1,14400)&&number(e.interruptions,0,1000)&&Number.isInteger(e.interruptions)&&text(e.output,500)))return null
  if(!list<Distraction>(s.distractions,200,e=>id(e.id)&&date(e.date)&&number(e.hour,0,23)&&Number.isInteger(e.hour)&&text(e.reason,120)&&text(e.context,200)))return null
  if(!list<SleepEntry>(s.sleep,120,e=>id(e.id)&&date(e.date)&&time(e.bed)&&time(e.wake)&&number(e.energy,1,5)&&Number.isInteger(e.energy)))return null
  if(!list<RecallCard>(s.cards,100,e=>id(e.id)&&text(e.question,300)&&!!e.question.trim()&&text(e.answer,1000)&&!!e.answer.trim()&&date(e.due)&&number(e.step,0,5)&&Number.isInteger(e.step)))return null
  if(!list<Review>(s.reviews,26,e=>id(e.id)&&date(e.date)&&text(e.helpful,500)&&text(e.hard,500)&&text(e.next,500)))return null
  if(!list<Challenge>(s.challenges,10,e=>id(e.id)&&text(e.title,120)&&date(e.startedOn)&&Array.isArray(e.completed)&&e.completed.length<=7&&new Set(e.completed).size===e.completed.length&&e.completed.every(d=>Number.isInteger(d)&&d>=1&&d<=7)))return null
  if(!list<Experiment>(s.experiments,10,e=>id(e.id)&&text(e.title,200)&&text(e.metric,120)&&number(e.before,0,100000)&&(e.after===null||number(e.after,0,100000))&&text(e.note,500)))return null
  if(s.program!==null){const p=s.program;if(!p||![30,60,90].includes(p.days)||!date(p.startedOn)||!text(p.goalId,80)||![5,10,20,30].includes(p.minutes)||!Array.isArray(p.completed)||p.completed.length>p.days||new Set(p.completed).size!==p.completed.length||!p.completed.every(d=>Number.isInteger(d)&&d>=1&&d<=p.days))return null}
  return s
}
export function addDays(value:string,amount:number){const d=new Date(value+'T12:00:00');d.setDate(d.getDate()+amount);return localDate(d)}
export function goalSchedule(goal:Goal,today=localDate()){
  const pending=goal.tasks.filter(t=>!t.doneOn)
  const totalMinutes=pending.reduce((n,t)=>n+t.minutes,0)
  const dates:string[]=[]
  for(let d=today;d<=goal.deadline&&dates.length<=730;d=addDays(d,1))if(goal.weekdays.includes(new Date(d+'T12:00:00').getDay()))dates.push(d)
  const capacity=dates.length*goal.minutes
  let cursor=0,used=0
  const scheduled=pending.map(task=>{
    const start=dates[cursor]??null
    let remaining=task.minutes
    while(remaining>0&&cursor<dates.length){const available=goal.minutes-used;const take=Math.min(available,remaining);remaining-=take;used+=take;if(used>=goal.minutes){cursor++;used=0}}
    return {...task,start:remaining>0?null:start}
  })
  return {pending,totalMinutes,capacity,shortfall:Math.max(0,totalMinutes-capacity),scheduled,availableDays:dates.length}
}
export const goalTemplates={
  project:{label:'مشروع برمجي',tasks:['حدد فكرة المشروع والمخرجات المطلوبة','ارسم الصفحات وتدفق المستخدم','جهّز المشروع وهيكل الملفات','ابنِ الواجهة الأساسية','اربط البيانات والتفاعلات','اختبر وأصلح المشاكل','انشر النسخة وراجعها']},
  course:{label:'تعلّم مهارة',tasks:['حدد المهارة ومصدر تعلّم واحد','قسّم المحتوى لأجزاء مناسبة','تعلم الجزء الأول وجرّب مثالًا','استرجع أهم الأفكار من غير المصدر','طبّق على تمرين مستقل','راجع الأخطاء وأعد المحاولة','أنجز تطبيقًا صغيرًا يثبت فهمك']},
  book:{label:'قراءة وفهم كتاب',tasks:['اختار الكتاب وحدد سبب قراءته','حدد الفصول اللي هتبدأ بيها','اقرأ جزءًا واكتب فكرته من الذاكرة','راجع الفكرة بمثال من حياتك','كمل الجزء التالي واسترجع القديم','طبّق فكرة واحدة مناسبة','اكتب مراجعة لما استفدت منه']},
  custom:{label:'هدف خاص',tasks:['حدد النتيجة النهائية','حدد أول مرحلة ملموسة','نفّذ أول خطوة','راجع اللي اتعمل وعدّل','كمل المرحلة التالية','اختبر النتيجة','راجع الهدف وحدد الخطوة الجاية']},
} as const
export function weeklySummary(state:ProState,today=localDate()){
  const start=addDays(today,-6),previous=addDays(today,-13)
  const current=state.sessions.filter(s=>s.date>=start&&s.date<=today),before=state.sessions.filter(s=>s.date>=previous&&s.date<start)
  const minutes=(list:FocusSession[])=>Math.round(list.reduce((n,s)=>n+s.seconds,0)/60)
  const interruptions=current.reduce((n,s)=>n+s.interruptions,0)
  const reasons=Object.entries(state.distractions.filter(d=>d.date>=start&&d.date<=today).reduce<Record<string,number>>((a,d)=>(a[d.reason]=(a[d.reason]??0)+1,a),{})).sort((a,b)=>b[1]-a[1])
  const tasksDone=state.goals.flatMap(g=>g.tasks).filter(t=>t.doneOn&&t.doneOn>=start&&t.doneOn<=today).length
  const energy=state.sleep.filter(s=>s.date>=start&&s.date<=today)
  const advice=!current.length?'ابدأ بجلسة 5 دقايق على مهمة واحدة بدل تعويض كل الأيام مرة واحدة.':interruptions/current.length>=3?'جرّب تبعد المشتت الأكثر تكرارًا في جلسة واحدة، وقارن عدد المقاطعات.':tasksDone===0?'اربط الجلسة بناتج واضح، حتى لو جزء صغير من مهمة.':'حافظ على المدة اللي ناسبتك، واختار ناتجًا واقعيًا للأسبوع الجاي.'
  return {minutes:minutes(current),previousMinutes:minutes(before),sessions:current.length,interruptions,tasksDone,reasons,energy:energy.length?Number((energy.reduce((n,s)=>n+s.energy,0)/energy.length).toFixed(1)):null,advice}
}
export function reviewCard(card:RecallCard,remembered:boolean,today=localDate()):RecallCard{
  const step=remembered?Math.min(card.step+1,5):0
  return {...card,step,due:addDays(today,[1,1,3,7,14,30][step])}
}
export function programDay(state:ProState,day:number){
  const p=state.program;if(!p)return null
  const goal=state.goals.find(g=>g.id===p.goalId)
  if(day%7===0||day===p.days)return {title:'مراجعة الأسبوع والتعديل',task:'راجع إنجازك وملاحظاتك. اختار خطوة نفعتك وخطوة محتاجة تتخفف.',minutes:Math.min(10,p.minutes),review:true}
  const task=goal?.tasks.find(t=>!t.doneOn)
  return {title:day<=3?'ابدأ بخطوة صغيرة':day%14===1?'راجع خط البداية وجدّد أولويتك':'طبّق على هدفك',task:task?`اشتغل على: ${task.title}`:'اختار مهمة واحدة واضحة من هدفك أو من مكتبة الحلول.',minutes:day<=3?Math.min(10,p.minutes):p.minutes,review:false}
}
