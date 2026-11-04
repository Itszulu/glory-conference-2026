# Glory Connect — controlled rollout

This branch implements the first release of the registration and follow-up workspace. It does **not** send messages automatically, create attendee passwords, or migrate existing records into a permanent identity table.

## Changes

- Two-step registration: name, WhatsApp/phone, email (optional), residence, church (optional), prior attendance, affiliation, conference days, discovery channel, optional messaging consent.
- New registrations save the existing Firestore fields plus attendanceFrequency, affiliation, followUpConsent, and consentRecordedAt. Existing registration IDs and historical records remain unchanged.
- Admin-only Glory Connect tab: filter first-timers / returning guests, view check-ins, see explicit communication opt-in, assign a follow-up owner, track status, next action and private notes.
- Walk-in entry now records whether the person is a first-timer or returning instead of silently assigning first-time status.
- Removed the church requirement from admin profile editing.
- Staff notes stored separately in followUps/{registrationId}; deletion of a registration also deletes that follow-up document.

## Preflight — do not skip

1. Back up Firestore registrations and checkIns via your authorized admin exports and retain the Git stash of original site files. Work on a non-production branch first.
2. Review the diff. On Windows, use `git fetch origin` then `git switch feature/glory-connect-registration-followup` only if your working tree is clean.
3. Run `npm install` if necessary, and `npm run build`. Do not deploy if this fails.
4. Firestore rules must be deployed **with** the new hosting build: `firebase deploy --only firestore:rules,hosting --project gloryconf`. Deploy only after confirming validation and a test registration in an appropriate test project / controlled test.
5. Test as an unauthenticated visitor: complete registration, confirm the registration reference, verify it appears in authorized admin records, and verify the optional consent toggles true/false in stored data.
6. Test as an authorized admin: first-timer filter, returning filter, daily check-ins, follow-up status changes, and the ability to save notes in followUps; verify no non-admin can query or write followUps.
7. Test an older attendee record (without the new fields), and check the old admin sign-in, products, and prayer pages.

## Limitations / next iteration

- Historical second-vs-third attendance cannot be inferred from old Yes/No registrations and is labeled 'Returning (count unknown)'.
- No automatic messaging, staff-level restricted permissions beyond current admin role, duplicate resolution, cross-year identity linking, or confirmation email/SMS is included.
- Optional follow-up messaging must remain permission-based; do not interpret an old missing consent field as consent.
- For continued conference use, add a documented retention and deletion policy, audited staff assignments, and an explicit unsubscribe process before sending outreach at scale.
