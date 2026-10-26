// An intent is navigation only, never evidence of authentication.
const key='mindreset-login-intent-v1'
export function rememberQuizLogin(){try{sessionStorage.setItem(key,JSON.stringify({screen:'quiz',createdAt:Date.now()}))}catch{/* Login remains usable if storage is unavailable. */}}
export function consumeLoginIntent():'quiz'|'home'{
 try{const raw=sessionStorage.getItem(key);sessionStorage.removeItem(key);const value=raw?JSON.parse(raw):null;if(value?.screen==='quiz'&&typeof value.createdAt==='number'&&Date.now()-value.createdAt>=0&&Date.now()-value.createdAt<30*60000)return 'quiz'}catch{/* Default to the public home page. */}
 return 'home'
}
