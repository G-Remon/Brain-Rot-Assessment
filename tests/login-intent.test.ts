// @vitest-environment jsdom
import {beforeEach,describe,expect,it} from 'vitest'
import {consumeLoginIntent,rememberQuizLogin} from '../src/login-intent'
beforeEach(()=>sessionStorage.clear())
describe('safe navigation after Google login',()=>{
 it('remembers the quiz once without changing the existing OAuth callback URL',()=>{rememberQuizLogin();expect(consumeLoginIntent()).toBe('quiz');expect(consumeLoginIntent()).toBe('home')})
 it('does not follow arbitrary destinations or expired intents',()=>{for(const value of [{screen:'https://evil.example',createdAt:Date.now()},{screen:'admin',createdAt:Date.now()},{screen:'quiz',createdAt:Date.now()-31*60000},{screen:'quiz',createdAt:Date.now()+60000}]){sessionStorage.setItem('mindreset-login-intent-v1',JSON.stringify(value));expect(consumeLoginIntent()).toBe('home')}})
})
