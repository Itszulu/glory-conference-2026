import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const app=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8')
const venue=readFileSync(new URL('../src/VenueDirections.jsx',import.meta.url),'utf8')
const css=readFileSync(new URL('../src/venue.css',import.meta.url),'utf8')
const main=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8')

test('original home hero and header precede all venue components',()=>{
  const home=app.slice(app.indexOf('function Home()'),app.indexOf('function MinisterCards()'))
  assert.ok(home.startsWith('function Home(){'))
  assert.ok(home.indexOf('<Header/>')>0)
  assert.ok(home.indexOf('<Header/>')<home.indexOf('<VenueDirections/>'))
  assert.ok(home.indexOf('VISIT GIVING PAGE')<home.indexOf('<VenueDirections/>'))
  assert.ok(home.indexOf('<VenueDirections/>')<home.indexOf('<Footer/>'))
})
test('travel planner is embedded and reports only computed route values',()=>{
  assert.match(venue,/Route\.computeRoutes\(request\)/)
  assert.match(venue,/route\.durationMillis/)
  assert.match(venue,/route\.distanceMeters/)
  assert.match(venue,/route\.createPolylines\(\)/)
  assert.match(venue,/VITE_GOOGLE_MAPS_API_KEY/)
  assert.match(venue,/GET|SHOW MY ROUTE/)
  assert.doesNotMatch(venue,/window\.open|maps\/dir\//)
  assert.match(css,/gc-journey-map-canvas/)
})
test('runtime social URLs match live domain',()=>{
  assert.doesNotMatch(main,/gloryconf\.org/)
  assert.match(main,/gloryconf\.web\.app/)
})
