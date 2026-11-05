import { useEffect, useRef, useState } from 'react'
import { ArrowRight, CarFront, CheckCircle2, Clock3, ExternalLink, Footprints, Info, MapPin, Navigation, Route as RouteIcon } from 'lucide-react'
import { conferenceVenue, venueDirectionsUrl, venueEmbedUrl } from './conferenceVenue'
import './venue.css'

const mapsKey=(import.meta.env.VITE_GOOGLE_MAPS_API_KEY||'').trim()
const destination={lat:conferenceVenue.latitude,lng:conferenceVenue.longitude}
let googleMapsPromise

function loadGoogleMaps(){
  if(window.google?.maps?.importLibrary)return Promise.resolve(window.google.maps)
  if(googleMapsPromise)return googleMapsPromise
  if(!mapsKey)return Promise.reject(new Error('Google Maps API key is not configured. Add VITE_GOOGLE_MAPS_API_KEY to .env.local and restart the development server.'))
  googleMapsPromise=new Promise((resolve,reject)=>{
    const callback='__gloryConferenceMapsReady'
    const script=document.createElement('script')
    let done=false
    const fail=()=>{
      if(done)return
      done=true;delete window[callback];script.remove()
      googleMapsPromise=null
      reject(new Error('Google Maps could not load. Check your API key, enabled Maps JavaScript API, billing and website restrictions.'))
    }
    window[callback]=()=>{
      if(done)return
      done=true;delete window[callback]
      if(window.google?.maps?.importLibrary)resolve(window.google.maps)
      else fail()
    }
    script.async=true
    script.onerror=fail
    script.src='https://maps.googleapis.com/maps/api/js?key='+encodeURIComponent(mapsKey)+'&v=weekly&loading=async&callback='+callback
    document.head.appendChild(script)
  })
  return googleMapsPromise
}
function formatDistance(metres){
  return metres>=1000?(metres/1000).toLocaleString('en-NG',{maximumFractionDigits:1})+' km':Math.round(metres)+' m'
}
function formatDuration(milliseconds){
  const minutes=Math.max(1,Math.round(milliseconds/60000))
  const h=Math.floor(minutes/60),m=minutes%60
  return h?h+' hr'+(m?' '+m+' min':''):minutes+' min'
}

export function VenueDirections({compact=false}){
  const placeWidgetHost=useRef(null)
  const mapHost=useRef(null)
  const mapRef=useRef(null)
  const placeWidgetRef=useRef(null)
  const routeLinesRef=useRef([])
  const markersRef=useRef([])
  const activeRef=useRef(false)
  const routeSerialRef=useRef(0)
  const [origin,setOrigin]=useState(null)
  const [mode,setMode]=useState('DRIVING')
  const [loading,setLoading]=useState(true)
  const [pending,setPending]=useState(false)
  const [error,setError]=useState('')
  const [routeInfo,setRouteInfo]=useState(null)

  // The compact link needs no Maps script, Places or billing requests.
  useEffect(()=>{
    if(compact)return
    activeRef.current=true
    let widget
    let handler
    let disposed=false
    let marker
    const start=async()=>{
      if(!mapsKey){setLoading(false);setError('Google Maps key is missing. Add VITE_GOOGLE_MAPS_API_KEY to .env.local and restart your server.');return}
      try{
        const maps=await loadGoogleMaps()
        const [{Map},{PlaceAutocompleteElement}]=await Promise.all([
          maps.importLibrary('maps'),maps.importLibrary('places')
        ])
        if(disposed||!activeRef.current)return
        if(!mapHost.current||!placeWidgetHost.current)throw new Error('Map container unavailable.')
        const map=new Map(mapHost.current,{
          center:destination,zoom:14,mapTypeControl:false,streetViewControl:false,
          fullscreenControl:true,gestureHandling:'cooperative'
        })
        mapRef.current=map
        // Mark the exact point supplied by the site owner without using deprecated google.maps.Marker.
        marker=new maps.Circle({center:destination,radius:15,map,strokeColor:'#067ba6',strokeWeight:3,strokeOpacity:1,fillColor:'#0d9ccb',fillOpacity:.85})
        markersRef.current.push(marker)

        widget=new PlaceAutocompleteElement()
        widget.placeholder='Search for a hotel, shop, street, town or landmark'
        widget.includedRegionCodes=['ng']
        // Prefer nearby Nsukka businesses when the query is vague,
        // but never exclude origins elsewhere in Nigeria.
        widget.locationBias={center:destination,radius:25000}
        widget.style.width='100%'
        widget.classList.add('gc-google-places-widget')
        // Google owns only this empty mount element; React never renders children inside it.
        placeWidgetHost.current.appendChild(widget)
        placeWidgetRef.current=widget
        handler=async event=>{
          const serial=++routeSerialRef.current
          setOrigin(null);setRouteInfo(null);setError('')
          routeLinesRef.current.forEach(line=>line.setMap(null))
          routeLinesRef.current=[]
          setPending(false)
          try{
            const place=event.placePrediction?.toPlace?.()
            if(!place)throw new Error('Please select one of the suggestions from Google Maps.')
            await place.fetchFields({fields:['displayName','formattedAddress','location']})
            if(disposed||!activeRef.current||serial!==routeSerialRef.current)return
            if(!place.location)throw new Error('Google did not return a mapped location. Please choose another result.')
            setOrigin({location:place.location,name:place.displayName||place.formattedAddress||'Selected location',address:place.formattedAddress||''})
          }catch(err){
            if(!disposed&&activeRef.current&&serial===routeSerialRef.current)setError(err?.message||'Could not load the selected location.')
          }
        }
        widget.addEventListener('gmp-select',handler)
        setLoading(false)
      }catch(err){
        if(!disposed&&activeRef.current){setLoading(false);setError(err?.message||'The map could not load.')}
      }
    }
    start()
    return ()=>{
      disposed=true
      activeRef.current=false
      ++routeSerialRef.current
      if(widget&&handler)widget.removeEventListener('gmp-select',handler)
      if(widget&&widget.parentNode)widget.remove()
      if(placeWidgetRef.current===widget)placeWidgetRef.current=null
      routeLinesRef.current.forEach(line=>line.setMap(null))
      routeLinesRef.current=[]
      markersRef.current.forEach(item=>item.setMap(null))
      markersRef.current=[]
      mapRef.current=null
    }
  },[compact])

  const changeMode=next=>{
    ++routeSerialRef.current
    setMode(next);setPending(false);setError('');setRouteInfo(null)
    routeLinesRef.current.forEach(line=>line.setMap(null))
    routeLinesRef.current=[]
  }
  const plan=async event=>{
    event.preventDefault()
    if(!origin?.location){setError('Choose a starting location from Google’s suggestions first.');return}
    if(!mapRef.current){setError('The map is not ready.');return}
    const serial=++routeSerialRef.current
    setError('');setPending(true);setRouteInfo(null)
    routeLinesRef.current.forEach(line=>line.setMap(null))
    routeLinesRef.current=[]
    try{
      const {Route}=await window.google.maps.importLibrary('routes')
      const request={
        origin:origin.location,
        destination,
        travelMode:mode,
        fields:['path','viewport','distanceMeters','durationMillis','warnings']
      }
      if(mode==='DRIVING')request.routingPreference='TRAFFIC_AWARE'
      const response=await Route.computeRoutes(request)
      if(!activeRef.current||serial!==routeSerialRef.current)return
      const route=response.routes?.[0]
      if(!route||!Number.isFinite(route.durationMillis)||!Number.isFinite(route.distanceMeters)){
        throw new Error('Google Maps could not calculate a route for those locations. Try another starting point.')
      }
      const lines=route.createPolylines()
      lines.forEach(line=>line.setMap(mapRef.current))
      routeLinesRef.current=lines
      if(route.viewport)mapRef.current.fitBounds(route.viewport,36)
      setRouteInfo({
        duration:formatDuration(route.durationMillis),
        distance:formatDistance(route.distanceMeters),
        arrival:new Date(Date.now()+route.durationMillis).toLocaleTimeString('en-NG',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'Africa/Lagos'}),
        trafficAware:mode==='DRIVING',warnings:route.warnings||[]
      })
    }catch(err){if(activeRef.current&&serial===routeSerialRef.current)setError(err?.message||'Route calculation failed. Please try again.')}
    finally{if(activeRef.current&&serial===routeSerialRef.current)setPending(false)}
  }

  if(compact)return <div className="gc-venue-compact">
    <div className="gc-venue-compact-info"><MapPin size={20} aria-hidden="true"/><div><strong>Find your way to The Outpouring</strong><span>{conferenceVenue.addressLine1}, {conferenceVenue.city}</span><small>Route to the church's map pin, supplied by the conference team</small></div></div>
    <a className="gc-venue-link" href="/directions"><Navigation size={16} aria-hidden="true"/> VIEW VENUE & DIRECTIONS</a>
  </div>

  return <section className="gc-venue" id="venue" aria-labelledby="gc-venue-title">
    <div className="gc-venue-layout">
      <div className="gc-venue-copy">
        <p className="gc-venue-eyebrow"><MapPin size={16} aria-hidden="true"/> PLAN YOUR VISIT · NSUKKA</p>
        <h2 id="gc-venue-title">YOUR JOURNEY<br/><span>TO THE OUTPOURING.</span></h2>
        <p className="gc-venue-intro">Use Google Maps to find a shop, street, hotel, landmark or town anywhere in Nigeria. Select a suggestion and see your route, distance and estimated travel time below.</p>
        <div className="gc-venue-address"><span>OFFICIAL CONFERENCE ADDRESS</span><strong>{conferenceVenue.addressLine1}</strong><strong>{conferenceVenue.addressLine2}</strong><strong>{conferenceVenue.city}</strong></div>
        <div className="gc-route-panel">
          <div className="gc-route-panel-head"><span className="gc-route-panel-icon"><Navigation size={19} aria-hidden="true"/></span><div><strong>Plan your journey</strong><small>Get a personalised route to the conference</small></div><span className="gc-route-panel-step">01 / 02</span></div>
          <form className="gc-journey-form" onSubmit={plan}>
            <label id="gc-google-origin-label">YOUR STARTING LOCATION</label>
            <div ref={placeWidgetHost} className="gc-google-origin" aria-labelledby="gc-google-origin-label"/>
            {loading&&<p className="gc-google-loading" role="status">Loading Google place search…</p>}
            <p className="gc-google-hint">Type a street, hotel or landmark, then choose a Google suggestion.</p>
            {origin&&<div className="gc-location-selected"><CheckCircle2 size={17} aria-hidden="true"/><span>Starting from <strong>{origin.name}</strong>{origin.address&&<small>{origin.address}</small>}</span></div>}
            <div className="gc-route-destination"><span className="gc-route-destination-pin"><MapPin size={16} aria-hidden="true"/></span><div><small>YOUR DESTINATION</small><strong>Divine Intervention Soul Rescue Ministry</strong><span>Uwani Ugwu Street, Nsukka</span></div><CheckCircle2 size={17} aria-label="Destination set"/></div>
            <fieldset className="gc-journey-modes"><legend>CHOOSE YOUR TRAVEL MODE</legend>
              <button type="button" className={mode==='DRIVING'?'selected':''} onClick={()=>changeMode('DRIVING')} aria-pressed={mode==='DRIVING'}><CarFront size={18} aria-hidden="true"/> Driving</button>
              <button type="button" className={mode==='WALKING'?'selected':''} onClick={()=>changeMode('WALKING')} aria-pressed={mode==='WALKING'}><Footprints size={18} aria-hidden="true"/> Walking</button>
            </fieldset>
            <button type="submit" className="gc-journey-submit" disabled={pending||loading||!origin}>{pending?'CALCULATING YOUR ROUTE…':'GET MY DIRECTIONS'} <ArrowRight size={18} aria-hidden="true"/></button>
          </form>
        </div>
        {error&&<p className="gc-journey-error" role="alert">{error}</p>}
        {routeInfo&&<div className="gc-journey-report" role="status" aria-live="polite">
          <div><Clock3 size={20} aria-hidden="true"/><span>ESTIMATED TRAVEL TIME</span><strong>{routeInfo.duration}</strong></div>
          <div><RouteIcon size={20} aria-hidden="true"/><span>ROUTE DISTANCE</span><strong>{routeInfo.distance}</strong></div>
          <div className="gc-journey-arrival"><span>ESTIMATED ARRIVAL IF YOU LEAVE NOW</span><strong>{routeInfo.arrival} WAT</strong></div>
          <p>{routeInfo.trafficAware?'Google driving estimate considers available traffic conditions.':'Google walking estimate; actual travel time may vary.'}</p>
          {routeInfo.warnings.map((warning,i)=><p className="gc-journey-warning" key={i}>{warning}</p>)}
        </div>}
        <p className="gc-venue-caveat"><Info size={15} aria-hidden="true"/> Routes end at the <strong>Divine Intervention Soul Rescue Ministry</strong> map pin supplied by the conference team. Confirm the entrance when you arrive.</p>
        <div className="gc-venue-cta-row"><a className="gc-venue-secondary" href={venueDirectionsUrl} target="_blank" rel="noopener noreferrer"><Navigation size={17} aria-hidden="true"/> OPEN FULL GOOGLE MAPS <ExternalLink size={15} aria-hidden="true"/></a></div>
      </div>
      <div className="gc-venue-map-card">
        <div className="gc-venue-map-heading"><span><Navigation size={18} aria-hidden="true"/> LIVE ROUTE PREVIEW</span><small className="gc-map-provider">Powered by Google Maps</small></div>
        <div className="gc-journey-map-stage">
          <div ref={mapHost} className="gc-journey-map-canvas" style={{display:mapsKey?'block':'none'}} aria-label="Google interactive map with route to Divine Intervention Soul Rescue Ministry in Nsukka"/>
          {!mapsKey&&<iframe className="gc-venue-embedded-map" title="Divine Intervention Soul Rescue Ministry in Nsukka" src={venueEmbedUrl} loading="lazy"/>}
        </div>
        <div className="gc-venue-map-bottom"><span className="gc-map-destination-icon"><MapPin size={18} aria-hidden="true"/></span><div><small>CONFERENCE DESTINATION</small><strong>Divine Intervention Soul Rescue Ministry</strong><span>Nsukka, Enugu State</span></div></div>
      </div>
    </div>
  </section>
}
export default VenueDirections
