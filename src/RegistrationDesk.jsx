import {useMemo,useState} from 'react'
import {doc,runTransaction,serverTimestamp} from 'firebase/firestore'
import {db} from './firebase'
import {attendeeRegistrationId,normalizeName,normalizePhone} from './registrationIdentity'
import './desk-workspaces.css'

const options=['Pastor','Reverend','Prophet','Bishop','Apostle','Minister','Evangelist']
const blank={title:'',fullName:'',phone:'',email:'',cityState:'',church:'',firstTime:'',gender:'',ageRange:'',followUpConsent:false}
const days=['Nov 12','Nov 13','Nov 14']
const digits=v=>String(v||'').replace(/\D/g,'').length
export default function RegistrationDesk({registrations=[],user}){
 const [form,setForm]=useState(blank)
 const [term,setTerm]=useState('')
 const [busy,setBusy]=useState(false)
 const [message,setMessage]=useState('')
 const [created,setCreated]=useState(null)
 const matches=useMemo(()=>{
  const q=term.trim().toLowerCase()
  if(q.length<2)return []
  return registrations.filter(r=>[r.fullName,r.phone,r.registrationId,r.title].some(v=>String(v||'').toLowerCase().includes(q))).slice(0,18)
 },[registrations,term])
 const set=(key,value)=>{setForm(f=>({...f,[key]:value}));setMessage('')}
 const submit=async e=>{
  e.preventDefault()
  if(busy)return
  const fullName=form.fullName.trim(),phone=form.phone.trim()
  if(fullName.length<2||digits(phone)<10||digits(phone)>15||!form.cityState.trim()||!form.firstTime){setMessage('Name, valid phone, location and attendance history are required.');return}
  if(form.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())){setMessage('Enter a valid email or leave it blank.');return}
  const same=registrations.find(r=>normalizeName(r.fullName)===normalizeName(fullName)&&normalizePhone(r.phone)===normalizePhone(phone))
  if(same){setMessage('Already registered: '+(same.registrationId||same.id)+'. Search for this attendee instead.');setTerm(phone);return}
  setBusy(true);setMessage('')
  try{
   const id=await attendeeRegistrationId(fullName,phone)
   await runTransaction(db,async tx=>{
    const ref=doc(db,'registrations',id)
    const existing=await tx.get(ref)
    if(existing.exists())throw new Error('This attendee already has a registration. Search their name or phone.')
    tx.set(ref,{
     registrationId:id,conferenceYear:2026,title:form.title,
     fullName,phone,email:form.email.trim(),gender:form.gender,ageRange:form.ageRange,
     cityState:form.cityState.trim(),church:form.church.trim(),attendanceType:'Individual',
     days,accommodation:'No',firstTime:form.firstTime,heardFrom:'Other',
     followUpConsent:form.followUpConsent,consentRecordedAt:serverTimestamp(),
     createdAt:serverTimestamp()
    })
   })
   setCreated({id,name:[form.title,fullName].filter(Boolean).join(' ')})
   setTerm('')
   setForm(blank)
   setMessage('Registration saved successfully. The attendee can proceed to the attendance desk on the day of arrival.')
  }catch(err){setMessage(err?.message||'Registration could not be saved. Verify permissions and internet connection.')}
  finally{setBusy(false)}
 }
 return <section className="gc-desk-workspace" aria-labelledby="gc-register-desk-title">
  <header className="gc-desk-header"><div><p>REGISTRATION OPERATIONS</p><h3 id="gc-register-desk-title">Register attendees</h3><span>Dedicated registration workspace · Search first to prevent duplicate records.</span></div><div className="gc-desk-head-count"><strong>{registrations.length}</strong><small>REGISTERED</small></div></header>
  <div className="gc-desk-columns">
   <section className="gc-desk-card"><div className="gc-desk-card-title"><span>01</span><div><h4>Check for an existing registration</h4><p>Search name, phone, ministry title, or registration ID before adding anyone.</p></div></div>
    <label className="gc-desk-label">SEARCH ATTENDEES<input type="search" value={term} onChange={e=>setTerm(e.target.value)} placeholder="Name, phone or GC26 reference"/></label>
    <div className="gc-desk-matches">{term.trim().length<2?<p className="gc-desk-muted">Enter at least two characters to search.</p>:matches.length?matches.map(r=><div className="gc-desk-match" key={r.id}><strong>{[r.title,r.fullName].filter(Boolean).join(' ')}</strong><span>{r.phone} · {r.registrationId||r.id}</span><small>ALREADY REGISTERED</small></div>):<p className="gc-desk-muted">No matching record found. Confirm the phone number before creating a new registration.</p>}</div>
   </section>
   <section className="gc-desk-card"><div className="gc-desk-card-title"><span>02</span><div><h4>Create a walk-in registration</h4><p>Complete required details and save. A separate attendance officer records arrivals.</p></div></div>
    <form onSubmit={submit} className="gc-desk-form">
     <label>MINISTRY TITLE (OPTIONAL)<select value={form.title} onChange={e=>set('title',e.target.value)}><option value="">No title / Not applicable</option>{options.map(x=><option key={x}>{x}</option>)}</select></label>
     <label>FULL NAME *<input required minLength={2} maxLength={120} value={form.fullName} onChange={e=>set('fullName',e.target.value)} placeholder="Attendee's full name"/></label>
     <label>PHONE / WHATSAPP *<input required type="tel" inputMode="tel" maxLength={30} value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="08012345678"/></label>
     <label>EMAIL (OPTIONAL)<input type="email" maxLength={254} value={form.email} onChange={e=>set('email',e.target.value)} placeholder="name@example.com"/></label>
     <label>CITY / STATE *<input required maxLength={40} value={form.cityState} onChange={e=>set('cityState',e.target.value)} placeholder="e.g. Nsukka, Enugu"/></label>
     <label>CHURCH / MINISTRY (OPTIONAL)<input maxLength={150} value={form.church} onChange={e=>set('church',e.target.value)} placeholder="Church name"/></label>
     <label>FIRST GLORY CONFERENCE? *<select required value={form.firstTime} onChange={e=>set('firstTime',e.target.value)}><option value="">Please select</option><option value="Yes">First time</option><option value="No">Returning attendee</option></select></label>
     <label>GENDER (OPTIONAL)<select value={form.gender} onChange={e=>set('gender',e.target.value)}><option value="">Not specified</option><option>Male</option><option>Female</option></select></label>
     <label>AGE RANGE (OPTIONAL)<select value={form.ageRange} onChange={e=>set('ageRange',e.target.value)}><option value="">Not specified</option>{['Under 18','18–24','25–34','35–44','45–54','55+'].map(x=><option key={x}>{x}</option>)}</select></label>
     <label className="gc-desk-optin"><input type="checkbox" checked={form.followUpConsent} onChange={e=>set('followUpConsent',e.target.checked)}/><span>The attendee explicitly agrees to optional follow-up messages by WhatsApp or SMS. Leave unchecked unless they consent.</span></label>
     <button className="gc-desk-submit" disabled={busy} type="submit">{busy?'REGISTERING ATTENDEE…':'SAVE REGISTRATION →'}</button>
    </form>
    {message&&<p className="gc-desk-message" role="status">{message}</p>}
    {created&&<div className="gc-desk-success" role="status"><strong>{created.name}</strong><span>Reference: {created.id}</span><small>Registered by {user?.email||'registration desk'}</small></div>}
   </section>
  </div>
 </section>
}
