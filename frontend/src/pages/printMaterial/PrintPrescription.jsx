import { formatDateTime } from "../../utils/helper";
import { doseIntervals, doseDurations } from "../../utils/localStorage";

const getLabel = (arr, value) =>
  arr.find((d) => d.value === value)?.label || value;

const PrintPrescription = () => {
  const payload = JSON.parse(localStorage.getItem("printPayload") || "{}");
  if (!payload || payload.type !== "prescription") return null;
  const { record = {}, patient = {} } = payload.data || {};
  const { medicines = [], labTests = [], note = "" } = record;
  const { onlyMedicine = false, ...patientData } = patient;

  if (!patientData) return null;

  // The doctor can arrive from two different places:
  //  - printing straight after writing a prescription: the editor passes
  //    `doctorFullName` on the patient payload (nothing is populated yet)
  //  - printing from patient history: `record` IS the saved prescription, so
  //    the populated `doctor` (or `createdBy`, for records written before the
  //    doctor field existed) carries the name.
  // Falling through these keeps both routes working.
  const doctorRef = record?.doctor || record?.createdBy || null;
  const doctorName = patientData?.doctorFullName || doctorRef?.fullName || "";
  const doctorCredentials = [doctorRef?.qualification, doctorRef?.specialist]
    .filter(Boolean)
    .join(", ");

  const fieldData = [
    { label: "Date", value: formatDateTime(record?.createdAt) || "-" },
    ...(record?.ipd || record?.opd
      ? [
          {
            label: record.ipd ? "IPD Number" : "OPD Number",
            value: record.ipd || record.opd || "-",
          },
        ]
      : []),
    { label: "Patient ID", value: patientData.patientId || "-" },
    { label: "Name", value: patientData.fullName || "-" },
    { label: "Gender", value: patientData.gender || "-" },
    {
      label: "DOB",
      value: patientData.dob
        ? new Date(patientData.dob).toLocaleDateString()
        : "-",
    },
    { label: "Blood Group", value: patientData.bloodGroup || "-" },
    { label: "Phone", value: patientData?.contact?.phone || "-" },
    ...(doctorName
      ? [
          {
            label: "Doctor",
            value: doctorCredentials
              ? `${doctorName} (${doctorCredentials})`
              : doctorName,
          },
        ]
      : []),
  ];

  return (
    <div className="bg-white text-black p-6 max-w-3xl mx-auto my-6 shadow print:shadow-none print:p-0 print:m-0 print:bg-white">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-10 text-sm text-gray-800 mb-6">
        {fieldData.map((item, idx) => (
          <div key={idx} className="flex">
            <span className="font-medium w-36">{item.label}:</span>
            <span className="flex-1">{item.value}</span>
          </div>
        ))}
      </div>

      {onlyMedicine ? (
        <>
          <h2 className="text-xl font-bold mb-4 text-center">Medicines</h2>
          <table className="w-full border border-gray-400 text-sm print:text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 px-2 py-1 text-left">
                  Medicine
                </th>
                <th className="border border-gray-400 px-2 py-1 text-left">
                  Qty
                </th>
                <th className="border border-gray-400 px-2 py-1 text-left">
                  Unit
                </th>
                <th className="border border-gray-400 px-2 py-1 text-left">
                  Price Per Piece
                </th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((item, idx) => (
                <tr key={idx}>
                  <td className="border border-gray-400 px-2 py-1 font-semibold">
                    {item.name}
                  </td>
                  <td className="border border-gray-400 px-2 py-1">
                    {item.quantity}
                  </td>
                  <td className="border border-gray-400 px-2 py-1">
                    {item.unit}
                  </td>
                  <td className="border border-gray-400 px-2 py-1">
                    ₹{item.sellPrice}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <>
          <h2 className="text-xl font-bold mb-4 text-center">Prescription</h2>

          {medicines.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Medicines</h3>
              <table className="w-full border border-gray-400 text-sm print:text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 px-2 py-1 text-left">
                      Medicine
                    </th>
                    <th className="border border-gray-400 px-2 py-1 text-left">
                      Category
                    </th>
                    <th className="border border-gray-400 px-2 py-1 text-left">
                      Dose Interval
                    </th>
                    <th className="border border-gray-400 px-2 py-1 text-left">
                      Dose Duration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((item, idx) => (
                    <tr key={idx}>
                      <td className="border border-gray-400 px-2 py-1 font-semibold">
                        {item.medicine}
                      </td>
                      <td className="border border-gray-400 px-2 py-1">
                        {item.medicineCategory}
                      </td>
                      <td className="border border-gray-400 px-2 py-1">
                        {getLabel(doseIntervals, item.doseInterval)}
                      </td>
                      <td className="border border-gray-400 px-2 py-1">
                        {getLabel(doseDurations, item.doseDuration)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {labTests.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Lab Tests</h3>
              <ul className="list-disc list-inside text-sm">
                {labTests.map((report, index) => (
                  <li key={`path-${index}`}>
                    {report.testName || report.testCode}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {note && (
            <>
              <hr className="my-4 border border-gray-300 print:border-black" />
              <div>
                <span className="font-semibold">Doctor's Note:</span>
                <div className="mt-1 whitespace-pre-line text-sm">{note}</div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default PrintPrescription;
