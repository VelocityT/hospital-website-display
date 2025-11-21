const PrintPatientDescription = () => {
  const patientDescription = JSON.parse(
    localStorage.getItem("printPatientDescription") || "{}"
  );

  if (!patientDescription || Object.keys(patientDescription).length === 0) {
    return null;
  }

  const fieldData = [
    {
      label: patientDescription.ipdNumber ? "IPD Number" : "OPD Number",
      value:
        patientDescription.ipdNumber || patientDescription.opdNumber || "-",
    },
    { label: "Patient ID", value: patientDescription.patientId || "-" },
    { label: "Name", value: patientDescription.fullName || "-" },
    { label: "Gender", value: patientDescription.gender || "-" },
    {
      label: "DOB",
      value: patientDescription.dob
        ? new Date(patientDescription.dob).toLocaleDateString()
        : "-",
    },
    { label: "Blood Group", value: patientDescription.bloodGroup || "-" },
    { label: "Phone", value: patientDescription.phone || "-" },
    ...(patientDescription?.doctorFullName
      ? [{ label: "Doctor", value: patientDescription.doctorFullName || "-" }]
      : []),
  ];

  return (
    <div className="bg-white p-6 max-w-3xl mx-auto my-6 shadow print:shadow-none print:p-0 print:bg-white">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-10 text-sm text-gray-800">
        {fieldData.map((item, idx) => (
          <div key={idx} className="flex">
            <span className="font-medium w-36">{item.label}:</span>
            <span className="flex-1">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrintPatientDescription;
