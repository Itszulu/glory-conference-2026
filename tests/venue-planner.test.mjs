import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const app=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8')
const venue=readFileSync(new URL('../src/VenueDirections.jsx',import.meta.url),'utf8')
const css=readFileSync(new URL('../src/venue.css',import.meta.url),'utf8')
const layout=readFileSync(new URL('../src/layout-fix.css',import.meta.url),'utf8')
const main=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8')

test('homepage never renders the journey planner',()=>{
  const home=app.slice(app.indexOf('function Home()'),app.indexOf('function MinisterCards()'))
  assert.ok(home.startsWith('function Home(){'))
  assert.ok(home.includes('<Header/>'))
  assert.ok(home.includes('<Footer/>'))
  assert.doesNotMatch(home,/<VenueDirections\b/)
  assert.match(app,/function Directions\(\)\{return <Shell/)
  assert.match(app,/'\/directions':Directions/)
  assert.match(venue,/href="\/directions"/)
})
test('existing homepage styling keeps the original hero first',()=>{
  assert.match(layout,/body>div>main:has\(> \.hero\) > \.hero\{order:1!important\}/)
  assert.doesNotMatch(layout,/body>div>main:has\(> \.hero\) > \.gc-venue/)
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
