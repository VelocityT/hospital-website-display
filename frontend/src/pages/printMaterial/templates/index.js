import DefaultPage from "./DefaultPage";
import NasaPage from "./NasaPage";
import NasaBill from "./NasaBill";
import NasaBillPage from "./NasaBillPage";

/**
 * Registry of printed documents, keyed by `hospital.printTemplate`.
 *
 * A template controls three independent things:
 *
 *   Page   — the default letterhead wrapper (header, footer, @page rules)
 *   pages  — optional per-document-type letterhead OVERRIDES
 *   bodies — optional per-document-type REPLACEMENTS for the shared body
 *
 * `pages` exists because a prescription pad and a bill are not the same
 * document. A prescription footer ("Validity for 5 Days", "Not for Medical
 * Legal Purpose") is actively wrong on a bill, which is a financial record used
 * for insurance claims — and a bill needs the vertical space a decorative
 * clinical header eats on every page.
 *
 * Most clients only ever need their own `Page`; the shared bodies
 * (PrintPrescription / PrintPatientBill / PathologyTestReport) then render
 * inside it. `bodies` exists for the case where the client wants a genuinely
 * different document, not just a different header — Nasa's itemised bill is
 * the first of those.
 *
 * ADDING A CLIENT'S OWN LETTERHEAD
 * --------------------------------
 * 1. Build a <ClientName>Page.jsx that renders `children` between its header
 *    and footer, keeping all CSS inside a <style> tag (a .css import would
 *    leak @page rules into every other hospital's print).
 * 2. Register it here under a new key.
 * 3. Add that key to TEMPLATE_OPTIONS so superAdmin can pick it.
 * 4. Assign it on the hospital in Add/Edit Hospital.
 *
 * An unknown or missing key falls back to `default`, so a hospital can never
 * end up with a blank letterhead because of a typo.
 */
export const PRINT_TEMPLATES = {
  default: {
    Page: DefaultPage,
    // Document types this template is allowed to wrap. `null` = all of them.
    appliesTo: null,
    pages: {},
    bodies: {},
  },
  nasa: {
    // Prescription pad: logo, wave banding, watermark, clinical footer.
    Page: NasaPage,
    // Prescriptions and bills are on Nasa letterheads. Pathology reports still
    // use the standard header until they ask otherwise.
    appliesTo: ["prescription", "bill"],
    // Bills get their own, flatter letterhead with a financial footer.
    pages: { bill: NasaBillPage },
    // Nasa's bill is a different document from the shared one — itemised,
    // grouped, with a summary and a detailed breakup — so it replaces the
    // body rather than restyling it.
    bodies: { bill: NasaBill },
  },
};

/** Options for the superAdmin dropdown. */
export const TEMPLATE_OPTIONS = [
  { value: "default", label: "Default (Velocare)" },
  { value: "nasa", label: "Nasa Hospital" },
];

/**
 * Pick the page wrapper for a hospital + document type.
 * @param {string} templateKey  hospital.printTemplate
 * @param {string} docType      "prescription" | "bill" | "testReport"
 */
export const resolvePrintTemplate = (templateKey, docType) => {
  const tpl = PRINT_TEMPLATES[templateKey];
  if (!tpl) return PRINT_TEMPLATES.default;
  if (tpl.appliesTo && !tpl.appliesTo.includes(docType)) {
    return PRINT_TEMPLATES.default;
  }
  return tpl;
};

/**
 * The letterhead wrapper for a hospital + document type.
 *
 * Falls back: per-docType override → template default → DefaultPage. Resolved
 * through resolvePrintTemplate so a hospital never gets a wrapper for a
 * document type its template does not cover.
 *
 * @param {string} templateKey  hospital.printTemplate
 * @param {string} docType      "prescription" | "bill" | "testReport"
 */
export const resolvePrintPage = (templateKey, docType) => {
  const tpl = resolvePrintTemplate(templateKey, docType);
  return tpl?.pages?.[docType] || tpl?.Page || DefaultPage;
};

/**
 * The body component for a hospital + document type, or null to use the shared
 * one. Resolved through resolvePrintTemplate so a body can never render on a
 * letterhead the template does not cover — e.g. Nasa's bill body must not end
 * up inside the default header if `appliesTo` is ever narrowed.
 *
 * @param {string} templateKey  hospital.printTemplate
 * @param {string} docType      "prescription" | "bill" | "testReport"
 */
export const resolvePrintBody = (templateKey, docType) => {
  const tpl = resolvePrintTemplate(templateKey, docType);
  return tpl?.bodies?.[docType] || null;
};

export default PRINT_TEMPLATES;
