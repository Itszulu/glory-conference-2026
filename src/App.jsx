import { useEffect, useState } from 'react'

const ministers = [
  ['HOST', 'PROPHET JOSHUA OHANYE'],
  ['MUSIC MINISTER', 'CHINYERE UDOMA'],
  ['MUSIC MINISTER', 'REV. CHRIS OKOLO'],
]

export default function App() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return <main>
    <section className="hero" id="home">
      <div className="rain" /><div className="hero-glow" />
      <header className={scrolled ? 'nav nav-scrolled' : 'nav'}>
        <a className="brand" href="#home"><span className="brand-mark">GC</span><span>GLORY CONFERENCE<br/><b>2026</b></span></a>
        <nav><a href="#about">ABOUT</a><a href="#ministers">MINISTERS</a><a href="#schedule">SCHEDULE</a><a href="#testimonies">TESTIMONIES</a></nav>
        <a className="nav-cta" href="#register">REGISTER</a>
      </header>
      <div className="hero-content">
        <p className="eyebrow">GLORY CONFERENCE 2026 PRESENTS</p>
        <h1><span>THE</span> OUTPOURING</h1>
        <p className="scripture">“Until the Spirit is poured upon us from on high...” <b>ISAIAH 32:15</b></p>
        <p className="date">NOVEMBER 12 — 14, 2026</p>
        <div className="actions"><a className="button primary" href="#register">REGISTER NOW →</a><a className="button ghost" href="#teaser">▶ WATCH TEASER</a></div>
      </div>
    </section>

    <section className="section-dark center" id="teaser"><p className="eyebrow">3 DAYS OF HIS PRESENCE</p><h2>THE OUTPOURING</h2><p>A gathering for encounters, transformation and an outpouring of the Spirit.</p><div className="video-shell"><span>▶</span><small>OFFICIAL CONFERENCE TEASER</small></div></section>

    <section className="section-dark" id="ministers"><p className="eyebrow">GLORY CONFERENCE 2026</p><h2>MINISTERING</h2><div className="minister-grid">{ministers.map(([role,name],i)=><article className="minister-card" key={name}><div className={'portrait portrait-'+(i+1)}></div><span>{role}</span><h3>{name}</h3></article>)}</div></section>

    <section className="about" id="about"><div><p className="eyebrow dark">WHAT IS</p><h2>GLORY<br/>CONFERENCE?</h2></div><div className="about-copy"><p>Glory Conference is a gathering centered on the presence of God, the Word and the transforming work of the Holy Spirit.</p><p>In 2026, we gather under one prophetic theme: <strong>The Outpouring.</strong></p></div></section>

    <section className="section-dark schedule" id="schedule"><div><p className="eyebrow">GLORY CONFERENCE 2026</p><h2>NSUKKA</h2><p className="schedule-date">NOVEMBER<br/>12TH — 14TH</p></div><div className="schedule-details"><p><span>12TH & 13TH</span><strong>4:00 PM</strong></p><p><span>14TH — FINALE</span><strong>9:00 AM</strong></p><p>NO. 4 UWANI UGWU STREET, OFF IKENGA JUNCTION, NSUKKA.</p><a className="button primary" href="#register">REGISTER NOW →</a></div></section>

    <section className="section-dark center" id="testimonies"><p className="eyebrow">STORIES OF ENCOUNTER</p><h2>TESTIMONIES FROM<br/>PAST CONFERENCES</h2><div className="testimony-grid"><blockquote>“I came expecting a meeting, but I left with a renewed hunger for God.”</blockquote><blockquote>“The atmosphere, the Word and worship marked a new beginning for me.”</blockquote><blockquote>“God restored my faith and gave me clarity for the season ahead.”</blockquote></div></section>

    <section className="final-cta center" id="register"><p className="eyebrow">NOVEMBER 12 — 14, 2026</p><h2>COME EXPECTING<br/><span>THE OUTPOURING.</span></h2><a className="button light" href="#home">REGISTRATION OPENING SOON →</a></section>
    <footer><span>GLORY CONFERENCE 2026</span><span>THE OUTPOURING · ISAIAH 32:15</span></footer>
  </main>
}
