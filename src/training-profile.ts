import {domains,domainScore,totalScore,type AnswerMap,type DomainId} from './data'
import {validatedAssessment} from './assessment-history'
export function trainingProfile(answers:AnswerMap|null){
 const complete=validatedAssessment(answers)
 if(!complete)return {mode:'explore' as const,score:null,domain:'focus' as DomainId,minutes:5,action:'اختار مجالًا وابدأ بالمستوى الأول؛ تقدر تعمل تقييم العادات لترشيح بداية أقرب ليك.'}
 const score=totalScore(complete),ranked=domains.map(d=>({...d,score:domainScore(complete,d.id)})).sort((a,b)=>b.score-a.score)
 if(score<=40&&ranked[0].score<12)return {mode:'maintain' as const,score,domain:ranked[0].id,minutes:10,action:'مسار تثبيت: جرّب الخطوات كاملة، وسجّل الناتج وراجع تجربة واحدة أعمق لما تكون جاهز.'}
 return {mode:'gentle' as const,score,domain:ranked[0].id,minutes:score>80?3:5,action:'بداية خفيفة: ابدأ بالنسخة الصغيرة من تمرين واحد، وراجع الحل المشروح قبل تكرار المحاولة.'}
}

/** Starting sets differ in both exercise selection and task size, not just a label. */
export function recommendedPracticalExercises(answers:AnswerMap|null,exercises:import('./journey').Exercise[]){
 const profile=trainingProfile(answers)
 if(profile.mode==='explore')return []
 const pool=exercises.filter(e=>e.domain===profile.domain)
 const chosen=profile.mode==='gentle'?pool.slice(0,profile.minutes===3?1:2):pool.slice(-3)
 return chosen.map(exercise=>({exercise,steps:profile.mode==='gentle'?[exercise.tiny,'بعد التجربة، سجّل ملاحظة واحدة عن اللي حصل.']:exercise.steps,minutes:profile.minutes}))
}
