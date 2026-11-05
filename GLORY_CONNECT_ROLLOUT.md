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

## 2026-11-04 — concurrent staff operations / duplicate prevention

### Staff accounts — never share a password

Create each volunteer as a separate email/password user in **Firebase Console → Authentication → Users**. Copy their Authentication UID. Then create a document in Firestore collection `admins` whose document ID is **exactly** that UID, with one string field `role`:

| role | Access |
| --- | --- |
| `admin` | Full existing operations, reception, records, merchandise, follow-up, Firestore editing |
| `checkin` | Check-in desk, attendee lookup and daily attendance only; cannot register walk-ins or undo check-ins |
| `registration` | Check-in desk plus walk-in registration |
| `followup` | Glory Connect follow-up view, authorized attendee and check-in reading, private notes |

Give the 4–8 people individual accounts and roles, use strong passwords, and revoke access by disabling Auth user / removing the role when the event ends. Do **not** provision 8 administrators.

### Protection against concurrent write conflicts

- Every newly registered attendee now gets a stable ID derived from SHA-256 of *normalized full name + normalized phone + conference year*. This allows different people sharing one household phone. Public rules only allow **create**, not update. Two simultaneous attempts under the same normalized identity target the same document; only one new registration can be created.
- This prevents *exact normalized matches for new records*, **not** all duplicates: spelling changes, altered phone numbers, existing legacy random-ID registrations and people who intentionally supply other details may evade matching. Staff must search for prior records; reconcile historical duplicates manually rather than delete records blindly. Avoid claiming complete deduplication.
- Every daily check-in uses a Firestore transaction and a fixed `registrationId_day` document ID. Parallel sessions checking the same attendee on the same day cannot both successfully create the same check-in record. Admins retain the ability to undo an incorrect check-in; non-admin staff do not.
- Individual real-time listeners keep check-in and registration lists synchronized across multiple operators. Confirm on the live Firebase project with 2 different accounts before conference day.

### Compatibility and release

The registration rules accept old records with `Host ministry` and new registrations with `DISRM`. Admin profile editing can correct historical attendance-frequency and affiliation values.

**IMPORTANT**: The new role permissions and public duplicate protection require a coordinated Firestore rules deployment with Hosting after tests. Run:
```
node --test tests/registrationIdentity.test.mjs
npm run build
firebase deploy --only firestore:rules,hosting --project gloryconf
```
Production deployment should only happen after build, emulator/security-rule checks, an unauthenticated trial registration, one authorized check-in, a denied duplicate check-in, a denied duplicate registration, a denied non-staff sign-in, and a dry-run involving two separate check-in accounts. Export a registration/check-in backup beforehand.

### Remaining operational work

No actual staff identities are created by this GitHub change. Firebase Auth accounts and `admins/{uid}` role records must be created by a trusted administrator. No server-side canonical identity registry or retroactive duplicate migration exists; those require a privileged backend and explicit rollout planning. A dedicated check-in test day and rules/emulator test suite is still recommended.

## Visitor directions (homepage / registration confirmation / schedule)

- The Schedule page's published venue is `No. 4 Uwani Ugwu Street, off Ikenga Junction, Nsukka`.
- Visitors may open an external Google Maps route or choose to load the optional map on the homepage. The map is **not** loaded automatically; no visitor GPS permission is requested by the website.
- The Google Maps destination is **Ikenga Hotel, Nsukka**, approximately `6.8366763, 7.3675346` (`R9Q8+7Q9`). This is a *navigation landmark*, **not the verified conference building entrance**. This distinction is displayed in the UI.
- The one source of truth for venue/map settings is `src/conferenceVenue.js`. If organizers supply the exact official venue pin, update that one file and verify every path.
- Confirm that mobile Google Maps launches properly for both Android and iPhone, and that the published street address really matches the event venue before widely sharing directions.

## In-page journey planner (2026-11-05)

The original homepage Header and hero are first. The interactive directions panel appears after the giving section near the homepage footer. Schedule and registration-confirmation panels link to the on-page planner, not an external Maps app.

On-site directions require a Google Maps Platform browser key with billing plus Maps JavaScript API and Routes API enabled. This project uses Route.computeRoutes and only loads Maps after visitors enter their starting point. The route, distance, driving/walking duration and leave-now arrival time are calculated by Google, not hardcoded. This is a journey planner, not full turn-by-turn GPS.

### Owner configuration on Windows

1. Open https://console.cloud.google.com/apis/credentials and select the correct Cloud project.
2. Enable Maps JavaScript API and Routes API, attach active billing, and set budgets/quotas.
3. Create an API key restricted to website referrers https://gloryconf.web.app/* and https://gloryconf.firebaseapp.com/* (plus any custom domain). Restrict to required APIs. Browser keys are visible in bundles by design; never use an unrestricted key.
4. In your local repository create .env.local with VITE_GOOGLE_MAPS_API_KEY=YOUR_RESTRICTED_BROWSER_KEY. Never commit .env.local.
5. Run npm run build after setting the variable. A previously built dist folder without the key cannot show routes.
6. Complete Firestore/security-rule acceptance tests before deploying the full feature branch.

The endpoint is the Ikenga Hotel navigation landmark (6.8366763, 7.3675346), not an independently verified conference gate. The published street address remains prominent. Replace the destination with the official gate pin once verified.

Without a configured key, users can still read the venue address; trying to calculate a route shows a clear setup error rather than fabricated distance or time. No external redirect occurs.

### Acceptance tests

- Verify the original hero and header appear first, and Maps does not load until route planning is requested.
- Search from Enugu, Enugu State; confirm the route line and realistic travel distance, duration and leave-now ETA.
- Edit origin or travel mode; ensure stale routes clear. Try a nonexistent place and verify useful error text.
- Verify usage quotas, restricted referrers and real Maps API failures.
- Test Android and iOS layouts and browser back/forward behaviour.

## CURRENT IMPLEMENTATION — NO-CARD IN-PAGE JOURNEY PLANNER (November 5, 2026)

The earlier Google Maps billing/API-key setup above is **superseded**. The live feature-branch implementation now uses OpenStreetMap/Leaflet for the map and HeiGIT's **free openrouteservice Standard API** for forward geocoding and driving/walking directions, using `https://api.heigit.org`. Google Cloud, Maps JavaScript and Routes API billing are **not required** for this implementation.

The original conference hero/header remains first. The journey planner appears after the giving sections, before the footer. Schedule and attendee confirmation link to `/#venue`.

### Activate without a card

1. Sign up for a free HeiGIT account at https://account.heigit.org/ (the Standard API key is free).
2. From the account dashboard, use **Copy** to get the entire API key (don't copy the masked characters).
3. In the local repo, create `.env.local` and add `VITE_ORS_API_KEY=YOUR_FULL_HEIGIT_KEY`.
4. Run `npm run build` and test a real route locally. The new key is required at build time.
5. Only deploy hosting after confirming routes, UI/mobile experience and the broader Firestore permissions tests on this same branch.

This client-only Firebase Hosting deployment embeds its `VITE_ORS_API_KEY` into browser JavaScript. **A browser API token is not secret**. Check the provider's published API-key usage rules and free quotas before using this at scale; a protected Firebase Functions routing proxy would require a separate architecture and might introduce billing. Don't use any sensitive or paid key here. Avoid storing full home addresses as application logs.

### Test checklist

- Test a car route from `Enugu, Nigeria` and another from `UNN Main Gate, Nsukka`, plus an appropriate walking route around Nsukka.
- The road line, route distance, duration and leave-now time should be calculated from the **actual API response**, not prefilled.
- Confirm the matched starting-place label is accurate; if not, enter more detail.
- Confirm the map displays **© OpenStreetMap contributors** attribution and tiles load only after asking for a route. The community tile service is best effort and is not designed for high-volume or bulk use.
- Confirm error handling for no key, invalid key, quota/rate limits, unsupported origin and network failures.
- HeiGIT's Standard plan has daily and per-minute usage limits. If attendee traffic grows, use a dedicated licensed map-tile provider and a back end with access controls.
- End point is Ikenga Hotel (`6.8366763,7.3675346`), a **landmark**, not a confirmed conference entrance. Always show the actual published street address.

Official sources: https://api.heigit.org/ ; https://ask.openrouteservice.org/t/deprecating-api-openrouteservice-org-in-favour-of-api-heigit-org/7912 ; https://operations.osmfoundation.org/policies/tiles/

## FINAL MAP DECISION — GOOGLE MAPS FREE EMBED ONLY (November 5, 2026)

This section **supersedes all previous Google API, OpenRouteService, HeiGIT, and on-site route-calculator instructions above**. Do not configure or use the old `VITE_ORS_API_KEY` or `VITE_GOOGLE_MAPS_API_KEY`. No key, billing account, or credit card is required.

- The original homepage hero and its CSS layout are unchanged. Only a small `FIND THE VENUE` link was added beneath existing hero buttons. There is no map component on the homepage.
- The existing hamburger drawer includes `DIRECTIONS & VENUE` using its existing link styling; Schedule and registration confirmation also link to `/directions`.
- `/directions` uses `VenueDirections.jsx` to show a Google Maps no-key iframe (landmark overview), the full officially published venue address, and a Google Maps directions link.
- Google Maps itself handles searches for streets, stores, local businesses, walking/driving options and ETA after clicking through to its website/app. Custom in-page search, automatic geocoding, and route ETAs are intentionally removed because they were unreliable without an appropriate licensed provider.
- An iframe from a Google Maps shared embed is free and requires no developer key. The current iframe uses the legacy `maps.google.com/maps?q=...&output=embed` URL; confirm its actual browser behavior before release. Prefer replacing it with the official `Share → Embed a map → Copy HTML` iframe if available for the precise landmark.
- **Ikenga Hotel is a navigation landmark, not a verified conference entrance.** The correct published venue is No. 4 Uwani Ugwu Street, off Ikenga Junction, Nsukka, Enugu State, Nigeria. Do not claim the map marker is the entrance.
- Verify the iframe and external directions link in mobile and desktop browsers before deployment. Existing Firestore registration/check-in access checks remain mandatory.

Nothing in this change automatically deploys the Firebase Hosting website.
