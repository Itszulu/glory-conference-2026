import {useMemo,useState} from 'react'
import {deleteDoc,doc,runTransaction,serverTimestamp} from 'firebase/firestore'
import {db} from './firebase'
import './desk-workspaces.css'
const days=['Nov 12','Nov 13','Nov 14']
const stamp=value=>value?.toDate?.().toLocaleTimeString('en-NG',{hour:'numeric',minute:'2-digit'})||'Recorded'
export default function AttendanceDesk({registrations=[],checkIns=[],user,isAdmin=false,onExport}){
 const [day,setDay]=useState('Nov 12')
 const [term,setTerm]=useState('')
 const [busy,setBusy]=useState('')
 const [message,setMessage]=useState('')
 const daily=useMemo(()=>checkIns.filter(record=>record.day===day),[checkIns,day])
 const active=daily.filter(r=>!r.checkedOutAt).length
 const completed=daily.filter(r=>!!r.checkedOutAt).length
 const matched=useMemo(()=>{
  const search=term.trim().toLowerCase()
  if(search.length<2)return []
  return registrations.filter(r=>[r.fullName,r.phone,r.registrationId,r.title].some(v=>String(v||'').toLowerCase().includes(search))).slice(0,30)
 },[registrations,term])
 const reverse=async r=>{
  if(!isAdmin||busy)return
  const id=r.id+'_'+day
  if(!window.confirm('ADMIN ONLY: Permanently remove this day\'s arrival and departure record for '+r.fullName+'?'))return
  setBusy(id);setMessage('')
  try{await deleteDoc(doc(db,'checkIns',id));setMessage('Attendance history reversed for '+r.fullName+' · '+day)}
  catch(err){setMessage(err?.message||'Could not reverse attendance.')}
  finally{setBusy('')}
 }
 const recordFor=r=>daily.find(check=>check.registrationId===r.id)
 const arrive=async r=>{
  if(busy)return
  const id=r.id+'_'+day
  setBusy(id);setMessage('')
  try{
   await runTransaction(db,async tx=>{
    const ref=doc(db,'checkIns',id)
    if((await tx.get(ref)).exists())throw new Error('This attendee has already been checked in for '+day+'.')
    tx.set(ref,{registrationId:r.id,fullName:r.fullName,day,checkedInAt:serverTimestamp(),checkedInBy:user.uid})
   })
   setMessage('Checked in: '+r.fullName+' · '+day)
  }catch(err){setMessage(err?.message||'Check-in failed. Try again.')}
  finally{setBusy('')}
 }
 const depart=async r=>{
  if(busy)return
  const id=r.id+'_'+day
  if(!window.confirm('Confirm check-out for '+r.fullName+' on '+day+'?'))return
  setBusy(id);setMessage('')
  try{
   await runTransaction(db,async tx=>{
    const ref=doc(db,'checkIns',id)
    const current=await tx.get(ref)
    if(!current.exists())throw new Error('Attendee must be checked in before check-out.')
    if(current.data().checkedOutAt)throw new Error('Already checked out for '+day+'.')
    tx.update(ref,{checkedOutAt:serverTimestamp(),checkedOutBy:user.uid})
   })
   setMessage('Checked out: '+r.fullName+' · '+day)
  }catch(err){setMessage(err?.message||'Check-out failed. Try again.')}
  finally{setBusy('')}
 }
 return <section className="gc-desk-workspace" aria-labelledby="gc-attendance-title">
  <header className="gc-desk-header"><div><p>EVENT ATTENDANCE</p><h3 id="gc-attendance-title">Check-in & check-out</h3><span>Find a registered guest, confirm their details, and record one arrival and departure per conference day.</span></div><div className="gc-desk-head-count"><strong>{daily.length}</strong><small>TODAY'S ARRIVALS</small></div></header>
  <div className="gc-attendance-stats"><article><span>CHECKED IN</span><strong>{active}</strong><small>Still on site</small></article><article><span>CHECKED OUT</span><strong>{completed}</strong><small>Departure recorded</small></article><article><span>TOTAL ARRIVALS</span><strong>{daily.length}</strong><small>{day}</small></article></div>
  {isAdmin&&<div className="gc-attendance-admin-actions"><button type="button" onClick={onExport}>EXPORT FULL CHECK-IN RECORDS CSV ↓</button><small>Administrative export only. Includes attendance staff and event timestamps.</small></div>}
  <div className="gc-desk-card">
   <div className="gc-desk-card-title"><span>01</span><div><h4>Find an existing registration</h4><p>Select the conference day and search for the attendee. This desk cannot create or edit registrations.</p></div></div>
   <div className="gc-attendance-search"><label className="gc-desk-label">CONFERENCE DAY<select value={day} onChange={e=>{setDay(e.target.value);setMessage('')}}>{days.map(x=><option key={x} value={x}>{x}</option>)}</select></label><label className="gc-desk-label">SEARCH BY NAME, PHONE OR REFERENCE<input type="search" value={term} onChange={e=>setTerm(e.target.value)} placeholder="Name, phone, GC26 reference"/></label></div>
   {message&&<p className="gc-desk-message" role="status">{message}</p>}
   <div className="gc-attendance-results" aria-live="polite">{term.trim().length<2?<div className="gc-attendance-empty"><strong>Ready for arrivals</strong><span>Type at least two characters to find an attendee.</span></div>:matched.length?matched.map(r=>{
    const record=recordFor(r),departed=!!record?.checkedOutAt,arrived=!!record
    const label=departed?'CHECKED OUT':arrived?'CHECKED IN':'NOT ARRIVED'
    return <article className="gc-attendance-person" key={r.id}>
     <div className="gc-attendance-avatar" aria-hidden="true">{String(r.fullName||'?').charAt(0).toUpperCase()}</div>
     <div className="gc-attendance-person-details"><strong>{[r.title,r.fullName].filter(Boolean).join(' ')}</strong><span>{r.phone} · {r.church||'Ministry not provided'}</span><small>{r.registrationId||r.id}</small>{record&&<p>{'Arrival: '+stamp(record.checkedInAt)}{departed?' · Departure: '+stamp(record.checkedOutAt):''}</p>}</div>
     <div className="gc-attendance-actions"><span className={'gc-attendance-state '+(departed?'done':arrived?'here':'pending')}>{label}</span>{!arrived?<button type="button" disabled={!!busy} onClick={()=>arrive(r)}>CHECK IN →</button>:!departed?<button type="button" className="gc-attendance-checkout" disabled={!!busy} onClick={()=>depart(r)}>CHECK OUT →</button>:<span className="gc-attendance-complete">Attendance complete</span>}{isAdmin&&arrived&&<button className="gc-attendance-undo" type="button" disabled={!!busy} onClick={()=>reverse(r)}>REVERSE RECORD</button>}</div>
    </article>
   }):<div className="gc-attendance-empty"><strong>No matching registration</strong><span>Verify the spelling or phone number, then ask the registration desk to register the visitor.</span></div>}</div>
  </div>
  <p className="gc-attendance-notice">Each check-in and check-out is recorded with the authenticated staff account and a server timestamp. Repeated submissions are blocked by Firestore transactions.</p>
 </section>
}
