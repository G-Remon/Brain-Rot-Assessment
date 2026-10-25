import {beforeEach,describe,it,expect,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
const mock=vi.hoisted(()=>({getUser:vi.fn(),rpc:vi.fn(),access:{active:true,isAdmin:false}}))
vi.mock('../src/supabase',()=>({supabase:{auth:{getUser:mock.getUser},rpc:mock.rpc}}))
vi.mock('../src/pro-access',()=>({usePro:()=>({status:mock.access,loading:false,error:false,refresh:()=>{}})}))
import {AdminPage,loadAdminOverview} from '../src/AdminPage'
beforeEach(()=>{vi.clearAllMocks();mock.access={active:true,isAdmin:false};mock.getUser.mockResolvedValue({data:{user:{id:'owner'}},error:null})})
describe('admin account identity and server authorization',()=>{
 it('rejects a different signed-in identity before sending the admin RPC',async()=>{await expect(loadAdminOverview('other','',1)).rejects.toThrow('login-required');expect(mock.rpc).not.toHaveBeenCalled()})
 it('propagates a server denial instead of displaying a fake account list',async()=>{mock.rpc.mockResolvedValue({data:null,error:new Error('forbidden')});await expect(loadAdminOverview('owner','',1)).rejects.toThrow('forbidden')})
 it('does not accept a malformed administration response',async()=>{mock.rpc.mockResolvedValue({data:{users:'invalid'},error:null});await expect(loadAdminOverview('owner','',1)).rejects.toThrow('invalid-admin-response')})
 it('clamps search input before requesting actual account data',async()=>{mock.rpc.mockResolvedValue({data:{summary:{users:0},users:[]},error:null});await loadAdminOverview('owner','x'.repeat(250),2);expect(mock.rpc).toHaveBeenCalledWith('get_admin_overview',{search_query:'x'.repeat(100),page_number:2})})
 it('does not let Pro membership render the admin page',()=>{const html=renderToStaticMarkup(<AdminPage owner="owner" onOpenTools={()=>{}}/>);expect(html).toContain('الحساب الحالي مش عنده صلاحية أدمن');expect(html).not.toContain('جدول الحسابات');expect(mock.rpc).not.toHaveBeenCalled()})
})
