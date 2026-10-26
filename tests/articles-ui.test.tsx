// @vitest-environment jsdom
import {act} from 'react'
import {createRoot,type Root} from 'react-dom/client'
import {beforeEach,afterEach,it,expect,vi} from 'vitest'
import {ArticlesPage} from '../src/ArticlesPage'
let root:Root,host:HTMLDivElement
const flush=async()=>{await act(async()=>{await new Promise(r=>setTimeout(r,0))})}
beforeEach(()=>{window.history.replaceState(null,'','/#/articles');window.scrollTo=vi.fn();Element.prototype.scrollIntoView=vi.fn();Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});host=document.createElement('div');document.body.append(host);root=createRoot(host)})
afterEach(async()=>{await act(async()=>root.unmount());host.remove()})
it('shows source headers and filters the university collection',async()=>{await act(async()=>root.render(<ArticlesPage/>));await flush();expect(host.querySelectorAll('.university-article-card')).toHaveLength(8);expect(host.textContent).toContain('إعداد MindReset');const select=host.querySelector('select')!;await act(async()=>{select.value='جامعة هارفارد';select.dispatchEvent(new Event('change',{bubbles:true}))});expect(host.querySelectorAll('.university-article-card')).toHaveLength(2);expect(host.querySelector('.university-card-banner')?.textContent).toContain('جامعة هارفارد')})
it('opens a readable deep-linked summary with its original source and preserves the route when jumping to a heading',async()=>{window.history.replaceState(null,'','/#/articles?read=mit-retrieval-practice');await act(async()=>root.render(<ArticlesPage/>));await flush();expect(host.querySelector('.university-reader')).not.toBeNull();expect(host.textContent).toContain('مش ترجمة كاملة');expect(host.querySelector('.article-original-source a')?.getAttribute('href')).toBe('https://openlearning.mit.edu/mit-faculty/research-based-learning-findings/retrieval-practice-testing-effect');await act(async()=>host.querySelector<HTMLAnchorElement>('.article-toc a')!.click());expect(window.location.hash).toBe('#/articles?read=mit-retrieval-practice');expect(Element.prototype.scrollIntoView).toHaveBeenCalled()})
