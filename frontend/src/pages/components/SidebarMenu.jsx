import { MdRequestQuote, MdSpaceDashboard } from "react-icons/md";
import { TbReportMedical } from "react-icons/tb";
import { Layout, Menu } from "antd";
import {
  UserAddOutlined,
  TeamOutlined,
  SolutionOutlined,
  ProfileOutlined,
  MedicineBoxOutlined,
  RestOutlined,
  UserOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FaChartLine, FaHospital, FaGlasses, FaUserMd } from "react-icons/fa";

const { Sider } = Layout;

const SidebarMenu = ({ collapsed, setCollapsed, user }) => {
  const hospital = useSelector((state) => state?.hospital);
  const baseMenu = [
    {
      key: "dashboard",
      icon: <MdSpaceDashboard size={"1.2rem"} />,
      label: <Link to="/dashboard">Dashboard</Link>,
    },
    {
      key: "patient-list",
      icon: <TeamOutlined size={"1.2rem"} />,
      label: <Link to="/patients">Patient List</Link>,
    },
  ];

  const roleMenus = {
    admin: [
      ...baseMenu,
      ...(hospital?.modules?.ipd
        ? [
            {
              key: "ipd-list",
              icon: <ProfileOutlined size={"1.2rem"} />,
              label: <Link to="/ipd-list">IPD List</Link>,
            },
          ]
        : []),
      ...(hospital?.modules?.opd
        ? [
            {
              key: "opd-list",
              icon: <MedicineBoxOutlined size={"1.2rem"} />,
              label: <Link to="/opd-list">OPD List</Link>,
            },
          ]
        : []),
      ...(hospital?.modules?.billing
        ? [
            {
              key: "billing",
              icon: <MdRequestQuote size={"1.2rem"} />,
              label: <Link to="/billing/patientBilling">Billing</Link>,
            },
          ]
        : []),
      {
        key: "registration",
        icon: <UserAddOutlined size={"1.2rem"} />,
        label: <Link to="/registration">Patient Registration</Link>,
      },
      {
        key: "doctor-list",
        icon: <SolutionOutlined size={"1.2rem"} />,
        label: <Link to="/doctors">Doctor List</Link>,
      },
      {
        key: "ward-management",
        icon: <RestOutlined size={"1.2rem"} />,
        label: <Link to="/wards">Ward and Beds</Link>,
      },
      {
        key: "staff-management",
        icon: <TeamOutlined size={"1.2rem"} />,
        label: <Link to="/staff">Staff Management</Link>,
      },
      ...(hospital?.modules?.pharmacy
        ? [
            {
              key: "pharmacy-group",
              label: "Pharmacy",
              icon: <MedicineBoxOutlined size={"1.2rem"} />,
              children: [
                {
                  key: "pharmacy",
                  label: <Link to="/pharmacy">Medicines</Link>,
                  icon: <MedicineBoxOutlined size={"1.2rem"} />,
                },
                {
                  key: "pharmacySales",
                  label: <Link to="/pharmacy/sales">Sales</Link>,
                  icon: <FaChartLine size={"1.2rem"} />,
                },
              ],
            },
          ]
        : []),
      ...(hospital?.modules?.pathology
        ? [
            {
              key: "pathology-group",
              label: "Pathology",
              icon: <TbReportMedical size={"1.2rem"} />,
              children: [
                {
                  key: "pathology",
                  label: <Link to="/pathology">Tests</Link>,
                  icon: <MedicineBoxOutlined size={"1.2rem"} />,
                },
                {
                  key: "pathologySales",
                  label: <Link to="/pathology/sales">Sales</Link>,
                  icon: <FaChartLine size={"1.2rem"} />,
                },
                {
                  key: "pathologyTestReports",
                  label: <Link to="/pathology/TestReports">Reports</Link>,
                  icon: <TbReportMedical size={"1.2rem"} />,
                },
              ],
            },
          ]
        : []),
      ...(hospital?.modules?.ophthalmology
        ? [
            {
              key: "ophthalmology-group",
              label: "Ophthalmology",
              icon: <EyeOutlined size={"1.2rem"} />,
              children: [
                {
                  key: "eye-queue",
                  label: <Link to="/eye/queue">Eye Queue</Link>,
                  icon: <EyeOutlined size={"1.2rem"} />,
                },
                ...(hospital?.modules?.ot
                  ? [
                      {
                        key: "surgery-board",
                        label: <Link to="/eye/surgery-board">Surgery Board</Link>,
                        icon: <FaUserMd size={"1.2rem"} />,
                      },
                    ]
                  : []),
              ],
            },
          ]
        : []),
      ...(hospital?.modules?.opticalShop
        ? [
            {
              key: "optical-group",
              label: "Optical Shop",
              icon: <FaGlasses size={"1.2rem"} />,
              children: [
                {
                  key: "optical-orders",
                  label: <Link to="/optical/orders">Orders</Link>,
                  icon: <ProfileOutlined size={"1.2rem"} />,
                },
                {
                  key: "optical-inventory",
                  label: <Link to="/optical/inventory">Inventory</Link>,
                  icon: <MedicineBoxOutlined size={"1.2rem"} />,
                },
              ],
            },
          ]
        : []),
      {
        key: "staffPayments",
        icon: <MdRequestQuote size={"1.2rem"} />,
        label: <Link to="/staff-payments">Staff Payments</Link>,
      },
    ],

    doctor: [
      ...baseMenu,
      ...(hospital?.modules?.ipd
        ? [
            {
              key: "ipd-list",
              icon: <ProfileOutlined size={"1.2rem"} />,
              label: <Link to="/ipd-list">IPD List</Link>,
            },
          ]
        : []),
      ...(hospital?.modules?.opd
        ? [
            {
              key: "opd-list",
              icon: <MedicineBoxOutlined size={"1.2rem"} />,
              label: <Link to="/opd-list">OPD List</Link>,
            },
          ]
        : []),
      ...(hospital?.modules?.ophthalmology
        ? [
            {
              key: "eye-queue",
              icon: <EyeOutlined size={"1.2rem"} />,
              label: <Link to="/eye/queue">Eye Queue</Link>,
            },
            ...(hospital?.modules?.ot
              ? [
                  {
                    key: "surgery-board",
                    icon: <FaUserMd size={"1.2rem"} />,
                    label: <Link to="/eye/surgery-board">Surgery Board</Link>,
                  },
                ]
              : []),
          ]
        : []),
    ],

    nurse: [...baseMenu],

    pharmacist: [
      ...baseMenu,
      {
        key: "sales",
        icon: <FaChartLine size={"1.2rem"} />,
        label: <Link to="/pharmacy/sales">Sales</Link>,
      },
      ...(hospital?.modules?.billing
        ? [
            {
              key: "billing",
              icon: <MdRequestQuote size={"1.2rem"} />,
              label: <Link to="/billing/patientBilling">Billing</Link>,
            },
          ]
        : []),
      {
        key: "pharmacy",
        icon: <MedicineBoxOutlined size={"1.2rem"} />,
        label: <Link to="/pharmacy">Pharmacy</Link>,
      },
    ],

    receptionist: [
      ...baseMenu,
      {
        key: "registration",
        icon: <UserAddOutlined size={"1.2rem"} />,
        label: <Link to="/registration">Patient Registration</Link>,
      },
      ...(hospital?.modules?.ipd
        ? [
            {
              key: "ipd-list",
              icon: <ProfileOutlined size={"1.2rem"} />,
              label: <Link to="/ipd-list">IPD List</Link>,
            },
          ]
        : []),
      ...(hospital?.modules?.opd
        ? [
            {
              key: "opd-list",
              icon: <MedicineBoxOutlined size={"1.2rem"} />,
              label: <Link to="/opd-list">OPD List</Link>,
            },
          ]
        : []),
      ...(hospital?.modules?.billing
        ? [
            {
              key: "billing",
              icon: <MdRequestQuote size={"1.2rem"} />,
              label: <Link to="/billing/patientBilling">Billing</Link>,
            },
          ]
        : []),
    ],
    pathologist: [
      {
        key: "dashboard",
        icon: <MdSpaceDashboard size={"1.2rem"} />,
        label: <Link to="/dashboard">Dashboard</Link>,
      },
      {
        key: "sales",
        icon: <FaChartLine size={"1.2rem"} />,
        label: <Link to="/pathology/sales">Sales</Link>,
      },
      ...(hospital?.modules?.billing
        ? [
            {
              key: "billing",
              icon: <MdRequestQuote size={"1.2rem"} />,
              label: <Link to="/billing/patientBilling">Billing</Link>,
            },
          ]
        : []),
      {
        key: "patient-list",
        icon: <TeamOutlined size={"1.2rem"} />,
        label: <Link to="/patients">Patient List</Link>,
      },
      {
        key: "pathologyTestReports",
        icon: <TbReportMedical size={"1.2rem"} />,
        label: <Link to="/pathology/TestReports">Pathology Reports</Link>,
      },
      {
        key: "pathology",
        icon: <MedicineBoxOutlined size={"1.2rem"} />,
        label: <Link to="/pathology">Pathology</Link>,
      },
    ],
    superAdmin: [
      {
        key: "dashboard",
        icon: <MdSpaceDashboard size={"1.2rem"} />,
        label: <Link to="/dashboard">Dashboard</Link>,
      },
      {
        key: "hospitals",
        icon: <FaHospital size={"1.2rem"} />,
        label: <Link to="/hospitals">Hospitals</Link>,
      },
    ],
  };

  const menuItems = roleMenus[user?.role] || [];

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      breakpoint="md"
      collapsedWidth={80}
      className="overflow-auto print:hidden"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 1000,
      }}
    >
      <div className="text-white p-4 font-bold flex items-center justify-center space-x-2">
        <span className="h-10 w-10">
          <img
            src="./icon.png"
            alt="Velocare Logo"
            className="h-full w-full object-contain"
          />
        </span>
        {!collapsed && <span className="text-xl font-semibold">Velocare</span>}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        items={menuItems}
        className="text-base pb-14"
      />
    </Sider>
  );
};

export default SidebarMenu;
