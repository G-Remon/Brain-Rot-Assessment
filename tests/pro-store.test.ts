import {beforeEach,describe,it,expect,vi} from 'vitest'
import {emptyProState} from '../src/pro-model'
const mock=vi.hoisted(()=>({getUser:vi.fn(),from:vi.fn()}))
vi.mock('../src/supabase',()=>({supabase:{auth:{getUser:mock.getUser},from:mock.from}}))
import {readProState,writeProState} from '../src/pro-store'
beforeEach(()=>{vi.clearAllMocks();mock.getUser.mockResolvedValue({data:{user:{id:'owner'}},error:null})})
describe('Pro private persistence and optimistic concurrency',()=>{
 it('refuses a different account before querying',async()=>{await expect(readProState('other')).rejects.toThrow('login-required');expect(mock.from).not.toHaveBeenCalled()})
 it('does not overwrite a state changed on another device',async()=>{const maybeSingle=vi.fn().mockResolvedValue({data:null,error:null});const chain={eq:vi.fn(),select:vi.fn(),maybeSingle};chain.eq.mockReturnValue(chain);chain.select.mockReturnValue(chain);mock.from.mockReturnValue({update:()=>chain});await expect(writeProState('owner',emptyProState(),'old-revision')).rejects.toThrow('conflict');expect(chain.eq).toHaveBeenCalledWith('updated_at','old-revision')})
 it('treats a concurrent first insert as a conflict',async()=>{mock.from.mockReturnValue({insert:()=>({select:()=>({maybeSingle:async()=>({data:null,error:{code:'23505'}})})})});await expect(writeProState('owner',emptyProState(),null)).rejects.toThrow('conflict')})
 it('rejects invalid state before any save',async()=>{await expect(writeProState('owner',{...emptyProState(),version:2} as never,null)).rejects.toThrow('invalid-state');expect(mock.from).not.toHaveBeenCalled()})
 it('surfaces storage/network errors without claiming success',async()=>{mock.from.mockReturnValue({insert:()=>({select:()=>({maybeSingle:async()=>({data:null,error:new Error('network')})})})});await expect(writeProState('owner',emptyProState(),null)).rejects.toThrow('network')})
})
