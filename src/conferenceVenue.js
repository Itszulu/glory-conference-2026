// The conference street address was already published on the Schedule page.
// Ikenga Hotel is a verified map landmark; it is NOT asserted to be the venue.
export const conferenceVenue = Object.freeze({
  title:'Glory Conference 2026 — The Outpouring',
  addressLine1:'No. 4 Uwani Ugwu Street',
  addressLine2:'Off Ikenga Junction',
  city:'Nsukka, Enugu State, Nigeria',
  fullAddress:'No. 4 Uwani Ugwu Street, Off Ikenga Junction, Nsukka, Enugu State, Nigeria',
  landmarkName:'Ikenga Hotel, Nsukka',
  landmarkLatitude:6.8366763,
  landmarkLongitude:7.3675346,
  landmarkPlusCode:'R9Q8+7Q9',
  exactVenuePinVerified:false
})
const coordinates=conferenceVenue.landmarkLatitude+','+conferenceVenue.landmarkLongitude
export const venueSearchUrl='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(coordinates)
export const venueDirectionsUrl='https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(coordinates)
export const venueEmbedUrl='https://maps.google.com/maps?q='+encodeURIComponent(coordinates)+'&z=16&output=embed'
