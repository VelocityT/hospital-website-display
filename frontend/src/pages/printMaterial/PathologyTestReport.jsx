import { formatDateTime } from "../../utils/helper";

const PathologyTestReport = ({ testReport }) => {
  const { descriptionForPatient, record } = testReport.data;

  const fieldData = [
    {
      label: "Test Code",
      value: record?.test?.testCode || "-",
    },
    {
      label: "Date",
      value: formatDateTime(record?.createdAt) || "-",
    },
    {
      label: "Patient ID",
      value: descriptionForPatient?.patientId || "-",
    },
    {
      label: record?.ipd?.ipdNumber ? "IPD Number" : "OPD Number",
      value: record?.ipd?.ipdNumber || record?.opd?.opdNumber || "-",
    },
    {
      label: "Patient Name",
      value: descriptionForPatient?.patientFullName || "-",
    },
    {
      label: "Reported By",
      value: record?.reportedBy?.fullName || "-",
    },
  ];

  return (
    <div className="bg-white p-6 mx-auto my-6 shadow print:shadow-none print:p-0 print:bg-white">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-10 text-sm text-gray-800">
        {fieldData.map((item, idx) => (
          <div key={idx} className="flex">
            <span className="font-medium w-36">{item.label}:</span>
            <span className="flex-1">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="pt-6 pb-2">
        <h2 className="text-lg font-semibold text-black">
          {record?.test?.testName}
        </h2>
      </div>

      <div className="border border-gray-300 rounded-md">
        <div className="flex bg-gray-100 font-semibold text-sm text-black p-2 border-b border-gray-300">
          <div className="w-2/6">Test Name</div>
          <div className="w-1/6">Result</div>
          <div className="w-1/6">Unit</div>
          <div className="w-2/6">Normal Range</div>
        </div>

        {record?.results?.map((item, idx) => (
          <div key={idx} className="flex text-sm p-2 border-b last:border-b-0">
            <div className="w-2/6">{item.name}</div>
            <div className="w-1/6">{item.result}</div>
            <div className="w-1/6">{item.unit}</div>
            <div className="w-2/6">{item.normalRange}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PathologyTestReport;
