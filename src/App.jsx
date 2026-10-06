import { useEffect, useState } from 'react'

const ministers = [
  ['HOST', 'PROPHET JOSHUA OHANYE', 'Leading Glory Conference 2026'],
  ['MUSIC MINISTER', 'CHINYERE UDOMA', 'Ministering in worship'],
  ['MUSIC MINISTER', 'REV. CHRIS OKOLO', 'Ministering in worship'],
]

const sessions = [
  ['THU · NOV 12', 'OPENING NIGHT', '4:00 PM', 'An evening of worship, the Word and encounter.'],
  ['FRI · NOV 13', 'OUTPOURING NIGHT', '4:00 PM', 'A gathering in expectation of the move of the Spirit.'],
  ['SAT · NOV 14', 'GRAND FINALE', '9:00 AM', 'The conference finale and final gathering.'],
]

export default function App() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeMenu = () => setMenuOpen(false)

  return <main>
    <section className="hero" id="home">
      <div className="rain"/><div className="hero-glow"/><div className="mist mist-one"/><div className="mist mist-two"/>
      <header className={scrolled ? 'nav nav-scrolled' : 'nav'}>
        <a className="brand" href="#home" onClick={closeMenu}><span className="brand-mark">GC</span><span>GLORY CONFERENCE<br/><b>2026</b></span></a>
        <nav className={menuOpen ? 'nav-links open' : 'nav-links'}><a onClick={closeMenu} href="#about">ABOUT</a><a onClick={closeMenu} href="#ministers">MINISTERS</a><a onClick={closeMenu} href="#schedule">SCHEDULE</a><a onClick={closeMenu} href="#testimonies">TESTIMONIES</a></nav>
        <a className="nav-cta" href="#register">REGISTER</a>
        <button className="menu-button" aria-label="Toggle menu" onClick={()=>setMenuOpen(!menuOpen)}><span/><span/></button>
      </header>
      <div className="hero-content reveal">
        <p className="eyebrow">GLORY CONFERENCE 2026 PRESENTS</p>
        <h1><span>THE</span> OUTPOURING</h1>
        <p className="scripture">“Until the Spirit is poured upon us from on high...” <b>ISAIAH 32:15</b></p>
        <p className="date">NOVEMBER 12 — 14, 2026 · NSUKKA</p>
        <div className="actions"><a className="button primary" href="#register">REGISTER NOW →</a><a className="button ghost" href="#teaser">▶ WATCH TEASER</a></div>
      </div>
      <a className="scroll-cue" href="#teaser"><span>SCROLL TO ENTER</span><i>↓</i></a>
    </section>

    <section className="section-dark center feature" id="teaser"><p className="eyebrow">3 DAYS OF HIS PRESENCE</p><h2>THE OUTPOURING</h2><p>Three days set apart for worship, the Word, encounters and the transforming work of the Holy Spirit.</p><div className="video-shell"><div className="play">▶</div><small>OFFICIAL CONFERENCE TEASER · COMING SOON</small></div></section>

    <section className="section-dark ministers" id="ministers"><div className="section-heading"><div><p className="eyebrow">GLORY CONFERENCE 2026</p><h2>MINISTERING</h2></div><p>Voices and ministers joining us for three unforgettable days in Nsukka.</p></div><div className="minister-grid">{ministers.map(([role,name,copy],i)=><article className="minister-card" key={name}><div className={'portrait portrait-'+(i+1)}><span className="portrait-placeholder">PORTRAIT<br/>COMING IN</span></div><div className="minister-info"><span>{role}</span><h3>{name}</h3><p>{copy}</p></div></article>)}</div></section>

    <section className="about" id="about"><div><p className="eyebrow dark">WHAT IS</p><h2>GLORY<br/>CONFERENCE?</h2></div><div className="about-copy"><p>Glory Conference is a gathering centered on the presence of God, the Word and the transforming work of the Holy Spirit.</p><p>In 2026, we gather under one prophetic theme: <strong>The Outpouring.</strong></p><p className="about-scripture">UNTIL THE SPIRIT IS POURED UPON US FROM ON HIGH · ISAIAH 32:15</p></div></section>

    <section className="section-dark schedule" id="schedule"><div className="schedule-intro"><p className="eyebrow">SAVE THE DATE</p><h2>NSUKKA</h2><p className="schedule-date">NOVEMBER<br/>12TH — 14TH</p><p className="venue">NO. 4 UWANI UGWU STREET<br/>OFF IKENGA JUNCTION, NSUKKA.</p></div><div className="session-list">{sessions.map(([day,title,time,copy])=><article className="session" key={day}><div><span>{day}</span><h3>{title}</h3><p>{copy}</p></div><strong>{time}</strong></article>)}<a className="button primary" href="#register">REGISTER NOW →</a></div></section>

    <section className="section-dark center testimonies" id="testimonies"><p className="eyebrow">STORIES OF ENCOUNTER</p><h2>TESTIMONIES FROM<br/>PAST CONFERENCES</h2><div className="testimony-grid"><blockquote><span>01</span>“I came expecting a meeting, but I left with a renewed hunger for God.”</blockquote><blockquote><span>02</span>“The atmosphere, the Word and worship marked a new beginning for me.”</blockquote><blockquote><span>03</span>“God restored my faith and gave me clarity for the season ahead.”</blockquote></div><p className="content-note">Real testimony stories and gallery images will replace these placeholders as they are supplied.</p></section>

    <section className="final-cta center" id="register"><div className="cta-water"/><p className="eyebrow">NOVEMBER 12 — 14, 2026 · NSUKKA</p><h2>COME EXPECTING<br/><span>THE OUTPOURING.</span></h2><p>Registration details will be announced soon.</p><a className="button light" href="#home">RETURN TO TOP ↑</a></section>
    <footer><span>GLORY CONFERENCE 2026</span><span>THE OUTPOURING · ISAIAH 32:15</span><span>NSUKKA · NIGERIA</span></footer>
  </main>
}
