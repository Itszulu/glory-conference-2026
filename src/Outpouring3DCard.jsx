import { useEffect, useState } from 'react'

const colourNames = { Black: 'black', 'Navy Blue': 'navy', White: 'white' }

/**
 * Uses the same Three.js preview approved for THE OUTPOURING.
 * Assets are required in public/assets/merch; keep normal media as fallback.
 */
export default function Outpouring3DCard({ colour = 'Black', fallback }) {
  const key = colourNames[colour] || 'black'
  const [available, setAvailable] = useState(false)
  useEffect(() => {
    let active = true
    const files = [
      `/assets/merch/models/shirt-${key}.glb`,
      `/assets/merch/designs/outpouring-front-${key}.png`,
      `/assets/merch/designs/outpouring-back-${key}.png`,
    ]
    setAvailable(false)
    Promise.all(files.map(async url => {
      const response = await fetch(url, { method: 'HEAD' })
      return response.ok && !response.headers.get('content-type')?.includes('text/html')
    })).then(results => { if (active) setAvailable(results.every(Boolean)) })
      .catch(() => { if (active) setAvailable(false) })
    return () => { active = false }
  }, [key])
  if (!available) return fallback
  return <iframe
    key={key}
    className="merch-3d-iframe"
    title={`Interactive ${colour} Outpouring T-shirt: drag to rotate; front, side and back views`}
    src={`/merch-3d-preview.html?embed=1&color=${key}`}
    loading="lazy"
    allow="fullscreen"
  />
}
