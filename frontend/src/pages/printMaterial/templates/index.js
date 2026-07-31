import DefaultPage from "./DefaultPage";
import NasaPage from "./NasaPage";

/**
 * Registry of printed letterheads, keyed by `hospital.printTemplate`.
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
  },
  nasa: {
    Page: NasaPage,
    // Nasa commissioned the prescription pad only — bills and pathology
    // reports keep the standard header until they ask otherwise.
    appliesTo: ["prescription"],
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

export default PRINT_TEMPLATES;
