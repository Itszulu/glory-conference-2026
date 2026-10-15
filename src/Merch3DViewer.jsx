import { useEffect, useRef, useState } from 'react'

/**
 * Progressive-enhancement 3D merch viewer.
 * Put a real GLB at /public/assets/merch/models/the-outpouring.glb
 * (public URL: /assets/merch/models/the-outpouring.glb).
 * A model may include mesh names "Garment" and "Print" to allow fabric
 * recolouring without affecting printed artwork.
 */
export default function Merch3DViewer({ modelSrc, colour = 'Black', fallback, alt = 'Merchandise' }) {
  const host = useRef(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(false)
  useEffect(() => { setError(false) }, [modelSrc])
  useEffect(() => {
    if (!modelSrc) return
    let active = true
    (async () => {
      if (!customElements.get('model-viewer')) {
        await new Promise((resolve, reject) => {
          const existing = document.querySelector('script[data-gc-model-viewer]')
          if (existing) { existing.addEventListener('load', resolve, { once: true }); existing.addEventListener('error', reject, { once: true }); return }
          const script = document.createElement('script')
          script.type = 'module'
          script.dataset.gcModelViewer = 'true'
          script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/4.1.0/model-viewer.min.js'
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
      }
      await customElements.whenDefined('model-viewer')
      if (active) setReady(true)
    })().catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [modelSrc])
  useEffect(() => {
    const model = host.current
    if (!model || !ready) return
    const recolour = () => {
      if (!model.model) return
      const hex = { White: '#f7f7f4', 'Navy Blue': '#172747', Black: '#171717' }[colour] || '#171717'
      for (const material of model.model.materials || []) {
        // Only recolour explicitly labelled fabric; protect the artwork.
        if (/fabric|garment|shirt|cloth/i.test(material.name) && !/print|logo|art/i.test(material.name)) {
          material.pbrMetallicRoughness.setBaseColorFactor(hex)
        }
      }
    }
    model.addEventListener('load', recolour)
    recolour()
    return () => model.removeEventListener('load', recolour)
  }, [colour, ready])
  if (!modelSrc || error || !ready) return fallback || <div role="img" aria-label={alt}>3D preview coming soon</div>
  return <div className="merch-3d-viewer">
    <model-viewer ref={host} src={modelSrc} alt={alt} camera-controls touch-action="pan-y"
      auto-rotate={false} shadow-intensity="1" exposure="1" environment-image="neutral"
      camera-orbit="0deg 75deg auto" onError={() => setError(true)} style={{ width: '100%', height: '100%', minHeight: 340, background: 'transparent' }} />
    <div className="merch-3d-angles">
      {[[ 'FRONT', '0deg 75deg auto' ], [ 'SIDE', '90deg 75deg auto' ], [ 'BACK', '180deg 75deg auto' ]].map(([label, orbit]) =>
        <button key={label} type="button" onClick={() => { if (host.current) host.current.cameraOrbit = orbit }}>{label}</button>
      )}
    </div>
    <small className="merch-3d-hint">Drag to rotate · Scroll or pinch to zoom</small>
  </div>
}
