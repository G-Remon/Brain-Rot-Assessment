import type { ProState } from '../pro-model'
export type ProPanelProps={state:ProState;busy:boolean;save:(next:ProState,message?:string)=>Promise<boolean>}
export const uid=()=>crypto.randomUUID()
export const weekdayNames=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت']
