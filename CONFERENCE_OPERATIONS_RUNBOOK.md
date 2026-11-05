# Glory Conference 2026 — Spark Plan Operations

**Billing:** Firebase Spark (no Blaze upgrade). The project uses Firebase Hosting, Firestore and Email/Password Authentication. Staff login accounts are created manually in the Firebase Console, and their role assignments are managed in the protected website dashboard. This implementation does not deploy Cloud Functions.

## Account privileges

| Role | Visible workspace | Allowed work |
| --- | --- | --- |
| `admin` | All administration sections | Staff role assignments, attendee records, website management, registration, attendance, follow-up, commerce |
| `registration` | Registration desk only | Find existing attendee, create walk-in registration; not check-in/check-out |
| `checkin` | Attendance desk only | Find registered attendees; record arrival and departure per day; not create registrations |
| `followup` | Glory Connect only | View permitted attendee data and record follow-up; not registration or check-in |

The public `/register` includes an optional **ministry title**: Pastor, Reverend, Prophet, Bishop, Apostle, Minister or Evangelist. A selected title is stored in Firestore and displayed on confirmation.

## Deployment commands — no Functions

In Windows CMD, from `glory-conference-2026`:

```cmd
git pull --rebase origin feature/glory-connect-registration-followup
npm run build
firebase deploy --only firestore:rules --project gloryconf
firebase deploy --only hosting --project gloryconf
```

If `firebase deploy` fails with "Failed to make request" for the Hosting API, investigate the connection or API response using `firebase deploy --only hosting --project gloryconf --debug`. Do not assume it is a billing error. Check the Firebase Hosting quota and connection separately. Do not deploy `functions`; Spark does not support deploying the Cloud Functions backend used in the prior draft.

The Firestore rules must be deployed successfully before deploying the new registration/attendance interfaces.

## How the main admin creates a staff login

1. Sign in to [Firebase Console → Authentication → Users](https://console.firebase.google.com/project/gloryconf/authentication/users) with the Firebase project owner account.
2. Choose **Add user**, create the staff member using their email and a temporary strong password, and copy the exact **User UID** from the Auth Users list.
3. Sign in at `https://gloryconf.org/admin` as the main admin whose Firestore `admins/{uid}` document has `role: "admin"`.
4. Open **Staff access**. Paste the Firebase Authentication UID, enter their name and login email, and assign exactly one operational role.
5. Save **Assign staff access**. The staff member now signs in at `/admin` with the credentials from Firebase Authentication.
6. Ask staff to use **Forgot Password** to set their own password; do not send passwords in public/group chats. They will see only the assigned workspace.

**Role changes**: Main admin → Staff access → Change role. The staff member signs out and signs back in to refresh their dashboard. The security rules apply role restrictions even if a browser briefly displays an old view.

**Revocation**: Main admin → Staff access → Revoke access removes the Firestore permission document. The account may still authenticate but cannot access protected dashboard data. For complete login lockout, additionally **disable the user in Firebase Authentication → Users**. The Spark plan cannot automatically disable Authentication accounts from ordinary browser code.

**Important:** Staff Access assigns a role to the UID you provide. Confirm the UID and email belong to the intended user. The UI cannot independently validate the Auth identity from Firestore.

## Registration and attendance workflows

**Registration officer:** Search for an existing attendee by name, phone or reference before adding a new entry. Complete name, phone, city/state and first-time status; ministry title is optional. Record optional follow-up consent only when granted. Save the generated registration reference; the attendee then proceeds to attendance.

**Attendance officer:** Select a conference day, search an already-registered attendee, confirm details and click CHECK IN. Later, choose CHECK OUT to record departure. Each action records `checkedInBy` / `checkedOutBy` and corresponding server timestamps. Firestore transactions prevent repeated check-ins/check-outs for the same attendee/day. One arrival and departure per day are supported.

**Main administrator:** Can view and edit attendee profiles and oversee attendance, with explicit controls for export and reversal. Other staff never gain these permissions.

## Pre-event test checklist

- [ ] Public register form stores title and renders it on confirmation, also works without title.
- [ ] Main admin's overview, Staff Access, attendee records and other workspaces load.
- [ ] Registration-only test account sees only registration and cannot check in or check out.
- [ ] Attendance-only test account sees only attendance and cannot register new attendees.
- [ ] Attendance check-in then check-out persists the actor UID and server timestamps; duplicate attempts are prevented.
- [ ] Follow-up test account sees only Glory Connect.
- [ ] Role change requires sign-out/sign-in for navigation and access changes are enforced by rules.
- [ ] Revoking a role immediately removes access to protected data; disabling the Firebase Auth account separately blocks future logins.
- [ ] Mobile layout and error handling are checked for actual staff devices.

Automated build and source tests do not replace tests with real Firebase Authentication identities and deployed Firestore rules. Previous registrations that were saved without a title cannot be reconstructed automatically.
