import { useMemo, useState } from 'react'
import { normalizePhone, normalizeName } from './registrationIdentity'
import './glory-connect.css'

// Admin review only. Existing legacy registrations may have random IDs; never auto-delete.
export default function AttendeeDuplicateReview({registrations,checkIns}) {
  const [filter,setFilter]=useState('')
  const groups=useMemo(()=>{
    const keys=new Map()
    registrations.forEach(r=>{
      const phone=normalizePhone(r.phone),name=normalizeName(r.fullName)
      if(phone.length<10 || name.length<2)return
      const key=phone+'|'+name
      if(!keys.has(key))keys.set(key,[])
      keys.get(key).push(r)
    })
    return [...keys.values()].filter(group=>group.length>1)
      .sort((a,b)=>b.length-a.length)
  },[registrations])
  const visible=groups.filter(g=>g.some(r=>[r.fullName,r.phone,r.registrationId].some(v=>String(v||'').toLowerCase().includes(filter.toLowerCase()))))
  return <section className="gc-duplicate-review">
    <header><p className="gc-section-eyebrow">DATA QUALITY · ADMIN ONLY</p><h3>Duplicate review</h3>
      <p>Review possible repeats in historical and current records. Matching names and phone numbers are a signal, not proof: verify the person before changing or removing any record.</p></header>
    <div className="gc-duplicate-summary"><strong>{groups.length}</strong><div>Possible duplicate groups found<span>{groups.reduce((sum,g)=>sum+g.length-1,0)} extra registration records to review</span></div></div>
    <label>SEARCH A NAME OR PHONE<input type="search" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search possible duplicates"/></label>
    <div className="gc-duplicate-groups">{visible.length?visible.map((group,i)=><article key={group[0].id||i}>
      <h4>{group[0].fullName}</h4><p>{group.length} registration records use the same normalized name and phone.</p>
      {group.map(r=><div key={r.id} className="gc-duplicate-row"><div><strong>{r.registrationId||r.id}</strong><span>{r.phone} · {r.cityState||'Location unavailable'}</span></div><small>{checkIns.filter(c=>c.registrationId===r.id).length} check-ins · {r.createdAt?.toDate?.().toLocaleDateString('en-NG')||'Date not recorded'}</small></div>)}
    </article>):<p className="gc-duplicate-empty">{groups.length?'No matching duplicate groups.':'No exact normalized name-and-phone duplicates detected in current records.'}</p>}</div>
    <p className="gc-duplicate-warning">Do not delete a record with attendance history until its check-ins have been reconciled. This view cannot detect spelling changes, different phone numbers, or reused numbers with different names.</p>
  </section>
}
