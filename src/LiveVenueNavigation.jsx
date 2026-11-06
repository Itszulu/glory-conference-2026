import {useEffect,useRef,useState} from 'react'
import {CarFront, Clock3, Crosshair, Footprints, MapPin, Navigation, ShieldCheck, StopCircle} from 'lucide-react'
import {conferenceVenue,venueDirectionsUrl} from './conferenceVenue'
import './live-venue-navigation.css'

const destination={lat:conferenceVenue.latitude,lng:conferenceVenue.longitude}
const metresBetween=(a,b)=>{
  const toRad=n=>n*Math.PI/180
  const lat=toRad(b.lat-a.lat),lng=toRad(b.lng-a.lng),mean1=toRad(a.lat),mean2=toRad(b.lat)
  const value=Math.sin(lat/2)**2+Math.cos(mean1)*Math.cos(mean2)*Math.sin(lng/2)**2
  return 12742000*Math.asin(Math.min(1,Math.sqrt(value)))
}
const distanceText=m=>Number.isFinite(m)?m>=1000?(m/1000).toFixed(1)+' km':Math.round(m)+' m':'—'
const timeText=ms=>!Number.isFinite(ms)?'—':ms===0?'Arrived':Math.max(1,Math.round(ms/60000))+' min'
const errorText=err=>{
  if(err?.code===1)return 'Location permission was denied. Allow location in your browser settings, then try again.'
  if(err?.code===2)return 'Your phone could not determine its location. Turn on Location Services and check your internet connection.'
  if(err?.code===3)return 'Location took too long. Move outdoors and try again.'
  return err?.message||'Live location is unavailable on this device.'
}

export default function LiveVenueNavigation({mapReady,getMap,onStart,onStop}){
 const [active,setActive]=useState(false)
 const [mode,setMode]=useState('DRIVING')
 const [finding,setFinding]=useState(false)
 const [error,setError]=useState('')
 const [notice,setNotice]=useState('')
 const [reading,setReading]=useState(null)
 const [guide,setGuide]=useState(null)
 const watchRef=useRef(null)
 const trackingRef=useRef(false)
 const routeBusyRef=useRef(false)
 const lastRouteRef=useRef(null)
 const routeSerialRef=useRef(0)
 const userDotRef=useRef(null)
 const accuracyRef=useRef(null)
 const routeLinesRef=useRef([])
 const mapRef=useRef(null)
 const lastFixRef=useRef(null)
 const acceptedFixRef=useRef(null)
 const modeRef=useRef('DRIVING')
 const recoveryRef=useRef(null)
 const lastGoodAtRef=useRef(0)
 const callbacksRef=useRef({onStart,onStop,getMap})
 callbacksRef.current={onStart,onStop,getMap}

 const clearVisuals=()=>{
   routeLinesRef.current.forEach(line=>line.setMap(null))
   routeLinesRef.current=[]
   if(userDotRef.current)userDotRef.current.setMap(null)
   if(accuracyRef.current)accuracyRef.current.setMap(null)
   userDotRef.current=null
   accuracyRef.current=null
 }
 const stop=()=>{
   trackingRef.current=false
   ++routeSerialRef.current
   if(watchRef.current!==null&&navigator.geolocation){navigator.geolocation.clearWatch(watchRef.current);watchRef.current=null}
   routeBusyRef.current=false
   lastRouteRef.current=null
   lastFixRef.current=null
   acceptedFixRef.current=null
   lastGoodAtRef.current=0
   if(recoveryRef.current){clearInterval(recoveryRef.current);recoveryRef.current=null}
   clearVisuals()
   mapRef.current=null
   setActive(false);setFinding(false);setGuide(null);setReading(null);setNotice('Live guidance stopped.')
   callbacksRef.current.onStop?.()
 }
 useEffect(()=>()=>{trackingRef.current=false;++routeSerialRef.current;if(recoveryRef.current)clearInterval(recoveryRef.current);if(watchRef.current!==null&&navigator.geolocation)navigator.geolocation.clearWatch(watchRef.current);clearVisuals()},[])

 const refreshRoute=async(position)=>{
   if(!trackingRef.current||routeBusyRef.current||!mapRef.current)return
   routeBusyRef.current=true
   // Throttle requests even when Google returns an error, preventing excessive API calls.
   lastRouteRef.current={position,at:Date.now()}
   const serial=++routeSerialRef.current
   try{
     const {Route}=await window.google.maps.importLibrary('routes')
     const result=await Route.computeRoutes({
       origin:position,destination,travelMode:modeRef.current,
       ...(modeRef.current==='DRIVING'?{routingPreference:'TRAFFIC_AWARE'}:{}),
       fields:['path','distanceMeters','durationMillis','legs','warnings']
     })
     if(!trackingRef.current||serial!==routeSerialRef.current)return
     const route=result.routes?.[0]
     if(!route||!Number.isFinite(route.distanceMeters)||!Number.isFinite(route.durationMillis))throw new Error('Google Maps could not find a walking route from your current position.')
     routeLinesRef.current.forEach(line=>line.setMap(null))
     routeLinesRef.current=route.createPolylines()
     routeLinesRef.current.forEach(line=>line.setMap(mapRef.current))
     const step=route.legs?.[0]?.steps?.find(s=>s.instructions)
     setGuide({
       distance:route.distanceMeters,
       duration:route.durationMillis,
       instruction:step?.instructions||'Follow the highlighted route towards DISRM.',
       nextDistance:step?.distanceMeters,
       arrival:new Date(Date.now()+route.durationMillis).toLocaleTimeString('en-NG',{timeZone:'Africa/Lagos',hour:'numeric',minute:'2-digit'})
     })
     setError('')
   }catch(err){
     if(trackingRef.current&&serial===routeSerialRef.current)setError(err?.message||'Unable to refresh the route. Keep the map open or use Google Maps.')
   }finally{routeBusyRef.current=false}
 }

 const start=()=>{
   if(trackingRef.current)return
   setError('');setNotice('');setGuide(null);setReading(null)
   if(!window.isSecureContext||!navigator.geolocation){setError('Live location needs HTTPS and a browser that supports location services.');return}
   const map=callbacksRef.current.getMap?.()
   if(!mapReady||!map){setError('Wait for the Google map to load before starting live guidance.');return}
   trackingRef.current=true;mapRef.current=map;setActive(true);setFinding(true)
   callbacksRef.current.onStart?.()
   const onPosition=update=>{
     if(!trackingRef.current||!mapRef.current)return
     const {latitude,longitude,accuracy,speed}=update.coords
     if(!Number.isFinite(latitude)||!Number.isFinite(longitude))return
     const position={lat:latitude,lng:longitude}
     const uncertainty=Number.isFinite(accuracy)&&accuracy>0?accuracy:1000
     const now=Date.now()
     setReading({accuracy:Math.round(uncertainty),updatedAt:new Date().toLocaleTimeString('en-NG',{hour:'numeric',minute:'2-digit'})})
     setFinding(false)
     // A weak desktop/Wi-Fi fix is a region, not a precise navigation position.
     if(uncertainty>120){
       setNotice('Your device currently reports only an approximate area (±'+Math.round(uncertainty)+' m). Waiting for a more precise reading automatically. On a computer without GPS, use your phone for live navigation.')
       return
     }
     const previous=acceptedFixRef.current
     const moved=previous?metresBetween(position,previous.position):Infinity
     const elapsed=previous?Math.max(1,(now-previous.at)/1000):Infinity
     // Reject sudden implausible jumps, especially those with worse accuracy.
     if(previous&&moved>Math.max(uncertainty*2+previous.accuracy,80)&&moved/elapsed>45){
       setNotice('Filtering an inconsistent location reading. Tracking is continuing.')
       return
     }
     const stationary=previous&&moved<Math.max(12,Math.min(35,(uncertainty+previous.accuracy)*.65))
     // Stationary fixes are not allowed to move the marker or camera.
     if(stationary){
       lastGoodAtRef.current=now
       setNotice(uncertainty>60?'Location is approximate; holding your last stable position.':'Location stable. Live tracking continues.')
       const lastRoute=lastRouteRef.current
       if(lastRoute&&now-lastRoute.at>60000)refreshRoute(previous.position)
       return
     }
     // Do not replace a substantially better fix with a noisy new one.
     if(previous&&uncertainty>previous.accuracy*2&&moved<uncertainty){
       setNotice('Keeping your last more accurate position while GPS improves.')
       return
     }
     acceptedFixRef.current={position,accuracy:uncertainty,at:now}
     lastGoodAtRef.current=now
     setNotice('')
     if(!userDotRef.current){
       userDotRef.current=new window.google.maps.Circle({
         map:mapRef.current,center:position,radius:9,
         strokeWeight:4,strokeColor:'#fff',fillColor:'#147dff',fillOpacity:1,zIndex:100
       })
       accuracyRef.current=new window.google.maps.Circle({
         map:mapRef.current,center:position,radius:uncertainty,
         strokeWeight:1,strokeColor:'#1481f8',strokeOpacity:.32,fillColor:'#1687ff',fillOpacity:.12,zIndex:1
       })
       mapRef.current.setZoom(16)
     }else{
       userDotRef.current.setCenter(position)
       accuracyRef.current?.setCenter(position)
       accuracyRef.current?.setRadius(uncertainty)
     }
     // Move the map only for meaningful motion, not GPS wobble.
     if(!lastFixRef.current||metresBetween(position,lastFixRef.current)>=Math.max(20,uncertainty)){
       mapRef.current.panTo(position)
       lastFixRef.current=position
     }
     if(metresBetween(position,destination)<35&&uncertainty<=35){
       setGuide({distance:0,duration:0,instruction:'You are near the DISRM venue pin. Confirm the entrance with the welcome team.',nextDistance:0,arrival:'Now'})
       setNotice('Near the destination — confirm the entrance on site.')
       return
     }
     const lastRoute=lastRouteRef.current
     const distance=lastRoute?metresBetween(position,lastRoute.position):Infinity
     const age=lastRoute?now-lastRoute.at:Infinity
     const movingFast=Number.isFinite(speed)&&speed>4
     if(!lastRoute||(distance>=(movingFast?50:30)&&age>=12000)||age>=60000)refreshRoute(position)
   }
   const onGeoError=err=>{
     if(!trackingRef.current)return
     if(err?.code===1){stop();setError('Location access was blocked. Allow location permission in your browser to continue.');return}
     // A temporary timeout or unavailable fix must not stop the live watch.
     setFinding(!acceptedFixRef.current)
     setNotice('Waiting for a fresh location reading. Your last reliable position is preserved; tracking will retry automatically.')
   }
   const getFix=()=>navigator.geolocation.getCurrentPosition(onPosition,err=>{
     if(err?.code===1)onGeoError(err)
   },{enableHighAccuracy:true,maximumAge:10000,timeout:12000})
   // Fast initial fix, then high accuracy updates. Both feed the same stability filter.
   navigator.geolocation.getCurrentPosition(onPosition,err=>{
     if(err?.code===1)onGeoError(err)
   },{enableHighAccuracy:false,maximumAge:15000,timeout:6000})
   watchRef.current=navigator.geolocation.watchPosition(
     onPosition,onGeoError,{enableHighAccuracy:true,maximumAge:2000,timeout:18000}
   )
   getFix()
   recoveryRef.current=setInterval(()=>{
     if(trackingRef.current&&Date.now()-lastGoodAtRef.current>18000)getFix()
   },20000)

 }

 return <section className="gc-live-guide" aria-labelledby="gc-live-guide-title">
   <header className="gc-live-guide-head"><span className="gc-live-guide-icon"><Crosshair size={20} aria-hidden="true"/></span><div><strong id="gc-live-guide-title">LIVE NAVIGATION</strong><small>Your phone finds your location automatically</small></div><span className="gc-live-guide-tag">ON THIS SITE</span></header>
   <p className="gc-live-guide-description">You don't need to know where you are. Tap below, choose Allow when your phone asks for location, and follow your moving position towards DISRM. Choose walking or driving. Your position, route and estimated arrival update as reliable location readings arrive.</p>
   <div className="gc-live-modes" role="group" aria-label="Live navigation travel mode">
     <button type="button" aria-pressed={mode==='DRIVING'} className={mode==='DRIVING'?'selected':''} onClick={()=>{if(mode==='DRIVING')return;modeRef.current='DRIVING';setMode('DRIVING');lastRouteRef.current=null;setGuide(null);if(acceptedFixRef.current)refreshRoute(acceptedFixRef.current.position)}}><CarFront size={17} aria-hidden="true"/> Driving</button>
     <button type="button" aria-pressed={mode==='WALKING'} className={mode==='WALKING'?'selected':''} onClick={()=>{if(mode==='WALKING')return;modeRef.current='WALKING';setMode('WALKING');lastRouteRef.current=null;setGuide(null);if(acceptedFixRef.current)refreshRoute(acceptedFixRef.current.position)}}><Footprints size={17} aria-hidden="true"/> Walking</button>
   </div>
   <div className="gc-live-guide-controls">
     {!active?<button className="gc-live-start" type="button" disabled={!mapReady} onClick={start}><Navigation size={18} aria-hidden="true"/> USE MY CURRENT LOCATION →</button>:<button type="button" className="gc-live-stop" onClick={stop}><StopCircle size={18} aria-hidden="true"/> STOP TRACKING</button>}
   </div>
   {active&&<div className="gc-live-reading" role="status" aria-live="polite">
     <div className="gc-live-state"><span className="gc-live-pulse"/><strong>{finding?'SEARCHING FOR A RELIABLE LOCATION…':acceptedFixRef.current?'LIVE NAVIGATION ACTIVE':'REFINING YOUR LOCATION…'}</strong></div>
     {guide&&<><div className="gc-live-stats"><div><Clock3 size={19} aria-hidden="true"/><small>TIME REMAINING</small><strong>{timeText(guide.duration)}</strong></div><div><Footprints size={19} aria-hidden="true"/><small>DISTANCE LEFT</small><strong>{distanceText(guide.distance)}</strong></div></div>
       <div className="gc-live-next"><span>FOLLOW THIS DIRECTION</span><strong>{guide.instruction}</strong>{Number.isFinite(guide.nextDistance)&&guide.nextDistance>0&&<small>Approx. {distanceText(guide.nextDistance)} for this section</small>}</div>
       <p className="gc-live-arrival"><MapPin size={16} aria-hidden="true"/> Estimated arrival: <strong>{guide.arrival} WAT</strong></p></>}
     {reading&&<small className="gc-live-accuracy">Location updated {reading.updatedAt} · Approximate accuracy ±{reading.accuracy} m</small>}
     {notice&&<p className="gc-live-note">{notice}</p>}
   </div>}
   {error&&<p className="gc-live-error" role="alert">{error}</p>}
   <p className="gc-live-privacy"><ShieldCheck size={15} aria-hidden="true"/> Your location is requested only after you press the button and is not saved to conference registration records. Keep this page open while travelling. Browser navigation may pause in the background; never interact with the screen while driving.</p>
   <a className="gc-live-fallback" href={venueDirectionsUrl} target="_blank" rel="noopener noreferrer">Need full voice navigation or background guidance? Open Google Maps ↗</a>
 </section>
}
