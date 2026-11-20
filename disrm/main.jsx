import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { addDoc, collection, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore'
import { auth, db } from '../src/firebase'
import { BulkSms, SmsPermission } from '../src/BulkSms'
import './workspace.css'

const branches = ['Nsukka','Enugu']
const groups = ['All contacts',...branches,'Unassigned']
function groupOf(contact) { return branches.includes(contact.memberBranch) ? contact.memberBranch : 'Unassigned' }
function Brand() { return <strong className="brand"><i aria-hidden="true">D</i> DISRM</strong> }

function Login(){
  const [error,setError] = useState('')
  const [busy,setBusy] = useState(false)
  async function login(event){
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setBusy(true)
    try { await signInWithEmailAndPassword(auth,data.get('email').trim(),data.get('password')) }
    catch { setError('Sign-in failed. Check your email and password.');setBusy(false) }
  }
  return <main className="login"><Brand/><form onSubmit={login}><h1>Church follow-up</h1>
    <label>Email<input type="email" name="email" autoComplete="username" required/></label>
    <label>Password<input type="password" name="password" autoComplete="current-password" required/></label>
    <button disabled={busy}>Sign in</button><p role="status">{error}</p></form></main>
}

function Directory(){
  const [lists,setLists] = useState({})
  const [group,setGroup] = useState(groups[0])
  const [query,setQuery] = useState('')
  const [selected,setSelected] = useState('')
  const [adding,setAdding] = useState(false)
  const [notice,setNotice] = useState('')
  const [loadError,setLoadError] = useState('')
  const [busy,setBusy] = useState(false)
  const [view,setView] = useState('directory')
  const [audience,setAudience] = useState(branches[0])
  useEffect(()=>{
    const unsub = ['registrations','churchMembers'].map(source=>onSnapshot(collection(db,source),snapshot=>{
      const contacts = snapshot.docs.map(row=>({...row.data(),id:row.id,source,key:source+'/'+row.id}))
      setLists(prev=>({...prev,[source]:contacts}))
    },()=>setLoadError('Unable to load the complete directory. Check your connection and access, then reload.')))
    return ()=>unsub.forEach(stop=>stop())
  },[])
  const all = Object.values(lists).flat()
  const ready = Object.keys(lists).length===2 && !loadError
  const person = all.find(c=>c.key===selected)
  const term=query.trim().toLowerCase()
  const rows=all.filter(c=>(group===groups[0] || groupOf(c)===group) &&
    [c.fullName,c.phone,c.church,c.registrationId].some(v=>String(v||'').toLowerCase().includes(term)))
    .sort((a,b)=>String(a.fullName||'').localeCompare(String(b.fullName||'')))
  async function save(event){
    event.preventDefault()
    const form=new FormData(event.currentTarget)
    setBusy(true);setNotice('')
    try {
      if(adding){
        const name=form.get('name').trim(), phone=form.get('phone').trim()
        if(!name || !phone) throw Error()
        await addDoc(collection(db,'churchMembers'),{fullName:name,phone,memberBranch:form.get('branch'),
          churchSmsConsent:form.get('consent')==='on',createdAt:serverTimestamp(),createdBy:auth.currentUser.uid})
      }else{
        await updateDoc(doc(db,person.source,person.id),{memberBranch:form.get('branch'),updatedAt:serverTimestamp()})
      }
      setNotice(adding?'Member added.':'Branch saved.');setAdding(false);setSelected('')
    }catch {setNotice('Could not save. Check the details and try again.')}
    finally{setBusy(false)}
  }
  return <><header className="top"><div><Brand/><nav aria-label="Workspace">
    <button aria-pressed={view==='directory'} onClick={()=>setView('directory')}>Directory</button>
    <button aria-pressed={view==='invite'} onClick={()=>setView('invite')}>Invitations</button></nav>
    <button className="exit" onClick={()=>signOut(auth)}>Sign out</button></div></header>
    <main className="work">{view==='invite'?<>
      <h1>Church invitations</h1><label className="audience">Invite members of<select value={audience} onChange={e=>setAudience(e.target.value)}>{branches.map(b=><option key={b}>{b}</option>)}</select></label>
      <BulkSms key={audience} branch={audience}/>
    </>:<>
      <div className="heading"><div><h1>Member directory</h1><p>Manage church contacts and branch membership.</p></div>
        <button className="primary" onClick={()=>{setAdding(true);setSelected('');setNotice('')}}>+ Add member</button></div>
      <div className="groups">{groups.map(g=><button key={g} aria-pressed={group===g} onClick={()=>{setGroup(g);setSelected('');setAdding(false)}}>
        <span>{branches.includes(g)?'DISRM '+g:g}</span><strong>{ready?(g===groups[0]?all.length:all.filter(c=>groupOf(c)===g).length):'…'}</strong></button>)}</div>
      {(person||adding)&&<section className="editor" key={adding?'new':person.key}><h2>{adding?'New member':person.fullName||'Contact details'}</h2>
        {person&&<p>{person.phone || 'No phone recorded'} · {person.source==='registrations'?'Glory Conference record':'Church directory'}{person.church?' · '+person.church:''}</p>}
        <form onSubmit={save}>{adding&&<><label>Full name<input name="name" required maxLength={120}/></label><label>Phone number<input name="phone" type="tel" required maxLength={30}/></label></>}
        <label>Membership branch<select name="branch" defaultValue={adding?(branches.includes(group)?group:''):person.memberBranch||''}>
          <option value="">Unassigned</option>{branches.map(b=><option key={b}>{b}</option>)}</select></label>
        {adding&&<label className="check"><input name="consent" type="checkbox"/>This person agreed to receive general church SMS.</label>}
        <div><button className="primary" disabled={busy}>Save {adding?'member':'branch'}</button> <button type="button" onClick={()=>{setSelected('');setAdding(false)}}>Close</button></div></form>
        {person&&<SmsPermission person={person}/>}</section>}
      {notice&&<p role="status">{notice}</p>}
      <section className="directory"><div className="searchbar"><h2>{branches.includes(group)?'DISRM '+group:group}</h2>
        <input type="search" aria-label="Search directory" placeholder="Search name or phone" value={query} onChange={e=>setQuery(e.target.value)}/></div>
        {loadError?<p role="alert">{loadError}</p>:!ready?<p>Loading contacts…</p>:rows.length===0?<p>No contacts in this view.</p>:
        <div className="tablewrap"><table><thead><tr><th>Name</th><th>Phone</th><th>Branch</th><th>Source</th></tr></thead><tbody>{rows.map(c=><tr key={c.key}><td><button onClick={()=>{setAdding(false);setSelected(c.key);setNotice('');window.scrollTo({top:0,behavior:'smooth'})}}>{c.fullName||'Unnamed contact'}</button></td>
        <td>{c.phone||'—'}</td><td>{groupOf(c)}</td><td>{c.source==='registrations'?'Glory Conference':'Church directory'}</td></tr>)}</tbody></table></div>}</section>
    </>}</main></>
}
function App(){
  const [session,setSession]=useState('loading')
  useEffect(()=>{
    let stopRole
    const stop=onAuthStateChanged(auth,user=>{
      stopRole?.()
      if(!user){setSession('login');return}
      setSession('loading')
      stopRole=onSnapshot(doc(db,'admins',user.uid),row=>setSession(row.data()?.role==='admin'?'ready':'denied'),()=>setSession('denied'))
    })
    return ()=>{stop();stopRole?.()}
  },[])
  if(session==='login')return <Login/>
  if(session==='ready')return <Directory/>
  return <main className="login"><Brand/><p>{session==='loading'?'Opening workspace…':'Administrator access is required.'}</p>{session==='denied'&&<button onClick={()=>signOut(auth)}>Sign out</button>}</main>
}
createRoot(document.getElementById('root')).render(<App/>)
