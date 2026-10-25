import {describe,it,expect} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {LibraryPage,JourneyPage} from '../src/FeaturePages'
describe('free feature pages',()=>{
 it('offers the complete library without a pricing preview',()=>{const html=renderToStaticMarkup(<LibraryPage answers={null} onQuiz={()=>{}}/>);expect(html).toContain('كل التمارين متاحة مجانًا');expect(html).not.toContain('pro-lock');expect(html).not.toContain('50 جنيه')})
 it('mounts the personal plan without an entitlement gate',()=>{const html=renderToStaticMarkup(<JourneyPage owner="owner" answers={null} onQuiz={()=>{}} onLogin={()=>{}}/>);expect(html).toContain('journey-workspace');expect(html).not.toContain('pro-lock')})
})
