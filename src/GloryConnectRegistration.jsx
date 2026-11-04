import { useState } from 'react'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import './glory-connect.css'

const days = ['Nov 12', 'Nov 13', 'Nov 14']
const frequencies = [
  { value: 'First time', label: 'This is my first Glory Conference' },
  { value: 'Second time', label: 'This will be my second time' },
  { value: 'Third time or more', label: "I've attended three or more times" }
]
const affiliations = [
  { value: 'Host ministry', label: "I'm part of the host ministry" },
  { value: 'Visiting from another church', label: "I'm visiting from another church" },
  { value: 'Not currently part of a church', label: "I'm not currently part of a church" },
  { value: 'Prefer not to say', label: 'Prefer not to say' }
]
const locations = ['Abuja (FCT)','Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara','Outside Nigeria']
const registrationId = () => 'GC26-R-' + Array.from(crypto.getRandomValues(new Uint8Array(12)), n => (n % 36).toString(36).toUpperCase()).join('')
const digitCount = value => (value.match(/\d/g) || []).length

export default function GloryConnectRegistration() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [completedId, setCompletedId] = useState('')
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
    const id=registrationId()
    try {
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
      setError('Registration could not be saved. Please check your connection and try again. Nothing was submitted successfully.')
    } finally {setBusy(false)}
  }

  return <section className="page-light center register-page">
    <div className="registration-form">
      {completedId ? <div className="registration-success" role="status">
        <p className="eyebrow dark">REGISTRATION COMPLETE</p>
        <h2>YOU'RE REGISTERED.</h2>
        <p>{form.attendanceFrequency==='First time'
          ? `We're glad to welcome you to your first Glory Conference, ${form.fullName.trim().split(/\s+/)[0]}.`
          : `Welcome back to Glory Conference, ${form.fullName.trim().split(/\s+/)[0]}.`}</p>
        <p>Your registration is confirmed. Our team can find you by name or registration number when you arrive.</p>
        <p>Your registration number:</p>
        <strong>{completedId}</strong>
        <div className="registration-success-actions">
          <button type="button" onClick={()=>navigator.clipboard?.writeText(completedId)}>COPY REGISTRATION ID</button>
          <button type="button" onClick={()=>window.print()}>PRINT CONFIRMATION</button>
        </div>
        <p><strong>12–14 November 2026 · Nsukka, Nigeria</strong></p>
        <p>We look forward to welcoming you to The Outpouring. You do not need to print your confirmation.</p>
      </div> : <>
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
