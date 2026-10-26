import {domains,type DomainId} from './data'
export type PracticeDomain=DomainId|'math'|'cards'|'visual'
export const practiceDomains:{id:PracticeDomain;title:string;short:string}[]=[...domains,{id:'math',title:'رياضيات وحساب',short:'رياضيات'},{id:'cards',title:'كوتشينة: عدّ وملاحظة',short:'كوتشينة'},{id:'visual',title:'صور وأنماط بصرية',short:'ملاحظة بصرية'}]
