# Velocare — Project Context

> Working notes for anyone (human or AI) picking this repo up cold.
> Last updated: 30 Jul 2026, from a full read of the codebase at commit `c331d56`.

---

## 1. What this is

**Velocare** is a multi-tenant hospital ERP (MERN) sold as a SaaS product by **Velocity Tech**
(Lucknow, UP). One deployment serves many hospitals; each hospital sees only its own data.

**Current business direction:** package it as an **ERP for ophthalmologists / eye hospitals**
and sell into that vertical. The eye-care module (workup → doctor exam → glasses Rx →
optical shop → cataract/OT surgery) is the differentiator; the generic hospital modules
(OPD, IPD, pharmacy, pathology, billing) are the base platform underneath it.

**Contact / brand:** `contact@velocitytech.in`, `info@velocitytech.in`,
YouTube `@VelocityTechYT`. Product name in UI and emails: **Velocare**.

---

## 2. Repo layout

Three independent apps in one repo. No monorepo tooling — each has its own `package.json`.

| Folder | Stack | Purpose | Runs on |
|---|---|---|---|
| `backend/` | Node ESM, Express 5, Mongoose 8, JWT, Helmet, Multer, Swagger | REST API | Render — `hospital-erp-9w6z.onrender.com` |
| `frontend/` | CRA (react-scripts 5), React 18, Ant Design 5, Redux Toolkit, Tailwind 3, axios | The ERP application | Vercel — `hp.velocare.in`, `superadmin.velocare.in` |
| `landing_page/` | Vite 7, React 19, Tailwind 4, `motion`, `lenis`, `lucide-react` | Marketing site + demo lead capture | static host |

Database: **MongoDB Atlas** (single cluster, single DB, shared by all tenants).

### Local dev

```bash
# backend  (port from .env, default 8080; .env.local on frontend points to 3001)
cd backend  && npm install && npm run dev      # nodemon index.js

# frontend
cd frontend && npm install && npm start        # CRA dev server on :3000

# landing page
cd landing_page && npm install && npm run dev  # vite
```

`frontend/.env.local` → `REACT_APP_API_URL=http://localhost:3001/api`
`backend/.env` → `MONGO_URI`, `PORT`, `JWT_SECRET`, `NODE_ENV`, `FRONTEND_URL`

CORS allow-list lives inline in `backend/index.js` — **add any new frontend origin there**
or requests fail silently with a console "CORS Blocked Origin" line.

---

## 3. Core architecture

### 3.1 Multi-tenancy

Every business document carries `hospital: ObjectId`. There is **no separate database per
tenant** — isolation is by query filter. Controllers read the tenant from
`req.authority.hospital`, which `authenticateToken` populates from the JWT.

> **Rule: never accept `hospitalId` from the request body or query for data scoping.**
> Always use `req.authority.hospital`. The only exception is superAdmin tooling.

### 3.2 Modules = the pricing lever

`Hospital.modules` is a boolean map. It decides what a customer can see:

```
pharmacy · ipd · opd · pathology · billing · inventory · ophthalmology · opticalShop · ot
```

Set per hospital by superAdmin in **Add/Edit Hospital**. `SidebarMenu.jsx` and
`roleBaseRoutes.jsx` read it to show/hide navigation.

⚠️ **This is currently enforced in the frontend only.** See §7, risk 3.

### 3.3 Roles

`superAdmin · admin · doctor · nurse · receptionist · pharmacist · pathologist ·
optometrist · optician`

- Backend gate: `roleBasedAccess([...])` middleware (`middlewares/roleBaseAccess.middleare.js` —
  note the typo in the filename, it is intentional at this point, renaming breaks imports).
- Frontend gate: `roleRoutes` map in `frontend/src/routes/roleBaseRoutes.jsx`.
  `adminRoutes` is the superset; `superAdmin` spreads `adminRoutes` and adds hospital
  management on top.
- **superAdmin has no `hospital`.** `state.hospital.modules` is `undefined` for them —
  always use optional chaining (`hospital?.modules?.opd`). Calling `Object.keys(modules)`
  crashes the sidebar for superAdmin.

### 3.4 Impersonation

superAdmin can log in *as* a hospital admin. The issued JWT carries `impersonatedBy`.
The app shows a yellow banner with a **Leave** button (`leaveImpersonationApi`).
`authenticateToken` deliberately skips the `isDisabled` hospital check when
`impersonatedBy` is present, so support can still enter a suspended hospital.

### 3.5 Auth

- JWT in the `Authorization: Bearer` header, stored in **`sessionStorage`** (not localStorage,
  not an httpOnly cookie). Axios request interceptor attaches it (`services/index.js`).
- Response interceptor: on `401 "No token provided"` it clears the token and hard-redirects
  to `/login`.
- No refresh token. Session dies when the tab closes.
- Login is rate-limited by `authLimiter` (`express-rate-limit`).

---

## 4. ID generation — the most important convention in this codebase

**Every human-readable ID is generated from a per-hospital counter on the `Hospital`
document.** Not global. This has caused real production bugs and there is now machinery
to protect it.

| ID | Counter field | Format | Collection |
|---|---|---|---|
| `patientId` | `patientCounter` | `PT-001` (prefix + 3 digits) | `patients` |
| `staffId` | `staffCounter` | `ST-001` (prefix + 3 digits) | `users` |
| `billNumber` | `billCounter` | `000006` (6 digits, no prefix) | `bills` |
| `orderNumber` | `opticalCounter` | `OPT-00001` | `opticalorders` |
| `surgeryNumber` | `surgeryCounter` | `SUR-00001` | `eyesurgeries` |
| `opdNumber` / `ipdNumber` | derived from patient, no standalone counter | — | `opds` / `ipds` |

Prefixes (`staffPrefix`, `patientPrefix`) are set per hospital by superAdmin.

### Consequences you must respect

1. **Unique indexes must be compound `{ hospital, <field> }` — never global.**
   A global `billNumber_1` index makes hospital B fail with `E11000` the moment its counter
   reaches a value hospital A already used. Every model has a comment explaining this.
   `email` and `phone` on `User` stay **globally** unique — they are login identity.

2. **All generators live in `backend/utils/generateCustomId.js`:**
   `generateCustomId(hospitalId, "patient"|"staff")`, `generateBillNumber(hospitalId)`,
   `generateSequenceNumber(hospitalId, counterField, prefix, collection, field, pad)`.
   Each `$inc`s the counter, builds a candidate, then calls `isFree()` to check the
   collection — retrying up to 50 times. This is the safety net for counter drift
   (restored backup, manual DB edit, failed insert, bulk import).
   **Use these helpers. Do not hand-roll a counter anywhere.**

3. **New module with its own numbering?** Add a `<name>Counter` to `Hospital`, add a
   compound unique index on the model, and call `generateSequenceNumber`. Then add the
   collection to `TARGETS` in `utils/fixTenantIndexes.js`.

### Migration scripts (run from `backend/`, one-time, idempotent)

```bash
node utils/fixTenantIndexes.js       # drops legacy GLOBAL indexes → compound per-hospital,
                                     # then resyncs every counter forward to its real max.
                                     # Refuses to act if real in-hospital duplicates exist.
node utils/fixBillNumberIndex.js     # older, bills-only version — superseded by the above
node utils/checkHospitalModules.js "hospital name"   # prints a hospital's module flags
node utils/seedSuperAdmin.js         # bootstrap the platform superAdmin
node utils/consolidateSuperAdmin.js  # collapse duplicate superAdmin accounts
node utils/whoOwnsHospital.js
node utils/lookupAdmin.js
node utils/migrate.js
```

**Restart the backend after `fixTenantIndexes.js`** so Mongoose picks up new index state.
These scripts set DNS to 8.8.8.8/1.1.1.1 because Atlas SRV lookups fail on some ISPs.

---

## 5. Domain model

### Generic hospital

- **Patient** — demographics, age as `{years, months, days}`, address, contact,
  arrays of `ipds`, `opds`, `prescriptions`, `pathologyTestReports`, `medicineOrders`,
  plus `medicalDocuments`.
- **Opd** — `opdNumber`, patient, doctor, `visitDateTime`, symptoms,
  `status: Scheduled → Workup Done → With Doctor → Completed`, one `payment.bill`,
  `doctorPayment[]` (commission payouts), `prescriptions[]`.
- **Ipd** — admission, ward/bed, discharge summary, consent, transfers.
- **Ward / WardType / Bed** — bed inventory and assignment.
- **Medicine / MedicineSale**, **PathologyTest / PathologyTestReport**.
- **Bill** — `entry.type ∈ {Ipd, Opd, Pathology, Medicine, Optical, Surgery}`,
  `totalCharge, discount, tax, paidAmount, payableAmount`,
  `paymentMethod ∈ {Cash, Card, UPI, Insurance}`.
  **Billing pattern: one Bill document per payment installment.** An entity holds an
  *array* of bill refs, so the array is the payment history. Never mutate an old bill to
  record a new payment.
- **StaffPayment** — salary/commission payouts to staff.

### Eye care (the vertical)

- **EyeExam** — one per OPD visit, keyed by `{hospital, opd}` (opdNumber string, same
  convention as Prescription). Three blocks:
  - `workup` (optometrist): chief complaints, duration, systemic illness, ocular history,
    per-eye (`rightEye`/`leftEye`) uncorrected/pinhole/corrected/BCVA, AR sph-cyl-axis,
    subjective sph-cyl-axis-add, IOP + `iopMethod ∈ {NCT, Applanation, Schiotz}`, dilation.
  - `doctorFindings`: slit lamp, fundus, C:D ratio (per eye), `diagnosis[]`,
    `advice ∈ {Glasses, Medical Management, Surgery, Referral, Observation}`,
    `surgeryAdvised`, review date.
  - `glassesPrescription`: per-eye dist sph/cyl/axis/VA + nearAdd, PD,
    `lensType ∈ {Single Vision, Bifocal, Progressive, Contact Lens}`, material note.
  - `status: Workup Pending → Workup Done → Completed`.
- **OpticalItem** — frames/lenses/CL/sunglasses/accessories stock. Mirrors `medicine.js`
  (cost/sell/MRP, supplier, invoice, `currentStock`, soft `isDeleted`).
- **OpticalOrder** — `OPT-xxxxx`, **snapshots the Rx at order time** (so later edits to the
  exam don't rewrite a dispatched order), line items,
  `status: Ordered → Lab → Ready → Delivered → Cancelled`, advance + `payment.bill`.
- **EyeSurgery** — `SUR-xxxxx`, `surgeryType` (PHACO / SICS / FLACS / LASIK / Pterygium /
  Glaucoma / Squint / Retina / DCR / Other), `eye ∈ {OD, OS, Both}`,
  `counseling` (packages offered with IOL model + price, selected package, estimated cost),
  `biometry` (K1, K2, axial length, formula, IOL power, physician fitness),
  surgeon, `otDate`, `status: Advised → Counseled → Scheduled → Completed → Cancelled`,
  operative notes, follow-up, and **installment billing** (`payment.bill[]` + running
  `paidAmount`).

### Clinical flow the software encodes

```
Reception registers patient
      → OPD visit created
      → Eye Queue (today's eye OPD list, /eye/queue)
      → Optometrist Workup (VA, AR, refraction, IOP, dilation)      [receptionist may also start this]
      → Doctor Panel (slit lamp, fundus, C:D, diagnosis, advice)
              ├── Glasses  → Optical Order → Lab → Ready → Delivered
              └── Surgery  → Counseling (IOL package + price)
                           → Biometry + fitness
                           → OT scheduling (Surgery Board)
                           → Completed + follow-up
```

---

## 6. Frontend notes

- **Routing**: `App.js` renders `SidebarMenu + Navbar + Content`, and injects only the
  routes in `roleRoutes[user.role]`. `/print` is mounted **outside** the layout so print
  views render clean (see `pages/printMaterial/`).
- **State**: Redux Toolkit, two slices — `userSlice`, `hospitalSlice`. Token in
  `sessionStorage`, theme in `localStorage`.
- **Global "Enter = next field"** (in `App.js`): a document-level keydown handler moves
  focus to the next input; on the last field it clicks the enabled submit button. It
  deliberately (a) ignores `e.repeat` so a held Enter can't spam, (b) throttles the same
  form to one submit per 1.2s, (c) skips an open AntD combobox so Enter still picks an
  option, (d) preventDefaults the native submit. **If you add a form, give the submit
  button `type="submit"` and disable it while submitting** — that disabled state is what
  actually blocks double submission.
- **Print**: `utils/printDataHelper.js`, `utils/eyePrintHelper.js`, `printMaterial/*`.
  Prescriptions, bills, pathology reports and eye Rx all print through here.
- **Theme**: dark mode via `data-theme` attribute + AntD `darkAlgorithm`, toggled by
  `window.setTheme`.

---

## 7. Open risks — prioritised

**1. `backend/.env` is tracked in git.** `.gitignore` lists `.env`, but the file was
committed before that took effect and still shows as modified. `MONGO_URI` and `JWT_SECRET`
are therefore in history.
→ Rotate the Atlas password and the JWT secret, then `git rm --cached backend/.env`.
Rotating invalidates all live sessions — do it at night.

**2. Hardcoded JWT fallback.** `auth.middleware.js` and the signing side use
`process.env.JWT_SECRET || "ijf9348yuq"`. If the env var is ever missing in production,
anyone who has read this repo can mint an admin token.
→ Throw on boot when `JWT_SECRET` is unset. Never fall back.

**3. Module gating is frontend-only.** `checkHospitalModules.js` is a diagnostic CLI
script, not middleware. `eye.route.js`, `optical.route.js` and `eyeSurgery.route.js` apply
only `authenticateToken` — no `roleBasedAccess`, no module check. A customer on a cheaper
plan can call `/api/optical/*` and `/api/eye-surgery/*` directly with curl, and any logged-in
role (nurse, pharmacist) can hit them.
→ Write a `requireModule("ophthalmology")` middleware and apply it alongside
`roleBasedAccess` on those routers. **This one directly protects revenue.**

**4. Line endings.** The working tree currently shows ~200 files changed with
58,912 insertions and 58,912 deletions — identical counts, i.e. a pure CRLF/LF rewrite,
not real edits. Committing as-is destroys `git blame` on every file.
→ Add `.gitattributes` with `* text=auto eol=lf`, normalise once in a dedicated commit
that touches nothing else, and set `git config core.autocrlf input` on Windows.

**5. Landing page leaks leads.** Demo and contact forms POST to a single Google Apps Script
webhook that only sends an email. No Sheet backup, no CRM, no dedupe, no retry if the script
quota trips — a lost email is a lost lead. `index.html` also has only `<title>Velocare</title>`:
no meta description, no OG/Twitter tags, no pricing page.
→ Cheapest, highest-return fix on this list.

**6. Auth hygiene.** Token in `sessionStorage` (XSS-readable), no refresh token, no token
version/blocklist so a compromised token stays valid until expiry.

---

## 8. Change log — what happened recently

### 31 Jul 2026 — IPD billing timezone mismatch

**Symptom:** billing screen showed *"To be paid: ₹1300"* and the Pay button, but the
API answered `400 "This IPD bill is already fully paid. Nothing is pending."`

**Cause:** `calculateStayDays` used `startOf("day")`, which resolves in the **runtime's**
timezone. The API runs on Render in **UTC**; the browser runs in **IST**. For an admission
at 29-Jul 20:41 IST viewed at 31-Jul 00:06 IST, the browser counted 2 days (₹2600) while
the server was still on 30-Jul in UTC and counted 1 (₹1300). One payment of ₹1300 therefore
settled the bill server-side while the UI still showed ₹1300 outstanding.
**Any date-boundary logic must be pinned to a timezone — never trust the process default.**

**Fixed:**

- `HOSPITAL_TZ = "Asia/Kolkata"` added to **both** `backend/utils/helper.js` and
  `frontend/src/utils/helper.js`; `calculateStayDays` now calls `.tz(HOSPITAL_TZ)` before
  `startOf("day")`. **These two implementations must stay identical.** If Velocare is ever
  sold outside IST, move the timezone onto the `Hospital` document.
- `pay.controller.js` read `getEntry.dischargeDate`, which does not exist on the schema
  (it is `dischargeSummary.dischargeDate`), so IPD `payment.status` could never become
  `"Paid"`. Fixed, and the comparison relaxed to `>=`.
- Rejected payments now return `data: { days, totalAmount, paidAmount, remainingBalance }`
  so the client can re-sync instead of showing a balance the API will not accept.
- `ChargeTable.jsx`: `dayjs(undefined)` returns *now* and is truthy, so
  `dayjs(x) || null` never yielded null. Replaced with an explicit ternary. The Pay button
  is now hidden on `balanceDue <= 0` rather than trusting `payment.status` alone, and the
  footer reads "Fully paid" / "Overpaid by ₹X" instead of "To be paid: ₹0".
- `PayModal.jsx`: `balanceDue` is NaN-safe (non-numeric ⇒ treated as settled, inputs
  locked); per-type API calls collapsed into `ENTRY_CONFIG`; submit button has a
  `submitting` lock; a rejected payment calls `onRefresh` (wired in `PatientBilling.jsx`)
  to refetch the patient.

**Still open:** the frontend recomputes charges independently of the API. The durable fix
is a single backend endpoint returning the authoritative balance per entry, with the UI
only rendering it. Until then, any change to charge maths must be applied to both sides.

### 29–30 Jul 2026 (previous session)

**`4f4ee3e` — per-hospital unique IDs, eye care module, prefix warning**

- Dropped global unique indexes in favour of compound `{hospital, field}` on `patients`,
  `users`, `bills`, `opds`, `ipds`, `opticalorders`, `eyesurgeries`.
- Added `utils/fixTenantIndexes.js` (222 lines) — the one-time migration + counter resync
  described in §4. It refuses to create an index when real duplicates exist, and only
  ever moves counters forward.
- Hardened `generateCustomId.js` with the `isFree()` + 50-attempt retry loop.
- **Soft prefix warning** (this is the "soft warning" work):
  `GET /auth/check-prefix?staffPrefix=&patientPrefix=&hospitalId=` →
  `checkHospitalPrefix` in `auth.controller.js`. superAdmin-only.
  The Add/Edit Hospital form (`CreateOrUpdateHospital.jsx`) debounces the prefix inputs
  by 500ms (`hooks/useDebounce.jsx`), calls it, and renders an amber `<PrefixWarning />`:
  *"Already used by X. Records stay separate, but a unique prefix avoids confusion in
  reports and support."*
  **Design intent: this warns, it never blocks.** Duplicate prefixes are safe at the DB
  level now that IDs are per-hospital — `NA-001` in two hospitals are two distinct records.
  The warning exists purely to prevent human confusion in support calls and superAdmin
  views. It excludes the hospital being edited from its own check, and the endpoint returns
  `200` even on error so a failing check can never block the form.
  Prefixes are upper-cased on input.

**`c331d56` — fix: overpaid**

- Backend (`pay.controller.js`): IPD and Medicine payment endpoints now compute
  `remainingBalance` and reject with 400 if the bill is already settled, or if
  `amountPaying > remainingBalance`. Enforced server-side independently of the UI,
  because a stale tab or a direct API call could otherwise write a negative balance.
- Frontend (`PayModal.jsx`): `selectedEntry.total` is treated as the **remaining balance**,
  not the original charge. If `<= 0` every input is locked and an Alert shows either
  "Bill fully paid" or "Overpaid by ₹X — issue a refund or adjust the earlier bill".
  Field relabelled *Total Charge* → **Pending Amount**, with a validator capping input at
  the balance.

### Earlier

- `ff104b7` eye queue: receptionist can start/edit workup
- `8bb1c93` double-submit prevention (registration lock + throttled Enter handler)
- `9b1c9b2` / `a5a1625` global Enter-to-next-field; symptoms hidden for eye hospitals
- `3ddfadf` sidebar cleanup + env-based API URL
- `0572a9f` only one superAdmin
- `3bb7bf6` Vercel build tolerates ESLint warnings (`CI=false react-scripts build`)
- `5feefa8` ophthalmology section added

Branches: `main` (current), `eye-care` (feature branch, merged via PRs #1 and #2).

---

## 9. Conventions to follow

- Backend is **ESM** (`"type": "module"`) — use `import`, include the `.js` extension.
- Controller responses are always `{ success, message?, data?, error? }`.
  Errors: 400 validation, 401 auth, 403 role, 404 missing, 500 server.
- Scope every query by `req.authority.hospital`. Add `roleBasedAccess` to every new router.
- Reads that don't need Mongoose documents use `.lean()`.
- Soft delete via `isDeleted: true` — don't hard-delete clinical or financial records.
- New API call → add to `frontend/src/services/apis.js` as `<name>Api`, using the shared
  `API` axios instance from `services/index.js`.
- New page → add to `roleBaseRoutes.jsx` **and** to `SidebarMenu.jsx` with the right
  `hospital?.modules?.<flag>` guard.
- Money: store numbers, render `₹`. Round to 2 dp before persisting.
