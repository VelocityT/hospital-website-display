import bcrypt from "bcrypt";
import dayjs from "dayjs";
// The ".js" is REQUIRED. dayjs 1.11.13 ships no "exports" map, so Node's ESM
// resolver does no extension guessing — "dayjs/plugin/utc" throws
// ERR_MODULE_NOT_FOUND. Verified empirically; do not "tidy" these.
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * The timezone every date-boundary calculation is anchored to.
 *
 * WHY THIS EXISTS: `startOf("day")` is timezone-dependent. The API runs on
 * Render in UTC, the browser runs in the hospital's local time (IST). For an
 * admission at 29-Jul 20:41 IST checked at 31-Jul 00:06 IST, the browser
 * counted 2 days (₹2600) while the server counted 1 (₹1300) — the server was
 * still on 30-Jul in UTC. The bill the staff saw did not match the bill the
 * API would accept, and payment was rejected as "already fully paid".
 *
 * Both sides must therefore compute stay days in the SAME fixed timezone.
 * Keep this identical to HOSPITAL_TZ in frontend/src/utils/helper.js.
 * If Velocare is ever sold outside IST, move this onto the Hospital document.
 */
export const HOSPITAL_TZ = "Asia/Kolkata";

export const hashPassword = async (plainPassword) => {
  const saltRounds = 10;
  const hashed = await bcrypt.hash(plainPassword, saltRounds);
  return hashed;
};


export const extractArray = (body, key) => {
  const value = body[key];
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

export const addOnlyDateStage = (field = "createdAt", alias = "onlyDate") => ({
  $addFields: {
    [alias]: {
      $dateToString: {
        format: "%Y-%m-%d",
        date: `$${field}`,
      },
    },
  },
});

/**
 * Billable days for an IPD stay.
 *
 * Rule (unchanged): the first calendar day is free of the day-boundary check —
 * the counter starts the day AFTER admission, so a stay is billed as at least
 * 1 day and gains a day at each midnight crossed. An undischarged patient is
 * billed up to "now".
 *
 * All boundaries are evaluated in HOSPITAL_TZ so the server and the browser
 * always agree. Do not remove the `.tz()` calls — without them this function
 * silently returns different numbers on Render (UTC) and in the clinic (IST).
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
