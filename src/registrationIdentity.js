// Stable per-conference identity for registrations created after this rollout.
// No public lookup is exposed; registrations are create-only for the public.
// A shared family phone is allowed when the attendee names are different.
export function normalizePhone(phone) {
  const digits=String(phone||'').replace(/\D/g,'')
  if(digits.startsWith('234') && digits.length===13) return digits
  if(digits.startsWith('0') && digits.length===11) return '234'+digits.slice(1)
  if(digits.length===10 && /^[789]/.test(digits)) return '234'+digits
  return digits
}
export function normalizeName(name) {
  return String(name||'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ')
}
export function sameAttendee(a,b) {
  return normalizePhone(a.phone)===normalizePhone(b.phone) && normalizeName(a.fullName)===normalizeName(b.fullName)
}
export async function attendeeRegistrationId(fullName,phone) {
  if(!globalThis.crypto?.subtle) throw new Error('A secure connection is required for registration.')
  const identity='gloryconf:2026:'+normalizePhone(phone)+':'+normalizeName(fullName)
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(identity))
  const hex=Array.from(new Uint8Array(digest)).map(byte=>byte.toString(16).padStart(2,'0')).join('').toUpperCase()
  return 'GC26-R-'+hex.slice(0,32)
}
