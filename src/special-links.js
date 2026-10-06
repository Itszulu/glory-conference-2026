function addLink(container,label,href,beforeSelector){
  if(!container || container.querySelector(`a[href="${href}"]`)) return
  const a=document.createElement('a')
  a.href=href
  a.textContent=label
  const before=beforeSelector?container.querySelector(beforeSelector):null
  if(before) container.insertBefore(a,before); else container.appendChild(a)
}
function syncSpecialLinks(){
  document.querySelectorAll('.nav-links').forEach(nav=>{
    addLink(nav,'PASTORS & MINISTERS','/pastors-ministers','a[href="/prayer-guide"]')
    addLink(nav,'VOLUNTEER','/volunteer','a[href="/giving"]')
  })
  document.querySelectorAll('.footer-nav').forEach(nav=>{
    addLink(nav,'PASTORS & MINISTERS','/pastors-ministers','a[href="/prayer-guide"]')
    addLink(nav,'VOLUNTEER','/volunteer','a[href="/giving"]')
  })
}
const observer=new MutationObserver(syncSpecialLinks)
observer.observe(document.documentElement,{childList:true,subtree:true})
queueMicrotask(syncSpecialLinks)
