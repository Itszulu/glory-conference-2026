# THE OUTPOURING — 3D viewer setup

This prototype lives on branch `feature/merch-3d-viewer` and is **not deployed**.

1. Download the prototype GLB from the ChatGPT conversation.
2. Create `public/assets/merch/models/` inside the project if it does not exist.
3. Save the model as `public/assets/merch/models/the-outpouring-prototype.glb`.
4. In the project root, run `npm ci` and then `npm run dev`.
5. Visit `/merch` and find **THE OUTPOURING**. Drag to rotate, pinch/scroll to zoom, and use the FRONT/SIDE/BACK buttons. Change the product colour to test fabric recolouring.

The component in `src/Merch3DViewer.jsx` loads Google's model-viewer library from its public CDN; the browser therefore needs internet access. If the model fails to load, the existing image/video appears instead.

The model is an early proof of concept and its print artwork is a placeholder. Do not advertise it as an accurate product photo or final design. Replace with an approved, optimized invisible-mannequin GLB and artwork before release.

The admin PRODUCTS tab includes a `3D MODEL (.GLB) URL` field. When supplied for THE OUTPOURING, this URL overrides the local prototype file path. Other products still use their existing media.
