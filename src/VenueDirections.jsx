import { MapPin, Navigation, ExternalLink, Info } from 'lucide-react'
import { conferenceVenue, venueDirectionsUrl, venueEmbedUrl } from './conferenceVenue'
import './venue.css'

/**
 * No inaccurate first-result geocoding, no unverified ETAs, no payment card.
 * The embedded Google Maps view is a landmark preview; turn-by-turn directions
 * open in Google's actual navigation service, where search is more reliable.
 */
export function VenueDirections({compact=false}){
  if(compact)return <div className="gc-venue-compact">
    <div className="gc-venue-compact-info">
      <MapPin size={20} aria-hidden="true"/>
      <div><strong>Find your way to The Outpouring</strong><span>{conferenceVenue.addressLine1}, {conferenceVenue.city}</span><small>Ikenga Hotel is a map landmark, not the conference entrance</small></div>
    </div>
    <a className="gc-venue-link" href="/directions"><Navigation size={16} aria-hidden="true"/> VIEW VENUE & DIRECTIONS</a>
  </div>

  return <section className="gc-venue" id="venue" aria-labelledby="gc-venue-title">
    <div className="gc-venue-layout">
      <div className="gc-venue-copy">
        <p className="gc-venue-eyebrow"><MapPin size={16} aria-hidden="true"/> VISITING NSUKKA · GLORY CONFERENCE 2026</p>
        <h2 id="gc-venue-title">FIND YOUR WAY<br/><span>TO THE OUTPOURING.</span></h2>
        <p className="gc-venue-intro">Our conference venue is in Nsukka, Enugu State. Use the map to see the area, and open Google Maps when you need reliable place search, turn-by-turn directions and its available travel-time estimates.</p>
        <div className="gc-venue-address"><span>OFFICIAL CONFERENCE ADDRESS</span><strong>{conferenceVenue.addressLine1}</strong><strong>{conferenceVenue.addressLine2}</strong><strong>{conferenceVenue.city}</strong></div>
        <div className="gc-venue-cta-row">
          <a className="gc-venue-primary" href={venueDirectionsUrl} target="_blank" rel="noopener noreferrer"><Navigation size={18} aria-hidden="true"/> GET GOOGLE MAPS DIRECTIONS <ExternalLink size={15} aria-hidden="true"/></a>
        </div>
        <p className="gc-venue-caveat"><Info size={15} aria-hidden="true"/> The map pin points to <strong>Ikenga Hotel</strong> as a navigation landmark. It does not represent a verified conference entrance. Check the written address before travelling.</p>
      </div>
      <div className="gc-venue-map-card">
        <div className="gc-venue-map-heading"><span><MapPin size={18} aria-hidden="true"/> NSUKKA AREA MAP</span><small>Google Maps landmark view</small></div>
        <iframe className="gc-venue-embedded-map" title="Ikenga Hotel landmark in Nsukka on Google Maps" src={venueEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/>
        <div className="gc-venue-map-bottom"><MapPin size={16} aria-hidden="true"/><span>Landmark: Ikenga Hotel · Nsukka</span></div>
      </div>
    </div>
  </section>
}
export default VenueDirections
