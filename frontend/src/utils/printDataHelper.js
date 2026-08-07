/**
 * Patient fields every printed bill needs.
 *
 * Itemised layouts (see templates/NasaBill.jsx) show demographics and address
 * alongside the charges. Kept in one place so a template can rely on these
 * being present regardless of which entry type produced the bill.
 */
const patientBlock = (patient) => ({
  patientId: patient?.patientId,
  patientName: patient?.fullName,
  gender: patient?.gender,
  age: patient?.age,
  address: patient?.address,
  phone: patient?.contact?.phone,
});

/**
 * Total collected across EVERY instalment on this entry.
 *
 * The payload deliberately narrows `payment.bill` to the one instalment being
 * printed, so this has to be summed BEFORE that narrowing — otherwise a bill
 * shows only the payment in front of it and reports a balance the patient has
 * already partly cleared.
 *
 * Mirrors ChargeTable: the running total is the sum of `totalCharge`, which is
 * the amount collected in each instalment.
 */
const sumPaid = (bills) =>
  (Array.isArray(bills) ? bills : bills ? [bills] : []).reduce(
    (sum, b) => sum + (Number(b?.totalCharge) || 0),
    0
  );

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
    // Summed before payment.bill is narrowed to the printed instalment.
    const paidToDate = sumPaid(ipd?.payment?.bill);

    ipd = {
      ...ipd,
      payment: {
        ...ipd.payment,
        bill: [bill],
      },
    };

    entryData = ipd;
    billDetails = {
      ...patientBlock(patient),
      billNumber: bill?.billNumber,
      date: bill?.createdAt,
      ipdNumber: ipd?.ipdNumber,
      patientType: "Ipd",
      paidToDate,
      admissionDate: ipd?.admissionDate,
      dischargeDate: ipd?.dischargeSummary?.dischargeDate || null,
      bed: [ipd?.bed?.bedType, ipd?.bed?.bedNumber].filter(Boolean).join(" - "),
      ward: ipd?.ward?.name,
      paymentMethod: bill?.paymentMethod,
      doctors: [
        ipd?.attendingDoctor && {
          name: ipd.attendingDoctor.fullName,
          specialist: ipd.attendingDoctor.specialist,
        },
      ].filter(Boolean),
    };
  } else if (type === "Opd") {
    const opd = opds.find((o) => o.opdNumber === record?.entry?.checkId);

    entryData = opd;
    billDetails = {
      ...patientBlock(patient),
      billNumber: record?.billNumber,
      date: record?.createdAt,
      opdNumber: opd?.opdNumber,
      patientType: "Opd",
      paidToDate: sumPaid(opd?.payment?.bill),
      admissionDate: opd?.visitDateTime,
      paymentMethod: record?.paymentMethod,
      doctors: [
        opd?.doctor && {
          name: opd.doctor.fullName,
          specialist: opd.doctor.specialist,
        },
      ].filter(Boolean),
    };
  } else if (type === "Pathology") {
    const report = testReports.find((r) => r?._id === record?.entry?.entryId);

    entryData = report;
    billDetails = {
      ...patientBlock(patient),
      billNumber: record?.billNumber,
      date: record?.createdAt,
      opdNumber: report?.opd?.opdNumber,
      ipdNumber: report?.ipd?.ipdNumber,
      paidToDate: sumPaid(report?.payment?.bill),
      paymentMethod: record?.paymentMethod,
      doctors: [
        report?.reportedBy && { name: report.reportedBy.fullName },
      ].filter(Boolean),
    };
  } else if (type === "Medicine") {
    let order = medicineOrder.find(
      (order) => order._id === record?.entry?.entryId
    );

    const bill = order?.payment?.bill?.find(
      (b) => b.billNumber === record?.billNumber
    );
    const paidToDate = sumPaid(order?.payment?.bill);

    order = {
      ...order,
      payment: {
        ...order.payment,
        bill: [bill],
      },
    };

    entryData = order;
    billDetails = {
      ...patientBlock(patient),
      billNumber: record?.billNumber,
      date: record?.createdAt,
      paidToDate,
      paymentMethod: bill?.paymentMethod,
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

/**
 * Print an EMPTY prescription pad for a visit.
 *
 * Letterhead, patient details, visit number and doctor are printed; the
 * consulting area is left blank for the doctor to write by hand. This is what
 * lets one terminal at reception serve every consulting room.
 *
 * Deliberately creates no Prescription record — nothing has been prescribed
 * yet. If the visit is typed up later it goes through the normal prescription
 * screen.
 *
 * Accepts either an OPD or an IPD visit. `doctor` may be a populated object or
 * already-flattened fields, because the three screens that offer this button
 * hold the visit in slightly different shapes.
 *
 * @param {Object} patient  patient record
 * @param {Object} visit    opd or ipd record
 * @param {"opd"|"ipd"} type
 */
export const handleBlankPrescriptionPrint = ({ patient, visit = {}, type }) => {
  const isIpd = type === "ipd";
  const doctor = isIpd ? visit?.attendingDoctor : visit?.doctor;

  localStorage.setItem(
    "printPayload",
    JSON.stringify({
      type: "blankPrescription",
      data: {
        patient: {
          patientId: patient?.patientId,
          fullName: patient?.fullName,
          gender: patient?.gender,
          age: patient?.age,
          phone: patient?.contact?.phone,
        },
        visit: {
          ipd: isIpd,
          number: isIpd ? visit?.ipdNumber : visit?.opdNumber,
          date: isIpd ? visit?.admissionDate : visit?.visitDateTime,
          bed: isIpd
            ? [visit?.bed?.bedType, visit?.bed?.bedNumber]
                .filter(Boolean)
                .join(" - ")
            : null,
          doctorName: doctor?.fullName || visit?.doctorFullName || "",
          doctorQualification: doctor?.qualification,
          doctorSpecialist: doctor?.specialist,
          // Drives the "Validity for N Days" footer line. Undefined here means
          // the template falls back to its own default rather than printing
          // a blank or NaN.
          validityDays: doctor?.prescriptionValidityDays,
        },
      },
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
