import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { SpecialPage } from './special-pages.jsx'
import './styles.css'
import './home-flow.css'
import './layout-fix.css'
import './giving-accounts.js'
import './home-media.js'
import './special-links.js'

const specialPaths=['/pastors-ministers','/volunteer']
const currentPath=location.pathname.replace(/\/$/,'')||'/'

const pageMeta={
  '/':['Glory Conference 2026 — The Outpouring','Join Glory Conference 2026, November 12–14 in Nsukka, Nigeria.'],
  '/about':['About Glory Conference 2026','Learn about Glory Conference 2026 and The Outpouring.'],
  '/ministers':['Ministers — Glory Conference 2026','Meet the ministers for Glory Conference 2026 in Nsukka.'],
  '/prayer-guide':['Prayer Guide — Glory Conference 2026','Prepare in prayer for The Outpouring at Glory Conference 2026.'],
  '/schedule':['Schedule — Glory Conference 2026','View the November 12–14 schedule and venue for Glory Conference 2026.'],
  '/testimonies':['Testimonies — Glory Conference 2026','Explore stories and reflections from the Glory Conference community.'],
  '/merch':['Official Merchandise — Glory Conference 2026','Shop The Outpouring collection for Glory Conference 2026.'],
  '/giving':['Giving — Glory Conference 2026','Support Glory Conference 2026 through official giving channels.'],
  '/register':['Register — Glory Conference 2026','Register to attend The Outpouring, November 12–14, 2026 in Nsukka.'],
  '/pastors-ministers':['Pastors and Ministers — Glory Conference 2026','Information for pastors and ministers attending Glory Conference 2026.'],
  '/volunteer':['Volunteer — Glory Conference 2026','Express interest in serving at Glory Conference 2026.']
}
const [pageTitle,pageDescription]=pageMeta[currentPath]||pageMeta['/']
document.title=pageTitle
const descriptionTag=document.querySelector('meta[name="description"]')
if(descriptionTag)descriptionTag.setAttribute('content',pageDescription)
for(const [selector,attribute,value] of [
  ['link[rel="canonical"]','href','https://gloryconf.org'+currentPath],
  ['meta[property="og:url"]','content','https://gloryconf.org'+currentPath],
  ['meta[property="og:title"]','content',pageTitle],
  ['meta[property="og:description"]','content',pageDescription],
  ['meta[name="twitter:title"]','content',pageTitle],
  ['meta[name="twitter:description"]','content',pageDescription]
]){const el=document.querySelector(selector);if(el)el.setAttribute(attribute,value)}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {specialPaths.includes(currentPath) ? <SpecialPage /> : <App />}
  </React.StrictMode>,
)
