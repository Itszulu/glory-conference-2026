import { useEffect, useRef, useState } from 'react'

const colourNames = { Black: 'black', 'Navy Blue': 'navy', White: 'white' }

/**
 * Only mount a resource-intensive Three.js preview when its product is near
 * the viewport. Parent/iframe use a ready handshake so fast taps are not
 * lost before the iframe's ES module has registered its message listener.
 */
export default function Outpouring3DCard({ colour = 'Black', productId = 'the-outpouring', design = 'Simple Typography', fallback }) {
  const key = colourNames[colour] || 'black'
  const hostRef = useRef(null)
  const iframeRef = useRef(null)
  const selectionRef = useRef({ colour: key, productId, design })
  const initialSelectionRef = useRef({ colour: key, productId, design })
  const readyRef = useRef(false)
  const [nearViewport, setNearViewport] = useState(false)

  selectionRef.current = { colour: key, productId, design }

  useEffect(() => {
    const node = hostRef.current
    if (!node) return
    if (!('IntersectionObserver' in window)) {
      setNearViewport(true)
      return
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) setNearViewport(true)
    }, { rootMargin: '350px 0px', threshold: 0 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const sendSelection = () => {
    const iframeWindow = iframeRef.current?.contentWindow
    if (!iframeWindow || !readyRef.current) return
    const next = selectionRef.current
    iframeWindow.postMessage({
      type: 'gc-shirt-colour',
      colour: next.colour,
      productId: next.productId,
      design: next.design
    }, window.location.origin)
  }

  useEffect(() => {
    const onMessage = event => {
      if (event.origin !== window.location.origin ||
          event.source !== iframeRef.current?.contentWindow ||
          event.data?.type !== 'gc-shirt-ready') return
      readyRef.current = true
      sendSelection()
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  useEffect(() => {
    sendSelection()
  }, [key, productId, design, nearViewport])

  const initial = initialSelectionRef.current
  return <div ref={hostRef} className="gc-merch-viewer-host">
    {nearViewport
      ? <iframe
          ref={iframeRef}
          className="merch-3d-iframe"
          title={`Interactive 3D T-shirt viewer: ${productId}`}
          src={`/merch-3d-preview.html?embed=1&product=${encodeURIComponent(initial.productId)}&design=${encodeURIComponent(initial.design)}&color=${encodeURIComponent(initial.colour)}`}
          loading="lazy"
          onLoad={() => sendSelection()}
          allow="fullscreen"
        />
      : fallback}
  </div>
}
