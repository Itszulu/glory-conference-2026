function mobile(value) {
  const digits = String(value || '').replace(/[\s()+-]/g, '').replace(/^(?:00234|0)/, '234')
  return /^234[789]\d{9}$/.test(digits) ? digits : ''
}

export function recipientNumbers(legacy, members, exclusions, branch) {
  const blockedIds = new Set(exclusions.docs.map(row => row.id))
  const allowed = new Set(), stopped = new Set()
  for (const row of [...legacy.docs,...members.docs]) {
    const number = mobile(row.get('phone'))
    if (!number) continue
    if (row.get('churchSmsStopped') === true || (row.ref.parent.id === 'registrations' && blockedIds.has(row.id))) stopped.add(number)
    if (row.get('memberBranch') === branch && row.get('churchSmsConsent') === true) allowed.add(number)
  }
  return [...allowed].filter(number => !stopped.has(number)).sort()
}
