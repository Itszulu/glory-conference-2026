import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const app=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8')
const venue=readFileSync(new URL('../src/VenueDirections.jsx',import.meta.url),'utf8')
const css=readFileSync(new URL('../src/venue.css',import.meta.url),'utf8')
const main=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8')

test('original homepage hero and header precede all venue components',()=>{
  const home=app.slice(app.indexOf('function Home()'),app.indexOf('function MinisterCards()'))
  assert.ok(home.startsWith('function Home(){'))
  assert.ok(home.indexOf('<Header/>')>0)
  assert.ok(home.indexOf('<Header/>')<home.indexOf('<VenueDirections/>'))
  assert.ok(home.indexOf('VISIT GIVING PAGE')<home.indexOf('<VenueDirections/>'))
  assert.ok(home.indexOf('<VenueDirections/>')<home.indexOf('<Footer/>'))
})
test('planner stays in-page and uses free HeiGIT routing and OpenStreetMap',()=>{
  assert.match(venue,/api\.heigit\.org/)
  assert.match(venue,/\/pelias\/v1\/search/)
  assert.match(venue,/\/openrouteservice\/v2\/directions\//)
  assert.match(venue,/properties\?\.summary\?\.duration/)
  assert.match(venue,/properties\?\.summary\?\.distance/)
  assert.match(venue,/L\.polyline\(/)
  assert.match(venue,/VITE_ORS_API_KEY/)
  assert.doesNotMatch(venue,/VITE_GOOGLE_MAPS_API_KEY|maps\.googleapis\.com|google\.com\/maps|window\.open/)
  assert.match(css,/gc-journey-map-canvas/)
})
test('runtime sharing URLs still refer to live website',()=>{
  assert.doesNotMatch(main,/gloryconf\.org/)
  assert.match(main,/gloryconf\.web\.app/)
})
