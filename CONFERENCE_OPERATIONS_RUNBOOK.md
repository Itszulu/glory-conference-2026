# Glory Conference 2026 — Operations & Staff Runbook

## What changed
- The public registration form again asks **MINISTRY TITLE (OPTIONAL)**: Pastor, Reverend, Prophet, Bishop, Apostle, Minister, Evangelist, or No title. The selected value is saved to `registrations/{registrationId}.title` and shown on confirmation.
- The admin portal opens to an operations overview, with grouped navigation: Event Operations, Ministry & Team, Commerce & Content. The welcome desk handles attendee search, day-by-day check-in, and walk-in registration. The administrator alone can edit records and export all check-ins.
- Walk-in registration includes the same optional title, streamlined optional gender and age, and an **unchecked explicit follow-up consent** control.
- Admins can assign, change or revoke **operational** staff roles at **Staff access**. Staff privileges are enforced by Firestore rules, not merely hidden buttons.

## Required deployment — both Hosting and Firestore
On your Windows CMD console in the `glory-conference-2026` project:
```cmd
git pull --rebase origin feature/glory-connect-registration-followup
npm run build
firebase deploy --only firestore:rules,hosting --project gloryconf
```
**Do not deploy hosting without the updated Firestore rules.** The new Staff access panel needs admin-level list/create/update/delete operations on role documents.

## One-time main administrator configuration
Your existing main administrator account must already have a Firestore document:
`admins/{YOUR_FIREBASE_AUTH_UID}` with `role: "admin"`.
The new interface does not create or modify any full administrator accounts; existing administrator documents cannot be modified through browser staff-management controls. If there is no admin role set yet, configure it in Firebase Console under Firestore, using the UID from Authentication.

## Add a new team member
1. Sign into [Firebase Authentication → Users](https://console.firebase.google.com/project/gloryconf/authentication/users) using the project owner's secure account.
2. Create an **Email / Password** Auth user. Copy the **User UID**; set a strong one-time password and share it privately.
3. Visit `https://gloryconf.org/admin` as an existing main admin; go to **Staff access**.
4. Enter that UID, their name, their email address and role; choose **Assign staff access**.
5. Ask the staff member to sign in at `/admin` with their Firebase Authentication credentials. The staff member can request a password-reset email using **Forgot Password**.
6. Confirm their navigation shows **only** the tools assigned to their role. Test with a non-production registration.

> Creating Firebase Authentication identities still takes place in Firebase Console. The website only grants/revokes Firestore role assignments. A future authenticated backend (Cloud Function) would be needed for a truly one-screen staff-account invitation that securely creates Auth users; **do not embed administrator credentials or Firebase Admin SDK secrets in browser JavaScript**.

### Permission matrix

| Role | Welcome desk | Create walk-ins | Attendee edit/delete | Follow-up | Assign staff | Orders, site media |
| --- | --- | --- | --- | --- | --- | --- |
| Main admin (`admin`) | Yes | Yes | Yes | Yes | Yes, operational roles only | Yes |
| Registration (`registration`) | Yes | Yes | No | No | No | No |
| Check-in (`checkin`) | Yes | No | No | No | No | No |
| Glory Connect (`followup`) | No | No | No | Yes | No | No |

### Revoke/change staff
Main admin → **Staff access** → use **Change role** or **Revoke access** on an operational account. Revocation removes the role document but not the Firebase Authentication account. For a full lockout, disable or delete that Auth account separately in Firebase Console. Already-open browser sessions may still display an outdated menu until re-login, but Firestore access denies prohibited operations as soon as role changes apply.

## On-site arrival procedure
- Search by full name, phone, or registration reference.
- Confirm the right person; select the conference day.
- Click **CHECK IN** only once, verifying the confirmation. Repeated check-ins are prevented with a Firestore transaction.
- If no registration is found, registration staff should search alternate spellings/phone before using **Register walk-in**.
- A walk-in must provide name, phone, state/city and first-time/returning status. Title, church, gender and age may be left blank. Staff must not tick follow-up consent without permission.
- Only the main admin can reverse check-ins or edit/delete attendee records.

## Practical release checks
1. Test `/register` as a signed-out visitor: select **Pastor** and register with a test name/number. Confirm the title appears on the confirmation and in admin records.
2. Register another test attendee without a ministry title. Confirm both work.
3. Sign in as main admin: verify overview cards, grouped navigation, Staff access, editable attendee profile, check-in and duplicate review.
4. Sign in as one test user for each operational role; verify role-scoped navigation and Firestore permissions.
5. Test an actual walk-in, select day, check in once, and verify a second check-in is rejected. Verify the optional consent value.
6. Test a staff role change and revocation, then refresh or re-login as that staff user.
7. Check mobile layout, keyboard focus, screen reader labels, and console errors.
8. Do not treat a successful Vite build as evidence that real Firebase Authentication and Firestore operations succeeded. Full live role and check-in tests need valid accounts and deployed rules.

## Important limitations
- This project is not yet backed by production end-to-end browser tests against Firestore/Auth; code/build checks are necessary but not sufficient.
- Historic registrations made while the title field was absent have blank titles; do not invent historic title values.
- Never share staff passwords in GitHub commits, public links, or group messages. Avoid editing or deleting active attendee records during testing.
