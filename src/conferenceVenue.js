// Shared conference venue details: update this file after the organizing team
// verifies the exact Google Maps pin. No guessed coordinates or Place ID.
export const conferenceVenue = Object.freeze({
  title: 'Glory Conference 2026 — The Outpouring',
  addressLine1: 'No. 4 Uwani Ugwu Street',
  addressLine2: 'Off Ikenga Junction',
  city: 'Nsukka, Enugu State, Nigeria',
  fullAddress: 'No. 4 Uwani Ugwu Street, Off Ikenga Junction, Nsukka, Enugu State, Nigeria',
  // The map pin has not yet been verified independently.
  verifiedPlaceUrl: '',
})
const query = encodeURIComponent(conferenceVenue.fullAddress)
export const venueSearchUrl = conferenceVenue.verifiedPlaceUrl ||
  'https://www.google.com/maps/search/?api=1&query=' + query
export const venueDirectionsUrl = conferenceVenue.verifiedPlaceUrl ||
  'https://www.google.com/maps/dir/?api=1&destination=' + query
export const venueEmbedUrl =
  'https://www.google.com/maps?q=' + query + '&output=embed'
