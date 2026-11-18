import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizePhone, normalizeName, sameAttendee, attendeeRegistrationId } from '../src/registrationIdentity.js'

test('Nigerian phone formats normalize to one identity',()=>{
  assert.equal(normalizePhone('0803 123 4567'),'2348031234567')
  assert.equal(normalizePhone('+234 803 123 4567'),'2348031234567')
  assert.equal(normalizePhone('8031234567'),'2348031234567')
})
test('names ignore casing, Unicode compatibility and whitespace differences',()=>{
  assert.equal(normalizeName('  ADA   OKAFOR  '),'ada okafor')
  assert.equal(normalizeName('ada okafor'),'ada okafor')
})
test('same attendee only matches same normalized full name and phone',()=>{
  assert.equal(sameAttendee({fullName:'Ada Okafor',phone:'08031234567'},{fullName:' ada  okafor ',phone:'+2348031234567'}),true)
  assert.equal(sameAttendee({fullName:'Ada Okafor',phone:'08031234567'},{fullName:'Amaka Okafor',phone:'08031234567'}),false)
})
test('registration ID is stable across devices/formats and distinct for a different person',async()=>{
  const a=await attendeeRegistrationId(' Ada  Okafor ','08031234567')
  const b=await attendeeRegistrationId('ADA OKAFOR','+234 803 123 4567')
  const c=await attendeeRegistrationId('Amaka Okafor','08031234567')
  assert.match(a,/^GC26-R-[0-9A-F]{32}$/)
  assert.equal(a,b)
  assert.notEqual(a,c)
})
