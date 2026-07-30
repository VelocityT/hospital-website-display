# Velocare — Client Onboarding Runbook

**Client type:** General hospital / nursing home
**Modules to enable:** `opd` · `ipd` · `pharmacy` · `pathology` · `billing` · `inventory`
**Modules to leave OFF:** `ophthalmology` · `opticalShop` · `ot` (eye-care vertical — not sold here)

> Do steps 1–6 **before** the client joins. Step 7 is the demo you run with them.
> The order matters: each step depends on the one above it.

---

## 0. Thirty minutes before — warm the server

Free-tier Render spins down after 15 minutes idle; the first request then takes
30–60 seconds. Open `hp.velocare.in` and log in once, ~3 minutes before the call.

**Better:** upgrade the Render service to Starter (~$7/mo) so this stops being a
risk permanently. A client watching a 60-second spinner on their first login is
a bad first impression that has nothing to do with your product.

---

## 1. Create the hospital  (superAdmin → `/hospitals/add`)

| Field | Notes |
|---|---|
| Hospital full name | As it should appear on printed bills and prescriptions |
| Address, phone, email, website | Hospital **email and phone must be unique** across all tenants |
| Logo | Shows on the print header — get it from the client in advance |
| **Staff Prefix** | e.g. `SNH` → staff IDs become `SNH-001` |
| **Patient Prefix** | e.g. `SNH` → patient IDs become `SNH-001` |

**About the amber prefix warning:** if another hospital already uses that prefix
you'll see *"Already used by X…"*. It is a **warning, not an error** — IDs are
unique per hospital, so duplicates are safe. Pick a unique one anyway so support
calls and reports are unambiguous.

**Admin account** (created on this same form):

- `adminFullName`, `adminEmail`, `adminPassword`, `adminPhone`
- **User email and phone are globally unique across every hospital.** If the
  client's email was ever used in a test account, creation fails. Check first.
- Use the client's real address — this is their login, and there is no password
  reset flow. Write the password down and hand it over.

**Module toggles:** turn on the six listed at the top. Anything off is hidden
from the sidebar, and "why can't I see Pharmacy?" is the most common day-one
support call.

---

## 2. Create staff  (`/staff/registration`)

Create at least one of each role the client will actually use:
`doctor` · `nurse` · `receptionist` · `pharmacist` · `pathologist`

### ⚠️ For every doctor, set all four money fields

| Field | Why it matters |
|---|---|
| `opdCharge` | Consultation fee. **Blank ⇒ OPD bill computes to ₹0 and the payment modal locks — the receptionist cannot collect money.** |
| `ipdCharge` | Per-day doctor fee for admitted patients. Blank ⇒ IPD bill undercounts. |
| `opdCommission` | % of `opdCharge` paid to the doctor |
| `ipdCommission` | % of `ipdCharge` paid to the doctor |

This is the single most common day-one breakage. Do not skip it.

---

## 3. Wards and beds  (`/wards`)

1. Create **ward types** (General, ICU, Private…)
2. Create **wards** under each type, with floor
3. Add **beds** to each ward — **every bed needs a `charge`**

Bed charge × days + doctor `ipdCharge` × days = the IPD bill. A bed with no
charge silently bills ₹0 for the stay.

---

## 4. Pharmacy and pathology masters

- **Medicines** (`/pharmacy/medicine/add`) — cost price, sell price, MRP, stock.
  Bulk import via Excel is available if they have a list.
- **Pathology tests** (`/pathology/create-test`) — test name and price.

Load 5–10 real items before the demo. An empty dropdown makes the product look
unfinished even though it's working perfectly.

---

## 5. Verify the tenant is isolated

Log in as the new hospital admin (not superAdmin) and confirm:

- Patient list is empty — no other hospital's patients are visible
- Sidebar shows exactly the six enabled modules, no eye-care entries
- New patient gets ID `<PREFIX>-001`

---

## 6. Smoke test — run every flow yourself first

Do this on the client's tenant, before they watch. Roughly 10 minutes.

- [ ] **Register a patient** → ID is `<PREFIX>-001`, prints correctly
- [ ] **Create an OPD visit** → assign doctor → consultation fee shows the
      doctor's `opdCharge`, **not ₹0**
- [ ] **Pay the OPD bill** → bill number generated → **print the bill**
- [ ] **Admit a patient (IPD)** → assign ward + bed → bed shows as occupied
- [ ] **Open Billing → IPD tab** → charges = (bed + doctor) × days.
      Day 1 shows ×1. Pay it. Confirm the amount is accepted, not rejected.
- [ ] **Add a prescription** → print it → header shows the hospital logo/name
- [ ] **Create a medicine order** → pay → stock decreases
- [ ] **Create a pathology report** → pay → print
- [ ] **Discharge the IPD patient** → discharge summary prints
- [ ] Log in as **receptionist** and confirm they cannot see Staff Payments or
      Income (admin-only screens)

**Then delete nothing.** Deleting test records leaves permanent gaps in the
patient/bill ID sequence — counters only move forward. Either keep the test
patient as a demo record, or do the smoke test on a staging tenant instead.

---

## 7. What to actually show the client

Run it as their day, not as a feature tour:

1. **Reception** — patient walks in, register, create OPD visit
2. **Doctor** — opens their OPD list, writes a prescription, prints it
3. **Billing** — collect the consultation fee, print the bill
4. **Admission** — same patient admitted to a bed, IPD created
5. **Pharmacy** — dispense medicines against the prescription
6. **Lab** — pathology test ordered, report entered, printed
7. **Discharge** — discharge summary, final bill
8. **Admin** — income overview, staff payments

Then hand the laptop over and let their receptionist register a patient
themselves. The moment they do it unaided is the moment the sale sticks.

---

## Known rough edges — know these before they're found live

| Issue | What to say if it comes up |
|---|---|
| First login of the day is slow | Server wakes on demand. Fix by upgrading Render. |
| No password reset flow | Admin resets staff passwords from Staff → Edit. Keep the admin password safe. |
| Session ends when the tab closes | Token is in `sessionStorage` by design; they log in again. |
| Bill for an admitted patient grows daily | Correct behaviour — charges accrue per day until discharge. |
| Deleted records leave ID gaps | IDs are sequential per hospital and never reused. |

---

## Post-onboarding, same week

- [ ] Add their subdomain to the CORS allow-list in `backend/index.js` if they
      get one — it's a hardcoded array, and a missing entry fails silently
- [ ] Confirm the daily flow worked on day 2 — call, don't email
- [ ] Ask for a testimonial while the enthusiasm is fresh
- [ ] Note which modules they asked for that don't exist yet — that's your roadmap
