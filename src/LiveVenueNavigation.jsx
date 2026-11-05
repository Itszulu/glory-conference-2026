import {useEffect,useRef,useState} from 'react'
import {Clock3, Crosshair, Footprints, MapPin, Navigation, ShieldCheck, StopCircle} from 'lucide-react'
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
   clearVisuals()
   mapRef.current=null
   setActive(false);setFinding(false);setGuide(null);setReading(null);setNotice('Live guidance stopped.')
   callbacksRef.current.onStop?.()
 }
 useEffect(()=>()=>{trackingRef.current=false;++routeSerialRef.current;if(watchRef.current!==null&&navigator.geolocation)navigator.geolocation.clearWatch(watchRef.current);clearVisuals()},[])

 const refreshRoute=async(position)=>{
   if(!trackingRef.current||routeBusyRef.current||!mapRef.current)return
   routeBusyRef.current=true
   // Throttle requests even when Google returns an error, preventing excessive API calls.
   lastRouteRef.current={position,at:Date.now()}
   const serial=++routeSerialRef.current
   try{
     const {Route}=await window.google.maps.importLibrary('routes')
     const result=await Route.computeRoutes({
       origin:position,destination,travelMode:'WALKING',
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
       instruction:step?.instructions||'Follow the highlighted walking route towards DISRM.',
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
   watchRef.current=navigator.geolocation.watchPosition(
     update=>{
       if(!trackingRef.current||!mapRef.current)return
       const {latitude,longitude,accuracy}=update.coords
       if(!Number.isFinite(latitude)||!Number.isFinite(longitude))return
       const position={lat:latitude,lng:longitude}
       setReading({accuracy:Math.round(accuracy||0),updatedAt:new Date().toLocaleTimeString('en-NG',{hour:'numeric',minute:'2-digit'})})
       setFinding(false)
       if(!userDotRef.current){
         userDotRef.current=new window.google.maps.Circle({
           map:mapRef.current,center:position,radius:9,
           strokeWeight:4,strokeColor:'#ffffff',fillColor:'#147dff',fillOpacity:1,zIndex:100
         })
         accuracyRef.current=new window.google.maps.Circle({
           map:mapRef.current,center:position,radius:Math.min(accuracy||30,300),
           strokeWeight:1,strokeColor:'#1481f8',strokeOpacity:.32,fillColor:'#1687ff',fillOpacity:.12,zIndex:1
         })
         mapRef.current.setZoom(17)
       }else{
         userDotRef.current.setCenter(position)
         accuracyRef.current?.setCenter(position)
         accuracyRef.current?.setRadius(Math.min(accuracy||30,300))
       }
       mapRef.current.panTo(position)
       if(metresBetween(position,destination)<35&&accuracy<=65){
         setGuide({distance:0,duration:0,instruction:'You are near the DISRM venue pin. Look for the entrance and confirm with the welcome team.',nextDistance:0,arrival:'Now'})
         setNotice('Near the destination — confirm the entrance on site.')
         return
       }
       if(accuracy>250){
         setNotice('GPS accuracy is weak. Move outdoors or enable high-accuracy location to improve directions.')
         return
       }
       setNotice('')
       const previous=lastRouteRef.current
       const moved=previous?metresBetween(position,previous.position):Infinity
       const elapsed=previous?Date.now()-previous.at:Infinity
       if(!previous||(moved>=25&&elapsed>=20000)||elapsed>=60000)refreshRoute(position)
     },
     err=>{
       if(!trackingRef.current)return
       setError(errorText(err))
       if(err?.code===1){stop();setError(errorText(err))}
       else setFinding(false)
     },
     {enableHighAccuracy:true,maximumAge:3000,timeout:20000}
   )
 }

 return <section className="gc-live-guide" aria-labelledby="gc-live-guide-title">
   <header className="gc-live-guide-head"><span className="gc-live-guide-icon"><Crosshair size={20} aria-hidden="true"/></span><div><strong id="gc-live-guide-title">LIVE WALKING GUIDE</strong><small>No need to know your current street or address</small></div><span className="gc-live-guide-tag">ON THIS SITE</span></header>
   <p className="gc-live-guide-description">Tap the button and allow location access. Your phone's position will move on the map as you walk, with a refreshed walking route and estimated time remaining.</p>
   <div className="gc-live-guide-controls">
     {!active?<button className="gc-live-start" type="button" disabled={!mapReady} onClick={start}><Navigation size={18} aria-hidden="true"/> START LIVE GUIDANCE</button>:<button type="button" className="gc-live-stop" onClick={stop}><StopCircle size={18} aria-hidden="true"/> STOP TRACKING</button>}
   </div>
   {active&&<div className="gc-live-reading" role="status" aria-live="polite">
     <div className="gc-live-state"><span className="gc-live-pulse"/><strong>{finding?'LOCATING YOUR PHONE…':'LIVE LOCATION ACTIVE'}</strong></div>
     {guide&&<><div className="gc-live-stats"><div><Clock3 size={19} aria-hidden="true"/><small>TIME REMAINING</small><strong>{timeText(guide.duration)}</strong></div><div><Footprints size={19} aria-hidden="true"/><small>DISTANCE LEFT</small><strong>{distanceText(guide.distance)}</strong></div></div>
       <div className="gc-live-next"><span>NEXT ROUTE INSTRUCTION</span><strong>{guide.instruction}</strong>{Number.isFinite(guide.nextDistance)&&guide.nextDistance>0&&<small>Approx. {distanceText(guide.nextDistance)} for this section</small>}</div>
       <p className="gc-live-arrival"><MapPin size={16} aria-hidden="true"/> Estimated arrival: <strong>{guide.arrival} WAT</strong></p></>}
     {reading&&<small className="gc-live-accuracy">Location updated {reading.updatedAt} · Approximate accuracy ±{reading.accuracy} m</small>}
     {notice&&<p className="gc-live-note">{notice}</p>}
   </div>}
   {error&&<p className="gc-live-error" role="alert">{error}</p>}
   <p className="gc-live-privacy"><ShieldCheck size={15} aria-hidden="true"/> Your location is requested only when you tap Start and is not saved to conference registration records. Keep this page open and your screen active; phones may pause browser tracking in the background.</p>
   <a className="gc-live-fallback" href={venueDirectionsUrl} target="_blank" rel="noopener noreferrer">Need full voice navigation or background guidance? Open Google Maps ↗</a>
 </section>
}
