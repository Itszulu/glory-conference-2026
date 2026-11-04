import { useState } from 'react'
import { MapPin, Navigation, Map, ExternalLink } from 'lucide-react'
import { conferenceVenue, venueDirectionsUrl, venueSearchUrl, venueEmbedUrl } from './conferenceVenue'
import './venue.css'

export function VenueDirections({ compact=false, print=false }) {
  const [mapVisible,setMapVisible]=useState(false)
  if (print) return <div className="gc-venue-print">
    <strong>VENUE & ARRIVAL</strong>
    <span>{conferenceVenue.addressLine1}, {conferenceVenue.addressLine2}, {conferenceVenue.city}</span>
  </div>
  if (compact) return <div className="gc-venue-compact">
    <div className="gc-venue-compact-info">
      <MapPin aria-hidden="true" size={20}/>
      <div><strong>Find the conference venue</strong><span>{conferenceVenue.addressLine1}, {conferenceVenue.city}</span><small>Maps opens at Ikenga Hotel landmark</small></div>
    </div>
    <a href={venueDirectionsUrl} target="_blank" rel="noopener noreferrer" className="gc-venue-link"><Navigation size={16} aria-hidden="true"/> GET DIRECTIONS</a>
  </div>
  return <section className="gc-venue" id="venue" aria-labelledby="gc-venue-title">
    <div className="gc-venue-layout">
      <div className="gc-venue-copy">
        <p className="gc-venue-eyebrow"><MapPin size={16} aria-hidden="true"/> PLAN YOUR VISIT</p>
        <h2 id="gc-venue-title">FIND YOUR WAY<br/><span>TO THE OUTPOURING.</span></h2>
        <p className="gc-venue-intro">We look forward to receiving you in Nsukka. Save the venue details before you travel and use Google Maps to plan your route.</p>
        <div className="gc-venue-address"><span>CONFERENCE VENUE</span><strong>{conferenceVenue.addressLine1}</strong><strong>{conferenceVenue.addressLine2}</strong><strong>{conferenceVenue.city}</strong></div>
        <div className="gc-venue-cta-row">
          <a className="gc-venue-primary" href={venueDirectionsUrl} target="_blank" rel="noopener noreferrer"><Navigation size={18} aria-hidden="true"/> GET DIRECTIONS <ExternalLink size={15} aria-hidden="true"/></a>
          <a className="gc-venue-secondary" href={venueSearchUrl} target="_blank" rel="noopener noreferrer"><MapPin size={17} aria-hidden="true"/> VIEW IN GOOGLE MAPS</a>
        </div>
        <p className="gc-venue-caveat">Google Maps directions lead to Ikenga Hotel as a landmark, not the exact entrance. The conference venue is at the published street address; ask the welcome team for final guidance.</p>
      </div>
      <div className="gc-venue-map-card">
        <div className="gc-venue-map-heading"><span><Map size={18} aria-hidden="true"/> LANDMARK MAP</span><small>Loads only when requested</small></div>
        {mapVisible ? <iframe title="Google Maps showing Ikenga Hotel navigation landmark in Nsukka" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={venueEmbedUrl} allowFullScreen/> :
          <div className="gc-venue-map-placeholder"><div className="gc-venue-map-icon"><MapPin size={34} aria-hidden="true"/></div><strong>Explore the venue area</strong><p>Open a map of Ikenga Hotel, the navigation landmark near the published venue address.</p><button type="button" onClick={()=>setMapVisible(true)}><Map size={18} aria-hidden="true"/> SHOW MAP</button></div>}
        <div className="gc-venue-map-bottom"><MapPin size={16} aria-hidden="true"/><span>Map landmark: Ikenga Hotel · Nsukka</span></div>
      </div>
    </div>
  </section>
}
export default VenueDirections
