// Self-contained glasses prescription print — opens a print-ready window.
// Does not touch the existing /print flow.
export const handleGlassesRxPrint = ({ hospital, patient, opdNumber, exam, doctorName }) => {
  const rx = exam?.glassesPrescription || {};
  const od = rx.rightEye || {};
  const os = rx.leftEye || {};

  const row = (label, eye) => `
    <tr>
      <td class="lbl">${label}</td>
      <td>${eye.distSph || "-"}</td>
      <td>${eye.distCyl || "-"}</td>
      <td>${eye.distAxis || "-"}</td>
      <td>${eye.distVA || "-"}</td>
      <td>${eye.nearAdd || "-"}</td>
    </tr>`;

  const html = `<!DOCTYPE html>
<html>
<head>
<title>Glasses Prescription - ${patient?.fullName || ""}</title>
<style>
  * { font-family: system-ui, -apple-system, sans-serif; color: #111; }
  body { margin: 24px; }
  .header { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #1d4ed8; padding-bottom: 12px; }
  .header img { height: 60px; }
  .hospital-name { font-size: 22px; font-weight: 700; color: #1d4ed8; }
  .hospital-meta { font-size: 12px; color: #444; }
  .title { text-align: center; font-size: 16px; font-weight: 600; margin: 16px 0 8px; text-decoration: underline; }
  .meta { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th, td { border: 1px solid #999; padding: 6px 8px; text-align: center; font-size: 13px; }
  th { background: #eff6ff; }
  .lbl { font-weight: 600; background: #f8fafc; }
  .extra { font-size: 13px; margin: 4px 0; }
  .footer { margin-top: 48px; display: flex; justify-content: space-between; font-size: 13px; }
  .sign { border-top: 1px solid #333; padding-top: 4px; }
  @media print { .no-print { display: none; } }
</style>
</head>
<body>
  <div class="header">
    ${hospital?.logoUrl ? `<img src="${hospital.logoUrl}" alt="logo" />` : ""}
    <div>
      <div class="hospital-name">${hospital?.fullName || ""}</div>
      <div class="hospital-meta">${hospital?.address || ""} ${
    hospital?.phone ? " | Ph: " + hospital.phone : ""
  }</div>
    </div>
  </div>

  <div class="title">GLASSES PRESCRIPTION</div>

  <div class="meta">
    <div>
      <b>${patient?.fullName || ""}</b> (${patient?.patientId || ""})<br/>
      ${patient?.gender || ""} ${opdNumber ? " | OPD: " + opdNumber : ""}
    </div>
    <div>Date: ${new Date().toLocaleDateString("en-IN")}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th></th><th>SPH</th><th>CYL</th><th>AXIS</th><th>V/A</th><th>ADD (Near)</th>
      </tr>
    </thead>
    <tbody>
      ${row("Right Eye (OD)", od)}
      ${row("Left Eye (OS)", os)}
    </tbody>
  </table>

  ${rx.pd ? `<div class="extra"><b>PD:</b> ${rx.pd} mm</div>` : ""}
  ${rx.lensType ? `<div class="extra"><b>Lens Type:</b> ${rx.lensType}</div>` : ""}
  ${
    rx.lensMaterialNote
      ? `<div class="extra"><b>Lens Advice:</b> ${rx.lensMaterialNote}</div>`
      : ""
  }
  ${rx.remarks ? `<div class="extra"><b>Remarks:</b> ${rx.remarks}</div>` : ""}

  <div class="footer">
    <div></div>
    <div class="sign">${doctorName ? "Dr. " + doctorName : "Doctor's Signature"}</div>
  </div>

  <button class="no-print" onclick="window.print()" style="margin-top:24px;padding:8px 16px;">Print</button>
  <script>window.onload = () => setTimeout(() => window.print(), 300);</script>
</body>
</html>`;

  const win = window.open("", "_blank", "noopener,noreferrer,width=800,height=900");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
};
