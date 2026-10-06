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

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {specialPaths.includes(currentPath) ? <SpecialPage /> : <App />}
  </React.StrictMode>,
)
