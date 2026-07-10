import PatientRegistration from "../pages/Patient/PatientRegistrationPage";
import PatientList from "../pages/Patient/PatientList";
import PatientProfile from "../pages/Patient/PatientProfile";
import StaffList from "../pages/staff/StaffList";
import StaffRegistrationForm from "../pages/staff/StaffRegistrationUpdateForm";
import StaffProfile from "../pages/staff/StaffProfile";
import DoctorList from "../pages/Doctor/DoctorList";
import Prescription from "../pages/prescription/Prescription";
import OPDIPDList from "../pages/OPDIPD/OPDIPDList";
import AddOpdIpd from "../pages/OPDIPD/AddOpdIpd";
import IpdOpdDetails from "../pages/OPDIPD/IpdOpdDetails";
import WardManagment from "../pages/wardManagment/WardManagment";
import BedsList from "../pages/wardManagment/BedsList";
import AddMedicine from "../pages/pharmacy/AddMedicine";
import PatientBilling from "../pages/billing/PatientBilling";
import IncomeOverview from "../pages/admin/IncomeOverview";
import SuperAdminDashboard from "../pages/superAdmin/SuperAdminDashboard";
import Hospitals from "../pages/superAdmin/Hospitals";
import CreateOrUpdateHospital from "../pages/superAdmin/CreateOrUpdateHospital";
import Hospital from "../pages/Hospital";
import CreateUpdatePathology from "../pages/pathology/CreateUpadatePathology";
import CreateUpdatePatholodyTestReport from "../pages/pathology/CreateUpdatePatholodyTestReport";
import Dashboard from "../pages/Dashboard";
import Pharmacy from "../pages/pharmacy/Pharmacy";
import CreateMedicineOrder from "../pages/pharmacy/CreateMedicineOrder";
import PathologyTestList from "../pages/pathology/PathologyTestList";
import PathologyTestReportsList from "../pages/pathology/PathologyTestReportsList";
import PathologySales from "../pages/pathology/PathologySales";
import PharmacySales from "../pages/pharmacy/PharmacySales";
import StaffPayments from "../pages/staff/StaffPayments";
import StaffListForPayment from "../pages/staff/StaffListForPayment";
import EyeQueue from "../pages/ophthalmology/EyeQueue";
import EyeWorkup from "../pages/ophthalmology/EyeWorkup";
import DoctorEyePanel from "../pages/ophthalmology/DoctorEyePanel";
import SurgeryBoard from "../pages/ophthalmology/SurgeryBoard";
import OpticalInventory from "../pages/ophthalmology/OpticalInventory";
import OpticalOrders from "../pages/ophthalmology/OpticalOrders";
import CreateOpticalOrder from "../pages/ophthalmology/CreateOpticalOrder";

const commonRoutes = [
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/patient/profile/:patientId", element: <PatientProfile /> },
  { path: "/profile", element: <StaffProfile selfProfile={true} /> },
];

const adminRoutes = [
  ...commonRoutes,
  {
    path: "/admin/income/ipd",
    element: <IncomeOverview incomeSource="Ipd" />,
  },
  {
    path: "/admin/income/opd",
    element: <IncomeOverview incomeSource="Opd" />,
  },
  { path: "/staff/profile/:staffId", element: <StaffProfile /> },
  {
    path: "/admin/income/pharmacy",
    element: <IncomeOverview incomeSource="Pharmacy" />,
  },
  {
    path: "/admin/income/Pathology",
    element: <IncomeOverview incomeSource="Pathology" />,
  },
  {
    path: "/staff-payments",
    element: <StaffListForPayment />,
  },
    {
    path: "/staff/payments/:id",
    element: <StaffPayments />,
  },
  { path: "/registration", element: <PatientRegistration /> },
  {
    path: "/registration/edit/:patientId",
    element: <PatientRegistration edit="patient" />,
  },
  { path: "/patients", element: <PatientList /> },
  { path: "/opd-list", element: <OPDIPDList type="opd" /> },
  { path: "/ipd-list", element: <OPDIPDList type="ipd" /> },
  { path: "/ipd/edit/:ipdId", element: <PatientRegistration edit="ipd" /> },
  { path: "/opd/edit/:opdId", element: <PatientRegistration edit="opd" /> },
  { path: "/staff", element: <StaffList /> },
  { path: "/staff/registration", element: <StaffRegistrationForm /> },
  {
    path: "/staff/edit/:staffId",
    element: <StaffRegistrationForm edit={true} />,
  },
  { path: "/doctors", element: <DoctorList /> },
  { path: "/wards", element: <WardManagment /> },
  { path: "/wards/beds/:wardId", element: <BedsList /> },
  { path: "/ipd/add/:patientId", element: <AddOpdIpd add="ipd" /> },
  { path: "/opd/add/:patientId", element: <AddOpdIpd add="opd" /> },
  { path: "/ipd/:ipdId", element: <IpdOpdDetails /> },
  { path: "/opd/:opdId", element: <IpdOpdDetails /> },
  { path: "/pharmacy/medicine/add", element: <AddMedicine /> },
  { path: "/pharmacy/medicine/order", element: <CreateMedicineOrder /> },
  {
    path: "/pharmacy/medicine/edit/:id",
    element: <AddMedicine isEdit={true} />,
  },
  { path: "/pharmacy", element: <Pharmacy /> },
  { path: "/addPrescription", element: <Prescription /> },
  { path: "/editPrescription", element: <Prescription edit={true} /> },

  { path: "/billing/patientBilling", element: <PatientBilling /> },
  { path: "/pathology/create-test", element: <CreateUpdatePathology /> },
  { path: "/pathology/edit-test/:id", element: <CreateUpdatePathology /> },
  { path: "/pathology", element: <PathologyTestList /> },
  { path: "/pathology/sales", element: <PathologySales /> },
  { path: "/pharmacy/sales", element: <PharmacySales /> },
  { path: "/pathology/TestReports", element: <PathologyTestReportsList /> },
  {
    path: "/pathology/create-report",
    element: <CreateUpdatePatholodyTestReport />,
  },
  {
    path: "/pathology/edit-report/:id",
    element: <CreateUpdatePatholodyTestReport />,
  },
  // ---------- Ophthalmology ----------
  { path: "/eye/queue", element: <EyeQueue /> },
  { path: "/eye/workup", element: <EyeWorkup /> },
  { path: "/eye/doctor-panel", element: <DoctorEyePanel /> },
  { path: "/eye/surgery-board", element: <SurgeryBoard /> },
  // ---------- Optical Shop ----------
  { path: "/optical/inventory", element: <OpticalInventory /> },
  { path: "/optical/orders", element: <OpticalOrders /> },
  { path: "/optical/order/new", element: <CreateOpticalOrder /> },
];
export const roleRoutes = {
  admin: adminRoutes,

  doctor: [
    {
      path: "/doctor/income/ipd",
      element: <IncomeOverview incomeSource="Ipd" />,
    },
    {
      path: "/doctor/income/opd",
      element: <IncomeOverview incomeSource="Opd" />,
    },
    {
      path: "/doctor/income/total",
      element: <IncomeOverview incomeSource="Total" />,
    },

    ...commonRoutes,
    { path: "/registration", element: <PatientRegistration /> },
    {
      path: "/registration/edit/:patientId",
      element: <PatientRegistration edit="patient" />,
    },
    { path: "/ipd/edit/:ipdId", element: <PatientRegistration edit="ipd" /> },
    { path: "/opd/edit/:opdId", element: <PatientRegistration edit="opd" /> },
    { path: "/ipd/add/:patientId", element: <AddOpdIpd add="ipd" /> },
    { path: "/opd/add/:patientId", element: <AddOpdIpd add="opd" /> },
    { path: "/ipd/:ipdId", element: <IpdOpdDetails /> },
    { path: "/opd/:opdId", element: <IpdOpdDetails /> },
    { path: "/addPrescription", element: <Prescription /> },
    { path: "/editPrescription", element: <Prescription edit={true} /> },

    { path: "/patients", element: <PatientList /> },
    { path: "/opd-list", element: <OPDIPDList type="opd" /> },
    { path: "/ipd-list", element: <OPDIPDList type="ipd" /> },
    // ---------- Ophthalmology ----------
    { path: "/eye/queue", element: <EyeQueue /> },
    { path: "/eye/workup", element: <EyeWorkup /> },
    { path: "/eye/doctor-panel", element: <DoctorEyePanel /> },
    { path: "/eye/surgery-board", element: <SurgeryBoard /> },
  ],

  nurse: [
    ...commonRoutes,

    { path: "/patients", element: <PatientList /> },
    { path: "/ipd/:ipdId", element: <IpdOpdDetails /> },
    { path: "/ipd-list", element: <OPDIPDList type="ipd" /> },
  ],

  pharmacist: [
    { path: "/billing/patientBilling", element: <PatientBilling /> },
    ...commonRoutes,
    { path: "/patients", element: <PatientList /> },
    { path: "/pharmacy/medicine/add", element: <AddMedicine /> },
    { path: "/pharmacy/medicine/order", element: <CreateMedicineOrder /> },
    {
      path: "/pharmacy/medicine/edit/:id",
      element: <AddMedicine isEdit={true} />,
    },
    { path: "/pharmacy/sales", element: <PharmacySales /> },
    { path: "/pharmacy", element: <Pharmacy /> },
  ],

  receptionist: [
    { path: "/ipd/:ipdId", element: <IpdOpdDetails /> },
    { path: "/opd/:opdId", element: <IpdOpdDetails /> },
    ...commonRoutes,
    { path: "/registration", element: <PatientRegistration /> },
    {
      path: "/registration/edit/:patientId",
      element: <PatientRegistration edit="patient" />,
    },
    { path: "/patients", element: <PatientList /> },
    { path: "/opd-list", element: <OPDIPDList type="opd" /> },
    { path: "/ipd-list", element: <OPDIPDList type="ipd" /> },
    { path: "/ipd/edit/:ipdId", element: <PatientRegistration edit="ipd" /> },
    { path: "/opd/edit/:opdId", element: <PatientRegistration edit="opd" /> },
    { path: "/ipd/add/:patientId", element: <AddOpdIpd add="ipd" /> },
    { path: "/opd/add/:patientId", element: <AddOpdIpd add="opd" /> },
    { path: "/billing/patientBilling", element: <PatientBilling /> },
  ],
  pathologist: [
    { path: "/billing/patientBilling", element: <PatientBilling /> },
    ...commonRoutes,
    { path: "/pathology/create-test", element: <CreateUpdatePathology /> },
    { path: "/pathology/sales", element: <PathologySales /> },
    { path: "/pathology/edit-test/:id", element: <CreateUpdatePathology /> },
    { path: "/pathology", element: <PathologyTestList /> },
    { path: "/pathology/TestReports", element: <PathologyTestReportsList /> },
    { path: "/patients", element: <PatientList /> },
    {
      path: "/pathology/create-report",
      element: <CreateUpdatePatholodyTestReport />,
    },
    {
      path: "/pathology/edit-report/:id",
      element: <CreateUpdatePatholodyTestReport />,
    },
    { path: "/ipd/:ipdId", element: <IpdOpdDetails /> },
    { path: "/opd/:opdId", element: <IpdOpdDetails /> },
  ],
  superAdmin: [
    { path: "/dashboard", element: <SuperAdminDashboard /> },
    ...adminRoutes,
    { path: "/hospitals", element: <Hospitals /> },
    { path: "/hospitals/add", element: <CreateOrUpdateHospital /> },
    {
      path: "/hospitals/edit/:hospitalId",
      element: <CreateOrUpdateHospital edit={true} />,
    },
    { path: "/hospital/:id", element: <Hospital /> },
  ],

  default: [],
};
