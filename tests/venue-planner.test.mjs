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
test('directions use a Google landmark iframe, not unreliable routing estimates',()=>{
  assert.match(venue,/venueEmbedUrl/)
  assert.match(venue,/<iframe/)
  assert.match(venue,/Ikenga Hotel/)
  assert.match(venue,/not the conference entrance|not represent a verified conference entrance/)
  assert.doesNotMatch(venue,/api\.heigit\.org|pelias\/v1|VITE_ORS_API_KEY|estimated travel time|new Date\(/)
  assert.match(css,/gc-venue-embedded-map/)
})
test('hero and existing hamburger both have discoverable directions links',()=>{
  assert.match(app,/gc-hero-directions" href="\/directions"/)
  assert.match(app,/href="\/directions" onClick=\{\(\)=>setOpen\(false\)\}/)
})
test('runtime sharing URLs still refer to live website',()=>{
  assert.doesNotMatch(main,/gloryconf\.org/)
  assert.match(main,/gloryconf\.web\.app/)
})
