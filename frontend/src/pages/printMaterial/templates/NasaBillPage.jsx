/**
 * NASA HOSPITAL — letterhead for BILLS.
 *
 * Deliberately not NasaPage. A prescription pad and a bill are different
 * documents with different obligations:
 *
 *   - The prescription footer reads "Validity for 5 Days" and "Not for Medical
 *     Legal Purpose". Both are wrong on a bill — a bill IS a legal/financial
 *     record, it is what a patient submits for insurance reimbursement, and it
 *     does not expire. Printing that footer on a bill invites a rejected claim.
 *   - A bill routinely runs to two or three pages. The prescription letterhead
 *     spends 56mm on a logo, wave graphics and an ECG line; that is 56mm of
 *     every page not spent on charges. This header is 34mm.
 *
 * So: no logo block, no watermark, flatter banding, and a footer written for a
 * financial document.
 *
 * MULTI-PAGE
 * ----------
 * In print media the header and footer are `position: fixed`, which in paged
 * media means "on every page at the paper edge". The content column reserves
 * exactly that much space with padding, so a long bill flows onto page 2 with a
 * full letterhead and footer and no overlap. The two heights are the only
 * numbers to change if the header or footer grows — they are declared once as
 * custom properties.
 *
 * CSS lives in a <style> tag rather than a .css import: CRA bundles imported
 * stylesheets globally, so an `@page` rule here would change how every other
 * hospital prints. Same reasoning as NasaPage.jsx.
 *
 * Brand colours sampled from the client's logo: navy #2A3A92 · teal #0CA19D.
 */

const CSS = `
@page { size: A4; margin: 0; }

/* Space reserved for the fixed letterhead / footer when printing.
   If content ever overlaps them, these are the only two numbers to change. */
.nbp-root { --nbp-header-h: 34mm; --nbp-footer-h: 16mm; }

.nbp-root *, .nbp-root *::before, .nbp-root *::after { box-sizing: border-box; }

.nbp-page {
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  background: #fff;
  color: #1a1a1a;
  font-family: "Segoe UI", Roboto, Arial, sans-serif;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* ---------------- letterhead ---------------- */
.nbp-head { flex: none; background: #fff; }

/* Flat banding instead of the prescription's wave: cheaper vertically and
   reads as a financial document rather than a clinical one. */
.nbp-bar { height: 4mm; display: flex; }
.nbp-bar i { display: block; height: 100%; }
.nbp-bar i:nth-child(1) { width: 62%; background: #2A3A92; }
.nbp-bar i:nth-child(2) { width: 22%; background: #0CA19D; }
.nbp-bar i:nth-child(3) { width: 16%; background: #EB1F28; }

.nbp-id {
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 6mm; padding: 4mm 12mm 0;
}
.nbp-id__name {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 24pt; font-weight: 700; color: #2A3A92;
  letter-spacing: .4px; line-height: 1; margin: 0;
}
.nbp-id__addr { margin: 1.6mm 0 0; font-size: 7.5pt; line-height: 1.45; color: #444; }
.nbp-id__right { text-align: right; font-size: 7.5pt; line-height: 1.5; color: #444; white-space: nowrap; }
.nbp-id__right b { color: #2A3A92; }

.nbp-rule { margin: 3mm 12mm 0; height: .8mm; background: #2A3A92; }

/* ---------------- body ---------------- */
.nbp-content { flex: 1; padding: 5mm 12mm 4mm; }

/* ---------------- footer ---------------- */
.nbp-foot { flex: none; }
.nbp-foot__rule { margin: 0 12mm; height: .5mm; background: #0CA19D; }
.nbp-foot__text {
  padding: 1.8mm 12mm 0;
  display: flex; justify-content: space-between; gap: 6mm;
  font-size: 7pt; color: #555; line-height: 1.4;
}
.nbp-foot__note { font-size: 7pt; color: #777; padding: 1mm 12mm 0; text-align: center; }
.nbp-foot__band { height: 3mm; display: flex; margin-top: 1.6mm; }
.nbp-foot__band i { display: block; height: 100%; }
.nbp-foot__band i:nth-child(1) { width: 16%; background: #EB1F28; }
.nbp-foot__band i:nth-child(2) { width: 22%; background: #0CA19D; }
.nbp-foot__band i:nth-child(3) { width: 62%; background: #2A3A92; }

@media print {
  html, body { width: 210mm; margin: 0; padding: 0; background: #fff; }

  /* Drop the flex column. "fixed", in print media, means "on every page at the
     paper edge" — so a bill that spills onto page 2 gets a full letterhead and
     footer there too, and the footer cannot ride up when content is short. */
  .nbp-page { display: block; width: 210mm; min-height: 0; box-shadow: none; }
  .nbp-head { position: fixed; top: 0; left: 0; right: 0; z-index: 3; background: #fff; }
  .nbp-foot { position: fixed; bottom: 0; left: 0; right: 0; z-index: 3; background: #fff; }
  .nbp-content {
    padding-top: var(--nbp-header-h);
    padding-bottom: var(--nbp-footer-h);
  }

  .nbp-root * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

/**
 * Contact details printed on the BILL only.
 *
 * Nasa asked for a billing-specific email and phone. The Hospital record still
 * holds the account owner's own address, which is what logins, notifications
 * and every other screen use — so this deliberately does NOT read
 * hospital.email / hospital.phone, and nothing here writes back to the
 * database.
 *
 * Scope is exactly one document: change these two lines and only the printed
 * bill changes. The prescription pad, the app and the DB are untouched.
 */
const BILL_CONTACT = {
  email: "nasahospital1@gmail.com",
  phone: "+91 9984499496",
};

const NasaBillPage = ({ hospital, children }) => (
  <div className="nbp-root">
    <style>{CSS}</style>

    <div className="nbp-page">
      {/* ---- letterhead: one block so it can pin to every printed page ---- */}
      <div className="nbp-head">
        <div className="nbp-bar">
          <i />
          <i />
          <i />
        </div>

        <div className="nbp-id">
          <div>
            <h1 className="nbp-id__name">
              {(hospital?.fullName || "NASA HOSPITAL").toUpperCase()}
            </h1>
            <p className="nbp-id__addr">
              {hospital?.address ||
                "Plot No. 474/227B Iradat Nagar, Opp. Shia P.G. College, Sitapur Road, Lucknow – 226020"}
            </p>
          </div>

          <div className="nbp-id__right">
            <div>
              <b>Ph:</b> {BILL_CONTACT.phone}
            </div>
            <div>
              <b>Email:</b> {BILL_CONTACT.email}
            </div>
            <div>
              <b>24×7</b> Emergency Services
            </div>
          </div>
        </div>

        <div className="nbp-rule" />
      </div>

      {/* ---- body ---- */}
      <div className="nbp-content">{children}</div>

      {/* ---- footer: written for a financial document, not a prescription ---- */}
      <div className="nbp-foot">
        <div className="nbp-foot__rule" />
        <div className="nbp-foot__text">
          <span>Please retain this bill for insurance and reimbursement claims.</span>
          <span>Subject to Lucknow jurisdiction</span>
        </div>
        <div className="nbp-foot__note">
          This is a computer-generated bill. Charges shown are provisional until
          discharge.
        </div>
        <div className="nbp-foot__band">
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  </div>
);

export default NasaBillPage;
