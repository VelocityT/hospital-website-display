import Bill from "../models/bill.js";
import Ipd from "../models/ipd.js";
import Opd from "../models/opd.js";
import StaffPayment from "../models/staffPayment.js";

const addOnlyDateStage = (field) => ({
  $addFields: {
    onlyDate: { $dateToString: { format: "%Y-%m-%d", date: `$${field}` } },
  },
});

const getValue = (arr) => (arr?.length ? arr[0].total : 0);

export const getUserIncome = async ({
  role,
  hospital,
  authorityId,
  id,
  startDate,
  endDate,
}) => {
  const todayDateStr = new Date().toISOString().split("T")[0];
  let income = null;

  const dateFilter =
    startDate && endDate
      ? {
          $gte: new Date(startDate + "T00:00:00.000Z"),
          $lte: new Date(endDate + "T23:59:59.999Z"),
        }
      : null;

  if (role === "admin" && authorityId.toString() === id) {
    const [
      todayIncomeAgg,
      totalIncomeAgg,
      totalOtherExpense,
      totalBonus,
      totalMonthly,
    ] = await Promise.all([
      Bill.aggregate([
        addOnlyDateStage("createdAt"),
        {
          $match: {
            hospital,
            onlyDate: todayDateStr,
            "entry.type": { $in: ["Ipd", "Opd", "Pathology", "Medicine"] },
          },
        },
        { $group: { _id: "$entry.type", total: { $sum: "$paidAmount" } } },
      ]),
      Bill.aggregate([
        {
          $match: {
            hospital,
            "entry.type": { $in: ["Ipd", "Opd", "Pathology", "Medicine"] },
            ...(dateFilter ? { createdAt: dateFilter } : {}),
          },
        },
        { $group: { _id: "$entry.type", total: { $sum: "$paidAmount" } } },
      ]),
      StaffPayment.aggregate([
        {
          $match: {
            hospital,
            staff: authorityId,
            paymentType: "Other Expense",
            ...(dateFilter ? { createdAt: dateFilter } : {}),
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      StaffPayment.aggregate([
        {
          $match: {
            hospital,
            staff: authorityId,
            paymentType: "Bonus",
            ...(dateFilter ? { createdAt: dateFilter } : {}),
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      StaffPayment.aggregate([
        {
          $match: {
            hospital,
            staff: authorityId,
            paymentType: "Monthly Salary",
            ...(dateFilter ? { createdAt: dateFilter } : {}),
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const formatIncomeMap = (data) =>
      ["Ipd", "Opd", "Pathology", "Medicine"].reduce((acc, key) => {
        const item = data.find((i) => i._id === key);
        const displayKey = key === "Medicine" ? "Pharmacy" : key;
        acc[displayKey] = item?.total || 0;
        return acc;
      }, {});

    income = {
      Today: formatIncomeMap(todayIncomeAgg),
      Total: formatIncomeMap(totalIncomeAgg),
      Salary: {
        MonthlySalary: getValue(totalMonthly),
        OtherExpense: getValue(totalOtherExpense),
        Bonus: getValue(totalBonus),
      },
    };
  } else if (role === "doctor" && authorityId.toString() === id) {
    const [
      todayDoctorIpdIncome,
      totalDoctorIpdIncome,
      todayDoctorOpdIncome,
      totalDoctorOpdIncome,
      totalOtherExpense,
      totalBonus,
    ] = await Promise.all([
      Ipd.aggregate([
        { $match: { hospital, attendingDoctor: authorityId } },
        { $unwind: "$doctorPayment" },
        { $match: { "doctorPayment.paidAt": { $type: "date" } } },
        {
          $addFields: {
            onlyDate: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$doctorPayment.paidAt",
              },
            },
          },
        },
        { $match: { onlyDate: todayDateStr } },
        {
          $group: {
            _id: null,
            total: { $sum: "$doctorPayment.amount" },
          },
        },
      ]),
      Ipd.aggregate([
        { $match: { hospital, attendingDoctor: authorityId } },
        { $unwind: "$doctorPayment" },
        {
          $match: {
            ...(dateFilter ? { "doctorPayment.paidAt": dateFilter } : {}),
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$doctorPayment.amount" },
          },
        },
      ]),

      Opd.aggregate([
        { $match: { hospital, doctor: authorityId } },
        { $unwind: "$doctorPayment" },
        { $match: { "doctorPayment.paidAt": { $type: "date" } } },
        {
          $addFields: {
            onlyDate: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$doctorPayment.paidAt",
              },
            },
          },
        },
        { $match: { onlyDate: todayDateStr } },
        {
          $group: {
            _id: null,
            total: { $sum: "$doctorPayment.amount" },
          },
        },
      ]),

      Opd.aggregate([
        { $match: { hospital, doctor: authorityId } },
        { $unwind: "$doctorPayment" },
        {
          $match: {
            ...(dateFilter ? { "doctorPayment.paidAt": dateFilter } : {}),
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$doctorPayment.amount" },
          },
        },
      ]),
      StaffPayment.aggregate([
        {
          $match: {
            hospital,
            staff: authorityId,
            paymentType: "Other Expense",
            ...(dateFilter ? { createdAt: dateFilter } : {}),
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),

      StaffPayment.aggregate([
        {
          $match: {
            hospital,
            staff: authorityId,
            paymentType: "Bonus",
            ...(dateFilter ? { createdAt: dateFilter } : {}),
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const getValue = (arr) => (arr.length ? arr[0].total : 0);

    income = {
      Today: {
        Ipd: getValue(todayDoctorIpdIncome),
        Opd: getValue(todayDoctorOpdIncome),
        Total: getValue(todayDoctorIpdIncome) + getValue(todayDoctorOpdIncome),
      },
      Salary: {
        OtherExpense: getValue(totalOtherExpense),
        Bonus: getValue(totalBonus),
      },
      Total: {
        Ipd: getValue(totalDoctorIpdIncome),
        Opd: getValue(totalDoctorOpdIncome),
        Total: getValue(totalDoctorIpdIncome) + getValue(totalDoctorOpdIncome),
      },
    };
  } else if (role === "nurse" && authorityId.toString() === id) {
    const [totalOtherExpense, totalBonus, totalMonthly] = await Promise.all([
      StaffPayment.aggregate([
        {
          $match: {
            hospital,
            staff: authorityId,
            paymentType: "Other Expense",

            ...(dateFilter ? { createdAt: dateFilter } : {}),
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),

      StaffPayment.aggregate([
        {
          $match: {
            hospital,
            staff: authorityId,
            paymentType: "Bonus",

            ...(dateFilter ? { createdAt: dateFilter } : {}),
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      StaffPayment.aggregate([
        {
          $match: {
            hospital,
            staff: authorityId,
            paymentType: "Monthly Salary",

            ...(dateFilter ? { createdAt: dateFilter } : {}),
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    income = {
      Salary: {
        MonthlySalary: getValue(totalMonthly),
        OtherExpense: getValue(totalOtherExpense),
        Bonus: getValue(totalBonus),
      },
    };
  } else if (role === "pathologist" && authorityId.toString() === id) {
    const [todayAgg, totalAgg, totalOtherExpense, totalBonus, totalMonthly] =
      await Promise.all([
        pathologyTestReport.aggregate([
          {
            $addFields: {
              onlyDate: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
            },
          },
          {
            $match: {
              hospital,
              onlyDate: todayDateStr,
              "payment.status": "Paid",
            },
          },
          {
            $group: {
              _id: null,
              paidToday: { $sum: "$payableAmount" },
            },
          },
        ]),
        pathologyTestReport.aggregate([
          {
            $match: { hospital },
          },
          {
            $lookup: {
              from: "bills",
              localField: "payment.bill",
              foreignField: "_id",
              as: "bills",
            },
          },
          { $unwind: "$bills" },
          {
            $match: {
              ...(dateFilter ? { "bills.createdAt": dateFilter } : {}),
            },
          },
          {
            $group: {
              _id: "$payment.status",
              totalAmount: { $sum: "$payableAmount" },
            },
          },
        ]),
        StaffPayment.aggregate([
          {
            $match: {
              hospital,
              staff: authorityId,
              paymentType: "Other Expense",
              ...(dateFilter ? { createdAt: dateFilter } : {}),
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),

        StaffPayment.aggregate([
          {
            $match: {
              hospital,
              staff: authorityId,
              paymentType: "Bonus",

              ...(dateFilter ? { createdAt: dateFilter } : {}),
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        StaffPayment.aggregate([
          {
            $match: {
              hospital,
              staff: authorityId,
              paymentType: "Monthly Salary",

              ...(dateFilter ? { createdAt: dateFilter } : {}),
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
      ]);

    const todayPaid = todayAgg[0]?.paidToday || 0;

    let totalPaid = 0;
    let totalUnpaid = 0;

    totalAgg.forEach((entry) => {
      if (entry._id === "Paid") {
        totalPaid = entry.totalAmount;
      } else if (entry._id === "Unpaid") {
        totalUnpaid = entry.totalAmount;
      }
    });

    income = {
      Salary: {
        MonthlySalary: getValue(totalMonthly),
        OtherExpense: getValue(totalOtherExpense),
        Bonus: getValue(totalBonus),
      },
      Today: { Pathology: todayPaid },
      Total: {
        Pathology: totalPaid + totalUnpaid,
        Paid: totalPaid,
        Unpaid: totalUnpaid,
      },
    };
  } else if (role === "pharmacist") {
    const [
      todayPharmacyIncomeAgg,
      totalPharmacyIncomeAgg,
      totalOtherExpense,
      totalBonus,
      totalMonthly,
    ] = await Promise.all([
      Bill.aggregate([
        addOnlyDateStage("createdAt"),
        {
          $match: {
            hospital,
            onlyDate: todayDateStr,
            "entry.type": "Medicine",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$paidAmount" },
          },
        },
      ]),
      Bill.aggregate([
        {
          $match: {
            hospital,
            "entry.type": "Medicine",
            ...(dateFilter ? { createdAt: dateFilter } : {}),
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$paidAmount" },
          },
        },
      ]),
      StaffPayment.aggregate([
        {
          $match: {
            hospital,
            staff: authorityId,
            paymentType: "Other Expense",

            ...(dateFilter ? { createdAt: dateFilter } : {}),
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),

      StaffPayment.aggregate([
        {
          $match: {
            hospital,
            staff: authorityId,
            paymentType: "Bonus",

            ...(dateFilter ? { createdAt: dateFilter } : {}),
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      StaffPayment.aggregate([
        {
          $match: {
            hospital,
            staff: authorityId,
            paymentType: "Monthly Salary",

            ...(dateFilter ? { createdAt: dateFilter } : {}),
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const todayPharmacyIncome = todayPharmacyIncomeAgg[0]?.total || 0;
    const totalPharmacyIncome = totalPharmacyIncomeAgg[0]?.total || 0;

    income = {
      Today: { Pharmacy: todayPharmacyIncome },
      Total: { Pharmacy: totalPharmacyIncome },
      SalarySalary: {
        Monthly: getValue(totalMonthly),
        OtherExpense: getValue(totalOtherExpense),
        Bonus: getValue(totalBonus),
      },
    };
  }

  return income;
};
