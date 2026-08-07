/**
 * Blank prescription pad.
 *
 * Prints the letterhead, the patient/visit details and the doctor's name, then
 * leaves the consulting area empty for the doctor to write by hand.
 *
 * WHY THIS EXISTS
 * ---------------
 * It removes the requirement for every consulting room to have a computer.
 * Reception registers the patient, prints this, and hands it over; the doctor
 * writes in their own way. The hospital still gets a printed pad carrying the
 * correct patient ID, visit number, date and doctor — which is what makes the
 * paper traceable back to a record later.
 *
 * Note this deliberately does NOT create a Prescription document. Nothing was
 * prescribed yet. If the visit is later typed up, that flows through the normal
 * prescription screen and prints the usual filled pad.
 *
 * The writing area is deliberately EMPTY — no rules, no grid. Guide lines were
 * tried and removed: doctors write at their own pitch, often diagonally or in
 * two columns, and pre-printed lines only fought that. The area still carries a
 * min-height so the signature block sits near the foot of the page rather than
 * riding up under the patient details.
 *
 * CSS is inline for the same reason as the other templates: a .css import in
 * CRA is bundled globally and would leak into every hospital's print.
 */

import { formatDateTime } from "../../utils/helper";

const CSS = `
.bp { color: #1a1a1a; font-family: "Segoe UI", Roboto, Arial, sans-serif; font-size: 10pt; }
.bp *, .bp *::before, .bp *::after { box-sizing: border-box; }

/* ---- patient / visit strip ----
   Sits directly under the letterhead rule. margin-top is pinned to 0 so no
   inherited spacing can push it down the page. */
.bp-meta {
  display: flex; gap: 6mm;
  border-bottom: 1px solid #2A3A92;
  padding: 0 0 2.5mm; margin: 0 0 4mm;
}
.bp-meta__col { flex: 1; }
.bp-meta__col + .bp-meta__col { border-left: 1px dashed #b9c0d8; padding-left: 5mm; }
.bp-row { display: flex; gap: 2mm; line-height: 1.5; }
.bp-row__k { min-width: 26mm; font-weight: 600; color: #2A3A92; }
.bp-row__v { flex: 1; }

/* Underlined blanks for anything reception could not fill in — weight,
   BP and allergies are usually taken at the door, not on the system. */
.bp-vitals { display: flex; gap: 8mm; margin-bottom: 3mm; font-size: 9pt; }
.bp-vitals span { flex: 1; color: #2A3A92; font-weight: 600; }
.bp-vitals i {
  display: inline-block; border-bottom: 1px dotted #999;
  min-width: 22mm; margin-left: 2mm;
}

/* ---- writing area ---- */
.bp-rx { display: flex; gap: 4mm; }
.bp-rx__mark {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 26pt; font-weight: 700; color: #2A3A92;
  line-height: 1; flex: none; padding-top: 1mm;
}
/* Intentionally empty — no rules, no grid. The doctor writes freehand and
   guide lines only got in the way. min-height reserves the page so the
   signature block still sits near the bottom rather than riding up under
   the patient details on a short pad. */
.bp-rx__area {
  flex: 1;
  min-height: 120mm;
}

/* ---- signature ---- */
.bp-sign { display: flex; justify-content: flex-end; margin-top: 8mm; }
.bp-sign__box { width: 62mm; text-align: center; font-size: 8.5pt; }
.bp-sign__line { border-top: 1px solid #555; padding-top: 1.5mm; }
.bp-sign__name { font-weight: 600; color: #2A3A92; }

@media print {
  .bp-meta, .bp-vitals, .bp-sign { page-break-inside: avoid; break-inside: avoid; }
  .bp-rx__area {
    /* Fill the page down to the reserved footer space. */
    min-height: 150mm;
  }
  .bp * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

const Field = ({ label, children }) => (
  <div className="bp-row">
    <span className="bp-row__k">{label}</span>
    <span className="bp-row__v">{children || "-"}</span>
  </div>
);

const BlankPrescription = ({ payload }) => {
  const { patient = {}, visit = {} } = payload?.data || {};

  const age = patient?.age;
  const ageText = age
    ? [
        age.years ? `${age.years}y` : "",
        age.months ? `${age.months}m` : "",
        !age.years && !age.months && age.days ? `${age.days}d` : "",
      ]
        .filter(Boolean)
        .join(" ")
    : "-";

  const doctorName = visit?.doctorName;
  const doctorCredentials = [visit?.doctorQualification, visit?.doctorSpecialist]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="bp">
      <style>{CSS}</style>

      <div className="bp-meta">
        <div className="bp-meta__col">
          <Field label="Patient ID">{patient?.patientId}</Field>
          <Field label="Name">
            {patient?.fullName}
            {patient?.gender ? ` (${patient.gender})` : ""}
          </Field>
          <Field label="Age">{ageText}</Field>
          <Field label="Phone">{patient?.phone}</Field>
        </div>

        <div className="bp-meta__col">
          <Field label="Date">{formatDateTime(visit?.date || new Date())}</Field>
          {visit?.number && (
            <Field label={visit?.ipd ? "IPD Number" : "OPD Number"}>
              {visit.number}
            </Field>
          )}
          <Field label="Doctor">
            {doctorName
              ? doctorCredentials
                ? `${doctorName} (${doctorCredentials})`
                : doctorName
              : ""}
          </Field>
          {visit?.bed && <Field label="Bed">{visit.bed}</Field>}
        </div>
      </div>

      {/* Taken at the door, not on the system — so they print as blanks. */}
      <div className="bp-vitals">
        <span>
          Weight<i />
        </span>
        <span>
          BP<i />
        </span>
        <span>
          Temp<i />
        </span>
        <span>
          Allergies<i />
        </span>
      </div>

      <div className="bp-rx">
        <div className="bp-rx__mark">℞</div>
        <div className="bp-rx__area" />
      </div>

      <div className="bp-sign">
        <div className="bp-sign__box">
          <div className="bp-sign__line">
            <span className="bp-sign__name">
              {doctorName ? `Dr. ${doctorName}`.replace(/^Dr\. Dr\.?/i, "Dr.") : "Doctor"}
            </span>
            <div>Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlankPrescription;
