function mountHomeMedia(){
  const slot=document.querySelector('.home-loop .loop-media')
  if(!slot||slot.querySelector('video')) return
  const video=document.createElement('video')
  video.src='/assets/video/outpouring-loop.mp4'
  video.autoplay=true
  video.muted=true
  video.loop=true
  video.playsInline=true
  video.preload='metadata'
  video.setAttribute('aria-hidden','true')
  slot.appendChild(video)
  video.play().catch(()=>{})
}

const observer=new MutationObserver(mountHomeMedia)
observer.observe(document.documentElement,{childList:true,subtree:true})
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mountHomeMedia)
else mountHomeMedia()
