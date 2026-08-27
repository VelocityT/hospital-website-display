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

/**
 * Total collected up to and including ONE specific instalment.
 *
 * `payment.bill` is pushed in payment order, so array position is
 * chronological order — no date parsing needed.
 *
 * This is what an honest per-instalment receipt needs for its Balance line:
 * the headline "Amount Paid" on that receipt must be the instalment's own
 * amount (see `handlePatientBillPrint` below), but the outstanding balance
 * still has to account for every earlier instalment, or the receipt would
 * print a balance the patient already partly cleared before this payment.
 */
const sumPaidUpTo = (bills, targetBill) => {
  const arr = Array.isArray(bills) ? bills : bills ? [bills] : [];
  const idx = arr.findIndex(
    (b) =>
      (targetBill?._id && String(b?._id) === String(targetBill._id)) ||
      (targetBill?.billNumber && b?.billNumber === targetBill.billNumber)
  );
  return sumPaid(idx === -1 ? arr : arr.slice(0, idx + 1));
};

/**
 * @param {"installment"|"collective"} mode
 *   installment (default) — the receipt for ONE payment, the thing the
 *   printer icon on each billing row produces. "Amount Paid" on the page is
 *   that instalment's own amount, never the running total — printing the
 *   cumulative figure on a single payment's receipt is what caused a ₹500
 *   receipt to read "Amount Paid ₹5,000" when two earlier instalments existed.
 *   collective — the summary receipt, for the "print everything" button at
 *   the top of the entry. "Amount Paid" IS the running total across every
 *   instalment collected so far, and it's shown next to what's still due.
 */
export const handlePatientBillPrint = ({
  record,
  ipds,
  opds,
  patient,
  testReports,
  medicineOrder,
  mode = "installment",
}) => {
  const type = record?.entry?.type;
  const isCollective = mode === "collective";
  let entryData = null;
  let billDetails = null;

  if (type === "Ipd") {
    let ipd = ipds.find((i) => i.ipdNumber === record?.entry?.checkId);
    const allBills = ipd?.payment?.bill || [];
    const bill =
      allBills.find((b) => b.billNumber === record?.billNumber) || record;

    const paidToDate = isCollective
      ? sumPaid(allBills)
      : sumPaidUpTo(allBills, bill);
    const amountReceivedNow = isCollective
      ? paidToDate
      : Number(bill?.totalCharge) || 0;

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
      billingMode: mode,
      paidToDate,
      amountReceivedNow,
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
    // Opd carries a single Bill ref, never an array — one visit, one
    // payment, so there is no "instalment vs collective" distinction to make
    // here. amountReceivedNow and paidToDate are always the same figure.
    const opd = opds.find((o) => o.opdNumber === record?.entry?.checkId);
    const paidToDate = sumPaid(opd?.payment?.bill);

    entryData = opd;
    billDetails = {
      ...patientBlock(patient),
      billNumber: record?.billNumber,
      date: record?.createdAt,
      opdNumber: opd?.opdNumber,
      patientType: "Opd",
      billingMode: mode,
      paidToDate,
      amountReceivedNow: paidToDate,
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
    const allBills = report?.payment?.bill || [];
    const bill =
      (Array.isArray(allBills) ? allBills : [allBills]).find(
        (b) => b?.billNumber === record?.billNumber
      ) || record;

    const paidToDate = isCollective
      ? sumPaid(allBills)
      : sumPaidUpTo(allBills, bill);
    const amountReceivedNow = isCollective
      ? paidToDate
      : Number(bill?.totalCharge) || 0;

    entryData = {
      ...report,
      payment: { ...report?.payment, bill: [bill] },
    };
    billDetails = {
      ...patientBlock(patient),
      billNumber: bill?.billNumber,
      date: bill?.createdAt,
      opdNumber: report?.opd?.opdNumber,
      ipdNumber: report?.ipd?.ipdNumber,
      billingMode: mode,
      paidToDate,
      amountReceivedNow,
      paymentMethod: bill?.paymentMethod,
      doctors: [
        report?.reportedBy && { name: report.reportedBy.fullName },
      ].filter(Boolean),
    };
  } else if (type === "Medicine") {
    let order = medicineOrder.find(
      (order) => order._id === record?.entry?.entryId
    );
    const allBills = order?.payment?.bill || [];
    const bill =
      allBills.find((b) => b.billNumber === record?.billNumber) || record;

    const paidToDate = isCollective
      ? sumPaid(allBills)
      : sumPaidUpTo(allBills, bill);
    const amountReceivedNow = isCollective
      ? paidToDate
      : Number(bill?.totalCharge) || 0;

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
      billNumber: bill?.billNumber,
      date: bill?.createdAt,
      billingMode: mode,
      paidToDate,
      amountReceivedNow,
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
