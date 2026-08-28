/**
 * NASA HOSPITAL — itemised printed bill.
 *
 * Rendered instead of the shared PrintPatientBill when
 * hospital.printTemplate === "nasa". See templates/index.js.
 *
 * SHAPE
 * -----
 * Summary ("PROVISIONAL BILL") = one row per charge group.
 * Detail  ("DETAILED BREAKUP") = every line, grouped, with a subtotal each.
 * Both are built from the SAME `sections` array, so the two halves of the bill
 * can never disagree — a mismatch between summary and breakup is the one thing
 * a patient will always spot.
 *
 * WHAT IS BILLED
 * --------------
 * Only what Velocare actually charges for. An IPD admission today produces bed
 * charge and attending-doctor fee; there is no per-item charge model, so there
 * are no nursing / injection / procedure lines to print. When such a model is
 * added, push a section here and both tables pick it up with no other change.
 *
 * CSS lives in a <style> tag, not a .css import: CRA bundles imported
 * stylesheets globally, so `@page` rules here would alter how every other
 * hospital prints. Same reasoning as NasaPage.jsx.
 */

import { Fragment } from "react";
import { calculateStayDays, formatDateTime } from "../../../utils/helper";
import { amountInWords } from "../../../utils/amountInWords";

/**
 * Account codes. Velocare has no chart of accounts, so these are fixed and
 * local to this template — they exist to match the layout Nasa asked for.
 * If they ever send their real codes, only this map changes.
 */
const GROUPS = {
  room: { code: 100000, title: "Room / Bed Charges" },
  nursing: { code: 200000, title: "Nursing Charges" },
  procedure: { code: 300000, title: "Procedure / OT Charges" },
  investigation: { code: 400000, title: "Investigation Charges" },
  pharmacy: { code: 450000, title: "Pharmacy" },
  optical: { code: 460000, title: "Optical" },
  professional: { code: 500000, title: "Professional Fees" },
};

const money = (n) => (Number(n) || 0).toFixed(2);

/** Round to paise. Every figure printed on a bill goes through this. */
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/**
 * Half a paisa. Anything closer to zero than this IS zero.
 *
 * Floating point leaves residue: 1000.10 + 2000.20 - 3000.30 is not exactly 0
 * in JavaScript, it is about -4.5e-13. Compared with a bare `< 0` that residue
 * prints "Refund Due 0.00" on a bill the patient has settled exactly — which
 * is the kind of thing that starts an argument at the counter.
 */
const EPSILON = 0.005;

/** Line-item code: group code + position, e.g. 100001, 100002. */
const lineCode = (groupCode, index) => groupCode + index + 1;

/**
 * Turn a print payload into charge groups.
 *
 * Every branch returns the same shape so the renderer stays dumb:
 *   { key, code, title, lines: [{ date, particulars, rate, units, amount }] }
 *
 * `rate × units` is always the amount, so the arithmetic on the page is
 * checkable by eye — which is the whole point of a detailed breakup.
 */
export const buildSections = (entryType, entryData) => {
  const sections = [];

  if (entryType === "Ipd") {
    const dischargeDate = entryData?.dischargeSummary?.dischargeDate || null;
    const days = calculateStayDays(entryData?.admissionDate, dischargeDate);

    const bedRate = Number(entryData?.bed?.charge) || 0;
    if (bedRate > 0) {
      const bedLabel = [entryData?.bed?.bedType, entryData?.bed?.bedNumber]
        .filter(Boolean)
        .join(" - ");
      sections.push({
        key: "room",
        ...GROUPS.room,
        lines: [
          {
            date: entryData?.admissionDate,
            particulars: `Bed Charges${bedLabel ? ` — ${bedLabel}` : ""}`,
            rate: bedRate,
            units: days,
            amount: bedRate * days,
          },
        ],
      });
    }

    // Negotiated rate wins over the doctor's default when one was agreed for
    // this admission — same precedence as pay.controller.js/ChargeTable, so
    // the printed bill always matches what was actually billed.
    const docRate =
      entryData?.doctorChargeOverride ??
      Number(entryData?.attendingDoctor?.ipdCharge) ??
      0;
    if (docRate > 0) {
      sections.push({
        key: "professional",
        ...GROUPS.professional,
        lines: [
          {
            date: entryData?.admissionDate,
            particulars: `Consultation — ${
              entryData?.attendingDoctor?.fullName || "Attending Doctor"
            }${entryData?.doctorChargeOverride != null ? " (negotiated rate)" : ""}`,
            rate: docRate,
            units: days,
            amount: docRate * days,
          },
        ],
      });
    }

    // General-hospital surgery/OT charges (Ipd.surgeryCharges[]) — separate
    // from the ophthalmology module's EyeSurgery counseling flow, which
    // prints through the "Surgery" entryType branch below instead.
    const surgeryLines = (entryData?.surgeryCharges || []).map((s) => ({
      date: s.date,
      particulars: `${s.procedureName}${
        s.doctor?.fullName ? ` — ${s.doctor.fullName}` : ""
      }`,
      rate: Number(s.charge) || 0,
      units: 1,
      amount: Number(s.charge) || 0,
    }));
    if (surgeryLines.length) {
      sections.push({
        key: "procedure",
        ...GROUPS.procedure,
        lines: surgeryLines,
      });
    }
  } else if (entryType === "Opd") {
    const rate =
      entryData?.doctorChargeOverride ??
      Number(entryData?.doctor?.opdCharge) ??
      0;
    sections.push({
      key: "professional",
      ...GROUPS.professional,
      lines: [
        {
          date: entryData?.visitDateTime,
          particulars: `OPD Consultation — ${
            entryData?.doctor?.fullName || "Consulting Doctor"
          }${entryData?.doctorChargeOverride != null ? " (negotiated rate)" : ""}`,
          rate,
          units: 1,
          amount: rate,
        },
      ],
    });
  } else if (entryType === "Pathology") {
    const rate = Number(entryData?.payment?.bill?.[0]?.totalCharge) || 0;
    const name = entryData?.test?.testName || "Investigation";
    const code = entryData?.test?.testCode;
    sections.push({
      key: "investigation",
      ...GROUPS.investigation,
      lines: [
        {
          date: entryData?.createdAt,
          particulars: `${name}${code ? ` (${code})` : ""}`,
          rate,
          units: 1,
          amount: rate,
        },
      ],
    });
  } else if (entryType === "Medicine") {
    const lines = (entryData?.medicines || []).map((m) => {
      const rate = Number(m.sellPrice) || 0;
      const units = Number(m.quantity) || 0;
      return {
        date: entryData?.createdAt,
        particulars: `${m.name}${m.unit ? ` (${m.unit})` : ""}`,
        rate,
        units,
        amount: rate * units,
      };
    });
    if (lines.length) {
      sections.push({ key: "pharmacy", ...GROUPS.pharmacy, lines });
    }
  } else if (entryType === "Optical") {
    const lines = (entryData?.items || []).map((it) => {
      const rate = Number(it.price) || 0;
      const units = Number(it.quantity) || 1;
      return {
        date: entryData?.createdAt,
        particulars: `${it.name}${it.itemType ? ` (${it.itemType})` : ""}`,
        rate,
        units,
        amount: rate * units,
      };
    });
    if (lines.length) {
      sections.push({ key: "optical", ...GROUPS.optical, lines });
    }
  } else if (entryType === "Surgery") {
    const pkg = entryData?.counseling?.selectedPackage;
    const rate =
      Number(pkg?.price) || Number(entryData?.counseling?.estimatedCost) || 0;
    sections.push({
      key: "procedure",
      ...GROUPS.procedure,
      lines: [
        {
          date: entryData?.otDate || entryData?.createdAt,
          particulars: [entryData?.surgeryType, entryData?.eye, pkg?.name]
            .filter(Boolean)
            .join(" — "),
          rate,
          units: 1,
          amount: rate,
        },
      ],
    });
  }

  return sections.map((s) => ({
    ...s,
    // Round each line, then the subtotal, so the printed lines always add up
    // to the printed subtotal. Summing raw floats and rounding only at the end
    // can leave a subtotal that is one paisa off the column above it.
    lines: s.lines.map((l) => ({ ...l, amount: round2(l.amount) })),
    subtotal: round2(
      s.lines.reduce((sum, l) => sum + round2(l.amount), 0)
    ),
  }));
};

const CSS = `
.nb { color: #1a1a1a; font-family: "Segoe UI", Roboto, Arial, sans-serif; font-size: 9.5pt; }
.nb *, .nb *::before, .nb *::after { box-sizing: border-box; }

/* ---- patient / bill meta ---- */
.nb-meta {
  display: flex; gap: 8mm; border: 1px solid #2A3A92;
  padding: 3mm 4mm; margin-bottom: 5mm;
}
.nb-meta__col { flex: 1; }
.nb-meta__col + .nb-meta__col { border-left: 1px dashed #b9c0d8; padding-left: 6mm; }
.nb-row { display: flex; gap: 2mm; line-height: 1.55; }
.nb-row__k { min-width: 30mm; font-weight: 600; color: #2A3A92; }
.nb-row__v { flex: 1; }
.nb-sub { margin-top: 2.5mm; padding-top: 2mm; border-top: 1px dashed #b9c0d8; }
.nb-sub__h {
  font-weight: 700; color: #2A3A92; text-transform: uppercase;
  font-size: 8pt; letter-spacing: .4px; margin-bottom: 1mm;
}

/* ---- section headings ---- */
.nb-title {
  text-align: center; font-weight: 700; letter-spacing: 1.2px;
  text-transform: uppercase; color: #2A3A92; font-size: 11pt;
  margin: 6mm 0 2.5mm; padding-bottom: 1mm; border-bottom: 1.5px solid #2A3A92;
}
.nb-subtitle {
  text-align: center; font-size: 8pt; color: #666; font-style: italic;
  margin: -1.5mm 0 3mm;
}

/* ---- tables ---- */
.nb table { width: 100%; border-collapse: collapse; }
.nb thead th {
  background: #eef1f9; color: #2A3A92; border-top: 1px solid #2A3A92;
  border-bottom: 1px solid #2A3A92; text-align: left;
  padding: 1.8mm 2mm; font-size: 8.5pt; text-transform: uppercase; letter-spacing: .3px;
}
.nb tbody td { padding: 1.6mm 2mm; border-bottom: 1px solid #e4e7f0; vertical-align: top; }
.nb .num { text-align: right; white-space: nowrap; }
.nb .grp td {
  font-weight: 700; color: #2A3A92; padding-top: 3mm;
  border-bottom: 1px solid #c9cede;
}
.nb .sub td {
  font-weight: 700; border-top: 1px solid #c9cede;
  border-bottom: 1.5px solid #2A3A92; background: #f7f8fc;
}

/* ---- totals ---- */
.nb-totals { display: flex; justify-content: flex-end; margin-top: 3mm; }
.nb-totals__box { min-width: 78mm; }
.nb-totals__row {
  display: flex; justify-content: space-between; gap: 8mm;
  padding: 1.1mm 0; font-size: 9.5pt;
}
.nb-totals__row--grand {
  border-top: 1px solid #2A3A92; border-bottom: 2px solid #2A3A92;
  margin-top: 1mm; padding: 1.8mm 0; font-weight: 700; color: #2A3A92; font-size: 10.5pt;
}
.nb-words {
  margin-top: 2.5mm; padding: 2mm 3mm; background: #f7f8fc;
  border-left: 3px solid #0CA19D; font-size: 8.5pt;
}
.nb-words b { color: #2A3A92; }

/* ---- signature ---- */
.nb-sign { display: flex; justify-content: space-between; margin-top: 14mm; font-size: 8.5pt; }
.nb-sign__box { width: 55mm; text-align: center; }
.nb-sign__line { border-top: 1px solid #555; padding-top: 1.5mm; }

/* ---- paged output ----
   A bill with many charges must flow onto page 2 cleanly. The rules below are
   ordered by what actually goes wrong on a long bill:

   1. thead repeats, so page 2's rows are not an unlabelled wall of numbers.
   2. No row is ever split in half across the fold.
   3. A group heading is never the last thing on a page with its lines
      overleaf, and a Subtotal never lands alone at the top of the next page —
      an orphaned "Subtotal 14,200.00" under a header the reader cannot see is
      how billing disputes start.
   4. The meta block, the totals box and the signature line are atomic.
   5. Widows/orphans of 2 keep at least two lines of any group together.

   Both the legacy page-break-* and the modern break-* properties are set:
   Chrome honours the new ones, some print pipelines still only read the old. */
@media print {
  .nb thead { display: table-header-group; }
  .nb tfoot { display: table-footer-group; }

  .nb tr { page-break-inside: avoid; break-inside: avoid; }

  .nb .grp td { page-break-after: avoid; break-after: avoid; }
  .nb .sub td { page-break-before: avoid; break-before: avoid; }

  .nb-meta,
  .nb-totals,
  .nb-words,
  .nb-sign { page-break-inside: avoid; break-inside: avoid; }

  /* A section heading must never be the last thing on a page. */
  .nb-title { page-break-after: avoid; break-after: avoid; }

  .nb table { orphans: 2; widows: 2; }
}
`;

const Field = ({ label, children }) => (
  <div className="nb-row">
    <span className="nb-row__k">{label}</span>
    <span className="nb-row__v">{children ?? "-"}</span>
  </div>
);

const NasaBill = ({ bill }) => {
  const { billDetails, entryData } = bill?.data || {};
  const entryType = bill?.entryType;

  const sections = buildSections(entryType, entryData);
  const totalBillAmount = round2(
    sections.reduce((sum, s) => sum + s.subtotal, 0)
  );

  // The payload narrows payment.bill to the single instalment being printed,
  // so the running total comes from billDetails.paidToDate (summed across all
  // instalments before narrowing). Falling back to this bill alone keeps an
  // older payload rendering rather than showing a blank.
  const thisBill = entryData?.payment?.bill?.[0] || entryData?.payment?.bill;
  const paidToDate = round2(
    billDetails?.paidToDate != null
      ? billDetails.paidToDate
      : thisBill?.totalCharge
  );

  // What THIS printed document actually collected. On a single-instalment
  // bill this equals paidToDate. On a later instalment of a multi-payment
  // IPD/Medicine/Pathology bill it does not — printing paidToDate there would
  // show a ₹500 receipt as "Amount Paid ₹5,000" because two earlier
  // instalments already happened. See printDataHelper.js.
  const amountReceivedNow = round2(
    billDetails?.amountReceivedNow != null
      ? billDetails.amountReceivedNow
      : paidToDate
  );
  const billingMode = billDetails?.billingMode || "installment";
  // Only worth a second line when the two figures actually differ — the
  // common case (one payment, fully covers it) stays exactly as it always
  // printed, no extra clutter.
  const showPaidSplit =
    billingMode !== "collective" &&
    Math.abs(amountReceivedNow - paidToDate) > EPSILON;

  const discount = round2(thisBill?.discount);
  const tax = round2(thisBill?.tax);
  const amountPayable = round2(Math.max(totalBillAmount - discount + tax, 0));
  const balance = round2(amountPayable - paidToDate);

  // Two outcomes on a Nasa bill, not three:
  //   settled  — paid >= payable. This covers an exact match AND a discount
  //              applied after payment was already collected (e.g. Total
  //              5800, Discount 50, Payable 5750, Paid 5800 — the "extra"
  //              50 is the discount the hospital is absorbing, not money
  //              owed back to the patient). Nasa does not refund cash at
  //              the counter for this, so the bill just reads "Fully Paid".
  //   balance  — paid < payable. Money still outstanding.
  // "Refund Due" is intentionally not a printed state here.
  const isSettled = balance <= EPSILON;

  const age = billDetails?.age;
  const ageText = age
    ? [
        age.years ? `${age.years} years` : "",
        age.months ? `${age.months} months` : "",
        !age.years && !age.months && age.days ? `${age.days} days` : "",
      ]
        .filter(Boolean)
        .join(" ")
    : "-";

  const address = [
    billDetails?.address?.line1,
    billDetails?.address?.line2,
    billDetails?.address?.city,
    billDetails?.address?.pincode || "",
  ]
    .filter(Boolean)
    .join(", ");

  const caseNumber = billDetails?.ipdNumber || billDetails?.opdNumber;
  const caseLabel = billDetails?.ipdNumber ? "Admission No" : "OPD No";

  return (
    <div className="nb">
      <style>{CSS}</style>

      {/* ---------- patient / bill meta ---------- */}
      <div className="nb-meta">
        <div className="nb-meta__col">
          <Field label="Patient UID">{billDetails?.patientId}</Field>
          <Field label="Name">
            {billDetails?.patientName}
            {billDetails?.gender ? ` (${billDetails.gender})` : ""}
          </Field>
          <Field label="Age">{ageText}</Field>
          <Field label="Address">{address || "-"}</Field>
          <Field label="Contact">{billDetails?.phone}</Field>

          {billDetails?.doctors?.length > 0 && (
            <div className="nb-sub">
              <div className="nb-sub__h">Consulting Doctors</div>
              {billDetails.doctors.map((d, i) => (
                <div key={i}>
                  - {d.name}
                  {d.specialist ? ` (${d.specialist})` : ""}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="nb-meta__col">
          <Field label="Bill No">{billDetails?.billNumber}</Field>
          <Field label="Bill Date">{formatDateTime(billDetails?.date)}</Field>
          {caseNumber && <Field label={caseLabel}>{caseNumber}</Field>}
          {billDetails?.admissionDate && (
            <Field label="Admission Date">
              {formatDateTime(billDetails.admissionDate)}
            </Field>
          )}
          {billDetails?.ipdNumber && (
            <Field label="Discharge Date">
              {billDetails?.dischargeDate
                ? formatDateTime(billDetails.dischargeDate)
                : "— / — / —"}
            </Field>
          )}
          {billDetails?.bed && <Field label="Bed No(s)">{billDetails.bed}</Field>}
          {billDetails?.paymentMethod && (
            <Field label="Mode">{billDetails.paymentMethod}</Field>
          )}
        </div>
      </div>

      {/* ---------- summary ---------- */}
      <div className="nb-title">Provisional Bill</div>
      {billingMode === "collective" ? (
        <div className="nb-subtitle">
          Combined Summary &mdash; All Instalments to Date
        </div>
      ) : showPaidSplit ? (
        <div className="nb-subtitle">
          Instalment Receipt &mdash; Bill No. {billDetails?.billNumber}
        </div>
      ) : null}
      <table>
        <thead>
          <tr>
            <th style={{ width: "22%" }}>Primary Code</th>
            <th>Particulars</th>
            <th className="num" style={{ width: "22%" }}>
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {sections.length === 0 ? (
            <tr>
              <td colSpan={3} style={{ textAlign: "center", padding: "4mm" }}>
                No chargeable items on this bill.
              </td>
            </tr>
          ) : (
            sections.map((s) => (
              <tr key={s.key}>
                <td>{s.code}</td>
                <td>{s.title}</td>
                <td className="num">{money(s.subtotal)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* ---------- totals ---------- */}
      <div className="nb-totals">
        <div className="nb-totals__box">
          <div className="nb-totals__row">
            <span>Total Bill Amount</span>
            <span>{money(totalBillAmount)}</span>
          </div>
          {discount > 0 && (
            <div className="nb-totals__row">
              <span>Discount</span>
              <span>- {money(discount)}</span>
            </div>
          )}
          {tax > 0 && (
            <div className="nb-totals__row">
              <span>Tax</span>
              <span>{money(tax)}</span>
            </div>
          )}
          <div className="nb-totals__row">
            <span>Amount Payable</span>
            <span>{money(amountPayable)}</span>
          </div>
          {showPaidSplit ? (
            <>
              <div className="nb-totals__row">
                <span>Amount Received (This Bill)</span>
                <span>{money(amountReceivedNow)}</span>
              </div>
              <div className="nb-totals__row">
                <span>Paid To Date (All Instalments)</span>
                <span>{money(paidToDate)}</span>
              </div>
            </>
          ) : (
            <div className="nb-totals__row">
              <span>Amount Paid</span>
              <span>{money(amountReceivedNow)}</span>
            </div>
          )}
          <div className="nb-totals__row nb-totals__row--grand">
            {isSettled ? (
              <span style={{ width: "100%", textAlign: "center" }}>
                Fully Paid
              </span>
            ) : (
              <>
                <span>Balance</span>
                <span>{money(balance)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="nb-words">
        <b>Paid amount in words:</b> {amountInWords(amountReceivedNow)}
      </div>

      {/* ---------- detailed breakup ---------- */}
      {sections.length > 0 && (
        <>
          <div className="nb-title">Detailed Breakup</div>
          <table>
            <thead>
              <tr>
                <th style={{ width: "12%" }}>Code</th>
                <th style={{ width: "22%" }}>Date &amp; Time</th>
                <th>Particulars</th>
                <th className="num" style={{ width: "12%" }}>
                  Rate
                </th>
                <th className="num" style={{ width: "9%" }}>
                  Units
                </th>
                <th className="num" style={{ width: "15%" }}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {sections.map((s) => (
                // Keyed Fragment, not <>: a group emits three sibling rows and
                // React needs the key on the wrapper, not the inner <tr>s.
                <Fragment key={s.key}>
                  <tr className="grp">
                    <td colSpan={6}>{s.title}</td>
                  </tr>
                  {s.lines.map((l, i) => (
                    <tr key={`${s.key}-${i}`}>
                      <td>{lineCode(s.code, i)}</td>
                      <td>{formatDateTime(l.date)}</td>
                      <td>{l.particulars}</td>
                      <td className="num">{money(l.rate)}</td>
                      <td className="num">{l.units}</td>
                      <td className="num">{money(l.amount)}</td>
                    </tr>
                  ))}
                  <tr className="sub">
                    <td colSpan={5} className="num">
                      Subtotal
                    </td>
                    <td className="num">{money(s.subtotal)}</td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* ---------- signature ---------- */}
      <div className="nb-sign">
        <div className="nb-sign__box">
          <div className="nb-sign__line">Patient / Attendant</div>
        </div>
        <div className="nb-sign__box">
          <div className="nb-sign__line">Authorised Signatory</div>
        </div>
      </div>
    </div>
  );
};

export default NasaBill;
