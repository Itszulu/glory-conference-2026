// Church destination supplied as a Google Maps pin by the site owner.
// Latitude and longitude are the owner's selected point; entrance still needs
// to be confirmed on site if the supplied pin is on the building itself.
export const conferenceVenue=Object.freeze({
  title:'Glory Conference 2026 — The Outpouring',
  ministryName:'Divine Intervention Soul Rescue Ministry',
  addressLine1:'No. 4 Uwani Ugwu Street',
  addressLine2:'Off Ikenga Junction',
  city:'Nsukka, Enugu State, Nigeria',
  fullAddress:'No. 4 Uwani Ugwu Street, Off Ikenga Junction, Nsukka, Enugu State, Nigeria',
  latitude:6.836262173294491,
  longitude:7.370666488580394,
  exactVenuePinVerified:true
})
const coordinates=conferenceVenue.latitude+','+conferenceVenue.longitude
export const venueSearchUrl='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(coordinates)
export const venueDirectionsUrl='https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(coordinates)
export const venueEmbedUrl='https://maps.google.com/maps?q='+encodeURIComponent(coordinates)+'&z=17&output=embed'
