import { Row, Col, Card, DatePicker } from "antd";
import {
  FaMoneyBillWave,
  FaPrescriptionBottleAlt,
  FaUserMd,
  FaFlask,
} from "react-icons/fa";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Cell,
  Legend,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getIncomeOverviewForDashApi } from "../../services/apis";

const { RangePicker } = DatePicker;

const roleConfig = {
  admin: {
    title: "Total Income",
    keys: ["Ipd", "Opd", "Pathology", "Pharmacy"],
    icon: <FaMoneyBillWave />,
  },
  doctor: {
    title: "Doctor Income",
    keys: ["Ipd", "Opd"],
    icon: <FaUserMd />,
  },
  pharmacist: {
    title: "Pharmacy Income",
    keys: ["Pharmacy"],
    icon: <FaPrescriptionBottleAlt />,
  },
  pathologist: {
    title: "Pathology Income",
    keys: ["Pathology"],
    icon: <FaFlask />,
  },
};

const IncomeOverview = ({ user }) => {
  const [income, setIncome] = useState({});
  const [salary, setSalary] = useState({});
  const navigate = useNavigate();
  const role = user?.role?.toLowerCase();

  const fetchIncome = async (startDate = null, endDate = null) => {
    const res = await getIncomeOverviewForDashApi({
      role: user.role,
      hospital: user.hospital,
      authorityId: user.authorityId,
      id: user._id,
      startDate,
      endDate,
    });
    if (res?.success) {
      setIncome(res?.data);
      setSalary(res?.data?.Salary);
    }
  };

  useEffect(() => {
    if (user?._id) fetchIncome();
  }, [user]);

  const handleIncomeFilter = (dates) => {
    fetchIncome(
      dates?.[0]?.format("YYYY-MM-DD") || null,
      dates?.[1]?.format("YYYY-MM-DD") || null
    );
  };

  const handleSalaryFilter = (dates) => {
    fetchIncome(
      dates?.[0]?.format("YYYY-MM-DD") || null,
      dates?.[1]?.format("YYYY-MM-DD") || null
    );
  };

  // A salaried doctor earns a fixed monthly amount, not a share of each
  // visit, so the IPD/OPD income cards are meaningless for them — the API
  // sends `isSalaried` and omits those figures entirely. Only the salary
  // section renders. Patient billing is unaffected either way.
  const isSalariedDoctor = role === "doctor" && income?.isSalaried;

  const {
    keys: configuredKeys = [],
    title = "Salary",
    icon = null,
  } = roleConfig[role] || {};
  const keys = isSalariedDoctor ? [] : configuredKeys;

  const incomeToday = income?.Today || {};
  const incomeTotal = income?.Total || {};

  const getColorByKey = (key) => {
    switch (key) {
      case "Ipd":
        return "#60A5FA"; // blue
      case "Opd":
        return "#34D399"; // green
      case "Pathology":
        return "#FBBF24"; // yellow
      case "Pharmacy":
        return "#F87171"; // red
      case "Paid":
        return "#34D399"; // green
      case "Unpaid":
        return "#F87171"; // red
      default:
        return "#A78BFA"; // fallback purple
    }
  };

  const SalaryChartData = [
    // Commission-based doctors have no monthly salary line; salaried ones do.
    ...(role !== "doctor" || isSalariedDoctor
      ? [
          {
            name: "Monthly Salary",
            value: salary?.MonthlySalary || 0,
            color: "#A78BFA",
          },
        ]
      : []),
    {
      name: "Other Expense",
      value: salary?.OtherExpense || 0,
      color: "#FBBF24",
    },
    {
      name: "Bonus",
      value: salary?.Bonus || 0,
      color: "#F472B6",
    },
  ];

  const chartData =
    role === "pathologist"
      ? [
          {
            name: "Paid",
            value: incomeTotal["Paid"] || 0,
            color: "#34D399",
          },
          {
            name: "Unpaid",
            value: incomeTotal["Unpaid"] || 0,
            color: "#F87171",
          },
        ]
      : keys?.map((key) => ({
          name: key,
          value: incomeTotal[key] || 0,
          color: getColorByKey(key),
        }));

  const boxData = keys?.map((key) => ({
    name: key,
    value: incomeTotal[key] || 0,
    color: getColorByKey(key),
  }));

  return (
    <Row gutter={[16, 16]}>
      {boxData.length > 0 && (
        <Col xs={24} lg={12}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex gap-2 items-center">
              {icon} Income Overview
            </h2>
          </div>
          <Row gutter={[12, 12]} className="mb-6">
            {boxData.map((item, i) => (
              <Col xs={24} sm={12} md={12} key={i}>
                <Card
                  styles={{ body: { padding: 12 } }}
                  onClick={() =>
                    role === "pathologist"
                      ? navigate(`/pathology/sales`)
                      : role === "pharmacist"
                      ? navigate(`/pharmacy/sales`)
                      : navigate(`/${role}/income/${item.name.toLowerCase()}`)
                  }
                  className="hover:shadow-lg hover:shadow-green-500/40 transition duration-300 ease-in-out cursor-pointer overflow-hidden"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {item.name} Income
                  </p>
                  <p className="text-base font-semibold text-green-500 mb-1">
                    ₹{item.value}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mb-1">
                    Today: ₹{incomeToday[item.name] || 0}
                  </p>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
      )}

      {["admin", "doctor", "pathologist"].includes(role) && (
        <Col xs={24} lg={12}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {title}
            </h2>
            <RangePicker onChange={handleSalaryFilter} />
          </div>
          <div className="p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] h-[200px] sm:h-[250px] md:h-[300px] lg:h-[320px] xl:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Col>
      )}

      <Col xs={24} lg={12}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            {role === "doctor" ? "Other Income" : "Salary"}
          </h2>
        </div>
        <div className="p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] h-[200px] sm:h-[250px] md:h-[300px] lg:h-[320px] xl:h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={SalaryChartData}
                cx="50%"
                cy="50%"
                outerRadius="80%"
                dataKey="value"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {SalaryChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₹${value}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Col>
    </Row>
  );
};

export default IncomeOverview;
