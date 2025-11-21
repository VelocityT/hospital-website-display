export const handlePatientBillPrint = ({
  record,
  ipds,
  opds,
  patient,
  testReports,
  medicineOrder,
}) => {
  const type = record?.entry?.type;
  let entryData = null;
  let billDetails = null;

  if (type === "Ipd") {
    let ipd = ipds.find((i) => i.ipdNumber === record?.entry?.checkId);
    const bill = ipd?.payment?.bill?.find(
      (b) => b.billNumber === record?.billNumber
    );

    ipd = {
      ...ipd,
      payment: {
        ...ipd.payment,
        bill: [bill],
      },
    };

    entryData = ipd;
    billDetails = {
      billNumber: bill?.billNumber,
      date: bill?.createdAt,
      patientId: patient?.patientId,
      patientName: patient?.fullName,
      ipdNumber: ipd?.ipdNumber,
      patientType: "Ipd",
    };
  } else if (type === "Opd") {
    const opd = opds.find((o) => o.opdNumber === record?.entry?.checkId);

    entryData = opd;
    billDetails = {
      billNumber: record?.billNumber,
      date: record?.createdAt,
      patientId: patient?.patientId,
      patientName: patient?.fullName,
      opdNumber: opd?.opdNumber,
      patientType: "Ipd",
    };
  } else if (type === "Pathology") {
    const report = testReports.find((r) => r?._id === record?.entry?.entryId);

    entryData = report;
    billDetails = {
      billNumber: record?.billNumber,
      date: record?.createdAt,
      patientId: patient?.patientId,
      patientName: patient?.fullName,
      opdNumber: report?.opd?.opdNumber,
      ipdNumber: report?.ipd?.ipdNumber,
    };
  } else if (type === "Medicine") {
    let order = medicineOrder.find(
      (order) => order._id === record?.entry?.entryId
    );

    const bill = order?.payment?.bill?.find(
      (b) => b.billNumber === record?.billNumber
    );

    order = {
      ...order,
      payment: {
        ...order.payment,
        bill: [bill],
      },
    };

    entryData = order;
    billDetails = {
      billNumber: record?.billNumber,
      date: record?.createdAt,
      patientId: patient?.patientId,
      patientName: patient?.fullName,
    };
  }

  localStorage.setItem(
    "printPayload",
    JSON.stringify({
      type: "bill",
      entryType: type,
      data: { entryData, billDetails },
    })
  );

  window.open("/print", "_blank", "noopener,noreferrer");
};

export const handlePatientTestReportPrint = ({ record, patient }) => {
  const descriptionForPatient = {
    date: record?.createdAt,
    patientId: patient?.patientId,
    caseNumber: record?.patientType === "Ipd" ? record?.ipd : record?.opd,
    patientFullName: patient?.fullName,
  };

  localStorage.setItem(
    "printPayload",
    JSON.stringify({
      type: "testReport",
      data: { record, descriptionForPatient },
    })
  );

  window.open("/print", "_blank", "noopener,noreferrer");
};

export const handlePatientPrescriptionPrint = ({ record, patient }) => {
  localStorage.setItem(
    "printPayload",
    JSON.stringify({
      type: "prescription",
      data: { record, patient },
    })
  );

  window.open("/print", "_blank", "noopener,noreferrer");
};
