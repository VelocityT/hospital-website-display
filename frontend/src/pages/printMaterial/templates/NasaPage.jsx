/**
 * NASA HOSPITAL — bespoke printed letterhead (prescriptions).
 *
 * Applied only when hospital.printTemplate === "nasa". See templates/index.js.
 *
 * WHY THE CSS LIVES IN A <style> TAG INSTEAD OF A .css FILE
 * --------------------------------------------------------
 * CRA bundles every imported stylesheet into one global sheet, so an
 * `@page { margin: 0 }` in a .css file would silently change how EVERY other
 * hospital prints. Keeping it inline means these rules only exist in the DOM
 * while this template is on screen.
 *
 * WHY THE BANDS ARE INLINE SVG INSTEAD OF background-color
 * -------------------------------------------------------
 * Chrome's print dialog has a "Background graphics" checkbox that is OFF by
 * default. CSS background colours vanish when it is unticked; SVG content
 * always prints. Verified against the client's own print preview.
 *
 * Brand colours are sampled from the client's logo file:
 *   navy #2A3A92 · teal #0CA19D · red #EB1F28
 */

const LOGO = `${process.env.PUBLIC_URL || ""}/templates/nasa-logo.png`;

const CSS = `
@page { size: A4; margin: 0; }

/* Space reserved for the fixed letterhead / footer when printing.
   If content ever overlaps them, these are the only two numbers to change. */
.nasa-root { --nasa-header-h: 56mm; --nasa-footer-h: 26mm; }

.nasa-root *, .nasa-root *::before, .nasa-root *::after { box-sizing: border-box; }

.nasa-page {
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  background: #fff;
  color: #1a1a1a;
  font-family: "Segoe UI", Roboto, Arial, sans-serif;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ---------------- letterhead ---------------- */
.nasa-letterhead { flex: none; background: #fff; }
.nasa-band-top { position: relative; height: 26mm; }
.nasa-band-top svg { display: block; width: 100%; height: 100%; }

.nasa-head { display: flex; align-items: center; gap: 6mm; padding: 0 12mm; margin-top: -6mm; }
.nasa-head__logo { width: 24mm; flex: none; }
.nasa-head__logo img { width: 100%; display: block; }
.nasa-head__mid { flex: 1; text-align: center; }
.nasa-head__name {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 30pt; font-weight: 700; color: #2A3A92;
  letter-spacing: .5px; line-height: 1; margin: 0;
}
.nasa-head__addr {
  margin: 2mm 0 0; font-size: 7.5pt; line-height: 1.45; color: #333;
  text-transform: uppercase; letter-spacing: .2px;
}
.nasa-head__emg { width: 30mm; flex: none; text-align: center; }
.nasa-emg__247 { font-family: Georgia, serif; font-size: 22pt; font-weight: 700; line-height: 1; color: #0CA19D; }
.nasa-emg__247 span { color: #EB1F28; }
.nasa-emg__label { font-size: 9pt; font-weight: 700; color: #EB1F28; line-height: 1.1; }
.nasa-emg__label small { display: block; font-size: 7.5pt; color: #2A3A92; letter-spacing: 2px; }

.nasa-ecg { padding: 0 12mm; margin-top: 1mm; }
.nasa-ecg svg { display: block; width: 100%; height: 7mm; }
.nasa-rule { height: 1.1mm; background: #2A3A92; }

/* ---------------- body ---------------- */
.nasa-content { position: relative; flex: 1; padding: 8mm 12mm 6mm; z-index: 1; }
.nasa-watermark {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 105mm; opacity: .07; z-index: 0; pointer-events: none;
}
.nasa-watermark img { width: 100%; display: block; }
/* keep the shared print components readable on this letterhead */
.nasa-content > * { position: relative; z-index: 1; }

/* ---- harmonise the SHARED prescription body with this letterhead ----
   These target element types inside .nasa-content, so they out-specify
   Tailwind's single-class utilities without editing PrintPrescription.jsx
   (which every other hospital still uses unchanged). */
.nasa-content > div { max-width: 100%; margin: 0; padding: 0; box-shadow: none; }
.nasa-content h2 { color: #2A3A92; font-family: Georgia, serif; }
.nasa-content h3 {
  color: #2A3A92; text-transform: uppercase;
  font-size: 10pt; letter-spacing: .5px;
}
.nasa-content table { border-collapse: collapse; }
.nasa-content table th {
  background: #eef1f9; color: #2A3A92; border-color: #b9c0d8;
  text-transform: uppercase; font-size: 8.5pt; letter-spacing: .3px;
}
.nasa-content table td { border-color: #c9cede; }

/* ---------------- footer ---------------- */
.nasa-band-bot { position: relative; height: 20mm; flex: none; }
.nasa-band-bot svg { display: block; width: 100%; height: 100%; position: absolute; inset: 0; }
.nasa-foot__text {
  position: absolute; bottom: 3.5mm; left: 0; right: 0;
  display: flex; justify-content: space-between; padding: 0 10mm;
  color: #fff; font-size: 8.5pt; font-weight: 600; z-index: 2;
}

@media print {
  html, body { width: 210mm; margin: 0; padding: 0; background: #fff; }

  /* Drop the flex column. Fixed, in print media, means "on every page at the
     paper edge" — so the footer cannot ride up when content is short, and a
     long prescription spilling onto page 2 still gets a full letterhead and
     footer with the signature flowing naturally underneath the content. */
  .nasa-page { display: block; width: 210mm; min-height: 0; overflow: visible; box-shadow: none; }
  .nasa-letterhead { position: fixed; top: 0; left: 0; right: 0; z-index: 3; }
  .nasa-band-bot  { position: fixed; bottom: 0; left: 0; right: 0; z-index: 3; }
  .nasa-content   { padding-top: var(--nasa-header-h); padding-bottom: var(--nasa-footer-h); }
  .nasa-watermark { top: 150mm; }

  .nasa-content tr, .nasa-content table { page-break-inside: auto; }
  .nasa-content tr { page-break-inside: avoid; }
  .nasa-content thead { display: table-header-group; }

  .nasa-root * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

const NasaPage = ({ hospital, children }) => (
  <div className="nasa-root">
    <style>{CSS}</style>

    <div className="nasa-page">
      {/* ---- letterhead: one block so it can pin to every printed page ---- */}
      <div className="nasa-letterhead">
        <div className="nasa-band-top">
          <svg viewBox="0 0 800 100" preserveAspectRatio="none">
            <path d="M0,0 H800 V34 C640,86 560,4 400,30 C240,56 150,96 0,52 Z" fill="#2A3A92" />
            <path d="M0,0 H520 C420,44 300,52 190,74 C120,88 60,80 0,60 Z" fill="#0CA19D" />
            <path d="M0,26 C160,74 250,32 400,14 C560,-6 650,54 800,16 L800,0 L0,0 Z" fill="#ffffff" />
          </svg>
        </div>

        <div className="nasa-head">
          <div className="nasa-head__logo">
            <img src={LOGO} alt={hospital?.fullName || "Nasa Hospital"} />
          </div>

          <div className="nasa-head__mid">
            <h1 className="nasa-head__name">
              {(hospital?.fullName || "NASA HOSPITAL").toUpperCase()}
            </h1>
            <p className="nasa-head__addr">
              Plot No. 474/227B Iradat Nagar, Opp. Shia P.G. College
              <br />
              Sitapur Road, Lucknow &ndash; PIN 226020
            </p>
          </div>

          <div className="nasa-head__emg">
            <div className="nasa-emg__247">
              24<span>&times;7</span>
            </div>
            <div className="nasa-emg__label">
              Emergency<small>SERVICES</small>
            </div>
          </div>
        </div>

        <div className="nasa-ecg">
          <svg viewBox="0 0 800 40" preserveAspectRatio="none">
            <path
              d="M0,20 H300 l12,0 l8,-15 l10,30 l9,-32 l10,32 l8,-15 l14,0 H800"
              fill="none"
              stroke="#2A3A92"
              strokeWidth="2.2"
            />
          </svg>
        </div>
        <div className="nasa-rule" />
      </div>

      {/* ---- body ---- */}
      <div className="nasa-content">
        <div className="nasa-watermark">
          <img src={LOGO} alt="" />
        </div>
        {children}
      </div>

      {/* ---- footer ---- */}
      <div className="nasa-band-bot">
        <svg viewBox="0 0 800 100" preserveAspectRatio="none">
          <path d="M0,100 H800 V22 C650,-14 560,64 400,70 C240,76 150,26 0,58 Z" fill="#0CA19D" />
          <path d="M0,100 H800 V52 C640,96 520,38 360,52 C220,64 120,92 0,74 Z" fill="#2A3A92" />
        </svg>
        <div className="nasa-foot__text">
          <span>Validity for 5 Days</span>
          <span>Contact: 9984499496, 0522-3194945</span>
          <span>Not for Medical Legal Purpose</span>
        </div>
      </div>
    </div>
  </div>
);

export default NasaPage;
