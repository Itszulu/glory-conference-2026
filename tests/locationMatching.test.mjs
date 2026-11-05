import test from 'node:test'
import assert from 'node:assert/strict'
import { candidateLocations } from '../src/locationMatching.js'

const feature=(name,lon,lat,locality='',label)=>({
  type:'Feature',geometry:{type:'Point',coordinates:[lon,lat]},
  properties:{name,label:label||name+', '+locality+', Nigeria',locality}
})
test('See New Hotel Nsukka never resolves to a hotel in Enugu',()=>{
  const wrong=feature('African Princess Hotel New Haven',7.52,6.45,'Enugu')
  assert.deepEqual(candidateLocations([wrong],'see new hotel nsukka'),[])
})
test('correctly named hotel around Nsukka is offered for confirmation',()=>{
  const place=feature('See New Hotel',7.38,6.84,'Nsukka')
  assert.equal(candidateLocations([place],'see new hotel nsukka')[0].feature,place)
})
test('starting places throughout Nigeria are supported',()=>{
  for(const [query,record] of [
    ['Lagos, Nigeria',feature('Lagos',3.3792,6.5244,'Lagos')],
    ['Abuja, Nigeria',feature('Abuja',7.3986,9.0765,'Abuja')],
    ['Port Harcourt, Nigeria',feature('Port Harcourt',7.0498,4.8156,'Port Harcourt')],
    ['Enugu, Nigeria',feature('Enugu',7.50,6.46,'Enugu')]
  ]){
    assert.equal(candidateLocations([record],query)[0]?.feature,record,query)
  }
})
test('hotel search with a named city cannot silently change city',()=>{
  const wrong=feature('Royal Hotel',7.0498,4.8156,'Port Harcourt')
  const right=feature('Royal Hotel',7.50,6.46,'Enugu')
  assert.deepEqual(candidateLocations([wrong],'royal hotel enugu'),[])
  assert.equal(candidateLocations([wrong,right],'royal hotel enugu')[0]?.feature,right)
})
test('unrelated or malformed results cannot be routed',()=>{
  assert.deepEqual(candidateLocations([feature('Different Resort',7.4,6.86,'Nsukka')],'see new hotel nsukka'),[])
  assert.deepEqual(candidateLocations([{geometry:{coordinates:['bad','data']},properties:{name:'See New Hotel'}}],'see new hotel nsukka'),[])
})
