import {useEffect,useState} from 'react'
import {collection,deleteDoc,doc,onSnapshot,serverTimestamp,setDoc,updateDoc} from 'firebase/firestore'
import {db} from './firebase'
import './staff-management.css'

const roles=[
 {value:'registration',name:'Registration desk',description:'Create attendee registrations. Cannot check anyone in or out.'},
 {value:'checkin',name:'Attendance desk',description:'Find existing attendees and record check-in and check-out.'},
 {value:'followup',name:'Glory Connect',description:'Manage permitted attendee follow-up information.'}
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
   if(!/^[A-Za-z0-9]{10,128}$/.test(uid)){setNotice('Enter the exact User UID copied from Firebase Authentication → Users.');return}
   if(name.length<2||!/^\S+@\S+\.\S+$/.test(email)||!roles.some(r=>r.value===draft.role)){setNotice('Enter a staff name, valid login email and operational role.');return}
   if(staff.some(s=>s.uid===uid)){setNotice('This UID already has a role. Change it in the staff list instead.');return}
   if(staff.some(s=>String(s.email||'').toLowerCase()===email)){setNotice('That email already has a staff role. Review the staff list.');return}
   setBusy(uid);setNotice('')
   try{
     await setDoc(doc(db,'admins',uid),{uid,name,email,role:draft.role,createdBy:user.uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp()})
     setDraft(empty)
     setNotice('Staff role assigned. The staff member can now log in using the Firebase Authentication account you created.')
   }catch(err){setNotice('Could not assign role: '+(err?.message||'Verify the UID and Firestore permissions.'))}
   finally{setBusy('')}
 }
 const changeRole=async(member,role)=>{
   if(busy||member.role==='admin'||!roles.some(r=>r.value===role)||member.role===role)return
   if(!window.confirm('Change '+(member.name||member.email||member.uid)+' to '+roles.find(r=>r.value===role).name+'?'))return
   setBusy(member.uid);setNotice('')
   try{await updateDoc(doc(db,'admins',member.uid),{role,updatedAt:serverTimestamp()});setNotice('Staff role changed. Ask the staff member to sign out and back in to refresh their dashboard.')}
   catch(err){setNotice('Unable to change role: '+(err?.message||'Check permissions.'))}
   finally{setBusy('')}
 }
 const revoke=async member=>{
   if(busy||member.role==='admin')return
   if(!window.confirm('Revoke dashboard permissions for '+(member.name||member.email||member.uid)+'? Their Firebase Authentication login will still exist.'))return
   setBusy(member.uid);setNotice('')
   try{
     await deleteDoc(doc(db,'admins',member.uid))
     setNotice('Dashboard access revoked. To disable their ability to sign in entirely, disable this user separately in Firebase Authentication → Users.')
   }catch(err){setNotice('Unable to revoke access: '+(err?.message||'Check permissions.'))}
   finally{setBusy('')}
 }
 const matches=staff.filter(m=>[m.uid,m.name,m.email,m.role].some(v=>String(v||'').toLowerCase().includes(search.trim().toLowerCase())))
 return <section className="gc-staff-manager" aria-labelledby="gc-staff-title">
   <header className="gc-staff-heading"><div><p className="gc-staff-eyebrow">SPARK PLAN · ROLE-BASED ACCESS</p><h3 id="gc-staff-title">Your conference team</h3><p>Create individual staff logins in Firebase Authentication and assign the correct workspace here. No Blaze upgrade required.</p></div><span className="gc-staff-count">{staff.length} STAFF ACCOUNTS</span></header>
   <div className="gc-staff-grid">
     <section className="gc-staff-panel">
       <div className="gc-staff-panel-heading"><span>01</span><div><h4>Assign a staff member</h4><p>First create their email/password login in Firebase Authentication. Then connect that login to exactly one role.</p></div></div>
       <ol className="gc-staff-steps">
         <li>Open <a href="https://console.firebase.google.com/project/gloryconf/authentication/users" target="_blank" rel="noreferrer">Firebase Authentication → Users</a> and select <strong>Add user</strong>.</li>
         <li>Enter the staff email and a secure temporary password. Copy the new <strong>User UID</strong> from the Users list.</li>
         <li>Enter their UID, name, email, and role below. Share login credentials privately, and ask them to reset their password.</li>
       </ol>
       <form onSubmit={add} className="gc-staff-form">
         <label>FIREBASE AUTH USER UID *<input required spellCheck="false" autoComplete="off" placeholder="Paste exact UID from Firebase" value={draft.uid} onChange={e=>setDraft(v=>({...v,uid:e.target.value}))}/></label>
         <label>STAFF MEMBER'S NAME *<input required maxLength={100} placeholder="Full name" value={draft.name} onChange={e=>setDraft(v=>({...v,name:e.target.value}))}/></label>
         <label>LOGIN EMAIL *<input required type="email" maxLength={254} placeholder="staff@example.com" value={draft.email} onChange={e=>setDraft(v=>({...v,email:e.target.value}))}/></label>
         <label>ASSIGNED WORKSPACE *<select value={draft.role} onChange={e=>setDraft(v=>({...v,role:e.target.value}))}>{roles.map(r=><option value={r.value} key={r.value}>{r.name}</option>)}</select></label>
         <p className="gc-staff-role-desc">{roles.find(r=>r.value===draft.role)?.description}</p>
         <button type="submit" disabled={!!busy}>{busy?'ASSIGNING ROLE…':'ASSIGN STAFF ACCESS →'}</button>
       </form>
       <p className="gc-staff-security">Only the main admin can assign operational roles. This screen never handles passwords or creates administrator accounts. Role removal blocks protected data access, but the Firebase Auth account must be disabled separately if needed.</p>
     </section>
     <section className="gc-staff-panel gc-staff-list-panel">
       <div className="gc-staff-panel-heading"><span>02</span><div><h4>People & permissions</h4><p>Review, change roles, or revoke access.</p></div></div>
       <label className="gc-staff-search">SEARCH TEAM<input type="search" placeholder="Search name, email or role" value={search} onChange={e=>setSearch(e.target.value)}/></label>
       <div className="gc-staff-people">{matches.length?matches.map(member=><article className="gc-staff-person" key={member.uid}>
         <div className="gc-staff-avatar">{String(member.name||member.email||'?').slice(0,1).toUpperCase()}</div>
         <div className="gc-staff-person-body"><strong>{member.name||'Account owner'}</strong><span>{member.email||'Email not recorded'}</span><small>{member.uid}</small><span className={'gc-staff-role gc-staff-role-'+member.role}>{member.role==='admin'?'MAIN ADMINISTRATOR':roles.find(r=>r.value===member.role)?.name||member.role}</span></div>
         {member.role!=='admin'&&<div className="gc-staff-actions"><label>CHANGE ROLE<select aria-label={'Change role for '+(member.name||member.uid)} value={member.role} disabled={!!busy} onChange={e=>changeRole(member,e.target.value)}>{roles.map(r=><option key={r.value} value={r.value}>{r.name}</option>)}</select></label><button type="button" disabled={!!busy} onClick={()=>revoke(member)}>Revoke access</button></div>}
       </article>):<p className="gc-staff-empty">No staff members match your search.</p>}</div>
     </section>
   </div>
   {notice&&<p role="status" className="gc-staff-notice">{notice}</p>}
   <aside className="gc-staff-launch"><strong>Staff sign-in</strong><p>Every worker signs in at the same protected dashboard. Registration officers see only registration; attendance officers see check-in and check-out; follow-up officers see only Glory Connect.</p><a href="/admin" target="_blank" rel="noreferrer">OPEN STAFF LOGIN ↗</a></aside>
 </section>
}
