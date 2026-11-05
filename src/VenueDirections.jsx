import { useEffect, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2, Clock3, LocateFixed, MapPin, Navigation, Route as RouteIcon } from 'lucide-react'
import { conferenceVenue } from './conferenceVenue'
import './venue.css'

const mapsKey=(import.meta.env.VITE_GOOGLE_MAPS_API_KEY||'').trim()
const destination={lat:conferenceVenue.landmarkLatitude,lng:conferenceVenue.landmarkLongitude}
let googleMapsPromise

// The maps script loads only after a visitor asks to plan a journey.
// This avoids charging for map views on the homepage hero.
function loadGoogleMaps() {
  if(window.google?.maps?.importLibrary) return Promise.resolve(window.google.maps)
  if(googleMapsPromise) return googleMapsPromise
  if(!mapsKey) return Promise.reject(new Error('Journey planning is not configured yet.'))
  googleMapsPromise=new Promise((resolve,reject)=>{
    const callback='__gloryConferenceMapsReady'
    const script=document.createElement('script')
    let finished=false
    const fail=()=>{if(finished)return;finished=true;delete window[callback];script.remove();googleMapsPromise=null;reject(new Error('Google Maps could not load. Check your connection and try again.'))}
    window[callback]=()=>{
      if(finished)return
      finished=true
      delete window[callback]
      resolve(window.google.maps)
    }
    script.onerror=fail
    script.src='https://maps.googleapis.com/maps/api/js?key='+encodeURIComponent(mapsKey)+'&v=weekly&loading=async&callback='+callback
    script.async=true
    document.head.appendChild(script)
  })
  return googleMapsPromise
}
function humanDuration(milliseconds) {
  if(!Number.isFinite(milliseconds)) return 'Unavailable'
  const minutes=Math.max(1,Math.round(milliseconds/60000))
  const hours=Math.floor(minutes/60),remaining=minutes%60
  return hours?hours+' hr'+(remaining?' '+remaining+' min':''):minutes+' min'
}
function humanDistance(metres) {
  if(!Number.isFinite(metres)) return 'Unavailable'
  return metres>=1000?(metres/1000).toLocaleString('en-NG',{maximumFractionDigits:1})+' km':Math.round(metres)+' m'
}

export function VenueDirections({ compact=false }) {
  const [origin,setOrigin]=useState('')
  const [mode,setMode]=useState('DRIVING')
  const [pending,setPending]=useState(false)
  const [error,setError]=useState('')
  const [journey,setJourney]=useState(null)
  const [opened,setOpened]=useState(false)
  const [activeMap,setActiveMap]=useState(false)
  const mapNode=useRef(null)
  const mapInstance=useRef(null)
  const overlays=useRef([])
  const mounted=useRef(true)
  const requestSerial=useRef(0)

  useEffect(()=>{mounted.current=true;return ()=>{mounted.current=false;requestSerial.current+=1;overlays.current.forEach(line=>line.setMap(null));overlays.current=[]}},[])

  const clearRoute=()=>{
    overlays.current.forEach(line=>line.setMap(null))
    overlays.current=[]
    setJourney(null)
  }
  const planRoute=async(e)=>{
    e?.preventDefault()
    if(!origin.trim()){setError('Enter the town, street, or place you are travelling from.');return}
    if(!mapsKey){setError('The journey planner needs its Google Maps API key configured by the site administrator.');return}
    const requestId=++requestSerial.current
    setOpened(true);setPending(true);setError('');setJourney(null);setActiveMap(false)
    try {
      const googleMaps=await loadGoogleMaps()
      const [{Map},{Route}]=await Promise.all([googleMaps.importLibrary('maps'),googleMaps.importLibrary('routes')])
      if(!mounted.current||requestId!==requestSerial.current)return
      if(!mapInstance.current) {
        if(!mapNode.current) throw new Error('The map could not be initialized.')
        mapInstance.current=new Map(mapNode.current,{center:destination,zoom:13,disableDefaultUI:false,mapTypeControl:false,streetViewControl:false,fullscreenControl:false,gestureHandling:'cooperative'})
      }
      const request={
        origin:origin.trim(),
        destination,
        travelMode:mode,
        fields:['path','viewport','distanceMeters','durationMillis','staticDurationMillis','warnings']
      }
      if(mode==='DRIVING')request.routingPreference='TRAFFIC_AWARE'
      const response=await Route.computeRoutes(request)
      if(!mounted.current||requestId!==requestSerial.current)return
      const route=response?.routes?.[0]
      if(!route) throw new Error('No route was found. Try a more specific starting location.')
      clearRoute()
      const lines=route.createPolylines()
      lines.forEach(line=>line.setMap(mapInstance.current))
      overlays.current=lines
      if(route.viewport)mapInstance.current.fitBounds(route.viewport,45)
      const duration=humanDuration(route.durationMillis)
      const distance=humanDistance(route.distanceMeters)
      const arrival=new Date(Date.now()+route.durationMillis).toLocaleTimeString('en-NG',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'Africa/Lagos'})
      setJourney({duration,distance,arrival,warnings:route.warnings||[],traffic:mode==='DRIVING'})
      setActiveMap(true)
    }catch(err){
      if(!mounted.current||requestId!==requestSerial.current)return
      clearRoute()
      setActiveMap(false)
      setError(err?.message||'We could not calculate the journey. Check your starting point and try again.')
    }finally{if(mounted.current&&requestId===requestSerial.current)setPending(false)}
  }

  if(compact) return <div className="gc-venue-compact">
    <div className="gc-venue-compact-info"><MapPin size={20} aria-hidden="true"/><div>
      <strong>Find your way to The Outpouring</strong>
      <span>{conferenceVenue.addressLine1}, {conferenceVenue.city}</span>
      <small>Plan a route using Ikenga Hotel as the map landmark</small>
    </div></div>
    <a className="gc-venue-link" href="/#venue"><Navigation size={16} aria-hidden="true"/> PLAN MY JOURNEY</a>
  </div>

  return <section className="gc-venue" id="venue" aria-labelledby="gc-venue-title">
    <div className="gc-venue-layout">
      <div className="gc-venue-copy">
        <p className="gc-venue-eyebrow"><MapPin size={16} aria-hidden="true"/> PLAN YOUR VISIT · NSUKKA</p>
        <h2 id="gc-venue-title">YOUR JOURNEY<br/><span>TO THE OUTPOURING.</span></h2>
        <p className="gc-venue-intro">Coming from another town or somewhere in Nsukka? Enter your starting point to see your route, distance, and estimated time right here.</p>
        <div className="gc-venue-address"><span>OFFICIAL CONFERENCE ADDRESS</span><strong>{conferenceVenue.addressLine1}</strong><strong>{conferenceVenue.addressLine2}</strong><strong>{conferenceVenue.city}</strong></div>
        <form className="gc-journey-form" onSubmit={planRoute}>
          <label htmlFor="gc-journey-origin">WHERE ARE YOU COMING FROM?</label>
          <div className="gc-journey-origin"><LocateFixed size={19} aria-hidden="true"/><input id="gc-journey-origin" type="text" value={origin} onChange={e=>{requestSerial.current+=1;setOrigin(e.target.value);setError('');clearRoute();setActiveMap(false);setPending(false)}} maxLength={180} autoComplete="street-address" placeholder="e.g. Enugu, Odenigbo or UNN Main Gate" required/></div>
          <fieldset className="gc-journey-modes"><legend>HOW WILL YOU TRAVEL?</legend>
            <button type="button" onClick={()=>{requestSerial.current+=1;setMode('DRIVING');clearRoute();setActiveMap(false);setPending(false)}} className={mode==='DRIVING'?'selected':''} aria-pressed={mode==='DRIVING'}>By car</button>
            <button type="button" onClick={()=>{requestSerial.current+=1;setMode('WALKING');clearRoute();setActiveMap(false);setPending(false)}} className={mode==='WALKING'?'selected':''} aria-pressed={mode==='WALKING'}>Walking</button>
          </fieldset>
          <button type="submit" className="gc-journey-submit" disabled={pending}>{pending?'CALCULATING ROUTE…':'SHOW MY ROUTE & ARRIVAL TIME'} <ArrowRight size={18} aria-hidden="true"/></button>
        </form>
        {error&&<p className="gc-journey-error" role="alert">{error}</p>}
        {journey&&<div className="gc-journey-report" role="status" aria-live="polite">
          <div><Clock3 size={20} aria-hidden="true"/><span>ESTIMATED TRAVEL TIME</span><strong>{journey.duration}</strong></div>
          <div><RouteIcon size={20} aria-hidden="true"/><span>ROUTE DISTANCE</span><strong>{journey.distance}</strong></div>
          <div className="gc-journey-arrival"><span>ESTIMATED ARRIVAL IF YOU LEAVE NOW</span><strong>{journey.arrival} WAT</strong></div><p>{journey.traffic?'Driving time reflects Google Maps traffic estimates where available.':'Walking times are estimates, not guaranteed arrival times.'}</p>
          {journey.warnings.map((warning,i)=><p className="gc-journey-warning" key={i}>{warning}</p>)}
        </div>}
        <p className="gc-venue-caveat">Map destination: Ikenga Hotel, a nearby navigation landmark. The actual conference entrance is at the official street address above. Travel times are estimates and can change.</p>
      </div>
      <div className="gc-venue-map-card">
        <div className="gc-venue-map-heading"><span><Navigation size={18} aria-hidden="true"/> JOURNEY MAP</span><small>{activeMap?'Your route is shown below':'Interactive route planner'}</small></div>
        <div className="gc-journey-map-stage">
          <div ref={mapNode} className="gc-journey-map-canvas" style={{display:opened?'block':'none'}} aria-label="Interactive map showing the route to Ikenga Hotel landmark"/>
          {!opened&&<div className="gc-venue-map-placeholder"><div className="gc-venue-map-icon"><MapPin size={34} aria-hidden="true"/></div><strong>See your way to Nsukka</strong><p>Enter where you're travelling from to reveal your route and estimated arrival time on this map.</p><button type="button" onClick={()=>{document.getElementById('gc-journey-origin')?.focus()}}><LocateFixed size={18} aria-hidden="true"/> ENTER STARTING POINT</button></div>}
          {opened&&!activeMap&&<div className="gc-journey-map-pending">{pending?'Drawing your journey…':error?'Your map will appear when a route is found.':'Plan a route to view the map.'}</div>}
        </div>
        <div className="gc-venue-map-bottom"><CheckCircle2 size={16} aria-hidden="true"/><span>Destination landmark: Ikenga Hotel, Nsukka</span></div>
      </div>
    </div>
  </section>
}
export default VenueDirections
