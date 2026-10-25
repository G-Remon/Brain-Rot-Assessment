// @vitest-environment jsdom
import {beforeEach,describe,it,expect,vi} from 'vitest'
const mock=vi.hoisted(()=>({getUser:vi.fn(),rpc:vi.fn()}))
vi.mock('../src/supabase',()=>({supabase:{auth:{getUser:mock.getUser},rpc:mock.rpc}}))
import {enqueueAssessmentEvent,flushAssessmentEvents} from '../src/assessment-events'
const settle=()=>new Promise(r=>setTimeout(r,0))
beforeEach(()=>{vi.clearAllMocks();localStorage.clear()})
describe('private completion metadata and retries',()=>{
 it('reports one idempotent event without uploading answers or scores',async()=>{
  mock.getUser.mockResolvedValue({data:{user:{id:'event-owner-1'}},error:null});mock.rpc.mockResolvedValue({error:null});const id=crypto.randomUUID();enqueueAssessmentEvent('event-owner-1',id);enqueueAssessmentEvent('event-owner-1',id);await settle();expect(mock.rpc).toHaveBeenCalledOnce();expect(mock.rpc).toHaveBeenCalledWith('record_assessment_completed',{completion_id:id});expect(localStorage.getItem('mindreset-completion-queue-v1:event-owner-1')).toBe('[]')
 })
 it('keeps a failed event and retries with the same ID',async()=>{
  mock.getUser.mockResolvedValue({data:{user:{id:'event-owner-2'}},error:null});mock.rpc.mockResolvedValue({error:Error('offline')});const id=crypto.randomUUID();enqueueAssessmentEvent('event-owner-2',id);await settle();expect(localStorage.getItem('mindreset-completion-queue-v1:event-owner-2')).toContain(id);mock.rpc.mockResolvedValue({error:null});await flushAssessmentEvents('event-owner-2');expect(mock.rpc.mock.calls).toEqual([['record_assessment_completed',{completion_id:id}],['record_assessment_completed',{completion_id:id}]]);expect(localStorage.getItem('mindreset-completion-queue-v1:event-owner-2')).toBe('[]')
 })
 it('never attributes an old account’s pending event to the newly signed-in account',async()=>{
  mock.getUser.mockResolvedValue({data:{user:{id:'different-account'}},error:null});enqueueAssessmentEvent('event-owner-3',crypto.randomUUID());await settle();expect(mock.rpc).not.toHaveBeenCalled()
 })
})
