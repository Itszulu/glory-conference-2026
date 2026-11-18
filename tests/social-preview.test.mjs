import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8')
const expected='https://gloryconf.web.app/glory-conference-2026-social-preview.jpg'

test('official Glory Conference event flyer is declared as the social preview',()=>{
  assert.match(html,/property="og:image" content="https:\/\/gloryconf\.web\.app\/glory-conference-2026-social-preview\.jpg"/)
  assert.match(html,/property="og:image:secure_url"/)
  assert.match(html,/property="og:image:type" content="image\/jpeg"/)
  assert.match(html,/property="og:image:width" content="1280"/)
  assert.match(html,/property="og:image:height" content="720"/)
  assert.match(html,/name="twitter:card" content="summary_large_image"/)
  assert.ok(html.includes('name="twitter:image" content="'+expected+'"'))
})
