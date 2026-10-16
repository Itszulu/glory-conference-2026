import { useEffect, useRef, useState } from 'react'

const colourNames = { Black: 'black', 'Navy Blue': 'navy', White: 'white' }

/**
 * Uses the same Three.js preview approved for THE OUTPOURING.
 * Assets are required in public/assets/merch; keep normal media as fallback.
 */
export default function Outpouring3DCard({ colour = 'Black', productId = 'the-outpouring', design = 'Simple Typography', fallback }) {
  const key = colourNames[colour] || 'black'
  const frame = useRef(null)
  const [available, setAvailable] = useState(null)
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    let active = true
    const files = [
      `/assets/merch/models/shirt-${key}.glb`,
      `/assets/merch/designs/outpouring-front-${key}.png`,
      ...(productId === 'the-outpouring' ? [`/assets/merch/designs/outpouring-back-${key}.png`] : []),
      ...(productId === 'made-for-his-glory' && design === 'Simple Typography' ? [`/assets/merch/designs/made-for-his-glory-simple-back-${key}.png`] : []),
    ]
    Promise.all(files.map(async url => {
      const response = await fetch(url, { method: 'HEAD' })
      return response.ok && !response.headers.get('content-type')?.includes('text/html')
    })).then(results => { if (active) setAvailable(results.every(Boolean)) })
      .catch(() => { if (active) setAvailable(false) })
    return () => { active = false }
  }, [key, productId, design])
  useEffect(() => {
    if (available !== true || !loaded) return
    frame.current?.contentWindow?.postMessage({ type: 'gc-shirt-colour', colour: key, productId, design }, window.location.origin)
  }, [key, productId, design, available, loaded])
  if (available === false) return fallback
  return <iframe
    ref={frame}
    onLoad={() => setLoaded(true)}
    className="merch-3d-iframe"
    title="Interactive Outpouring T-shirt: drag to rotate; front, side and back views"
    src={`/merch-3d-preview.html?embed=1&product=${encodeURIComponent(productId)}&design=${encodeURIComponent(design)}`}
    loading="eager"
    allow="fullscreen"
  />
}
