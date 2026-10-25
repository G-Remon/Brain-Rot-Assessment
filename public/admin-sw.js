/* Push only. Private pages are never cached. */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
function destination(value){try{const u=new URL(value,self.location.origin);if(u.origin===self.location.origin&&/^\/#\/(home|account|journey|tools|results|admin)(\?panel=(goals|focus|program|habits|learning|review))?$/.test(u.pathname+u.hash))return u.href}catch{}return new URL('/#/account',self.location.origin).href}
self.addEventListener('push',event=>{
 let message={};try{message=event.data?event.data.json():{}}catch{}
 const body=typeof message.body==='string'?message.body.slice(0,300):'عندك خطوة جديدة في MindReset.';
 event.waitUntil((async()=>{
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for(const client of windows)client.postMessage({type:'mindreset-push',body,url:destination(message.url),owner:message.owner??null});
  await self.registration.showNotification(typeof message.title==='string'?message.title.slice(0,80):'MindReset',{body,icon:'/icons/mindreset-192.png',badge:'/icons/mindreset-badge-96.png',tag:typeof message.tag==='string'?message.tag.slice(0,100):'mindreset-activity',data:{url:destination(message.url)},dir:'rtl',lang:'ar',timestamp:Date.now()});
 })());
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();const url=destination(event.notification.data?.url);
 event.waitUntil((async()=>{const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const client of windows){if(new URL(client.url).origin===self.location.origin){await client.navigate(url);return client.focus()}}return self.clients.openWindow(url)})());
});
