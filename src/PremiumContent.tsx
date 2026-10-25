import { useEffect, useState } from 'react'
import type { AnswerMap } from './data'
import type { PersonalReport } from './personalization'
import type { Exercise } from './journey'
import { snapshotKey } from './assessment-history'
import { AnalysisExplorer } from './AnalysisExplorer'
import { SolutionLibrary } from './SolutionLibrary'
import { proRequest } from './pro-access'
export function PremiumContent({answers,kind}:{answers:AnswerMap|null;kind:'report'|'library'}){
 const [report,setReport]=useState<PersonalReport|null>(null),[exercises,setExercises]=useState<Exercise[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(false),[retry,setRetry]=useState(0)
 const key=snapshotKey(answers)
 useEffect(()=>{let alive=true;setLoading(true);setError(false);void proRequest<{report?:PersonalReport;exercises?:Exercise[]}>(kind,kind==='report'?{answers}:{}).then(data=>{if(alive){if(kind==='report'){if(!data.report||data.report.questionReadings.length!==30)throw new Error('invalid-report');setReport(data.report)}else{if(!Array.isArray(data.exercises))throw new Error('invalid-library');setExercises(data.exercises)}}}).catch(()=>{if(alive)setError(true)}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[kind,key,retry])
 if(loading)return <div className="workspace-status" role="status">بنحمّل {kind==='report'?'تحليلك التفصيلي':'مكتبة الحلول'} من حسابك...</div>
 if(error)return <div className="workspace-error" role="alert">تعذّر تحميل المحتوى أو الاشتراك انتهى. <button onClick={()=>setRetry(n=>n+1)}>جرّب تاني</button></div>
 return kind==='report'&&answers&&report?<AnalysisExplorer answers={answers} report={report}/>:kind==='library'?<SolutionLibrary answers={answers} exercises={exercises}/>:null
}
