const givingAccounts = [
  {
    type: 'OFFERINGS & TITHE',
    bank: 'ACCESS BANK',
    name: 'DIVINE INTERVENTION SOUL RESCUE MINISTRY',
    number: '1833231722',
  },
  {
    type: 'PARTNERSHIP',
    bank: 'MONIEPOINT MFB',
    name: 'DIVINE INTERVENTION SOUL RESCUE MINISTRY',
    note: 'PROJECTS AND PARTNERSHIP ACCOUNT',
    number: '6727925986',
  },
]

function accountMarkup(account) {
  return `<article class="bank-card giving-account-card">
    <div class="bank-card-head"><span>${account.type}</span><small>OFFICIAL GIVING ACCOUNT</small></div>
    <div class="bank-row"><span>BANK</span><strong>${account.bank}</strong></div>
    <div class="bank-row"><span>ACCOUNT NAME</span><strong>${account.name}</strong></div>
    ${account.note ? `<div class="bank-row"><span>ACCOUNT TYPE</span><strong>${account.note}</strong></div>` : ''}
    <div class="bank-row"><span>ACCOUNT NUMBER</span><div class="account-number"><strong>${account.number}</strong><button class="copy-button" type="button" data-copy="${account.number}">COPY NUMBER</button></div></div>
  </article>`
}

function applyGivingAccounts() {
  if (location.pathname !== '/giving' && location.pathname !== '/give') return
  const section = document.querySelector('.giving-bank')
  const oldCard = section?.querySelector('.bank-card')
  if (!section || !oldCard || section.dataset.officialAccounts === 'true') return

  section.dataset.officialAccounts = 'true'
  const wrapper = document.createElement('div')
  wrapper.className = 'giving-accounts-grid'
  wrapper.innerHTML = givingAccounts.map(accountMarkup).join('')
  oldCard.replaceWith(wrapper)

  const intro = section.querySelector('.giving-heading > p')
  if (intro) intro.textContent = 'Choose the appropriate official ministry account below. Please confirm the account name before completing your transfer.'

  wrapper.querySelectorAll('[data-copy]').forEach(button => {
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy)
        button.textContent = 'COPIED ✓'
        setTimeout(() => { button.textContent = 'COPY NUMBER' }, 1800)
      } catch {
        button.textContent = button.dataset.copy
      }
    })
  })
}

const observer = new MutationObserver(applyGivingAccounts)
observer.observe(document.documentElement, { childList: true, subtree: true })
queueMicrotask(applyGivingAccounts)
