/* Push only: no fetch interception and no caching of private application data. */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{
 let message={};try{message=event.data?event.data.json():{}}catch{/* Use a visible generic fallback. */}
 const body=typeof message.body==='string'?message.body.slice(0,250):'فيه نشاط جديد في موقعك. افتح لوحة الإدارة.';
 event.waitUntil(self.registration.showNotification('MindReset',{body,icon:'/icons/mindreset-192.png',badge:'/icons/mindreset-192.png',tag:typeof message.tag==='string'?message.tag.slice(0,100):'mindreset-activity',data:{url:'/#/admin'},dir:'rtl',lang:'ar'}));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();const url=new URL('/#/admin',self.location.origin).href;
 event.waitUntil((async()=>{const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const client of windows){if(new URL(client.url).origin===self.location.origin){await client.navigate(url);return client.focus()}}return self.clients.openWindow(url)})());
});
