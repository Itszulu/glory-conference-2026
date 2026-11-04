import { useEffect, useMemo, useState } from 'react'
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import './glory-connect.css'

const statuses=['Unassigned','Awaiting contact','Contacted','Completed','Do not contact']
const typeFor = person => person.attendanceFrequency || (person.firstTime==='Yes'?'First time':person.firstTime==='No'?'Returning (count unknown)':'Unknown')
const labelFor = person => typeFor(person)==='First time'?'First-timer':typeFor(person)
const normalPhone = phone => {
  const digits=String(phone||'').replace(/\D/g,'')
  if(digits.startsWith('234') && digits.length===13)return digits
  if(digits.startsWith('0') && digits.length===11)return '234'+digits.slice(1)
  return ''
}
const sortByName=(a,b)=>String(a.fullName||'').localeCompare(String(b.fullName||''))

export default function GloryConnectFollowUp({registrations,checkIns,user}) {
  const [followUps,setFollowUps]=useState({})
  const [search,setSearch]=useState('')
  const [segment,setSegment]=useState('All')
  const [selectedId,setSelectedId]=useState('')
  const [draft,setDraft]=useState(null)
  const [saving,setSaving]=useState(false)
  const [message,setMessage]=useState('')
  const [loadError,setLoadError]=useState('')
  useEffect(()=>{
    const unsubscribe=onSnapshot(collection(db,'followUps'),snap=>{
      setFollowUps(Object.fromEntries(snap.docs.map(x=>[x.id,x.data()])))
      setLoadError('')
    },()=>setLoadError('Could not load follow-up records. Check your admin permissions and deployed Firestore rules.'))
    return ()=>unsubscribe()
  },[])
  const person=registrations.find(x=>x.id===selectedId)
  const filtered=useMemo(()=>{
    const term=search.trim().toLowerCase()
    return registrations.filter(r=>{
      const record=followUps[r.id]||{}
      const qualifies=segment==='All' ||
        (segment==='First-timers'&&typeFor(r)==='First time') ||
        (segment==='Returning'&&typeFor(r)!=='First time'&&typeFor(r)!=='Unknown') ||
        (segment==='Needs follow-up'&&r.followUpConsent===true&&!['Completed','Do not contact'].includes(record.status||'Unassigned')) ||
        (segment==='Checked in'&&checkIns.some(c=>c.registrationId===r.id)) ||
        (segment==='Opted in'&&r.followUpConsent===true)
      return qualifies && (!term||[r.fullName,r.phone,r.registrationId,r.church,r.cityState,record.owner,record.status].some(v=>String(v||'').toLowerCase().includes(term)))
    }).sort(sortByName)
  },[registrations,followUps,checkIns,search,segment])
  const firstTimers=registrations.filter(r=>typeFor(r)==='First time').length
  const optedIn=registrations.filter(r=>r.followUpConsent===true).length
  const pending=registrations.filter(r=>r.followUpConsent===true&&!['Completed','Do not contact'].includes(followUps[r.id]?.status||'Unassigned')).length
  const done=registrations.filter(r=>followUps[r.id]?.status==='Completed').length
  const open=r=>{
    setSelectedId(r.id)
    const current=followUps[r.id]||{}
    setDraft({
      status:current.status||'Unassigned',
      owner:current.owner||'',
      notes:current.notes||'',
      nextAction:current.nextAction||'',
      lastContactOutcome:current.lastContactOutcome||''
    })
    setMessage('')
  }
  const save=async e=>{
    e.preventDefault()
    if(!person||!draft||saving)return
    const status=draft.status
    if(!statuses.includes(status))return
    if(person.followUpConsent!==true && ['Awaiting contact','Contacted'].includes(status)){
      setMessage('This attendee has not opted in to follow-up messages. Record only operational attendance notes unless they give permission.')
      return
    }
    setSaving(true);setMessage('')
    try{
      await setDoc(doc(db,'followUps',person.id),{
        registrationId:person.id,
        status,
        owner:draft.owner.trim().slice(0,120),
        notes:draft.notes.trim().slice(0,2000),
        nextAction:draft.nextAction.trim().slice(0,240),
        lastContactOutcome:draft.lastContactOutcome.trim().slice(0,240),
        updatedBy:user?.uid||'',
        updatedAt:serverTimestamp()
      })
      setMessage('Follow-up record saved.')
    }catch(e){setMessage('Unable to save follow-up: '+(e.message||'Unknown error'))}
    finally{setSaving(false)}
  }
  return <section className="gc-connect-admin">
    <header className="gc-connect-admin-head"><div><p className="gc-connect-kicker">GLORY CONNECT</p><h3>People & Follow-Up</h3><p>Welcome every guest, recognize returning attendees and record each follow-up responsibility.</p></div></header>
    {loadError&&<p className="gc-connect-alert" role="alert">{loadError}</p>}
    <div className="gc-connect-metrics">
      <article><span>First-time guests</span><strong>{firstTimers}</strong></article>
      <article><span>Updates opted in</span><strong>{optedIn}</strong></article>
      <article><span>Awaiting follow-up</span><strong>{pending}</strong></article>
      <article><span>Completed</span><strong>{done}</strong></article>
    </div>
    <div className="gc-connect-toolbar">
      <label>SEARCH PEOPLE<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name, phone, registration ID, owner…"/></label>
      <label>VIEW<select value={segment} onChange={e=>setSegment(e.target.value)}>{['All','First-timers','Returning','Needs follow-up','Checked in','Opted in'].map(s=><option key={s}>{s}</option>)}</select></label>
    </div>
    <p className="gc-connect-summary">{filtered.length} of {registrations.length} attendees · Returning classifications from older registrations may be less precise.</p>
    <div className="gc-connect-people">
      {filtered.map(r=>{
        const record=followUps[r.id]||{}
        const attended=checkIns.filter(c=>c.registrationId===r.id).length
        return <article key={r.id} className="gc-connect-person">
          <div className="gc-connect-avatar">{(r.fullName||'?').trim().slice(0,1).toUpperCase()}</div>
          <div><h4>{r.fullName}</h4><p>{labelFor(r)} · {r.cityState||'Location unknown'} · {attended} day(s) checked in</p><small>{r.followUpConsent===true?'Opted in to updates':'No recorded update opt-in'} · {record.status||'Unassigned'}</small></div>
          <button type="button" onClick={()=>open(r)}>MANAGE →</button>
        </article>
      })}
      {filtered.length===0&&<p>No attendees match this filter.</p>}
    </div>
    {person&&draft&&<div className="gc-connect-dialog-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSelectedId('')}}>
      <section className="gc-connect-dialog" role="dialog" aria-modal="true" aria-label="Follow-up profile">
        <div className="gc-connect-dialog-top"><div><small>FOLLOW-UP PROFILE · {person.registrationId||person.id}</small><h3>{person.fullName}</h3><p>{labelFor(person)} · {person.affiliation||'Affiliation not recorded'}</p></div><button type="button" onClick={()=>setSelectedId('')} aria-label="Close">×</button></div>
        <div className="gc-connect-profile-facts">
          <span>{person.phone}</span><span>{person.church||'No church stated'}</span>
          <span>{checkIns.filter(c=>c.registrationId===person.id).map(c=>c.day).join(', ')||'Not checked in'}</span>
          <span>{person.followUpConsent===true?'Communication consent: Yes':'Communication consent: Not recorded / No'}</span>
        </div>
        <form className="gc-connect-followup-form" onSubmit={save}>
          <label>FOLLOW-UP STATUS<select value={draft.status} onChange={e=>setDraft(d=>({...d,status:e.target.value}))}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label>
          <label>ASSIGNED TEAM MEMBER<input maxLength={120} value={draft.owner} onChange={e=>setDraft(d=>({...d,owner:e.target.value}))} placeholder="Person responsible"/></label>
          <label>LAST CONTACT RESULT<input maxLength={240} value={draft.lastContactOutcome} onChange={e=>setDraft(d=>({...d,lastContactOutcome:e.target.value}))} placeholder="Reached, no answer, requested help…"/></label>
          <label>NEXT ACTION<input maxLength={240} value={draft.nextAction} onChange={e=>setDraft(d=>({...d,nextAction:e.target.value}))} placeholder="Follow up after conference"/></label>
          <label className="full">PRIVATE TEAM NOTES<textarea rows={4} maxLength={2000} value={draft.notes} onChange={e=>setDraft(d=>({...d,notes:e.target.value}))} placeholder="Record concise, factual follow-up details only"/></label>
          {person.followUpConsent===true && normalPhone(person.phone)&&<a className="gc-connect-whatsapp" href={`https://wa.me/${normalPhone(person.phone)}`} target="_blank" rel="noreferrer">OPEN WHATSAPP CONTACT</a>}
          <p className="gc-connect-private-note">Only contact opted-in attendees for optional messages. This workspace records activity; it does not automatically send messages.</p>
          {message&&<p role="status" className="gc-connect-alert">{message}</p>}
          <button type="submit" disabled={saving}>{saving?'SAVING…':'SAVE FOLLOW-UP'}</button>
        </form>
      </section>
    </div>}
  </section>
}
