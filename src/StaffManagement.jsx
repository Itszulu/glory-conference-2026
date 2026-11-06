import {useEffect,useState} from 'react'
import {collection,deleteDoc,doc,onSnapshot,serverTimestamp,setDoc,updateDoc} from 'firebase/firestore'
import {initializeApp,deleteApp} from 'firebase/app'
import {createUserWithEmailAndPassword,deleteUser,getAuth,inMemoryPersistence,setPersistence,signOut,updateProfile} from 'firebase/auth'
import {app,db} from './firebase'
import './staff-management.css'

const roles=[
 {value:'registration',name:'Registration desk',description:'Create attendee registrations. Cannot check anyone in or out.'},
 {value:'checkin',name:'Attendance desk',description:'Find existing attendees and record check-in and check-out.'},
 {value:'followup',name:'Glory Connect',description:'Manage permitted attendee follow-up information.'}
]
const empty={uid:'',name:'',email:'',password:'',role:'registration'}
export default function StaffManagement({user}){
 const [staff,setStaff]=useState([])
 const [draft,setDraft]=useState(empty)
 const [busy,setBusy]=useState('')
 const [notice,setNotice]=useState('')
 const [search,setSearch]=useState('')
 const [accountMode,setAccountMode]=useState('create')
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
   if(name.length<2||name.length>100||!/^\S+@\S+\.\S+$/.test(email)||!roles.some(r=>r.value===draft.role)){setNotice('Enter a valid name, email address and staff role.');return}
   if(staff.some(s=>String(s.email||'').toLowerCase()===email)){setNotice('This email already has a staff role. Review the list first.');return}
   if(accountMode==='link'&&!/^[A-Za-z0-9]{10,128}$/.test(uid)){setNotice('Enter the exact UID for the existing account.');return}
   if(accountMode==='create'&&(draft.password.length<12||draft.password.length>128)){setNotice('Temporary password must be between 12 and 128 characters.');return}
   setBusy('create');setNotice('')
   let secondaryApp,secondaryAuth,createdUser
   try{
     let assignedUid=uid
     if(accountMode==='create'){
       // Completely separate short-lived Auth instance: the main admin remains signed in.
       secondaryApp=initializeApp(app.options,'staff-provision-'+Date.now())
       secondaryAuth=getAuth(secondaryApp)
       await setPersistence(secondaryAuth,inMemoryPersistence)
       const result=await createUserWithEmailAndPassword(secondaryAuth,email,draft.password)
       createdUser=result.user
       assignedUid=createdUser.uid
       // Profile data is optional; role assignment remains the security boundary.
       await updateProfile(createdUser,{displayName:name}).catch(()=>{})
     }else if(staff.some(member=>member.uid===uid)){
       throw new Error('This login already has staff access. Change its role in the list instead.')
     }
     try{
       await setDoc(doc(db,'admins',assignedUid),{
         uid:assignedUid,name,email,role:draft.role,createdBy:user.uid,
         createdAt:serverTimestamp(),updatedAt:serverTimestamp()
       })
     }catch(roleError){
       if(createdUser){
         try{await deleteUser(createdUser)}
         catch{
           throw new Error('Login created but role assignment failed. The account has no staff access; please delete or disable the unassigned login in Firebase Authentication.')
         }
       }
       throw roleError
     }
     setDraft(empty)
     setNotice(accountMode==='create'
       ?'Staff account created and role assigned. Share the temporary password securely and ask the staff member to reset it after their first sign-in.'
       :'Staff role assigned to the existing account.')
   }catch(err){
     const code=err?.code
     setNotice(code==='auth/email-already-in-use'
       ?'This email already has a login. Choose Link Existing Login or use another email.'
       :code==='auth/operation-not-allowed'
       ?'Email/password account creation is currently disabled in Authentication settings.'
       :code==='auth/weak-password'
       ?'Choose a stronger temporary password.'
       :err?.message||'Could not create the staff account.')
   }finally{
     if(secondaryAuth)await signOut(secondaryAuth).catch(()=>{})
     if(secondaryApp)await deleteApp(secondaryApp).catch(()=>{})
     setBusy('')
   }
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
   <header className="gc-staff-heading"><div><p className="gc-staff-eyebrow">STAFF & PERMISSIONS</p><h3 id="gc-staff-title">Your conference team</h3><p>Create and manage individual team accounts, with access limited to their assigned responsibilities.</p></div><span className="gc-staff-count">{staff.length} STAFF ACCOUNTS</span></header>
   <div className="gc-staff-grid">
     <section className="gc-staff-panel">
       <div className="gc-staff-panel-heading"><span>01</span><div><h4>Create staff account</h4><p>Set up individual login details and a restricted workspace in one place.</p></div></div>
       <div className="gc-staff-modes" role="group" aria-label="Account setup method">
         <button type="button" aria-pressed={accountMode==='create'} className={accountMode==='create'?'active':''} onClick={()=>{setAccountMode('create');setNotice('')}}>CREATE NEW LOGIN</button>
         <button type="button" aria-pressed={accountMode==='link'} className={accountMode==='link'?'active':''} onClick={()=>{setAccountMode('link');setNotice('')}}>LINK EXISTING LOGIN</button>
       </div>
       <p className="gc-staff-setup-note">{accountMode==='create'?'Enter the staff member’s name, email, temporary password and role. Your own administrator login will stay active.':'Link an existing account by its UID only when the login has already been created.'}</p>
       <form onSubmit={add} className="gc-staff-form">
         {accountMode==='link'&&<label>EXISTING USER UID *<input required spellCheck="false" autoComplete="off" placeholder="Paste UID of existing login" value={draft.uid} onChange={e=>setDraft(v=>({...v,uid:e.target.value}))}/></label>}
         <label>STAFF MEMBER'S NAME *<input required maxLength={100} placeholder="Full name" value={draft.name} onChange={e=>setDraft(v=>({...v,name:e.target.value}))}/></label>
         <label>LOGIN EMAIL *<input required type="email" maxLength={254} placeholder="staff@example.com" value={draft.email} onChange={e=>setDraft(v=>({...v,email:e.target.value}))}/></label>
         {accountMode==='create'&&<label>TEMPORARY PASSWORD *<input required type="password" autoComplete="new-password" minLength={12} maxLength={128} placeholder="At least 12 characters" value={draft.password} onChange={e=>setDraft(v=>({...v,password:e.target.value}))}/></label>}
         <label>ASSIGNED WORKSPACE *<select value={draft.role} onChange={e=>setDraft(v=>({...v,role:e.target.value}))}>{roles.map(r=><option value={r.value} key={r.value}>{r.name}</option>)}</select></label>
         <p className="gc-staff-role-desc">{roles.find(r=>r.value===draft.role)?.description}</p>
         <button type="submit" disabled={!!busy}>{busy?'CREATING ACCOUNT…':accountMode==='create'?'CREATE STAFF ACCOUNT →':'ASSIGN EXISTING LOGIN →'}</button>
       </form>
       <p className="gc-staff-security">Only the main admin can assign staff permissions. Creating a login here uses a separate temporary sign-in session and cannot grant administrator status. Revoking dashboard access does not disable an underlying login.</p>
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
