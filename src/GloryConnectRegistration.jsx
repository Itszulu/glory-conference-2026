import { useState } from 'react'
import { Check, Copy, Printer } from 'lucide-react'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { attendeeRegistrationId } from './registrationIdentity'
import { VenueDirections } from './VenueDirections'
import { conferenceVenue } from './conferenceVenue'
import './glory-connect.css'

const days = ['Nov 12', 'Nov 13', 'Nov 14']
const frequencies = [
  { value: 'First time', label: 'This is my first Glory Conference' },
  { value: 'Second time', label: 'This will be my second time' },
  { value: 'Third time or more', label: "I've attended three or more times" }
]
const affiliations = [
  { value: 'DISRM', label: "I'm part of DISRM" },
  { value: 'Visiting from another church', label: "I'm visiting from another church" },
  { value: 'Not currently part of a church', label: "I'm not currently part of a church" },
  { value: 'Prefer not to say', label: 'Prefer not to say' }
]
const locations = ['Abuja (FCT)','Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara','Outside Nigeria']
const digitCount = value => (value.match(/\d/g) || []).length

export default function GloryConnectRegistration() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [completedId, setCompletedId] = useState('')
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({
    fullName:'', phone:'', email:'', cityState:'', church:'',
    attendanceFrequency:'', affiliation:'', days:['Nov 12','Nov 13','Nov 14'],
    followUpConsent:false, heardFrom:'', ageRange:'', gender:''
  })
  const set = (name,value) => { setForm(f=>({...f,[name]:value})); setError('') }
  const checkFirstStep = () => {
    if(form.fullName.trim().length < 2 || digitCount(form.phone) < 10 || digitCount(form.phone) > 15 || !form.cityState) {
      setError('Enter your full name, a valid phone/WhatsApp number and your state of residence.')
      return false
    }
    if(form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Please check your email address, or leave it blank.')
      return false
    }
    return true
  }
  const submit = async e => {
    e.preventDefault()
    if(busy || !checkFirstStep()) return
    if(!form.attendanceFrequency || !form.affiliation || form.days.length === 0) {
      setError('Choose your conference experience, connection and attendance days.')
      return
    }
    setBusy(true);setError('')
    try {
      const id=await attendeeRegistrationId(form.fullName,form.phone)
      await setDoc(doc(db,'registrations',id), {
        registrationId:id,conferenceYear:2026,title:'',
        fullName:form.fullName.trim(),phone:form.phone.trim(),email:form.email.trim(),
        gender:form.gender,ageRange:form.ageRange,cityState:form.cityState,
        church:form.church.trim(),attendanceType:'Individual',
        days:form.days,accommodation:'No',
        firstTime:form.attendanceFrequency==='First time'?'Yes':'No',
        attendanceFrequency:form.attendanceFrequency,affiliation:form.affiliation,
        followUpConsent:form.followUpConsent,consentRecordedAt:serverTimestamp(),
        heardFrom:form.heardFrom||'Other',createdAt:serverTimestamp()
      })
      setCompletedId(id)
      window.scrollTo({top:0,behavior:'smooth'})
    } catch(e) {
      setError(e?.code==='permission-denied' ? 'We could not complete your registration. You may already be registered under this name and phone number. Please contact the welcome team if you need help.' : 'Registration could not be saved. Please check your connection and try again.')
    } finally {setBusy(false)}
  }

  const copyId = async () => {
    if (!completedId) return
    try {
      await navigator.clipboard.writeText(completedId)
      setCopied(true)
    } catch {
      // Older mobile browsers or an insecure context may disable Clipboard API.
      const field=document.createElement('textarea')
      field.value=completedId
      field.style.position='fixed'
      field.style.opacity='0'
      document.body.appendChild(field)
      field.select()
      const success=document.execCommand('copy')
      field.remove()
      if (success) setCopied(true)
    }
  }
  const attendeeName=form.fullName.trim()
  const attendingDays=form.days.map(day=>day.replace('Nov ','November ')).join(' · ')
  return <section className="page-light center register-page">
    <div className="registration-form">
      {completedId ? <>
        <div className="registration-success gc-confirmation" role="status" aria-live="polite">
          <div className="gc-confirmation-topline"><img src="/assets/branding/glory-conference-logo.webp" alt="Glory Conference" /><span>GLORY CONFERENCE 2026</span></div>
          <div className="gc-confirmation-seal" aria-hidden="true"><Check size={30} strokeWidth={2.5}/></div>
          <p className="gc-confirmation-overline">REGISTRATION SUCCESSFUL</p>
          <h2>You're all set.</h2>
          <p className="gc-confirmation-lead">Your place at <strong>The Outpouring</strong> is confirmed.</p>
          <div className="gc-confirmation-details">
            <div><span>REGISTERED ATTENDEE</span><strong>{attendeeName}</strong></div>
            <div><span>CONFERENCE DATES</span><strong>12–14 November 2026</strong></div>
            <div><span>LOCATION</span><strong>{conferenceVenue.addressLine1}, {conferenceVenue.city}</strong></div>
          </div>
          <div className="gc-confirmation-reference">
            <div className="gc-confirmation-reference-text"><span>YOUR REGISTRATION REFERENCE</span><strong>{completedId}</strong></div>
            <button className="gc-confirmation-copy" type="button" onClick={copyId} aria-label={copied?'Registration reference copied':'Copy registration reference'} title={copied?'Copied':'Copy reference'}>{copied?<Check size={19}/>:<Copy size={19}/>}<span>{copied?'Copied':'Copy'}</span></button>
          </div>
          <p className="gc-confirmation-arrival">When you arrive, our welcome team can find your registration using your name or reference. No printed document is required.</p>
          <VenueDirections compact/>
          <button type="button" className="gc-confirmation-print" onClick={()=>window.print()}><Printer size={19} aria-hidden="true"/> SAVE OR PRINT CONFIRMATION</button>
          <p className="gc-confirmation-fine">An A4-ready confirmation is available if you'd like to keep a copy.</p>
        </div>
        <article className="gc-confirmation-paper" aria-label="A4 printable conference registration confirmation">
          <div className="gc-paper-header">
            <img src="/assets/branding/glory-conference-logo.webp" alt="Glory Conference logo"/>
            <div><span>GLORY CONFERENCE 2026</span><strong>THE OUTPOURING</strong></div>
          </div>
          <div className="gc-paper-main">
            <p className="gc-paper-kicker">OFFICIAL REGISTRATION CONFIRMATION</p>
            <h1>Registration confirmed.</h1>
            <p className="gc-paper-subtitle">This document confirms your registration for Glory Conference 2026.</p>
            <div className="gc-paper-divider"/>
            <div className="gc-paper-record">
              <div><span>ATTENDEE NAME</span><strong>{attendeeName}</strong></div>
              <div><span>REGISTRATION REFERENCE</span><strong className="gc-paper-code">{completedId}</strong></div>
              <div><span>CONFERENCE</span><strong>Glory Conference 2026 — The Outpouring</strong></div>
              <div><span>DATES</span><strong>12–14 November 2026</strong></div>
              <div><span>PLANNED ATTENDANCE</span><strong>{attendingDays}</strong></div>
              <div><span>VENUE ADDRESS</span><strong>{conferenceVenue.fullAddress}</strong></div>
            </div>
            <div className="gc-paper-note"><strong>ARRIVAL INFORMATION</strong><p>Visit the welcome desk when you arrive. Our team can locate your registration by name or reference. Printing this confirmation is optional.</p></div>
          </div>
          <footer className="gc-paper-footer"><span>GLORY CONFERENCE 2026 <small>· OFFICIAL ATTENDEE RECORD</small></span><img src="/assets/branding/the-outpouring.webp" alt="The Outpouring" /></footer>
        </article>
      </> : <>
        <p className="eyebrow dark">GLORY CONFERENCE 2026</p>
        <h2>MAKE ROOM FOR<br/>THE OUTPOURING.</h2>
        <p className="reg-intro">Complete the form below to register for Glory Conference 2026. Fields marked with <span className="required">*</span> are required.</p>
        <form className="reg-grid" onSubmit={submit}>
          <label>FULL NAME *<input required autoComplete="name" minLength={2} maxLength={120} name="fullName" value={form.fullName} onChange={e=>set('fullName',e.target.value)} placeholder="Your full name"/></label>
          <label>WHATSAPP / PHONE *<input required type="tel" autoComplete="tel" inputMode="tel" maxLength={30} name="phone" value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="08012345678"/></label>
          <label>EMAIL (OPTIONAL)<input type="email" autoComplete="email" maxLength={254} name="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="Your email address"/></label>
          <label>STATE OF RESIDENCE *<select required name="cityState" value={form.cityState} onChange={e=>set('cityState',e.target.value)}><option value="">Select your state</option>{locations.map(place=><option key={place} value={place}>{place}</option>)}</select></label>
          <label>CHURCH / MINISTRY (OPTIONAL)<input maxLength={150} name="church" value={form.church} onChange={e=>set('church',e.target.value)} placeholder="If applicable"/></label>
          <label>FIRST GLORY CONFERENCE? *<select required name="attendanceFrequency" value={form.attendanceFrequency} onChange={e=>set('attendanceFrequency',e.target.value)}><option value="">Select your attendance</option>{frequencies.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
          <label>YOUR CONNECTION TO GLORY CONFERENCE *<select required name="affiliation" value={form.affiliation} onChange={e=>set('affiliation',e.target.value)}><option value="">Select an option</option>{affiliations.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
          <label>HOW DID YOU HEAR ABOUT US? (OPTIONAL)<select name="heardFrom" value={form.heardFrom} onChange={e=>set('heardFrom',e.target.value)}><option value="">Select an option</option>{['Church','Friend / Family','WhatsApp','Instagram','Facebook','YouTube','Other'].map(x=><option key={x}>{x}</option>)}</select></label>
          <label className="full">DAYS ATTENDING *<div className="merch-options">{days.map(day=><button type="button" key={day} className={form.days.includes(day)?'selected':''} aria-pressed={form.days.includes(day)} onClick={()=>set('days',form.days.includes(day)?form.days.filter(d=>d!==day):[...form.days,day])}>{day}</button>)}</div></label>
          <label className="full gc-registration-consent"><input type="checkbox" name="followUpConsent" checked={form.followUpConsent} onChange={e=>set('followUpConsent',e.target.checked)}/><span>Yes, I'd like to receive Glory Conference updates and follow-up messages by WhatsApp or SMS. I can opt out later.</span></label>
          <p className="gc-registration-privacy full">Your details are used for conference registration and attendance management. Optional follow-up messages require your permission.</p>
          {error&&<p className="registration-error" role="alert">{error}</p>}
          <button type="submit" className="form-action" disabled={busy}>{busy?'REGISTERING...':'COMPLETE REGISTRATION →'}</button>
        </form>
      </>}
    </div>
  </section>
}
