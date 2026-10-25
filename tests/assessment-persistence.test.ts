import {beforeEach,describe,expect,it,vi} from 'vitest'
import {questions} from '../src/data'
const mock=vi.hoisted(()=>({getUser:vi.fn(),from:vi.fn()}))
vi.mock('../src/supabase',()=>({supabase:{auth:{getUser:mock.getUser},from:mock.from}}))
import {listSavedAssessments,saveAssessment} from '../src/assessment-history'
const answers=Object.fromEntries(questions.map(q=>[q.id,2]))
const row=(id='id')=>({id,user_id:'owner',answers,total_score:60,created_at:'2026-10-25T12:00:00Z'})
beforeEach(()=>{vi.clearAllMocks();mock.getUser.mockResolvedValue({data:{user:{id:'owner'}},error:null})})
describe('assessment saves and complete history',()=>{
 it('returns the inserted row instead of another tab’s newest assessment',async()=>{
  const inserted=row('inserted');const single=vi.fn().mockResolvedValue({data:inserted,error:null});const select=vi.fn().mockReturnValue({single});const insert=vi.fn().mockReturnValue({select});const newest={single:async()=>({data:row('other-tab'),error:null}),eq:()=>newest,order:()=>newest,limit:()=>newest};mock.from.mockReturnValue({insert,select:()=>newest})
  expect(await saveAssessment('owner',answers)).toEqual(inserted);expect(mock.from).toHaveBeenCalledTimes(1);expect(insert).toHaveBeenCalledWith({user_id:'owner',answers,total_score:60})
 })
 it('reads beyond the first page of saved results with stable ordering',async()=>{
  const range=vi.fn().mockResolvedValueOnce({data:Array.from({length:200},(_,i)=>row(String(i))),error:null}).mockResolvedValueOnce({data:[row('last')],error:null})
  const chain={select:vi.fn(),eq:vi.fn(),order:vi.fn(),limit:vi.fn().mockResolvedValue({data:Array.from({length:40},(_,i)=>row(String(i))),error:null}),range};chain.select.mockReturnValue(chain);chain.eq.mockReturnValue(chain);chain.order.mockReturnValue(chain);mock.from.mockReturnValue(chain)
  expect(await listSavedAssessments('owner')).toHaveLength(201);expect(range.mock.calls).toEqual([[0,199],[200,399]]);expect(chain.order).toHaveBeenCalledWith('id',{ascending:false})
 })
 it('does not silently discard an error on a later history page',async()=>{
  const range=vi.fn().mockResolvedValueOnce({data:Array.from({length:200},(_,i)=>row(String(i))),error:null}).mockResolvedValueOnce({data:null,error:Error('offline')});const chain={select:vi.fn(),eq:vi.fn(),order:vi.fn(),limit:vi.fn().mockResolvedValue({data:Array.from({length:40},(_,i)=>row(String(i))),error:null}),range};chain.select.mockReturnValue(chain);chain.eq.mockReturnValue(chain);chain.order.mockReturnValue(chain);mock.from.mockReturnValue(chain)
  await expect(listSavedAssessments('owner')).rejects.toThrow('offline')
 })
})
