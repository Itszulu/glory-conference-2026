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
  const [step, setStep] = useState(1)
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
  const next = e => { e.preventDefault(); if(checkFirstStep()) {setError('');setStep(2)} }
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

  return <section className="page-light center register-page gc-connect-registration">
    <div className="registration-form">
      {completedId ? <div className="registration-success gc-connect-success" role="status">
        <p className="eyebrow dark">WELCOME TO GLORY CONFERENCE 2026</p>
        <h2>YOUR PLACE IS RESERVED.</h2>
        <p>{form.attendanceFrequency==='First time'?`It's wonderful to have you joining us for the first time, ${form.fullName.trim().split(/\s+/)[0]}. Our welcome team will be glad to help you settle in.`:`Welcome back, ${form.fullName.trim().split(/\s+/)[0]}! We're glad you're part of The Outpouring again.`}</p>
        <p><strong>November 12–14, 2026 · Nsukka, Nigeria</strong></p>
        <p>Registration reference</p><strong>{completedId}</strong>
        <div className="registration-success-actions">
          <button type="button" onClick={()=>navigator.clipboard?.writeText(completedId)}>COPY REFERENCE</button>
          <button type="button" onClick={()=>window.print()}>SAVE / PRINT</button>
        </div>
        <p>Please keep your reference. At the entrance, our welcome team can also look up your name or phone number. No account or password is needed.</p>
        {form.followUpConsent&&<p>You've opted in to conference updates and follow-up messages.</p>}
      </div> : <>
        <p className="eyebrow dark">GLORY CONNECT · REGISTRATION</p>
        <h2>YOU BELONG<br/>AT THE OUTPOURING.</h2>
        <p className="reg-intro">We'd love to welcome you. A few quick details will help our team prepare for your arrival.</p>
        <div className="gc-connect-progress" aria-label={`Registration step ${step} of 2`}>
          <span className={step>=1?'active':''}/><span className={step>=2?'active':''}/>
          <strong>STEP {step} OF 2</strong>
        </div>
        <form className="reg-grid gc-connect-form" onSubmit={step===1?next:submit}>
          {step===1 ? <>
            <div className="gc-connect-section"><strong>01 · ABOUT YOU</strong><p>Just enough to recognize and welcome you.</p></div>
            <label className="full">FULL NAME *<input required autoComplete="name" maxLength={120} value={form.fullName} onChange={e=>set('fullName',e.target.value)} placeholder="Your first and last name"/></label>
            <label>WHATSAPP / PHONE *<input required type="tel" inputMode="tel" autoComplete="tel" maxLength={30} value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="e.g. 08012345678"/></label>
            <label>EMAIL (OPTIONAL)<input type="email" autoComplete="email" maxLength={254} value={form.email} onChange={e=>set('email',e.target.value)} placeholder="you@example.com"/></label>
            <label>STATE OF RESIDENCE *<select required value={form.cityState} onChange={e=>set('cityState',e.target.value)}><option value="">Select your state</option>{locations.map(place=><option key={place} value={place}>{place}</option>)}</select></label>
            <label>CHURCH / MINISTRY (OPTIONAL)<input maxLength={150} value={form.church} onChange={e=>set('church',e.target.value)} placeholder="If applicable"/></label>
            <button className="form-action" type="submit">CONTINUE →</button>
          </> : <>
            <div className="gc-connect-section"><strong>02 · YOUR CONFERENCE EXPERIENCE</strong><p>These answers help us welcome both new and returning guests.</p></div>
            <fieldset className="gc-connect-choice full"><legend>HOW MANY TIMES HAVE YOU ATTENDED GLORY CONFERENCE? *</legend>
              {frequencies.map(x=><label key={x.value} className={form.attendanceFrequency===x.value?'chosen':''}><input type="radio" name="attendanceFrequency" value={x.value} checked={form.attendanceFrequency===x.value} onChange={()=>set('attendanceFrequency',x.value)}/><span>{x.label}</span></label>)}
            </fieldset>
            <label className="full">HOW ARE YOU CONNECTED TO GLORY CONFERENCE? *<select value={form.affiliation} required onChange={e=>set('affiliation',e.target.value)}><option value="">Choose an option</option>{affiliations.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
            <fieldset className="gc-connect-choice full"><legend>WHICH DAYS DO YOU PLAN TO ATTEND? *</legend><div className="gc-connect-days">{days.map(day=><label key={day} className={form.days.includes(day)?'chosen':''}><input type="checkbox" checked={form.days.includes(day)} onChange={()=>set('days',form.days.includes(day)?form.days.filter(d=>d!==day):[...form.days,day])}/><span>{day}</span></label>)}</div></fieldset>
            <label className="full">HOW DID YOU HEAR ABOUT GLORY CONFERENCE? (OPTIONAL)<select value={form.heardFrom} onChange={e=>set('heardFrom',e.target.value)}><option value="">Choose an option</option>{['Church','Friend / Family','WhatsApp','Instagram','Facebook','YouTube','Other'].map(x=><option key={x}>{x}</option>)}</select></label>
            <label className="gc-connect-consent full"><input type="checkbox" checked={form.followUpConsent} onChange={e=>set('followUpConsent',e.target.checked)}/><span>Yes, I'd like to receive Glory Conference updates and personal follow-up on WhatsApp or SMS. I can opt out later.</span></label>
            <p className="gc-connect-privacy full">We use your details for registration, attendance and event administration. Optional updates are sent only with your permission. Your information is accessible to authorized conference personnel.</p>
            <div className="gc-connect-actions full"><button type="button" onClick={()=>{setError('');setStep(1)}}>← BACK</button><button type="submit" disabled={busy}>{busy?'SAVING REGISTRATION…':'COMPLETE MY REGISTRATION →'}</button></div>
          </>}
          {error&&<p className="registration-error full" role="alert">{error}</p>}
        </form>
      </>}
    </div>
  </section>
}
