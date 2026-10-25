import {describe,it,expect} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {ProBoundary} from '../src/pro-access'
import {Goals} from '../src/pro/Goals'
import {Focus} from '../src/pro/Focus'
import {Habits} from '../src/pro/Habits'
import {Learning} from '../src/pro/Learning'
import {Program} from '../src/pro/Program'
import {Review} from '../src/pro/Review'
import {emptyProState} from '../src/pro-model'
const props={state:emptyProState(),busy:false,save:async()=>true}
describe('Pro UI boundaries and empty states',()=>{
 it('renders every free feature without an entitlement lookup',()=>{expect(renderToStaticMarkup(<ProBoundary><div>FREE_FEATURE</div></ProBoundary>)).toContain('FREE_FEATURE')})
 it.each([Goals,Focus,Habits,Learning,Program,Review])('renders the empty panel safely %#',Component=>{const html=renderToStaticMarkup(<Component {...props}/>);expect(html.length).toBeGreaterThan(300);expect(html).not.toContain('NaN');expect(html).not.toContain('undefined')})
})
