import { useEffect, useState } from 'react'
import { Header, Footer } from './App.jsx'
import './prayer-guide.css'

const DAYS = [
  {
    "number": 1,
    "date": "22 Oct",
    "title": "A Heart Prepared for God",
    "scripture": "Psalm 51:10–12",
    "prayers": [
      "Create in me a clean heart and renew a right spirit within me.",
      "Remove distractions and spiritual weights that hinder fellowship with You.",
      "Awaken a genuine hunger for Your presence."
    ],
    "declaration": "My heart is prepared for the Lord."
  },
  {
    "number": 2,
    "date": "23 Oct",
    "title": "Genuine Repentance",
    "scripture": "Acts 3:19; 1 John 1:9",
    "prayers": [
      "Expose and cleanse every hidden sin and compromise.",
      "Give me grace to turn from everything that displeases You.",
      "Let repentance produce lasting transformation."
    ],
    "declaration": "I walk in repentance and renewal."
  },
  {
    "number": 3,
    "date": "24 Oct",
    "title": "Consecration and Holiness",
    "scripture": "Romans 12:1–2; 2 Timothy 2:21",
    "prayers": [
      "I present my body, mind and desires as a living sacrifice.",
      "Sanctify my thoughts, words, decisions and relationships.",
      "Make me a vessel of honour, prepared for Your use."
    ],
    "declaration": "I am set apart for God's purpose."
  },
  {
    "number": 4,
    "date": "25 Oct",
    "title": "Hunger and Thirst for God",
    "scripture": "Psalm 63:1–2; Matthew 5:6",
    "prayers": [
      "Restore my first love and passion for Your presence.",
      "Deliver me from spiritual complacency.",
      "Let my desire for You overcome every distraction."
    ],
    "declaration": "My soul thirsts for the living God."
  },
  {
    "number": 5,
    "date": "26 Oct",
    "title": "The Altar of Prayer",
    "scripture": "Luke 18:1; 1 Thessalonians 5:17",
    "prayers": [
      "Rekindle consistency and fervency in my prayer life.",
      "Deliver me from prayerlessness and discouragement.",
      "Raise a fresh altar of communion in my heart and home."
    ],
    "declaration": "My prayer altar will not grow cold."
  },
  {
    "number": 6,
    "date": "27 Oct",
    "title": "The Word and Spiritual Understanding",
    "scripture": "Colossians 3:16; Psalm 119:18",
    "prayers": [
      "Open my understanding to the truth of Your Word.",
      "Give me grace to meditate on and obey Scripture.",
      "Let Your Word renew my mind and strengthen my faith."
    ],
    "declaration": "The Word of Christ dwells richly in me."
  },
  {
    "number": 7,
    "date": "28 Oct",
    "title": "Total Surrender to God's Will",
    "scripture": "Luke 22:42; Proverbs 3:5–6",
    "prayers": [
      "Bring my ambitions and desires into alignment with Your will.",
      "Break every resistance to Your leading.",
      "Teach me to trust and obey even when I do not understand."
    ],
    "declaration": "Not my will, but Yours be done."
  },
  {
    "number": 8,
    "date": "29 Oct",
    "title": "Fresh Fire of the Holy Spirit",
    "scripture": "Acts 2:1–4; Matthew 3:11",
    "prayers": [
      "Rekindle the fire of Your Spirit within me.",
      "Let every area of spiritual coldness come alive.",
      "Baptize Your Church afresh with holy passion and boldness."
    ],
    "declaration": "The fire of the Spirit burns afresh in me."
  },
  {
    "number": 9,
    "date": "30 Oct",
    "title": "The Promise of the Father",
    "scripture": "Joel 2:28–29; Acts 1:4–5",
    "prayers": [
      "Prepare our hearts to receive all You desire to do.",
      "Let Your Spirit be poured out across generations and families.",
      "Remove unbelief and strengthen our expectation."
    ],
    "declaration": "I receive God's promise with faith."
  },
  {
    "number": 10,
    "date": "31 Oct",
    "title": "The Spirit of Wisdom and Revelation",
    "scripture": "Ephesians 1:17–19",
    "prayers": [
      "Grant us wisdom and revelation in knowing Christ.",
      "Open our eyes to the hope of Your calling.",
      "Let the conference teaching produce understanding."
    ],
    "declaration": "My understanding is enlightened by the Spirit."
  },
  {
    "number": 11,
    "date": "1 Nov",
    "title": "Boldness and Spiritual Empowerment",
    "scripture": "Acts 4:29–31; Acts 1:8",
    "prayers": [
      "Fill believers with boldness to proclaim the Gospel.",
      "Strengthen us to witness for Christ.",
      "Let Your power work through surrendered vessels."
    ],
    "declaration": "I am empowered to witness for Christ."
  },
  {
    "number": 12,
    "date": "2 Nov",
    "title": "The Gifts and Fruit of the Spirit",
    "scripture": "1 Corinthians 12:4–11; Galatians 5:22–23",
    "prayers": [
      "Stir up spiritual gifts according to Your will.",
      "Let every manifestation glorify Jesus and build up the Church.",
      "Produce lasting fruit and Christlike character."
    ],
    "declaration": "I pursue love and serve through the Spirit."
  },
  {
    "number": 13,
    "date": "3 Nov",
    "title": "Revival in the Church",
    "scripture": "Habakkuk 3:2; Psalm 85:6",
    "prayers": [
      "Revive Your work in our generation.",
      "Restore holiness, prayer, love and sound doctrine.",
      "Let renewal spread from churches into communities."
    ],
    "declaration": "Lord, revive Your work in our midst."
  },
  {
    "number": 14,
    "date": "4 Nov",
    "title": "Intercession for Souls",
    "scripture": "1 Timothy 2:1–4; Matthew 9:37–38",
    "prayers": [
      "Draw the unsaved to repentance and faith in Jesus.",
      "Raise labourers with compassion for lost souls.",
      "Use Glory Conference to make the Gospel known."
    ],
    "declaration": "Souls will hear the Gospel and turn to Christ."
  },
  {
    "number": 15,
    "date": "5 Nov",
    "title": "Praying for the Ministers",
    "scripture": "Colossians 4:3–4; Ephesians 6:19–20",
    "prayers": [
      "Strengthen Prophet Joshua Ohanye and every minister serving.",
      "Grant them clarity, boldness and faithfulness in the Word.",
      "Protect their families, health and spiritual lives."
    ],
    "declaration": "God's servants will minister with grace and clarity."
  },
  {
    "number": 16,
    "date": "6 Nov",
    "title": "Unity Among Workers and Volunteers",
    "scripture": "Psalm 133:1–3; Philippians 2:2–4",
    "prayers": [
      "Establish unity, humility and love among the teams.",
      "Give strength and diligence to every volunteer.",
      "Remove confusion and strife from preparations."
    ],
    "declaration": "We serve together in love and unity."
  },
  {
    "number": 17,
    "date": "7 Nov",
    "title": "Divine Provision and Resources",
    "scripture": "Philippians 4:19; 2 Corinthians 9:8",
    "prayers": [
      "Supply the resources required for the conference.",
      "Raise willing and faithful partners.",
      "Give leadership wisdom and integrity in stewardship."
    ],
    "declaration": "God will provide what is needed for His work."
  },
  {
    "number": 18,
    "date": "8 Nov",
    "title": "Protection and Peace",
    "scripture": "Psalm 121:7–8; 2 Thessalonians 3:3",
    "prayers": [
      "Preserve attendees and ministers travelling to Nsukka.",
      "Grant peace, order and safety throughout the gathering.",
      "Give wisdom to logistics and security teams."
    ],
    "declaration": "The Lord watches over our going out and coming in."
  },
  {
    "number": 19,
    "date": "9 Nov",
    "title": "Hearts Ready for Encounter",
    "scripture": "Hosea 10:12; Jeremiah 29:13",
    "prayers": [
      "Prepare attendees to receive Your Word with humility.",
      "Remove distractions, unbelief and hardened hearts.",
      "Let worship, prayer and preaching point to Jesus."
    ],
    "declaration": "We seek the Lord with all our hearts."
  },
  {
    "number": 20,
    "date": "10 Nov",
    "title": "An Outpouring Across Generations",
    "scripture": "Joel 2:28–29; Acts 2:17–18",
    "prayers": [
      "Let young and old experience renewed devotion.",
      "Raise a generation grounded in Scripture and empowered by the Spirit.",
      "Let the gathering's impact reach families and communities."
    ],
    "declaration": "May Your Spirit work across every generation."
  },
  {
    "number": 21,
    "date": "11 Nov",
    "title": "Thanksgiving and Great Expectation",
    "scripture": "Psalm 100:4–5; Ephesians 3:20–21",
    "prayers": [
      "Thank You for sustaining us through these days of prayer.",
      "We commit every session and attendee into Your hands.",
      "May Jesus be glorified and the fruit remain."
    ],
    "declaration": "All glory belongs to Jesus Christ."
  }
]
const PHASES = [{name:'PREPARE THE VESSEL',subtitle:'Consecration & intimacy',from:1,to:7},{name:'STIR THE FIRE',subtitle:'Empowerment & revival',from:8,to:14},{name:'MAKE ROOM',subtitle:'Intercession for the gathering',from:15,to:21}]
export default function PrayerGuidePage(){
  const [selected,setSelected]=useState(1)
  const [completed,setCompleted]=useState(()=>{try{return JSON.parse(localStorage.getItem('gc26-prayer-completed')||'[]').filter(n=>Number.isInteger(n)&&n>=1&&n<=21)}catch{return []}})
  const [showAll,setShowAll]=useState(false)
  const day=DAYS[selected-1],phase=PHASES.find(p=>selected>=p.from&&selected<=p.to)
  useEffect(()=>{try{localStorage.setItem('gc26-prayer-completed',JSON.stringify(completed))}catch{}},[completed])
  useEffect(()=>{document.title='21-Day Prayer Guide | Glory Conference 2026';return()=>{document.title='Glory Conference 2026'}},[])
  const choose=n=>{setSelected(n);document.getElementById('prayer-detail')?.scrollIntoView({behavior:'smooth',block:'start'})}
  const toggle=()=>setCompleted(prev=>prev.includes(selected)?prev.filter(n=>n!==selected):[...prev,selected])
  return <main className="prayer-page">
    <Header/>
    <section className="prayer-hero"><div className="rain"/><div className="prayer-hero-inner">
      <p className="eyebrow">PRE-GLORY CONFERENCE FAST · OCT 22 — NOV 11, 2026</p>
      <h1>21 DAYS<br/><span>TO THE OUTPOURING.</span></h1>
      <p className="prayer-lead">A journey of consecration, prayer and expectation as we prepare our hearts for Glory Conference 2026.</p>
      <div className="prayer-hero-meta"><span>JOEL 2:28</span><span>21 DAYS</span><span>3 PHASES</span></div>
      <a href="#prayer-days" className="button primary">EXPLORE THE PRAYER GUIDE ↓</a>
    </div></section>
    <section className="prayer-intro"><div><p className="eyebrow dark">A HEART MADE READY</p><h2>PREPARE THE VESSEL.<br/>STIR THE FIRE.</h2></div><div><p>Set aside time each day to read the Scriptures, pray through the points and reflect on the declaration. You can return to any day at any time.</p><p className="prayer-note">This is a provisional preparation guide. The official daily prayer points from the conference pastor will be added when received.</p></div></section>
    <section id="prayer-days" className="prayer-workspace">
      <div className="prayer-workspace-top"><div><p className="eyebrow dark">YOUR PRAYER JOURNEY</p><h2>THE 21-DAY GUIDE.</h2></div><div className="prayer-progress" aria-label={completed.length+' of 21 days marked complete'}><strong>{completed.length}<small> / 21</small></strong><span>DAYS COMPLETED</span><div className="prayer-progress-track"><div style={{width:(completed.length/21*100)+'%'}}/></div></div></div>
      <div className="prayer-phases">{PHASES.map((p,i)=><button type="button" key={p.name} className={phase===p?'active':''} onClick={()=>choose(p.from)}><small>PHASE 0{i+1} · DAYS {p.from}–{p.to}</small><strong>{p.name}</strong><span>{p.subtitle}</span></button>)}</div>
      <div className="prayer-days-grid" aria-label="Choose a prayer day">{DAYS.map(d=><button key={d.number} type="button" aria-label={'Day '+d.number+': '+d.title} aria-pressed={selected===d.number} className={'prayer-day-tile'+(selected===d.number?' active':'')+(completed.includes(d.number)?' completed':'')} onClick={()=>choose(d.number)}><small>DAY</small><strong>{String(d.number).padStart(2,'0')}</strong><span>{d.date}</span>{completed.includes(d.number)&&<b aria-label="Completed">✓</b>}</button>)}</div>
      <article id="prayer-detail" className="prayer-detail" aria-live="polite">
        <div className="prayer-detail-head"><div><p className="eyebrow">DAY {String(day.number).padStart(2,'0')} · {day.date.toUpperCase()} · {phase.name}</p><h2>{day.title}</h2></div><span className="prayer-detail-count">{String(day.number).padStart(2,'0')} / 21</span></div>
        <div className="prayer-detail-content"><div className="prayer-scripture"><small>TODAY'S SCRIPTURE</small><h3>{day.scripture}</h3><p>Read and meditate on these passages before praying.</p></div><div className="prayer-points"><small>PRAYER FOCUS</small><ol>{day.prayers.map((point,i)=><li key={i}>{point}</li>)}</ol></div></div>
        <div className="prayer-declaration"><small>DAILY DECLARATION</small><p>“{day.declaration}”</p></div>
        <div className="prayer-actions"><button type="button" className="prayer-mark" onClick={toggle}>{completed.includes(selected)?'✓ MARKED AS PRAYED':'✓ MARK DAY AS PRAYED'}</button><div><button type="button" disabled={selected===1} onClick={()=>choose(selected-1)}>← PREVIOUS</button><button type="button" disabled={selected===21} onClick={()=>choose(selected+1)}>NEXT DAY →</button></div></div>
      </article>
      <button className="prayer-overview-toggle" type="button" aria-expanded={showAll} onClick={()=>setShowAll(v=>!v)}>{showAll?'HIDE ALL DAY TITLES ↑':'VIEW ALL 21 DAY TITLES ↓'}</button>
      {showAll&&<div className="prayer-overview">{DAYS.map(d=><button key={d.number} type="button" onClick={()=>choose(d.number)}><span>DAY {String(d.number).padStart(2,'0')}</span><strong>{d.title}</strong><small>{d.scripture}</small></button>)}</div>}
    </section>
    <section className="prayer-closing"><p className="eyebrow">JOEL 2:28</p><h2>MAKE ROOM FOR<br/>THE OUTPOURING.</h2><p>November 12–14, 2026 · Nsukka, Nigeria</p><a className="button primary" href="/register">REGISTER FOR THE CONFERENCE →</a></section>
    <Footer/>
  </main>
}
