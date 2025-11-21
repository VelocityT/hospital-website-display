import { useEffect } from "react";
import PrintHeader from "./PrintHeader";
import PrintPrescription from "./PrintPrescription";
import PrintPatientBill from "./PrintPatientBill";
import PathologyTestReport from "./PathologyTestReport";

const Print = () => {
  const payload = JSON.parse(localStorage.getItem("printPayload"));
  const type = payload?.type;

  useEffect(() => {
    const timeout = setTimeout(() => window.print(), 500);
    return () => {
      clearTimeout(timeout);
      localStorage.removeItem("printPayload");
    };
  }, []);

  const renderContent = () => {
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
    <div className="p-4 print:p-0 bg-white print:bg-white">
      <PrintHeader />
      {renderContent()}
      <div className="mt-8 flex justify-center print:hidden">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Print Again
        </button>
      </div>
    </div>
  );
};

export default Print;
