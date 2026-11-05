// Official published conference venue. No exact church entrance coordinates are
// asserted until confirmed with a Google Maps listing/pin.
export const conferenceVenue=Object.freeze({
  title:'Glory Conference 2026 — The Outpouring',
  ministryName:'Divine Intervention Soul Rescue Ministry',
  addressLine1:'No. 4 Uwani Ugwu Street',
  addressLine2:'Off Ikenga Junction',
  city:'Nsukka, Enugu State, Nigeria',
  fullAddress:'No. 4 Uwani Ugwu Street, Off Ikenga Junction, Nsukka, Enugu State, Nigeria',
  // Approximate regional map center only; never a route destination.
  searchCenterLatitude:6.8366763,
  searchCenterLongitude:7.3675346,
  exactVenuePinVerified:false
})
export const venueSearchQuery='Divine Intervention Soul Rescue Ministry, Uwani Ugwu Road, Nsukka, Enugu State, Nigeria'
export const venueSearchUrl='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(venueSearchQuery)
export const venueDirectionsUrl='https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(venueSearchQuery)
export const venueEmbedUrl='https://maps.google.com/maps?q='+encodeURIComponent(venueSearchQuery)+'&z=16&output=embed'
