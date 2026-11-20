import { collection, doc, getDocFromServer, getDocsFromServer, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from '../src/firebase'

export async function assignCurrentContacts() {
  const setup = doc(db, 'directorySetup', 'nsukkaInitialAssignment')
  const initial = await getDocFromServer(setup)
  if (initial.get('complete')) return
  if (!initial.exists()) {
    await runTransaction(db, async tx => {
      if (!(await tx.get(setup)).exists()) tx.set(setup, { startedAt: serverTimestamp(), complete: false })
    })
  }
  const cutoff = (await getDocFromServer(setup)).get('startedAt').toMillis()
  function pending(row) {
    return row.exists() && !row.get('branchAssignmentVersion') &&
      (row.get('createdAt')?.toMillis?.() ?? 0) <= cutoff
  }
  for (const source of ['registrations','churchMembers']) {
    const rows = (await getDocsFromServer(collection(db,source))).docs.filter(pending)
    for (let offset = 0; offset < rows.length; offset += 25) {
      const batch = rows.slice(offset,offset+25)
      await runTransaction(db,async tx => {
        const latest = await Promise.all(batch.map(row=>tx.get(row.ref)))
        for (const row of latest.filter(pending)) {
          tx.update(row.ref,{ memberBranch:'Nsukka', branchAssignmentVersion:1, updatedAt:serverTimestamp() })
        }
      })
    }
  }
  await runTransaction(db,async tx => {
    const latest = await tx.get(setup)
    if (!latest.get('complete')) tx.update(setup,{complete:true,completedAt:serverTimestamp()})
  })
}
