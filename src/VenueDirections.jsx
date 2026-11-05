import { useEffect, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2, Clock3, LocateFixed, MapPin, Navigation, Route as RouteIcon } from 'lucide-react'
import { conferenceVenue } from './conferenceVenue'
import './venue.css'

const orsKey=(import.meta.env.VITE_ORS_API_KEY||'').trim()
const apiBase='https://api.heigit.org'
const destination=[conferenceVenue.landmarkLongitude,conferenceVenue.landmarkLatitude]
const leafletScript='https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js'
const leafletCss='https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css'
let leafletPromise

function loadLeaflet(){
  if(window.L?.map) return Promise.resolve(window.L)
  if(leafletPromise) return leafletPromise
  leafletPromise=new Promise((resolve,reject)=>{
    if(!document.querySelector('link[data-gc-leaflet]')){
      const css=document.createElement('link')
      css.rel='stylesheet';css.href=leafletCss;css.dataset.gcLeaflet='yes'
      document.head.appendChild(css)
    }
    const script=document.createElement('script')
    script.src=leafletScript;script.async=true
    script.onload=()=>window.L?.map?resolve(window.L):reject(new Error('The map library did not load correctly.'))
    script.onerror=()=>{leafletPromise=null;script.remove();reject(new Error('Could not load the map. Please check your internet connection.'))}
    document.head.appendChild(script)
  })
  return leafletPromise
}
function formatDuration(seconds){
  const min=Math.max(1,Math.round(seconds/60))
  const h=Math.floor(min/60),m=min%60
  return h?h+' hr'+(m?' '+m+' min':''):min+' min'
}
function formatDistance(metres){
  return metres>=1000?(metres/1000).toLocaleString('en-NG',{maximumFractionDigits:1})+' km':Math.round(metres)+' m'
}
async function fetchJson(url,options,signal){
  const response=await fetch(url,{...options,signal})
  if(response.status===429)throw new Error('The free route service is busy. Please try again later.')
  if(response.status===403||response.status===401)throw new Error('Journey planning is temporarily unavailable. The route service key or daily allowance needs checking.')
  if(!response.ok)throw new Error('We could not find a route for those locations. Try a more specific starting place.')
  return response.json()
}

export function VenueDirections({compact=false}){
  const [origin,setOrigin]=useState('')
  const [mode,setMode]=useState('driving-car')
  const [pending,setPending]=useState(false)
  const [error,setError]=useState('')
  const [journey,setJourney]=useState(null)
  const [opened,setOpened]=useState(false)
  const [activeMap,setActiveMap]=useState(false)
  const mapNode=useRef(null)
  const mapInstance=useRef(null)
  const routeLayer=useRef(null)
  const aborter=useRef(null)
  const requestId=useRef(0)
  const mounted=useRef(false)

  useEffect(()=>{
    mounted.current=true
    return ()=>{
      mounted.current=false
      ++requestId.current
      aborter.current?.abort()
      mapInstance.current?.remove()
      mapInstance.current=null
    }
  },[])

  const reset=()=>{
    requestId.current++
    aborter.current?.abort()
    setPending(false);setError('');setJourney(null);setActiveMap(false)
    if(routeLayer.current&&mapInstance.current){mapInstance.current.removeLayer(routeLayer.current);routeLayer.current=null}
  }
  const planRoute=async(e)=>{
    e.preventDefault()
    if(!origin.trim()){setError('Please enter a town, street, or landmark you are coming from.');return}
    if(!orsKey){setError('The free journey planner is awaiting its OpenRouteService API key.');return}
    aborter.current?.abort()
    const controller=new AbortController()
    aborter.current=controller
    const id=++requestId.current
    setPending(true);setError('');setJourney(null);setActiveMap(false);setOpened(true)
    try{
      const query=origin.trim()
      const searchUrl=new URL(apiBase+'/pelias/v1/search')
      searchUrl.searchParams.set('api_key',orsKey)
      searchUrl.searchParams.set('text',query)
      searchUrl.searchParams.set('boundary.country','NGA')
      searchUrl.searchParams.set('focus.point.lat',String(conferenceVenue.landmarkLatitude))
      searchUrl.searchParams.set('focus.point.lon',String(conferenceVenue.landmarkLongitude))
      searchUrl.searchParams.set('size','5')
      const places=await fetchJson(searchUrl.toString(),{},controller.signal)
      if(!mounted.current||id!==requestId.current)return
      const candidates=(places.features||[]).filter(p=>Array.isArray(p.geometry?.coordinates)&&p.geometry.coordinates.length===2)
      if(!candidates.length)throw new Error('We could not identify that starting place in Nigeria. Try a nearby major road or landmark.')
      const place=candidates[0]
      const coords=place.geometry.coordinates
      const profile=mode
      const data=await fetchJson(apiBase+'/openrouteservice/v2/directions/'+profile+'/geojson',{
        method:'POST',
        headers:{Authorization:orsKey,'Content-Type':'application/json'},
        body:JSON.stringify({coordinates:[coords,destination],instructions:false})
      },controller.signal)
      if(!mounted.current||id!==requestId.current)return
      const route=data.features?.[0]
      const distance=route?.properties?.summary?.distance
      const seconds=route?.properties?.summary?.duration
      const line=route?.geometry?.coordinates
      if(!Array.isArray(line)||!line.length||!Number.isFinite(distance)||!Number.isFinite(seconds))throw new Error('The route service did not return a usable journey. Please try again.')
      const L=await loadLeaflet()
      if(!mounted.current||id!==requestId.current)return
      if(!mapInstance.current){
        if(!mapNode.current)throw new Error('Map area unavailable. Please reload this page.')
        mapInstance.current=L.map(mapNode.current,{scrollWheelZoom:false,zoomControl:true}).setView([destination[1],destination[0]],13)
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
          maxZoom:18,
          attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>'
        }).addTo(mapInstance.current)
      }
      if(routeLayer.current)mapInstance.current.removeLayer(routeLayer.current)
      routeLayer.current=L.layerGroup().addTo(mapInstance.current)
      const points=line.map(pair=>[pair[1],pair[0]])
      const routeLine=L.polyline(points,{color:'#007fae',weight:6,opacity:.95,lineJoin:'round'}).addTo(routeLayer.current)
      L.circleMarker([coords[1],coords[0]],{radius:9,color:'#fff',weight:3,fillColor:'#007fae',fillOpacity:1}).bindPopup('Starting point: '+(place.properties?.label||query)).addTo(routeLayer.current)
      L.circleMarker([destination[1],destination[0]],{radius:9,color:'#fff',weight:3,fillColor:'#e77a20',fillOpacity:1}).bindPopup('Ikenga Hotel — navigation landmark, not the conference entrance').addTo(routeLayer.current)
      mapInstance.current.invalidateSize()
      mapInstance.current.fitBounds(routeLine.getBounds().pad(.13),{padding:[28,28],maxZoom:15})
      setActiveMap(true)
      setJourney({
        duration:formatDuration(seconds),
        distance:formatDistance(distance),
        arrival:new Date(Date.now()+seconds*1000).toLocaleTimeString('en-NG',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'Africa/Lagos'}),
        resolvedOrigin:place.properties?.label||query
      })
    }catch(err){
      if(controller.signal.aborted||!mounted.current||id!==requestId.current)return
      setError(err?.message||'We could not calculate the route. Try again shortly.')
      setActiveMap(false)
    }finally{if(mounted.current&&id===requestId.current)setPending(false)}
  }

  if(compact)return <div className="gc-venue-compact">
    <div className="gc-venue-compact-info"><MapPin size={20} aria-hidden="true"/><div><strong>Find your way to The Outpouring</strong><span>{conferenceVenue.addressLine1}, {conferenceVenue.city}</span><small>Plan your journey on our website using Ikenga Hotel as a landmark</small></div></div>
    <a className="gc-venue-link" href="/#venue"><Navigation size={16} aria-hidden="true"/> PLAN MY JOURNEY</a>
  </div>

  return <section className="gc-venue" id="venue" aria-labelledby="gc-venue-title">
    <div className="gc-venue-layout">
      <div className="gc-venue-copy">
        <p className="gc-venue-eyebrow"><MapPin size={16} aria-hidden="true"/> PLAN YOUR VISIT · NSUKKA</p>
        <h2 id="gc-venue-title">YOUR JOURNEY<br/><span>TO THE OUTPOURING.</span></h2>
        <p className="gc-venue-intro">Coming from another town or somewhere in Nsukka? Enter your starting point to see your route, distance and estimated time without leaving this website.</p>
        <div className="gc-venue-address"><span>OFFICIAL CONFERENCE ADDRESS</span><strong>{conferenceVenue.addressLine1}</strong><strong>{conferenceVenue.addressLine2}</strong><strong>{conferenceVenue.city}</strong></div>
        <form className="gc-journey-form" onSubmit={planRoute}>
          <label htmlFor="gc-journey-origin">WHERE ARE YOU COMING FROM?</label>
          <div className="gc-journey-origin"><LocateFixed size={19} aria-hidden="true"/><input id="gc-journey-origin" type="text" value={origin} onChange={e=>{reset();setOrigin(e.target.value)}} maxLength={180} autoComplete="off" placeholder="e.g. Enugu, Odenigbo or UNN Main Gate" required/></div>
          <fieldset className="gc-journey-modes"><legend>HOW WILL YOU TRAVEL?</legend>
            <button type="button" onClick={()=>{reset();setMode('driving-car')}} className={mode==='driving-car'?'selected':''} aria-pressed={mode==='driving-car'}>By car</button>
            <button type="button" onClick={()=>{reset();setMode('foot-walking')}} className={mode==='foot-walking'?'selected':''} aria-pressed={mode==='foot-walking'}>Walking</button>
          </fieldset>
          <button type="submit" className="gc-journey-submit" disabled={pending}>{pending?'CALCULATING ROUTE…':'SHOW MY ROUTE & ARRIVAL TIME'} <ArrowRight size={18} aria-hidden="true"/></button>
        </form>
        {error&&<p className="gc-journey-error" role="alert">{error}</p>}
        {journey&&<div className="gc-journey-report" role="status" aria-live="polite">
          <div><Clock3 size={20} aria-hidden="true"/><span>ESTIMATED TRAVEL TIME</span><strong>{journey.duration}</strong></div>
          <div><RouteIcon size={20} aria-hidden="true"/><span>ROUTE DISTANCE</span><strong>{journey.distance}</strong></div>
          <div className="gc-journey-arrival"><span>ESTIMATED ARRIVAL IF YOU LEAVE NOW</span><strong>{journey.arrival} WAT</strong></div>
          <p>Starting point matched: {journey.resolvedOrigin}. These are route estimates, not live-traffic predictions. Please check the matched location is correct.</p>
        </div>}
        <p className="gc-venue-caveat">Map destination: Ikenga Hotel, a navigation landmark. The conference entrance is at the official street address above, not necessarily the hotel. Route timings don't include live traffic or road delays.</p>
      </div>
      <div className="gc-venue-map-card">
        <div className="gc-venue-map-heading"><span><Navigation size={18} aria-hidden="true"/> JOURNEY MAP</span><small>{activeMap?'Your route is shown below':'Powered by OpenStreetMap'}</small></div>
        <div className="gc-journey-map-stage">
          <div ref={mapNode} className="gc-journey-map-canvas" style={{display:opened?'block':'none'}} aria-label="Interactive OpenStreetMap route to Ikenga Hotel landmark"/>
          {!opened&&<div className="gc-venue-map-placeholder"><div className="gc-venue-map-icon"><MapPin size={34} aria-hidden="true"/></div><strong>See your way to Nsukka</strong><p>Enter where you're travelling from to reveal your route and estimated travel time on this map.</p><button type="button" onClick={()=>document.getElementById('gc-journey-origin')?.focus()}><LocateFixed size={18} aria-hidden="true"/> ENTER STARTING POINT</button></div>}
          {opened&&!activeMap&&<div className="gc-journey-map-pending">{pending?'Drawing your journey…':error?'Your map will appear when a route is found.':'Plan a route to view the map.'}</div>}
        </div>
        <div className="gc-venue-map-bottom"><CheckCircle2 size={16} aria-hidden="true"/><span>Destination landmark: Ikenga Hotel, Nsukka</span></div>
      </div>
    </div>
  </section>
}
export default VenueDirections
