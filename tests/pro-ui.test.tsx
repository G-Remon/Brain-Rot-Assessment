import {describe,it,expect} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {ProBoundary} from '../src/pro-access'
import {ProPage} from '../src/ProPage'
import {Goals} from '../src/pro/Goals'
import {Focus} from '../src/pro/Focus'
import {Habits} from '../src/pro/Habits'
import {Learning} from '../src/pro/Learning'
import {Program} from '../src/pro/Program'
import {Review} from '../src/pro/Review'
import {emptyProState} from '../src/pro-model'
const props={state:emptyProState(),busy:false,save:async()=>true}
describe('Pro UI boundaries and empty states',()=>{
 it('does not render protected children before access verification',()=>{expect(renderToStaticMarkup(<ProBoundary><div>PRIVATE_DATA</div></ProBoundary>)).not.toContain('PRIVATE_DATA')})
 it('shows the agreed price and no pretend live checkout',()=>{const html=renderToStaticMarkup(<ProPage onOpen={()=>{}}/>);expect(html).toContain('50');expect(html).toContain('3 شهور');expect(html).not.toContain('href="https://accept.paymob.com')})
 it.each([Goals,Focus,Habits,Learning,Program,Review])('renders the empty panel safely %#',Component=>{const html=renderToStaticMarkup(<Component {...props}/>);expect(html.length).toBeGreaterThan(300);expect(html).not.toContain('NaN');expect(html).not.toContain('undefined')})
})
