const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { defineSecret, defineString } = require('firebase-functions/params')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const { createHash } = require('node:crypto')

initializeApp()
const db = getFirestore()
const token = defineSecret('BULKSMS_NIGERIA_TOKEN')
const sender = defineString('BULKSMS_NIGERIA_SENDER')
const mode = defineString('BULKSMS_NIGERIA_MODE', { default: 'sandbox' })

function mobile(value) {
  const digits = String(value || '').replace(/[\s()+-]/g, '').replace(/^(?:00234|0)/, '234')
  return /^234[789]\d{9}$/.test(digits) ? digits : ''
}

exports.gloryBulkSms = onCall({ secrets: [token], timeoutSeconds: 90 }, async request => {
  const uid = request.auth?.uid
  if (!uid || (await db.doc('admins/' + uid).get()).get('role') !== 'admin') {
    throw new HttpsError('permission-denied', 'Administrator access required.')
  }
  const { branch, action, body, id, maxPages = 1 } = request.data || {}
  if (!['Nsukka','Enugu'].includes(branch) || !['preview', 'send'].includes(action) || typeof body !== 'string' || !body.trim() || body.length > 1530 || !/^[a-f0-9-]{36}$/.test(id || '')) {
    throw new HttpsError('invalid-argument', 'Check the message and try again.')
  }
  const { measureSms, estimatedKobo } = await import('./measure.mjs')
  const length = measureSms(body, maxPages)
  if (![1, 2].includes(maxPages) || length.pages > maxPages) {
    throw new HttpsError('invalid-argument','This message exceeds the selected page limit.')
  }
  const fields = ['phone','memberBranch','churchSmsConsent','churchSmsStopped']
  const [legacy, members, exclusions] = await Promise.all([
    db.collection('registrations').select(...fields).get(),
    db.collection('churchMembers').select(...fields).get(),
    db.collection('followUps').where('status','==','Do not contact').select('registrationId').get()
  ])
  const blockedIds = new Set(exclusions.docs.map(row => row.id))
  const allowed = new Set(), stopped = new Set()
  for (const row of [...legacy.docs,...members.docs]) {
    const number = mobile(row.get('phone'))
    if (!number) continue
    if (row.get('churchSmsStopped') === true || (row.ref.parent.id === 'registrations' && blockedIds.has(row.id))) stopped.add(number)
    if (row.get('memberBranch') === branch && row.get('churchSmsConsent') === true) allowed.add(number)
  }
  const numbers = [...allowed].filter(number => !stopped.has(number)).sort()
  const sandbox = mode.value() !== 'live'
  const totalKobo = estimatedKobo(numbers.length, length.pages)
  const digest = createHash('sha256').update(JSON.stringify([uid, branch, body, numbers, sandbox, maxPages, totalKobo])).digest('hex')
  const campaign = db.collection('smsCampaigns').doc(id)
  if (action === 'preview') {
    await campaign.create({ uid, branch, digest, state: 'preview', createdAt: FieldValue.serverTimestamp() })
    return { count: numbers.length, sandbox, pages:length.pages, totalKobo }
  }
  let previous = await db.runTransaction(async tx => {
    const record = (await tx.get(campaign)).data()
    if (!record || record.uid !== uid) throw new HttpsError('failed-precondition','Preview the message first.')
    if (record.state === 'accepted') return record.result
    if (record.state !== 'preview') throw new HttpsError('failed-precondition','Check this send in the provider dashboard before starting another.')
    if (!numbers.length || record.digest !== digest) throw new HttpsError('failed-precondition','The audience or message changed. Preview again.')
    tx.update(campaign,{state:'submitting'})
    return null
  })
  if (previous) return previous
  const endpoint = sandbox ? 'api/sandbox/v2/sms' : 'api/v2/sms'
  const response = await fetch('https://www.bulksmsnigeria.com/' + endpoint, {
    method:'POST', signal:AbortSignal.timeout(30000),
    headers:{Authorization:'Bearer ' + token.value(),'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify({from:sender.value(),to:numbers.join(','),body,unicode:length.unicode,gateway:'direct-refund'})
  })
  const data = await response.json()
  if (!response.ok || data.status !== 'success' || !data.data?.message_id) {
    throw new HttpsError('failed-precondition','Provider acceptance could not be confirmed. Check your SMS dashboard before retrying.')
  }
  const result = { sandbox, reference:data.data.message_id, count:data.data.recipients_count ?? numbers.length }
  await campaign.update({ state:'accepted',result })
  return result
})
