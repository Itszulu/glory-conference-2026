import { useEffect, useRef, useState } from 'react'

const colourNames = { Black: 'black', 'Navy Blue': 'navy', White: 'white' }

/**
 * Uses the same Three.js preview approved for THE OUTPOURING.
 * Assets are required in public/assets/merch; keep normal media as fallback.
 */
export default function Outpouring3DCard({ colour = 'Black', productId = 'the-outpouring', design = 'Simple Typography', fallback }) {
  const key = colourNames[colour] || 'black'
  const frame = useRef(null)
  const initialSelection = useRef({ colour: key, design })
  const [available, setAvailable] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [droughtArtwork, setDroughtArtwork] = useState({ colour: '', url: '' })
  useEffect(() => {
    let active = true
    const files = [
      `/assets/merch/models/shirt-${key}.glb`,
      `/assets/merch/designs-webp/outpouring-front-${key}.webp`,
      ...(productId === 'the-outpouring' ? [`/assets/merch/designs-webp/outpouring-back-${key}.webp`] : []),
      ...(productId === 'made-for-his-glory' && design === 'Simple Typography' ? [`/assets/merch/designs-webp/made-for-his-glory-simple-back-${key}.webp`] : []),
      ...(productId === 'made-for-his-glory' && design === 'Bold Design' ? [`/assets/merch/designs-webp/made-for-his-glory-bold-back-${key}.webp`] : []),
      ...(productId === 'not-empty-overflowing' ? [`/assets/merch/designs-webp/not-empty-overflowing-back-${key}.webp`] : []),
      ...(productId === 'no-more-shame' ? [`/assets/merch/designs/NO_MORE_SHAME_NOW_GLORY_BACK_${key.toUpperCase()}.png`] : []),

    ]
    const isValid = async url => {
      try {
        const response = await fetch(url, { method: 'HEAD' })
        return response.ok && !response.headers.get('content-type')?.includes('text/html')
      } catch { return false }
    }
    const droughtNames = [
      'THE_DROUGHT_IS_OVER_BACK_' + key.toUpperCase(),
      'THE_DROUGHT_IS_OVER_BACK_' + key,
      'THE_DROUGHT_IS_OVER_back_' + key,
      'THE_DROUGHT_IS_OVER_BACK_' + (key === 'navy' ? 'NAVY_BLUE' : key.toUpperCase()),
      'THE_DROUGHT_IS_OVER_back_' + (key === 'navy' ? 'navy' : key),
      'THE_DROUGHT_IS_OVER_BACK_' + key + '_6000x7500',
    ]
    Promise.all([
      Promise.all(files.map(isValid)),
      productId === 'drought-is-over'
        ? (async () => {
            for (const name of droughtNames) {
              const url = '/assets/merch/designs-webp/' + name + '.webp'
              if (await isValid(url)) return url
            }
            return ''
          })()
        : Promise.resolve('')
    ]).then(([results, artwork]) => {
      if (!active) return
      // Garment colour is independent of whether its print PNG exists.
      if (productId === 'drought-is-over') setDroughtArtwork({ colour: key, url: artwork })
      setAvailable(results.every(Boolean))
    })
    return () => { active = false }
  }, [key, productId, design])
  useEffect(() => {
    if (!loaded) return
    const artwork = droughtArtwork.colour === key ? droughtArtwork.url : ''
    frame.current?.contentWindow?.postMessage({ type: 'gc-shirt-colour', colour: key, productId, design, backArtwork: artwork }, window.location.origin)
  }, [key, productId, design, droughtArtwork, loaded])
  if (available === false && productId !== 'drought-is-over') return fallback
  return <iframe
    ref={frame}
    onLoad={() => setLoaded(true)}
    className="merch-3d-iframe"
    title="Interactive 3D T-shirt viewer"
    src={`/merch-3d-preview.html?embed=1&product=${encodeURIComponent(productId)}&design=${encodeURIComponent(initialSelection.current.design)}&color=${encodeURIComponent(initialSelection.current.colour)}`}
    loading="lazy"
    allow="fullscreen"
  />
}
