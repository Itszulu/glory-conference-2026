import {useEffect,useState} from 'react'
import {collection,deleteDoc,doc,onSnapshot,serverTimestamp,setDoc,updateDoc} from 'firebase/firestore'
import {db} from './firebase'
import './staff-management.css'

const roles=[
 {value:'registration',name:'Registration desk',description:'Register walk-ins, look up attendees and check in guests.'},
 {value:'checkin',name:'Check-in desk',description:'Look up existing attendees and record arrivals only.'},
 {value:'followup',name:'Glory Connect',description:'View attendee information and manage follow-up notes.'}
]
const empty={uid:'',name:'',email:'',role:'registration'}
export default function StaffManagement({user}){
 const [staff,setStaff]=useState([])
 const [draft,setDraft]=useState(empty)
 const [busy,setBusy]=useState('')
 const [notice,setNotice]=useState('')
 const [search,setSearch]=useState('')
 useEffect(()=>{
   const unsubscribe=onSnapshot(collection(db,'admins'),snapshot=>{
     setStaff(snapshot.docs.map(d=>({uid:d.id,...d.data()})).sort((a,b)=>String(a.name||a.email||a.uid).localeCompare(String(b.name||b.email||b.uid))))
   },err=>setNotice('Unable to load staff access records: '+(err?.message||'Check deployed Firestore rules.')))
   return unsubscribe
 },[])
 const add=async e=>{
   e.preventDefault()
   if(busy)return
   const uid=draft.uid.trim(),name=draft.name.trim(),email=draft.email.trim().toLowerCase()
   if(!/^[A-Za-z0-9]{10,128}$/.test(uid)){setNotice('Enter the exact Firebase Authentication UID copied from the Users page.');return}
   if(name.length<2||!/^\S+@\S+\.\S+$/.test(email)||!roles.some(r=>r.value===draft.role)){setNotice('Enter a staff name, valid email and operational role.');return}
   if(staff.some(s=>s.uid===uid)){setNotice('This UID already has a staff assignment. Change their role below instead.');return}
   if(staff.some(s=>String(s.email||'').toLowerCase()===email)){setNotice('That email already has an assignment. Review the staff list first.');return}
   setBusy(uid);setNotice('')
   try{
     await setDoc(doc(db,'admins',uid),{uid,name,email,role:draft.role,createdBy:user.uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp()})
     setDraft(empty);setNotice('Staff role assigned. The person can now sign in using their existing Firebase Authentication account.')
   }catch(err){setNotice('Could not assign staff role: '+(err?.message||'Check Firestore permissions.'))}
   finally{setBusy('')}
 }
 const changeRole=async(member,role)=>{
   if(busy||member.role==='admin'||!roles.some(r=>r.value===role)||member.role===role)return
   if(!window.confirm('Change '+(member.name||member.email||member.uid)+' to '+roles.find(r=>r.value===role).name+'?'))return
   setBusy(member.uid);setNotice('')
   try{await updateDoc(doc(db,'admins',member.uid),{role,updatedAt:serverTimestamp()});setNotice('Role updated successfully. Access changes take effect on their next dashboard login.')}
   catch(err){setNotice('Unable to change role: '+(err?.message||'Check permissions.'))}finally{setBusy('')}
 }
 const revoke=async member=>{
   if(busy||member.role==='admin')return
   if(!window.confirm('Revoke dashboard access for '+(member.name||member.email||member.uid)+'? This does not delete their Firebase Authentication login.'))return
   setBusy(member.uid);setNotice('')
   try{await deleteDoc(doc(db,'admins',member.uid));setNotice('Staff dashboard access revoked.')}
   catch(err){setNotice('Unable to revoke staff access: '+(err?.message||'Check permissions.'))}finally{setBusy('')}
 }
 const matches=staff.filter(m=>[m.uid,m.name,m.email,m.role].some(v=>String(v||'').toLowerCase().includes(search.trim().toLowerCase())))
 return <section className="gc-staff-manager" aria-labelledby="gc-staff-title">
   <header className="gc-staff-heading"><div><p className="gc-staff-eyebrow">SECURE ACCESS MANAGEMENT</p><h3 id="gc-staff-title">Your conference team</h3><p>Give each person only the access they need. Manage roles here; passwords stay in Firebase Authentication.</p></div><span className="gc-staff-count">{staff.length} STAFF ACCOUNTS</span></header>
   <div className="gc-staff-grid">
     <section className="gc-staff-panel">
       <div className="gc-staff-panel-heading"><span>01</span><div><h4>Assign a staff member</h4><p>Create their login in Firebase Authentication first, then link their UID here.</p></div></div>
       <ol className="gc-staff-steps"><li>In <a href="https://console.firebase.google.com/project/gloryconf/authentication/users" target="_blank" rel="noreferrer">Firebase Authentication → Users</a>, add an Email/Password user.</li><li>Copy their <strong>User UID</strong>. Share the temporary password privately and ask them to reset it.</li><li>Enter their UID, name, email and operational role below.</li></ol>
       <form onSubmit={add} className="gc-staff-form">
         <label>FIREBASE AUTH USER UID *<input required spellCheck="false" autoComplete="off" placeholder="Paste exact UID from Firebase" value={draft.uid} onChange={e=>setDraft(v=>({...v,uid:e.target.value}))}/></label>
         <label>STAFF MEMBER'S NAME *<input required maxLength={100} placeholder="Full name" value={draft.name} onChange={e=>setDraft(v=>({...v,name:e.target.value}))}/></label>
         <label>LOGIN EMAIL *<input required type="email" maxLength={254} placeholder="staff@example.com" value={draft.email} onChange={e=>setDraft(v=>({...v,email:e.target.value}))}/></label>
         <label>STAFF ROLE *<select value={draft.role} onChange={e=>setDraft(v=>({...v,role:e.target.value}))}>{roles.map(r=><option value={r.value} key={r.value}>{r.name}</option>)}</select></label>
         <p className="gc-staff-role-desc">{roles.find(r=>r.value===draft.role)?.description}</p>
         <button type="submit" disabled={!!busy}>{busy?'ASSIGNING ROLE…':'ASSIGN STAFF ACCESS →'}</button>
       </form>
       <p className="gc-staff-security">For security, operational staff cannot grant themselves access. This screen cannot create new full administrators.</p>
     </section>
     <section className="gc-staff-panel gc-staff-list-panel">
       <div className="gc-staff-panel-heading"><span>02</span><div><h4>People & permissions</h4><p>Review, update or revoke team access.</p></div></div>
       <label className="gc-staff-search">SEARCH TEAM<input type="search" placeholder="Search name, email or role" value={search} onChange={e=>setSearch(e.target.value)}/></label>
       <div className="gc-staff-people">{matches.length?matches.map(member=><article className="gc-staff-person" key={member.uid}>
         <div className="gc-staff-avatar">{String(member.name||member.email||'?').slice(0,1).toUpperCase()}</div>
         <div className="gc-staff-person-body"><strong>{member.name||'Account owner'}</strong><span>{member.email||'Email not recorded'}</span><small>{member.uid}</small><span className={'gc-staff-role gc-staff-role-'+member.role}>{member.role==='admin'?'MAIN ADMINISTRATOR':roles.find(r=>r.value===member.role)?.name||member.role}</span></div>
         {member.role!=='admin'&&<div className="gc-staff-actions"><label>CHANGE ROLE<select aria-label={'Change role for '+(member.name||member.uid)} value={member.role} disabled={!!busy} onChange={e=>changeRole(member,e.target.value)}>{roles.map(r=><option key={r.value} value={r.value}>{r.name}</option>)}</select></label><button type="button" disabled={!!busy} onClick={()=>revoke(member)}>Revoke access</button></div>}
       </article>):<p className="gc-staff-empty">No staff members match your search.</p>}</div>
     </section>
   </div>
   {notice&&<p role="status" className="gc-staff-notice">{notice}</p>}
   <aside className="gc-staff-launch"><strong>Staff sign-in</strong><p>Every team member signs in at the same protected dashboard. Their assigned role decides which tools appear. Registration staff work at the welcome desk; check-in staff see arrival tools only; follow-up staff see Glory Connect.</p><a href="/admin" target="_blank" rel="noreferrer">OPEN STAFF LOGIN ↗</a></aside>
 </section>
}
