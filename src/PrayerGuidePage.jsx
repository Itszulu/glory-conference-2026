import { useEffect, useState } from 'react'
import { Header, Footer } from './App.jsx'
import './prayer-guide.css'

// All release dates use Nigerian civil time (Africa/Lagos, UTC+1).
// Future prayer content is not displayed until its release date.
// IMPORTANT: Client-side gating is a publishing UI, not a confidentiality boundary.
const START_UTC = Date.UTC(2026, 9, 21, 23, 0, 0)
const DAY_MS = 24 * 60 * 60 * 1000
const RELEASED_PRAYERS = [
  {
    "number": 1,
    "title": "THANKSGIVING FOR THE GIFT OF THE HOLY SPIRIT",
    "scripture": "Luke 11:13; Acts 2:32–33; Ephesians 1:3",
    "burden": "Thanksgiving for the finished work of Christ, the gift of the Holy Spirit, and the privilege of participating in God's eternal purpose.",
    "prayers": [
      "Father, we thank You for the finished work of Jesus Christ through which we have received redemption, reconciliation, and access to You.",
      "We thank You for the gift of the Holy Spirit, who dwells in us and makes the life and reality of Christ known to us.",
      "We thank You for the vision of Glory Conference and for every life, family, and generation You intend to reach through this gathering.",
      "We acknowledge Your faithfulness in previous seasons and give You thanks in anticipation of the fruit that will emerge from this year's conference."
    ]
  },
  {
    "number": 2,
    "title": "THE FINISHED WORK OF CHRIST AND THE PROMISE OF THE SPIRIT",
    "scripture": "Galatians 3:13–14; John 7:37–39; Acts 2:32–33",
    "burden": "A deeper revelation of Christ's redemptive work and the outpouring of the Spirit as the promise fulfilled through the exalted Christ.",
    "prayers": [
      "Father, grant us a deeper revelation of the finished work of Jesus Christ and the inheritance that has become ours in Him.",
      "Let the Church understand the relationship between Christ's exaltation, the promise of the Father, and the outpouring of the Holy Spirit.",
      "Let every dimension of Glory Conference reveal Jesus as the crucified, risen, and exalted Lord, who gives the Spirit to His people."
    ]
  },
  {
    "number": 3,
    "title": "THE OUTPOURING PROMISED FOR A GENERATION",
    "scripture": "Joel 2:28–29; Acts 2:16–18; Acts 2:38–39",
    "burden": "The fulfilment and present expression of the Spirit's promise, with the Gospel reaching people across generations.",
    "prayers": [
      "Father, let the truth and significance of Your promise concerning the outpouring of the Holy Spirit be unveiled to us.",
      "Let men and women, young and old, come into a greater knowledge of the Spirit and His ministry.",
      "Let Glory Conference become a catalyst for a generation that knows Christ, walks in the Spirit, and faithfully expresses His life in the world."
    ]
  },
  {
    "number": 4,
    "title": "REVELATION OF THE PERSON AND MINISTRY OF THE HOLY SPIRIT",
    "scripture": "John 14:16–17, 26; John 16:13–14",
    "burden": "That the Church will understand the person, nature, and ministry of the Holy Spirit.",
    "prayers": [
      "Father, grant us revelation knowledge of the person and ministry of the Holy Spirit.",
      "Let the Holy Spirit be known not merely as a doctrine to discuss, but as the divine Person with whom we fellowship and through whom Christ is revealed.",
      "Let every teaching, ministration, and expression at Glory Conference lead people into the knowledge of Jesus Christ."
    ]
  },
  {
    "number": 5,
    "title": "INTIMACY AND FELLOWSHIP WITH THE HOLY SPIRIT",
    "scripture": "2 Corinthians 13:14; Philippians 2:1; 1 John 1:3",
    "burden": "Deeper, enduring fellowship with the Holy Spirit beyond conference experiences.",
    "prayers": [
      "Father, awaken in us a deeper appreciation of our fellowship with the Holy Spirit.",
      "Let men and women develop consistent lives of communion, spiritual understanding, and responsiveness to His leading.",
      "Let Glory Conference produce believers whose fellowship with the Holy Spirit continues long after the meetings have ended."
    ]
  },
  {
    "number": 6,
    "title": "SPIRITUAL SENSITIVITY AND DISCERNMENT",
    "scripture": "Romans 8:14; 1 Corinthians 2:10–16; Hebrews 5:14",
    "burden": "Growth in discernment, sensitivity, and the ability to recognize and respond to the Spirit's operations.",
    "prayers": [
      "Father, grant us spiritual understanding and discernment in the things of the Spirit.",
      "Let ministers and believers grow in their ability to distinguish what is consistent with Your Word and the character of Christ.",
      "Let every aspect of Glory Conference be guided by wisdom, spiritual sensitivity, and obedience to the Holy Spirit."
    ]
  },
  {
    "number": 7,
    "title": "A YIELDED AND PREPARED PEOPLE",
    "scripture": "Romans 12:1–2; Galatians 5:25; 2 Timothy 2:21",
    "burden": "Preparing the hearts, lives, and service of the people for the effective expression of the Spirit's ministry.",
    "prayers": [
      "Father, teach us to walk in step with the Holy Spirit in our personal lives and corporate gatherings.",
      "Let pride, strife, distraction, disorder, and every attitude that contradicts the character of Christ be addressed by Your truth.",
      "Prepare our leadership, ministers, intercessors, worshippers, and workers to serve faithfully and yield to Your purpose."
    ]
  }
]
const DAYS = Array.from({length:21},(_,i)=>({
  number:i+1,
  date:new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',timeZone:'Africa/Lagos'}).format(new Date(START_UTC+i*DAY_MS)),
  unlockAt:START_UTC+i*DAY_MS,
}))
const PHASES = [{name:'PREPARE THE VESSEL',subtitle:'Days 1–7',from:1,to:7},{name:'STIR THE FIRE',subtitle:'Days 8–14',from:8,to:14},{name:'MAKE ROOM',subtitle:'Days 15–21',from:15,to:21}]
const dateLabel = timestamp => new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',timeZone:'Africa/Lagos'}).format(new Date(timestamp))
function remainingText(ms){
  const seconds=Math.max(0,Math.ceil(ms/1000))
  const days=Math.floor(seconds/86400),hours=Math.floor(seconds%86400/3600),minutes=Math.floor(seconds%3600/60),secs=seconds%60
  return (days?days+'d ':'')+String(hours).padStart(2,'0')+':'+String(minutes).padStart(2,'0')+':'+String(secs).padStart(2,'0')
}
export default function PrayerGuidePage(){
  const [now,setNow]=useState(()=>Date.now())
  const [selected,setSelected]=useState(()=>Math.max(1,Math.min(21,Math.floor((Date.now()-START_UTC)/DAY_MS)+1)))
  const [completed,setCompleted]=useState(()=>{try{return JSON.parse(localStorage.getItem('gc26-prayer-completed')||'[]').filter(n=>Number.isInteger(n)&&n>=1&&n<=21)}catch{return []}})
  const [showAll,setShowAll]=useState(false)
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);const refresh=()=>setNow(Date.now());document.addEventListener('visibilitychange',refresh);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',refresh)}},[])
  useEffect(()=>{try{localStorage.setItem('gc26-prayer-completed',JSON.stringify(completed))}catch{}},[completed])
  useEffect(()=>{document.title='21-Day Prayer Guide | Glory Conference 2026';return()=>{document.title='Glory Conference 2026'}},[])
  const slot=DAYS[selected-1],unlocked=now>=slot.unlockAt
  const prayer=unlocked?RELEASED_PRAYERS.find(p=>p.number===selected):null
  const phase=PHASES.find(p=>selected>=p.from&&selected<=p.to)
  const choose=n=>{setSelected(n);document.getElementById('prayer-detail')?.scrollIntoView({behavior:'smooth',block:'start'})}
  const toggle=()=>{if(prayer)setCompleted(prev=>prev.includes(selected)?prev.filter(n=>n!==selected):[...prev,selected])}
  return <main className="prayer-page">
    <Header/>
    <section className="prayer-hero"><div className="rain"/><div className="prayer-hero-inner">
      <p className="eyebrow">PRE-GLORY CONFERENCE FAST · OCT 22 — NOV 11, 2026</p>
      <h1>21 DAYS<br/><span>TO THE OUTPOURING.</span></h1>
      <p className="prayer-lead">A journey of consecration, prayer and expectation as we prepare our hearts for Glory Conference 2026.</p>
      <div className="prayer-hero-meta"><span>JOEL 2:28</span><span>21 DAYS</span><span>NEW PRAYERS AT 12:00 AM WAT</span></div>
      <a href="#prayer-days" className="button primary">EXPLORE THE PRAYER GUIDE ↓</a>
    </div></section>
    <section className="prayer-intro"><div><p className="eyebrow dark">A HEART MADE READY</p><h2>PREPARE THE VESSEL.<br/>STIR THE FIRE.</h2></div><div><p>Join us daily in Scripture and prayer. Each day's guide opens at midnight Nigerian time. Previous days remain available to revisit.</p></div></section>
    <section id="prayer-days" className="prayer-workspace">
      <div className="prayer-workspace-top"><div><p className="eyebrow dark">YOUR PRAYER JOURNEY</p><h2>THE 21-DAY GUIDE.</h2></div><div className="prayer-progress" aria-label={completed.length+' of 21 days marked complete'}><strong>{completed.length}<small> / 21</small></strong><span>DAYS COMPLETED</span><div className="prayer-progress-track"><div style={{width:(completed.length/21*100)+'%'}}/></div></div></div>
      <div className="prayer-phases">{PHASES.map((p,i)=><button type="button" key={p.name} className={phase===p?'active':''} onClick={()=>choose(p.from)}><small>PHASE 0{i+1} · DAYS {p.from}–{p.to}</small><strong>{p.name}</strong><span>{p.subtitle}</span></button>)}</div>
      <div className="prayer-days-grid" aria-label="Choose a prayer day">{DAYS.map(d=><button key={d.number} type="button" aria-label={'Day '+d.number+': '+(now<d.unlockAt?'Opens on '+dateLabel(d.unlockAt):RELEASED_PRAYERS.some(p=>p.number===d.number)?'Prayer available':'Prayer coming soon')} aria-pressed={selected===d.number} className={'prayer-day-tile'+(selected===d.number?' active':'')+(completed.includes(d.number)?' completed':'')} onClick={()=>choose(d.number)}><small>DAY</small><strong>{String(d.number).padStart(2,'0')}</strong><span>{d.date}</span>{now<d.unlockAt?<small aria-label="Locked">🔒</small>:completed.includes(d.number)?<b aria-label="Completed">✓</b>:null}</button>)}</div>
      <article id="prayer-detail" className="prayer-detail" aria-live="polite">
        <div className="prayer-detail-head"><div><p className="eyebrow">DAY {String(slot.number).padStart(2,'0')} · {slot.date.toUpperCase()} · {phase.name}</p><h2>{prayer?.title||(unlocked?'PRAYER POINTS COMING SOON':'OPENS ON '+dateLabel(slot.unlockAt).toUpperCase())}</h2></div><span className="prayer-detail-count">{String(slot.number).padStart(2,'0')} / 21</span></div>
        {!unlocked?<div className="prayer-locked-state" role="status"><small>THIS DAY IS LOCKED</small><h3>Opens on {dateLabel(slot.unlockAt)} at 12:00 AM (Nigeria time)</h3><p>Prayer points will become available on their scheduled day.</p><p><strong>Time until opening: {remainingText(slot.unlockAt-now)}</strong></p></div>:!prayer?<div className="prayer-locked-state" role="status"><small>AWAITING PUBLICATION</small><h3>Prayer points will be available soon.</h3><p>This day has opened, but its official prayer points have not been uploaded yet.</p></div>:<>
          <div className="prayer-detail-content"><div className="prayer-scripture"><small>TODAY'S SCRIPTURES</small><h3>{prayer.scripture}</h3><p>Read and meditate on these passages before praying.</p></div><div className="prayer-points"><small>PRAYER BURDEN</small><p>{prayer.burden}</p><small>PRAYER POINTS</small><ol>{prayer.prayers.map((point,i)=><li key={i}>{point}</li>)}</ol></div></div>
          <div className="prayer-actions"><button type="button" className="prayer-mark" onClick={toggle}>{completed.includes(selected)?'✓ MARKED AS PRAYED':'✓ MARK DAY AS PRAYED'}</button><div><button type="button" disabled={selected===1} onClick={()=>choose(selected-1)}>← PREVIOUS</button><button type="button" disabled={selected===21} onClick={()=>choose(selected+1)}>NEXT DAY →</button></div></div>
        </>}
        {!prayer&&<div className="prayer-actions"><div><button type="button" disabled={selected===1} onClick={()=>choose(selected-1)}>← PREVIOUS</button><button type="button" disabled={selected===21} onClick={()=>choose(selected+1)}>NEXT DAY →</button></div></div>}
      </article>
      <button className="prayer-overview-toggle" type="button" aria-expanded={showAll} onClick={()=>setShowAll(v=>!v)}>{showAll?'HIDE DAY OVERVIEW ↑':'VIEW ALL 21 DAYS ↓'}</button>
      {showAll&&<div className="prayer-overview">{DAYS.map(d=>{const item=now>=d.unlockAt?RELEASED_PRAYERS.find(p=>p.number===d.number):null;return <button key={d.number} type="button" onClick={()=>choose(d.number)}><span>DAY {String(d.number).padStart(2,'0')}</span><strong>{now<d.unlockAt?'Opens on '+dateLabel(d.unlockAt):item?.title||'Prayer points coming soon'}</strong><small>{item?.scripture||d.date}</small></button>})}</div>}
    </section>
    <section className="prayer-closing"><p className="eyebrow">JOEL 2:28</p><h2>MAKE ROOM FOR<br/>THE OUTPOURING.</h2><p>November 12–14, 2026 · Nsukka, Nigeria</p><a className="button primary" href="/register">REGISTER FOR THE CONFERENCE →</a></section>
    <Footer/>
  </main>
}
