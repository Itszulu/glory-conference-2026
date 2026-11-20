import './bulk-sms.css'
import { recipientNumbers } from '../sms-functions/audience.mjs'
import { estimatedKobo, measureSms } from '../sms-functions/measure.mjs'
import { useState } from 'react'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { collection, getDocsFromServer, query, where, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from './firebase'

export function SmsPermission({ person }) {
  const [status,setStatus] = useState('')
  async function record(consent) {
    try {
      await updateDoc(doc(db,person.source || 'registrations',person.id),{
        updatedAt:serverTimestamp(), churchSmsConsent:consent, churchSmsStopped:!consent, churchSmsUpdatedAt:serverTimestamp()
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

export function BulkSms({ branch }) {
  const [body,setBody] = useState('')
  const [preview,setPreview] = useState(null)
  const [busy,setBusy] = useState(false)
  const [status,setStatus] = useState('')
  const [maxPages,setMaxPages] = useState(1)
  const length = measureSms(body,maxPages)
  const overLimit = length.pages > maxPages
  const money = new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN'})
  function edit(change) {
    change()
    setPreview(null)
    setStatus('')
  }
  async function submit(event) {
    event.preventDefault()
    if (busy || overLimit) return
    setBusy(true)
    setStatus('')
    try {
      if (!preview) {
        const [legacy,members,exclusions] = await Promise.all([
          getDocsFromServer(collection(db,'registrations')),
          getDocsFromServer(collection(db,'churchMembers')),
          getDocsFromServer(query(collection(db,'followUps'),where('status','==','Do not contact')))
        ])
        const count = recipientNumbers(legacy,members,exclusions,branch).length
        setPreview({ count, pages:length.pages, totalKobo:estimatedKobo(count,length.pages) })
        if (!count) setStatus('No eligible numbers in this branch. Check branch assignment and general church SMS permission in the directory.')
        return
      }
      const id = preview.id || crypto.randomUUID()
      const send = httpsCallable(getFunctions(db.app),'gloryBulkSms',{timeout:90000})
      const {data} = await send({ id, body, maxPages, branch, action:preview.id ? 'send' : 'preview' })
      if (preview.id) {
        setStatus((data.sandbox ? 'Simulation accepted' : 'Accepted for sending') + ' for ' + data.count + ' recipients. Reference: ' + data.reference)
        setPreview(null)
        setBody('')
        setMaxPages(1)
      } else {
        setPreview({...data,id})
      }
    } catch (err) {
      if (!preview) setStatus('Could not load the directory for this estimate. Check your connection and admin access, then try again.')
      else if (!preview.id) setStatus('The SMS sending service could not be reached or authorised. Your estimate is ready. No SMS was submitted.')
      else setStatus(err.code === 'functions/internal' || err.code === 'functions/unavailable' ? 'Send status is unconfirmed. Check the provider dashboard before starting another send.' : err.message)
    } finally { setBusy(false) }
  }
  return <div className="invitation-layout"><form className="sms-composer" onSubmit={submit}>
    <header><h3>Compose invitation</h3><p>Audience · Opted-in {branch} members</p></header>
    <div className="sms-compose-body">
      <div className="sms-toolbar">
        <label htmlFor="church-sms-body">Message</label>
        <fieldset disabled={busy}><legend>Maximum pages per recipient</legend>
          {[1,2].map(n=><label key={n}>
            <input type="radio" name="sms-page-limit" checked={maxPages===n} onChange={()=>edit(()=>setMaxPages(n))}/>
            <span>{n===1?'1 page max':'2 pages max'}</span>
          </label>)}
        </fieldset>
      </div>
      <textarea id="church-sms-body" aria-describedby="sms-meter" aria-invalid={overLimit} required rows={4} value={body} disabled={busy}
        placeholder="Write your message…" onChange={e=>edit(()=>setBody(e.target.value))}/>
      <div id="sms-meter" className={'sms-meter'+(overLimit?' sms-error':'')}>
        <span>{overLimit?'Over the page limit':length.pages+' of '+maxPages+' pages used'} · {length.unicode?'Unicode':'Standard SMS'}</span>
        <span>{length.units} / {length.limit} units</span>
      </div>
      {preview && <section className="sms-review" aria-label="SMS cost review" aria-live="polite">
        <dl>
          <div><dt>Recipients</dt><dd>{preview.count.toLocaleString()}</dd></div>
          <div><dt>Pages each</dt><dd>{preview.pages}</dd></div>
          <div><dt>Estimated live total</dt><dd>{money.format(preview.totalKobo/100)}</dd></div>
        </dl>
        <p>₦6.49 per page, plus 7.5% VAT.{preview.sandbox?' This simulation is free.':''}</p>
      </section>}
      <footer><button className="sms-primary" disabled={busy || !branch || !body.trim() || overLimit || preview?.count===0}>
        {busy?'Working…':!preview?'Review recipients and cost':!preview.id?'Check sending availability':preview.sandbox?'Run free simulation':'Send SMS · '+money.format(preview.totalKobo/100)}
      </button>{preview && <button type="button" className="sms-secondary" disabled={busy} onClick={()=>setPreview(null)}>Back to draft</button>}</footer>
      {status && <p className="sms-status" role="status">{status}</p>}
    </div>
  </form>
    <aside className="message-preview"><h3>Message preview</h3><div className="preview-device">
      <div className="device-speaker" aria-hidden="true"/><div className="preview-contact">DISRM {branch}</div>
      <div className={'preview-bubble'+(!body.trim()?' is-empty':'')}>{body.trim()?body:'Your invitation will appear here as you type.'}</div>
    </div></aside>
  </div>
}
