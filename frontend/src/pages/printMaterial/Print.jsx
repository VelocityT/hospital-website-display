import { useEffect } from "react";
import { useSelector } from "react-redux";
import PrintPrescription from "./PrintPrescription";
import PrintPatientBill from "./PrintPatientBill";
import PathologyTestReport from "./PathologyTestReport";
import BlankPrescription from "./BlankPrescription";
import { resolvePrintPage, resolvePrintBody } from "./templates";

/**
 * Validity in days for the letterhead footer, read off whichever payload shape
 * we were handed.
 *
 * - blank pad: the visit's doctor, flattened by handleBlankPrescriptionPrint
 * - saved prescription: the populated `doctor`, or `createdBy` on records
 *   written before the doctor field existed
 *
 * Returns undefined when no doctor resolves, letting the template apply its own
 * default rather than printing "Validity for undefined Days".
 */
const resolveValidityDays = (payload) => {
  if (payload?.type === "blankPrescription") {
    return payload?.data?.visit?.validityDays;
  }
  const doctor = payload?.data?.record?.doctor;
  return doctor?.prescriptionValidityDays;
};

const Print = () => {
  const payload = JSON.parse(localStorage.getItem("printPayload"));
  const type = payload?.type;

  // This route opens in a NEW TAB via window.open, so Redux starts empty here.
  // It rehydrates from the persisted `reduxState` in localStorage (see
  // redux/store.js) — that is how hospital identity survives the jump.
  const hospital = useSelector((state) => state.hospital);

  useEffect(() => {
    const timeout = setTimeout(() => window.print(), 500);
    return () => {
      clearTimeout(timeout);
      localStorage.removeItem("printPayload");
    };
  }, []);

  // Anything that is not a bill or a test report is a prescription — the
  // switch below falls through the same way. A blank pad is a prescription for
  // letterhead purposes, so it lands on the same header and footer.
  const docType =
    type === "bill" || type === "testReport" ? type : "prescription";

  // Footer data the letterhead needs but the body does not render itself.
  const meta = { validityDays: resolveValidityDays(payload) };

  // Falls back to the default letterhead for any hospital without a bespoke
  // template, and for document types a bespoke template does not cover.
  // A template may also give a specific document type its own letterhead —
  // Nasa's bill does not use the prescription pad's header or footer.
  const Page = resolvePrintPage(hospital?.printTemplate, docType);

  // A template may also replace the body outright (see templates/index.js).
  // Null for every hospital that just wants its own letterhead.
  const CustomBody = resolvePrintBody(hospital?.printTemplate, docType);

  const renderContent = () => {
    // A blank pad is the same document for every hospital — only the
    // letterhead around it differs — so it is checked before template bodies.
    if (type === "blankPrescription") {
      return <BlankPrescription payload={payload} />;
    }

    if (CustomBody) return <CustomBody bill={payload} payload={payload} />;

    switch (type) {
      case "bill":
        return <PrintPatientBill bill={payload} />;
      case "testReport":
        return <PathologyTestReport testReport={payload} />;
      default:
        return <PrintPrescription />;
    }
  };

  return (
    <>
      <Page hospital={hospital} meta={meta}>
        {renderContent()}
      </Page>

      <div className="mt-8 flex justify-center print:hidden">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Print Again
        </button>
      </div>
    </>
  );
};

export default Print;
