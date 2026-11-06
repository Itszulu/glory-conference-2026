# Glory Conference 2026 — Administration & Staff Operations

The main administrator can create operational staff logins directly from the protected Staff Access page. The system uses a separate temporary Firebase Authentication session so creating a staff account does not sign out the main administrator. Staff roles are restricted by Firestore rules.

## Account privileges

| Role | Visible workspace | Allowed work |
| --- | --- | --- |
| `admin` | All administration sections | Staff role assignments, attendee records, website management, registration, attendance, follow-up, commerce |
| `registration` | Registration desk only | Find existing attendee, create walk-in registration; not check-in/check-out |
| `checkin` | Attendance desk only | Find registered attendees; record arrival and departure per day; not create registrations |
| `followup` | Glory Connect only | View permitted attendee data and record follow-up; not registration or check-in |

The public `/register` includes an optional **ministry title**: Pastor, Reverend, Prophet, Bishop, Apostle, Minister or Evangelist. A selected title is stored in Firestore and displayed on confirmation.

## Deployment commands

In Windows CMD, from `glory-conference-2026`:

```cmd
git pull --rebase origin feature/glory-connect-registration-followup
npm run build
firebase deploy --only firestore:rules --project gloryconf
firebase deploy --only hosting --project gloryconf
```

If Firebase Hosting fails with a network/API error, run `firebase deploy --only hosting --project gloryconf --debug` for details. Deploy the website and Firestore rules; no backend functions are needed for this client-side account creation workflow.

The Firestore rules must be deployed successfully before deploying the new registration/attendance interfaces.

## Creating a staff account in the admin dashboard

1. Sign in to `https://gloryconf.org/admin` as the main administrator, then open **Staff Access**.
2. Choose **Create New Login**.
3. Enter the staff member's full name, email, a temporary password (at least 12 characters), and the appropriate role.
4. Click **Create Staff Account**. A separate Firebase Authentication instance creates the login. The existing main administrator session stays signed in.
5. The main administrator's Firestore permissions determine whether the new account receives an operational role. A newly created staff account cannot grant itself privileged database access.
6. Share the temporary password through a secure private channel. Ask the staff member to sign in and use **Forgot Password** to set a personal password. Do not reuse staff passwords or post them in groups.
7. For an account that already exists, **Link Existing Login** assigns a role using its UID.

**Changing roles:** Use **Staff Access → Change Role**. Staff should sign out and back in to refresh the displayed workspace. Database rules enforce permissions independently of the interface.

**Revoking access:** **Revoke access** removes the staff role, immediately blocking protected Firestore operations. The Firebase Authentication login itself remains active and must be disabled separately in Firebase Console if a complete login lockout is necessary.

**Security boundary:** Creating an email/password Auth login is a Firebase client SDK operation, not a protected server-side administrator API. Other people may also be able to create ordinary Auth accounts if the project's signup endpoint is enabled. Only an authenticated main admin can grant operational role records under the Firestore security rules. Do not treat an Auth account without an assigned role as an authorized staff account. A fully administrator-exclusive, server-verified account-provisioning endpoint requires a privileged backend.

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
