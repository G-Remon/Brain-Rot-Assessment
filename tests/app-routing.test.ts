import {describe,it,expect} from 'vitest'
import {appScreens,routeHash,screenFromHash} from '../src/app-routing'
describe('application route navigation',()=>{
 it.each(appScreens)('can deep-link and restore the %s route',screen=>expect(screenFromHash(routeHash(screen))).toBe(screen==='pro'||screen==='upgrade'?'tools':screen))
 it.each(['#weekly-plan','#analysis','#main-content','#/unknown','#/admin?role=admin','', '#/<script>'])('does not interpret anchors or arbitrary content as a route %s',hash=>expect(screenFromHash(hash)).toBeNull())
})
