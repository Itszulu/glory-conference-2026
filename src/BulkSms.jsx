import { useState } from 'react'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from './firebase'

export function SmsPermission({ person }) {
  const [status,setStatus] = useState('')
  async function record(consent) {
    try {
      await updateDoc(doc(db,'registrations',person.id),{
        churchSmsConsent:consent, churchSmsStopped:!consent, churchSmsUpdatedAt:serverTimestamp()
      })
      setStatus(consent ? 'SMS permission recorded.' : 'SMS stopped for this number.')
    } catch { setStatus('Could not update SMS permission.') }
  }
  return <div>
    <p>General church SMS permission: {person.churchSmsConsent ? 'Yes' : 'No'}</p>
    <button type="button" onClick={()=>record(false)}>Record SMS opt-out</button>
    {!person.churchSmsConsent && <button type="button" onClick={()=>{if(window.confirm('Has this person explicitly agreed to receive general church texts?')) record(true)}}>Record SMS opt-in</button>}
    <p role="status">{status}</p>
  </div>
}

export function BulkSms() {
  const [body,setBody] = useState('')
  const [preview,setPreview] = useState(null)
  const [busy,setBusy] = useState(false)
  const [status,setStatus] = useState('')
  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setStatus('')
    try {
      const id = preview?.id || crypto.randomUUID()
      const send = httpsCallable(getFunctions(db.app),'gloryBulkSms',{timeout:90000})
      const {data} = await send({ id, body, action:preview ? 'send' : 'preview' })
      if (preview) {
        setStatus((data.sandbox ? 'Simulation accepted' : 'Accepted for sending') + ' for ' + data.count + ' recipients. Reference: ' + data.reference)
        setPreview(null)
        setBody('')
      } else {
        setPreview({...data,id})
      }
    } catch (err) {
      setStatus(err.code === 'functions/internal' || err.code === 'functions/unavailable' ? 'SMS service unavailable. If you already pressed Send, check the provider dashboard before retrying.' : err.message)
    } finally { setBusy(false) }
  }
  return <form onSubmit={submit} className="gc-connect-filters">
    <h3>Bulk SMS</h3>
    <label>Your message<textarea required maxLength={1530} rows={4} value={body} disabled={busy}
      onChange={e=>{setBody(e.target.value);setPreview(null);setStatus('')}}/></label>
    {preview && <p>{preview.count} unique opted-in recipients · {preview.sandbox ? 'Sandbox simulation' : 'Live SMS, billed per page'}</p>}
    <button disabled={busy || !body.trim() || preview?.count === 0}>{busy ? 'Working…' : !preview ? 'Preview recipients' : preview.sandbox ? 'Run simulation' : 'Send SMS'}</button>
    {preview && <button type="button" disabled={busy} onClick={()=>setPreview(null)}>Reset preview</button>}
    <p role="status">{status}</p>
  </form>
}
