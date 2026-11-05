# Glory Conference 2026 — Role-Based Operations Runbook

## The operating model
All staff use `https://gloryconf.org/admin`, but **each sees only the workspace for their assigned role**, with Firestore rules enforcing the restrictions behind the UI.

| Role in Firebase | Workspace | Permissions |
| --- | --- | --- |
| `admin` (main admin) | All operations, staff access, attendee records, commerce, website | Full supervision and operational-role management |
| `registration` | **Registration desk only** | Search registrations, create walk-in registration; **no check-in or check-out** |
| `checkin` | **Attendance desk only** | Search registered attendees, record each day's check-in and check-out; **no new registrations** |
| `followup` | **Glory Connect only** | Work with follow-up notes using assigned privileges, not admin/attendance |

The public `/register` form includes an optional ministry title (Pastor, Reverend, Prophet, Bishop, Apostle, Minister, Evangelist). The selected title is stored in the registration and shown on the attendee's confirmation.

## Safe deployment order
These changes introduce Cloud Functions in `functions/` and change Firestore role permissions. Hosting alone is **not sufficient**.

From Windows CMD in the project:
```cmd
git pull --rebase origin feature/glory-connect-registration-followup
npm install --prefix functions
npm run build
firebase deploy --only functions --project gloryconf
firebase deploy --only firestore:rules --project gloryconf
firebase deploy --only hosting --project gloryconf
```

**Do not push Hosting until both Functions and Firestore rules deploy successfully.** Firebase Cloud Functions requires the project's billing and deployment services to be correctly configured; Google Cloud billing and API usage may produce charges. You may be prompted to enable Cloud Functions, Cloud Build, Artifact Registry and other services.

Verify the login path on `gloryconf.org/admin`. A Vite build passing does not replace actual Firebase permission tests.

## Creating a staff login (main admin)
1. As an existing main administrator (a Firebase Authentication user with `admins/{uid}.role = "admin"`), sign in to `/admin`.
2. Select **Staff access → Create new login**.
3. Enter the staff name, email, and exactly one role (Registration, Attendance, or Glory Connect). Click **Create staff login**.
4. A server-side callable verifies your administrator role, creates a Firebase Auth user with an unguessable password, and stores a Firestore operational role. The browser never receives a password or server credentials.
5. **Copy the one-time setup link** and send it privately to the correct staff member, not a public group. The staff member uses it to set a password and then signs in at `/admin`.
6. To connect an Auth account that already exists, select **Link existing login**, copy its Firebase Auth UID from [Firebase Console Authentication Users](https://console.firebase.google.com/project/gloryconf/authentication/users), and assign the role.
7. To change permissions, select a different role under their profile. To revoke access, select **Revoke access**, which calls the authenticated server to disable their Firebase Auth account and remove their staff role document. Attendee records remain intact.

**Security:** The callable checks `admins/{currentUserUid}.role === "admin"` on the server and permits only the operational roles. It cannot create another full administrator. Existing administrator roles are protected by Firestore rules. Do not share setup links or copy them to untrusted chats.

## Registration officer workflow
1. Sign in and see only **Registration desk**.
2. Search a person's name, phone number or registration ID to avoid duplicates.
3. If not registered, enter name, phone, city/state, first-time/returning status; ministry title, church, age, gender and email are optional.
4. Only tick follow-up consent if the attendee explicitly agrees.
5. Save and read back the generated reference. Ask the guest to proceed to attendance check-in with an attendance officer.

## Attendance officer workflow
1. Sign in and see only **Attendance desk**.
2. Select `Nov 12`, `Nov 13` or `Nov 14`; search a registered guest.
3. Confirm identity and select **CHECK IN**. The system writes one arrival record per person per day, including `checkedInAt` and `checkedInBy`.
4. When they leave, find the same record and choose **CHECK OUT**. Firestore records `checkedOutAt` and `checkedOutBy`, preserving the original arrival.
5. Repeat check-in and repeat check-out attempts fail; operations use Firestore transactions. Attendance staff cannot modify registrations.
6. If the guest has no registration, send them to the registration officer. Only the main admin can delete or reverse attendance history.

## Release verification checklist
- [ ] New ministry title selected on public registration appears in confirmation and admin records.
- [ ] Existing admin account loads the full overview and Staff access.
- [ ] Main admin can create a **test** staff login, obtain the setup link and sign in with that account on another browser.
- [ ] Registration login sees only Registration desk; creating a walk-in works; attempting check-in is denied by Firestore.
- [ ] Attendance login sees only Attendance desk; existing attendee check-in and check-out work and record actor/time; attempting registration creation is denied.
- [ ] Follow-up login sees only Glory Connect; unauthorized attendance/registration changes are denied.
- [ ] Role change updates future access; revoked staff cannot sign in.
- [ ] Test all three event days and duplicate operations, offline/error paths, mobile display, keyboard navigation and browser console.
- [ ] Preserve original homepage and Directions page during rollout.

## Known boundaries
- Account setup links are **generated**, not automatically emailed: the admin securely sends them to staff. Automatic invitation emails require a connected email delivery provider.
- The code-level test suite validates architecture and regression markers. End-to-end real Firebase Auth and Firestore tests must be completed with test accounts.
- Existing registration titles lost during the old bug cannot be reconstructed automatically.
- Checkout is one departure record per guest per conference day; this version does not model repeated departures/returns within one day.
