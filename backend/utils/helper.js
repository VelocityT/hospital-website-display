import bcrypt from "bcrypt";
import dayjs from "dayjs";

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

export const calculateStayDays = (admissionDate, dischargeDate) => {
  const admission = dayjs(admissionDate)
    .startOf("day")
    .add(1, "day")
    .add(1, "minute");
  const discharge = dischargeDate ? dayjs(dischargeDate) : dayjs();

  const days = discharge.diff(admission, "day") + 1;

  return days > 0 ? days : 1;
};
