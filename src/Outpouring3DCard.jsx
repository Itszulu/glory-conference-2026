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
  const [droughtArtwork, setDroughtArtwork] = useState('')
  useEffect(() => {
    let active = true
    const files = [
      `/assets/merch/models/shirt-${key}.glb`,
      ...(productId !== 'drought-is-over' ? [`/assets/merch/designs/outpouring-front-${key}.png`] : []),
      ...(productId === 'the-outpouring' ? [`/assets/merch/designs/outpouring-back-${key}.png`] : []),
      ...(productId === 'made-for-his-glory' && design === 'Simple Typography' ? [`/assets/merch/designs/made-for-his-glory-simple-back-${key}.png`] : []),
      ...(productId === 'made-for-his-glory' && design === 'Bold Design' ? [`/assets/merch/designs/made-for-his-glory-bold-back-${key}.png`] : []),
      ...(productId === 'not-empty-overflowing' ? [`/assets/merch/designs/not-empty-overflowing-back-${key}.png`] : []),

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
    ]
    Promise.all([
      Promise.all(files.map(isValid)),
      productId === 'drought-is-over'
        ? (async () => {
            for (const name of droughtNames) {
              const url = '/assets/merch/designs/' + name + '.png'
              if (await isValid(url)) return url
            }
            return ''
          })()
        : Promise.resolve('')
    ]).then(([results, artwork]) => {
      if (!active) return
      setDroughtArtwork(artwork)
      setAvailable(results.every(Boolean) && (productId !== 'drought-is-over' || Boolean(artwork)))
    })
    return () => { active = false }
  }, [key, productId, design])
  useEffect(() => {
    if (available !== true || !loaded) return
    frame.current?.contentWindow?.postMessage({ type: 'gc-shirt-colour', colour: key, productId, design, backArtwork: droughtArtwork }, window.location.origin)
  }, [key, productId, design, droughtArtwork, available, loaded])
  if (available === false) return fallback
  return <iframe
    ref={frame}
    onLoad={() => setLoaded(true)}
    className="merch-3d-iframe"
    title="Interactive Outpouring T-shirt: drag to rotate; front, side and back views"
    src={`/merch-3d-preview.html?embed=1&product=${encodeURIComponent(productId)}&design=${encodeURIComponent(initialSelection.current.design)}&color=${encodeURIComponent(initialSelection.current.colour)}&backArtwork=${encodeURIComponent(droughtArtwork)}`}
    loading="eager"
    allow="fullscreen"
  />
}
