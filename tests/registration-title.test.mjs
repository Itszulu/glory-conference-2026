import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const registration=readFileSync(new URL('../src/GloryConnectRegistration.jsx',import.meta.url),'utf8')
const admin=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8')
test('online registrations collect the ministry title choices used by the admin',()=>{
  assert.match(registration,/MINISTRY TITLE \(OPTIONAL\)/)
  assert.match(registration,/name="title" value=\{form.title\}/)
  assert.match(registration,/set\('title',e.target.value\)/)
  assert.match(registration,/\['Pastor','Reverend','Prophet','Bishop','Apostle','Minister','Evangelist'\]/)
  assert.match(admin,/MINISTRY TITLE \(OPTIONAL\)/)
})
test('title is retained in the attendee document rather than discarded',()=>{
  assert.match(registration,/title:form.title/)
  assert.doesNotMatch(registration,/title:''/)
  assert.match(registration,/title:''\s*,\s*fullName:''/)
})
