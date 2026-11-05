import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const app=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8')
const staff=readFileSync(new URL('../src/StaffManagement.jsx',import.meta.url),'utf8')
const navigation=readFileSync(new URL('../src/AdminNavigation.jsx',import.meta.url),'utf8')
const rules=readFileSync(new URL('../firestore.rules',import.meta.url),'utf8')
test('main admin opens to task-first overview; staff see restricted workflows',()=>{
 assert.match(app,/setTab\(role==='admin'\?'overview':role==='followup'\?'follow-up':'reception'\)/)
 assert.match(app,/tab==='overview'/)
 assert.match(app,/tab==='staff'&&<StaffManagement user=\{user\}/)
 assert.match(app,/<AdminNavigation role=\{staffRole\} active=\{tab\} onNavigate=\{setTab\}/)
 assert.match(navigation,/EVENT OPERATIONS/)
 assert.match(navigation,/MINISTRY & TEAM/)
 assert.match(navigation,/COMMERCE & CONTENT/)
 assert.match(navigation,/checkin:\['reception'\]/)
 assert.match(app,/className="gc-admin-overview-cards"/)
})
test('operational roles are assigned by UID, never by client-created privileged credentials',()=>{
 assert.match(staff,/Firebase Authentication/)
 assert.match(staff,/setDoc\(doc\(db,'admins',uid\)/)
 assert.match(staff,/updateDoc\(doc\(db,'admins',member.uid\)/)
 assert.match(staff,/deleteDoc\(doc\(db,'admins',member.uid\)/)
 assert.match(staff,/member.role!=='admin'/)
 assert.doesNotMatch(staff,/createUserWithEmailAndPassword|serviceAccount|privateKey/)
})
test('firestore guards against self escalation and updates to administrators',()=>{
 assert.match(rules,/function operationalRole/)
 assert.match(rules,/operationalRole\(request.resource.data.role\)/)
 assert.match(rules,/resource.data.role != 'admin'/)
 assert.match(rules,/request.resource.data.diff\(resource.data\).affectedKeys\(\).hasOnly\(\['role','updatedAt'\]\)/)
 assert.match(rules,/allow list: if isAdmin\(\)/)
})
test('check-in staff do not get the personal check-in CSV export',()=>{
 assert.match(app,/\{staffRole==='admin'&&<button className="gc-outline-button" type="button" onClick=\{\(\)=>exportCsv\('glory-conference-checkins.csv',checkIns\)\}/)
})

test('walk-in desk records explicit communication consent and keeps optional demographics optional',()=>{
 assert.match(app,/followUpConsent:walkIn.followUpConsent/)
 assert.match(app,/consentRecordedAt:serverTimestamp\(\)/)
 assert.match(app,/GENDER \(OPTIONAL\)/)
 assert.match(app,/AGE RANGE \(OPTIONAL\)/)
 assert.match(app,/gc-walkin-consent/)
})
