import {useEffect,useState} from 'react'
import {collection,deleteDoc,doc,onSnapshot,serverTimestamp,setDoc,updateDoc} from 'firebase/firestore'
import {httpsCallable,getFunctions} from 'firebase/functions'
import {app,db} from './firebase'
import './staff-management.css'

const roles=[
 {value:'registration',name:'Registration desk',description:'Register new attendees and review potential duplicate registrations. Cannot check in or check out.'},
 {value:'checkin',name:'Attendance desk',description:'Find existing attendees, record check-in and check-out, and view current attendance.'},
 {value:'followup',name:'Glory Connect',description:'View attendee information and manage follow-up notes.'}
]
const empty={uid:'',name:'',email:'',role:'registration'}
const callable=()=>getFunctions(app,'us-central1')
export default function StaffManagement({user}){
 const [staff,setStaff]=useState([])
 const [draft,setDraft]=useState(empty)
 const [busy,setBusy]=useState('')
 const [notice,setNotice]=useState('')
 const [search,setSearch]=useState('')
 const [createMode,setCreateMode]=useState('new')
 const [setupLink,setSetupLink]=useState('')
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
   if(name.length<2||!/^\S+@\S+\.\S+$/.test(email)||!roles.some(r=>r.value===draft.role)){setNotice('Enter a staff name, valid email and operational role.');return}
   if(staff.some(s=>String(s.email||'').toLowerCase()===email)){setNotice('That email already has an assignment. Review the staff list first.');return}
   if(createMode==='existing'&&!/^[A-Za-z0-9]{10,128}$/.test(uid)){setNotice('Copy the exact UID of the existing Firebase Authentication user.');return}
   setBusy(createMode);setNotice('');setSetupLink('')
   try{
     if(createMode==='new'){
       const result=await httpsCallable(callable(),'createStaffAccount')({name,email,role:draft.role})
       const data=result.data
       setSetupLink(data.setupLink||'')
       setNotice(data.setupLink?'Login created. Share the one-time password setup link privately with this staff member.':'Login created. '+(data.warning||'Use Firebase Authentication to send a password reset.'))
     }else{
       if(staff.some(s=>s.uid===uid)){setNotice('That UID already has a role. Use the change-role control.');return}
       await setDoc(doc(db,'admins',uid),{uid,name,email,role:draft.role,createdBy:user.uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp()})
       setNotice('Existing login linked. Staff may sign in using their Firebase Authentication credentials.')
     }
     setDraft(empty)
   }catch(err){
     setNotice(createMode==='new'?'Could not create login: '+(err?.message||'Deploy the Cloud Functions backend first.'):'Could not assign existing login: '+(err?.message||'Check staff permissions.'))
   }finally{setBusy('')}
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
   if(!window.confirm('Disable login and revoke dashboard access for '+(member.name||member.email||member.uid)+'? This does not delete attendee records.'))return
   setBusy(member.uid);setNotice('')
   try{
     await httpsCallable(callable(),'revokeStaffAccount')({uid:member.uid})
     setNotice('Account disabled and dashboard access revoked.')
   }catch(err){setNotice('Unable to disable account: '+(err?.message||'Check the deployed Cloud Functions backend.'))}
   finally{setBusy('')}
 }
 const matches=staff.filter(m=>[m.uid,m.name,m.email,m.role].some(v=>String(v||'').toLowerCase().includes(search.trim().toLowerCase())))
 return <section className="gc-staff-manager" aria-labelledby="gc-staff-title">
   <header className="gc-staff-heading"><div><p className="gc-staff-eyebrow">SECURE ACCESS MANAGEMENT</p><h3 id="gc-staff-title">Your conference team</h3><p>Create individual staff logins, assign least-privilege roles and disable access when needed.</p></div><span className="gc-staff-count">{staff.length} STAFF ACCOUNTS</span></header>
   <div className="gc-staff-grid">
     <section className="gc-staff-panel">
       <div className="gc-staff-panel-heading"><span>01</span><div><h4>Invite a staff member</h4><p>Create a protected login and assign exactly one operational role.</p></div></div>
       <div className="gc-staff-modes"><button type="button" className={createMode==='new'?'active':''} onClick={()=>{setCreateMode('new');setSetupLink('');setNotice('')}}>CREATE NEW LOGIN</button><button type="button" className={createMode==='existing'?'active':''} onClick={()=>{setCreateMode('existing');setSetupLink('');setNotice('')}}>LINK EXISTING LOGIN</button></div>
       <p className="gc-staff-setup-note">{createMode==='new'?'A secure server function creates the Firebase account. You receive a one-time password setup link to share privately.':'Already made their Firebase Authentication account? Copy the UID from Firebase Console and link it to a role.'}</p>
       <form onSubmit={add} className="gc-staff-form">
         {createMode==='existing'&&<label>EXISTING FIREBASE AUTH UID *<input required spellCheck="false" autoComplete="off" placeholder="Paste exact UID from Firebase" value={draft.uid} onChange={e=>setDraft(v=>({...v,uid:e.target.value}))}/></label>}
         <label>STAFF MEMBER'S NAME *<input required maxLength={100} placeholder="Full name" value={draft.name} onChange={e=>setDraft(v=>({...v,name:e.target.value}))}/></label>
         <label>LOGIN EMAIL *<input required type="email" maxLength={254} placeholder="staff@example.com" value={draft.email} onChange={e=>setDraft(v=>({...v,email:e.target.value}))}/></label>
         <label>STAFF ROLE *<select value={draft.role} onChange={e=>setDraft(v=>({...v,role:e.target.value}))}>{roles.map(r=><option value={r.value} key={r.value}>{r.name}</option>)}</select></label>
         <p className="gc-staff-role-desc">{roles.find(r=>r.value===draft.role)?.description}</p>
         <button type="submit" disabled={!!busy}>{busy?'SAVING STAFF LOGIN…':createMode==='new'?'CREATE STAFF LOGIN →':'LINK EXISTING LOGIN →'}</button>
       </form>
       {setupLink&&<div className="gc-staff-setup-link"><strong>ONE-TIME ACCOUNT SETUP LINK</strong><p>Copy and share privately with the correct staff member. Do not post in a group or screenshot publicly. It expires according to Firebase settings.</p><input aria-label="One-time account setup link" readOnly value={setupLink}/><button type="button" onClick={()=>navigator.clipboard.writeText(setupLink).then(()=>setNotice('Setup link copied. Share privately.')).catch(()=>setNotice('Select and copy the link manually.'))}>COPY SETUP LINK</button></div>}
       <p className="gc-staff-security">Only the main administrator can create operational staff accounts. This screen cannot grant full administrator access.</p>
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
