import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Timezone every date-boundary calculation is anchored to.
 * MUST stay identical to HOSPITAL_TZ in backend/utils/helper.js — see the
 * comment there for the billing bug this prevents.
 */
export const HOSPITAL_TZ = "Asia/Kolkata";

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

/**
 * Billable days for an IPD stay. Must produce the SAME number as
 * calculateStayDays in backend/utils/helper.js — the API rejects a payment
 * whose amount disagrees with its own total, so any drift between these two
 * implementations shows up as "This IPD bill is already fully paid".
 */
export const calculateStayDays = (admissionDate, dischargeDate) => {
  const admission = dayjs(admissionDate)
    .tz(HOSPITAL_TZ)
    .startOf("day")
    .add(1, "day")
    .add(1, "minute");
  const discharge = dischargeDate
    ? dayjs(dischargeDate).tz(HOSPITAL_TZ)
    : dayjs().tz(HOSPITAL_TZ);

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

    // A negotiated per-visit rate (Ipd.doctorChargeOverride) replaces the
    // doctor's normal ipdCharge for commission purposes too — it's the
    // doctor's actual rate for THIS admission, not a discount on the
    // patient's bill, so the commission % applies to it the same way it
    // would to the normal rate. See pay.controller.js for the matching
    // billing-side calculation.
    const rate = record.doctorChargeOverride ?? staffData.ipdCharge;
    const perDay = (staffData.ipdCommission * rate) / 100;

    return parseFloat((perDay * days).toFixed(2));
  }

  if (type === "opd") {
    const rate = record.doctorChargeOverride ?? staffData.opdCharge;
    const commission = (staffData.opdCommission * rate) / 100;
    return parseFloat(commission.toFixed(2));
  }

  return 0;
};
