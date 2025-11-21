import dayjs from "dayjs";

export function generateUniqueNumber(prefix) {
  const now = Date.now().toString().slice(-6);
  const rand = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `${prefix}-${now}${rand}`;
}
export const formatDate = (date) => {
  const d = dayjs(date);
  return d.isValid() ? d.format("DD/MM/YYYY") : "-";
};
export const formatDateTime = (date) => {
  const d = dayjs(date);
  return d.isValid() ? d.format("DD/MM/YYYY HH:mm") : "-";
};

export const handleNumericKeyDown = (e) => {
  const allowedKeys = ["Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete"];

  const isDigit = /^[0-9]$/.test(e.key);
  const isAllowed = isDigit || allowedKeys.includes(e.key);

  if (!isAllowed) {
    e.preventDefault();
  }
};

export const calculateStayDays = (admissionDate, dischargeDate) => {
  const admission = dayjs(admissionDate)
    .startOf("day")
    .add(1, "day")
    .add(1, "minute");
  const discharge = dischargeDate ? dayjs(dischargeDate) : dayjs();

  const days = discharge.diff(admission, "day") + 1;

  return days > 0 ? days : 1;
};
export function calculateTotalDoctorPayment(doctorPaymentArray) {
  if (!Array.isArray(doctorPaymentArray)) return 0;

  return doctorPaymentArray.reduce(
    (sum, payment) => sum + (payment?.amount || 0),
    0
  );
}
export const calculateCommission = (record, type, staffData) => {
  if (!record || !staffData) return 0;

  if (type === "ipd") {
    const admission = dayjs(record.admissionDate);
    const discharge = record?.dischargeSummary?.dischargeDate
      ? dayjs(record.dischargeSummary.dischargeDate)
      : dayjs();

    const days = discharge.diff(admission, "day") || 1;

    const perDay = (staffData.ipdCommission * staffData.ipdCharge) / 100;

    return parseFloat((perDay * days).toFixed(2));
  }

  if (type === "opd") {
    const commission = (staffData.opdCommission * staffData.opdCharge) / 100;
    return parseFloat(commission.toFixed(2));
  }

  return 0;
};
