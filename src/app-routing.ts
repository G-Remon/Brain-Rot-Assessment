export const appScreens=['home','quiz','results','science','auth','account','library','journey','tools','pro','upgrade','admin'] as const
export type AppScreen=typeof appScreens[number]
export function screenFromHash(hash:string):AppScreen|null{if(!hash.startsWith('#/'))return null;if(hash.includes('?')&&!/^#\/tools\?panel=(goals|focus|program|habits|learning|review)$/.test(hash))return null;const name=hash.slice(2).split('?')[0];if(name==='pro'||name==='upgrade')return 'tools';return (appScreens as readonly string[]).includes(name)?name as AppScreen:null}
export function routeHash(screen:AppScreen){return `#/${screen}`}
