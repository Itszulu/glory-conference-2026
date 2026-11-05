import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8')
const parent=read('src/VenueDirections.jsx')
const guide=read('src/LiveVenueNavigation.jsx')
const venue=read('src/conferenceVenue.js')
test('live guide is embedded only on full directions view and shares existing Google map',()=>{
 assert.match(parent,/import LiveVenueNavigation/)
 assert.match(parent,/<LiveVenueNavigation mapReady=/)
 assert.match(parent,/getMap=\{\(\)=>mapRef.current\}/)
 assert.match(parent,/if\(compact\)return/)
})
test('location only starts after explicit click and can be stopped',()=>{
 assert.match(guide,/onClick=\{start\}/)
 assert.match(guide,/navigator.geolocation.watchPosition/)
 assert.match(guide,/navigator.geolocation.clearWatch/)
 assert.match(guide,/onClick=\{stop\}/)
 assert.match(guide,/window.isSecureContext/)
})
test('walking route is refreshed from live phone coordinates and retains exact venue pin',()=>{
 assert.match(guide,/origin:position,destination,travelMode:'WALKING'/)
 assert.match(guide,/distanceMeters/)
 assert.match(guide,/durationMillis/)
 assert.match(guide,/route.legs\?\.\[0\]\?\.steps/)
 assert.match(guide,/mapRef.current.panTo\(position\)/)
 assert.match(guide,/elapsed>=60000/)
 assert.match(venue,/latitude:6.836262173294491/)
 assert.match(venue,/longitude:7.370666488580394/)
})
test('no location is saved to attendee or conference database',()=>{
 assert.doesNotMatch(guide,/firebase|firestore|setDoc|addDoc|localStorage|sessionStorage/)
 assert.match(guide,/location is requested only after you press the button/)
 assert.match(guide,/phones may pause browser tracking in the background/i)
})

test('current GPS location is first and typing a starting location is optional',()=>{
 const gpsPosition=parent.indexOf('<LiveVenueNavigation mapReady=')
 const addressPosition=parent.indexOf('<div className="gc-route-panel">')
 assert.ok(gpsPosition>=0&&addressPosition>gpsPosition)
 assert.match(guide,/USE MY CURRENT LOCATION/)
 assert.match(parent,/OPTIONAL: SEARCH A STARTING LOCATION/)
 assert.match(parent,/02 \/ 02/)
})
