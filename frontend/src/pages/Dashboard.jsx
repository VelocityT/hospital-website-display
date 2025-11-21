import { useEffect, useState } from "react";
import { Card, Col, Row, Spin, Table } from "antd";
import { useNavigate } from "react-router-dom";
import {
  FaBox,
  FaCapsules,
  FaPills,
  FaProcedures,
  FaStethoscope,
  FaUserCheck,
  FaUserMd,
  FaUserNurse,
  FaUserPlus,
  FaUserTie,
} from "react-icons/fa";
import {
  TbMicroscope,
  TbReportAnalytics,
} from "react-icons/tb";

import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { getDashboardStaticData } from "../services/apis";

const Dashboard = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [newPatients, setNewPatients] = useState({});
  const [pharmacyStats, setPharmacyStats] = useState({});
  const [lowStockMedicines, setLowStockMedicines] = useState([]);
  const [pathologyStats, setPathologyStats] = useState({});
  const [staffs, setStaffs] = useState({});

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoading(true);
      const res = await getDashboardStaticData();

      if (res.success) {
        setNewPatients(res?.data?.newPatients || {});

        if (user?.role?.includes("admin")) {
          setStaffs(res?.data?.staffs || {});
        } else if (user?.role === "pharmacist") {
          const stockData = res?.data?.stock || {};
          const orders = res?.data?.medicineOrders || {};
          const lowStock = res?.data?.stock?.lowStock || [];
          setLowStockMedicines(lowStock);
          setPharmacyStats({
            totalMedicines: stockData?.totalMedicines || 0,
            totalOrders: orders?.total || 0,
            todayOrders: orders?.today || 0,
          });
        } else if (user?.role === "pathologist") {
          setPathologyStats(res?.data || {});
        }
      } else {
        toast.error(res.message || "Failed to fetch dashboard stats");
      }

      setLoading(false);
    };

    fetchDashboardStats();
  }, [user?.role]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Spin size="large" />
      </div>
    );
  }

  if (user?.role === "pharmacist") {
    return (
      <>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Pharmacy Overview
        </h2>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={5}>
            <Card
              styles={{ body: { padding: 12 } }}
              className="relative overflow-hidden hover:shadow-lg hover:shadow-blue-500/40 transition duration-300 ease-in-out cursor-pointer h-full"
              onClick={() => {
                navigate(`/pharmacy`, { state: { key: 2 } });
              }}
            >
              <p className="text-gray-500 dark:text-gray-400 mb-1">
                Total Medicines
              </p>
              <p className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-1">
                {pharmacyStats?.totalMedicines}
              </p>
              <div className="absolute right-2 bottom-2 text-blue-600 opacity-70 text-[60px] pointer-events-none z-0 max-[275px]:hidden">
                <FaPills />
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8} lg={5}>
            <Card
              styles={{ body: { padding: 12 } }}
              className="relative overflow-hidden hover:shadow-lg hover:shadow-purple-500/40 transition duration-300 ease-in-out cursor-pointer h-full"
              onClick={() => {
                navigate(`/pharmacy/sales`);
              }}
            >
              <p className="text-gray-500 dark:text-gray-400 mb-1">
                Total Orders
              </p>
              <p className="text-xl font-semibold text-purple-600 dark:text-purple-400 mb-1">
                {pharmacyStats?.totalOrders}
              </p>
              <p className="text-gray-400 dark:text-gray-500 mb-1">
                Today: {pharmacyStats?.todayOrders || 0}
              </p>
              <div className="absolute right-2 bottom-2 text-purple-600 opacity-70 text-[60px] pointer-events-none z-0 max-[275px]:hidden">
                <FaBox />
              </div>
            </Card>
          </Col>
        </Row>

        {lowStockMedicines?.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-red-600 mb-4">
              Low Stock Medicines
            </h3>
            <Table
              dataSource={lowStockMedicines.map((item, index) => ({
                ...item,
                key: index + 1,
                serial: index + 1,
              }))}
              columns={[
                {
                  title: "S.No",
                  dataIndex: "serial",
                  key: "serial",
                },
                {
                  title: "Medicine Name",
                  dataIndex: "name",
                  key: "name",
                },
                {
                  title: "Category",
                  dataIndex: "category",
                  key: "category",
                  render: (text) => text || "-",
                },
                {
                  title: "Stock",
                  dataIndex: "currentStock",
                  key: "quantity",
                  render: (text) => (
                    <span className="text-red-600 font-semibold">{text}</span>
                  ),
                },
              ]}
              pagination={false}
              bordered
              size="small"
            />
          </div>
        )}
      </>
    );
  } else if (user?.role === "pathologist") {
    return (
      <>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Pathology Overview
        </h2>
        <Row gutter={[12, 12]}>
          {[
            {
              title: "Today's Test Reports",
              count: pathologyStats?.testReports?.today || 0,
              total: pathologyStats?.testReports?.total || 0,
              icon: <TbReportAnalytics />,
              navigateTo: "/pathology/TestReports",
            },
            {
              title: "Total Tests Available",
              count: pathologyStats?.tests?.totalAvailable || 0,
              icon: <TbMicroscope />,
              navigateTo: "/pathology",
            },
          ].map((item, i) => (
            <Col xs={24} sm={12} md={12} lg={6} key={i}>
              <Card
                styles={{ body: { padding: 12 } }}
                className="relative overflow-hidden hover:shadow-lg hover:shadow-blue-500/40 transition duration-300 ease-in-out cursor-pointer h-full"
                onClick={() => navigate(item.navigateTo)}
              >
                <p className="text-gray-500 dark:text-gray-400 mb-1">
                  {item.title}
                </p>
                <p className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-1">
                  {item.count}
                </p>
                <p className="text-gray-400 dark:text-gray-500 mb-1">
                  {item?.total && `Total: ${item.total}`}
                </p>
                <div className="absolute right-2 bottom-2 text-blue-600 opacity-70 text-[60px] pointer-events-none z-0 max-[275px]:hidden">
                  {item.icon}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </>
    );
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <FaUserPlus />
            New Patients
          </h2>
          <Row gutter={[12, 12]}>
            {[
              {
                title: "New IPD",
                count: newPatients?.ipdsToday,
                total: newPatients?.ipdsTotal,
                active: newPatients?.ipdsActive,
                navigateTo: "/ipd-list",
                icon: <FaProcedures />,
              },
              ["admin", "doctor", "receptionist"].includes(user?.role) && {
                title: "New OPD",
                count: newPatients?.opdsToday,
                total: newPatients?.opdsTotal,
                navigateTo: "/opd-list",
                icon: <FaUserCheck />,
              },
              ["admin", "receptionist"].includes(user?.role) && {
                title: "New Patients",
                count: newPatients?.todayPatients,
                total: newPatients?.totalPatients,
                navigateTo: "/patients",
                icon: <FaUserPlus />,
              },
            ]
              .filter(Boolean)
              .map((item, i) => (
                <Col xs={24} sm={12} md={8} key={i}>
                  <Card
                    styles={{ body: { padding: 12 } }}
                    className="relative overflow-hidden hover:shadow-lg hover:shadow-blue-500/40 transition duration-300 ease-in-out cursor-pointer h-full"
                    onClick={() => navigate(item.navigateTo)}
                  >
                    <p className="text-gray-500 dark:text-gray-400 mb-1">
                      {item.title}
                    </p>
                    <p className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      {item.count}
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 mb-1">
                      Total: {item.total}
                    </p>
                    {item.active !== undefined && (
                      <p className="text-green-500 dark:text-green-400 font-medium text-sm mb-0">
                        Admitted: {item.active}
                      </p>
                    )}
                    <div className="absolute right-2 bottom-2 text-blue-600 opacity-70 text-[60px] pointer-events-none z-0 max-[275px]:hidden">
                      {item.icon}
                    </div>
                  </Card>
                </Col>
              ))}
          </Row>
        </Col>
      </Row>

      {["admin"].includes(user?.role) && (
        <>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mt-10 mb-4 flex items-center gap-2">
            <FaStethoscope />
            Staff Overview
          </h2>
          <Row gutter={[12, 12]}>
            {[
              {
                label: "Doctors",
                role: "doctor",
                value: staffs?.doctors,
                icon: <FaUserMd />,
              },
              {
                label: "Receptionists",
                role: "receptionist",
                value: staffs?.receptionists,
                icon: <FaUserTie />,
              },
              {
                label: "Pharmacists",
                role: "pharmacist",
                value: staffs?.pharmacists,
                icon: <FaCapsules />,
              },
              {
                label: "Nurses",
                role: "nurse",
                value: staffs?.nurses,
                icon: <FaUserNurse />,
              },
            ].map((staff, i) => (
              <Col xs={24} sm={12} md={12} lg={6} key={i}>
                <Card
                  styles={{ body: { padding: 12 } }}
                  className="relative overflow-hidden hover:shadow-lg hover:shadow-indigo-500/40 transition duration-300 ease-in-out cursor-pointer bg-white dark:bg-neutral-900"
                  onClick={() =>
                    navigate("/staff", { state: { role: staff.role } })
                  }
                >
                  <div className="absolute right-2 bottom-2 text-indigo-600 text-[60px] pointer-events-none opacity-70 z-0">
                    {staff.icon}
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 mb-1">
                    {staff.label}
                  </p>
                  <p className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400">
                    {staff.value}
                  </p>
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard;
