import { useEffect } from "react";
import { useSelector } from "react-redux";
import PrintPrescription from "./PrintPrescription";
import PrintPatientBill from "./PrintPatientBill";
import PathologyTestReport from "./PathologyTestReport";
import { resolvePrintPage, resolvePrintBody } from "./templates";

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
  // switch below falls through the same way.
  const docType =
    type === "bill" || type === "testReport" ? type : "prescription";

  // Falls back to the default letterhead for any hospital without a bespoke
  // template, and for document types a bespoke template does not cover.
  // A template may also give a specific document type its own letterhead —
  // Nasa's bill does not use the prescription pad's header or footer.
  const Page = resolvePrintPage(hospital?.printTemplate, docType);

  // A template may also replace the body outright (see templates/index.js).
  // Null for every hospital that just wants its own letterhead.
  const CustomBody = resolvePrintBody(hospital?.printTemplate, docType);

  const renderContent = () => {
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
      <Page hospital={hospital}>{renderContent()}</Page>

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
