import { useState, useEffect } from "react";
import {
  Input,
  Card,
  Spin,
  Empty,
  Typography,
  message,
  Modal,
  Col,
  Row,
  Tabs,
  Select,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  searchPatientApi,
  getPatientFullDetailsApi,
} from "../../services/apis";
import PayModal from "../components/billing/PayModal";
import {
  IpdChargeTable,
  MedicineChargeTable,
  OpdChargeTable,
  PathologyChargeTable,
} from "../components/billing/ChargeTable";
import { formatDate, formatDateTime } from "../../utils/helper";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

const { Text } = Typography;

const PatientBilling = () => {
  const user = useSelector((state) => state?.user);
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const currentDate = formatDateTime(dayjs());
  const [paymentStatus, setPaymentStatus] = useState("");

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchTerm.length >= 2) {
        setLoading(true);
        const res = await searchPatientApi({ searchTerm, paymentStatus });
        setPatients(res.success ? res.patients : []);
        setLoading(false);
      } else {
        setPatients([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, paymentStatus]);

  const handleSelectPatient = async (patientId) => {
    setSearchTerm("");
    setFetchingDetails(true);
    const res = await getPatientFullDetailsApi({ patientId });
    if (res.success) {
      setPatient({
        ...res.data,
      });
    } else {
      message.error("Failed to fetch patient details");
    }
    setFetchingDetails(false);
  };

  // Pull the current patient again from the API. Used after a rejected payment
  // so the screen re-syncs with the server's view of what is outstanding
  // instead of leaving a stale balance on display.
  const refreshPatient = async () => {
    if (!patient?.patientId) return;
    const res = await getPatientFullDetailsApi({
      patientId: patient.patientId,
    });
    if (res.success) setPatient({ ...res.data });
  };

  const tabs = [
    ...(["admin", "receptionist"].includes(user?.role)
      ? [
          {
            label: "IPD",
            key: "IPD",
            children:
              patient?.ipds?.length > 0 ? (
                <IpdChargeTable
                  patient={patient}
                  ipdEntries={patient?.ipds}
                  setSelectedEntry={setSelectedEntry}
                />
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No IPD found
                </div>
              ),
          },
          {
            label: "OPD",
            key: "OPD",
            children:
              patient?.opds?.length > 0 ? (
                <OpdChargeTable
                  patient={patient}
                  opdEntries={patient?.opds}
                  setSelectedEntry={setSelectedEntry}
                />
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No OPD found
                </div>
              ),
          },
        ]
      : []),
    ["admin", "receptionist", "pathologist"].includes(user?.role) && {
      label: "Test Reports",
      key: "testReports",
      children: (
        <PathologyChargeTable
          reports={patient?.pathologyTestReports || []}
          patient={patient}
          setSelectedEntry={setSelectedEntry}
        />
      ),
    },
    ["admin", "receptionist", "pharmacist"].includes(user?.role) && {
      label: "Medicines",
      key: "medicines",
      children: (
        <MedicineChargeTable
          medicineOrders={patient?.medicineOrders || []}
          patient={patient}
          setSelectedEntry={setSelectedEntry}
        />
      ),
    },
  ].filter(Boolean);

  return (
    <div className="mx-auto space-y-6">
      <Card title="Search Patient by Phone no. or ID" className="print:hidden">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <Input
            prefix={<SearchOutlined />}
            placeholder="patient ID, phone or name"
            allowClear
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select
            allowClear
            value={paymentStatus}
            onChange={setPaymentStatus}
            placeholder="Filter by Payment"
            className="min-w-[150px]"
            options={[
              { value: "", label: "All" },
              { value: "Paid", label: "Paid" },
              { value: "Unpaid", label: "Unpaid" },
            ]}
          />
        </div>

        {loading ? (
          <div className="flex justify-center mt-6">
            <Spin size="large" />
          </div>
        ) : patients.length ? (
          <div className="mt-4 border rounded">
            {patients.map((p) => (
              <div
                key={p.patientId}
                className="p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                onClick={() => handleSelectPatient(p.patientId)}
              >
                <Text strong>{p.fullName}</Text> - <Text>{p.patientId}</Text>{" "}
                &nbsp;
                <Text type="secondary">📞 {p.contact?.phone || "-"}</Text>
              </div>
            ))}
          </div>
        ) : (
          searchTerm.length >= 4 && (
            <Empty className="mt-4" description="No matching patients found" />
          )
        )}
      </Card>

      {fetchingDetails ? (
        <div className="flex justify-center">
          <Spin size="large" />
        </div>
      ) : (
        patient && (
          <>
            <div title="Patient Details" className="print:text-black">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Text strong>Name:</Text> {patient.fullName}
                </Col>
                <Col xs={24} md={12}>
                  <Text strong>Patient ID:</Text>{" "}
                  <Link
                    to={`/patient/profile/${patient.patientId}`}
                    className="text-blue-600"
                  >
                    {patient.patientId}
                  </Link>
                </Col>
                <Col xs={24} md={12}>
                  <Text strong>Phone:</Text> {patient.contact?.phone || "-"}
                </Col>
                <Col xs={24} md={12}>
                  <Text strong>Email:</Text> {patient.contact?.email || "-"}
                </Col>
                <Col xs={24} md={12}>
                  <Text strong>Gender:</Text> {patient.gender}
                </Col>
                <Col xs={24} md={12}>
                  <Text strong>Blood Group:</Text> {patient.bloodGroup || "-"}
                </Col>
                <Col xs={24} md={12}>
                  <Text strong>Date of Birth:</Text> {formatDate(patient.dob)}
                </Col>
                <Col xs={24} md={12}>
                  <Text strong>Age:</Text>
                  {patient.age
                    ? `${patient.age.years}y ${patient.age.months}m ${patient.age.days}d`
                    : "-"}
                </Col>
                <Col xs={24}>
                  <Text strong>Address:</Text>
                  <br />
                  {patient.address?.line1}, {patient.address?.line2}
                  <br />
                  {patient.address?.city} - {patient.address?.pincode}
                </Col>
              </Row>
            </div>

            <Tabs defaultActiveKey="IPD" items={tabs} />
            <Modal
              title={`Billing Info ${currentDate}`}
              open={!!selectedEntry}
              closable={true}
              onCancel={() => setSelectedEntry(null)}
              footer={null}
            >
              <PayModal
                data={{
                  _id: patient?._id,
                  fullName: patient?.fullName,
                  patientId: patient?.patientId,
                  selectedEntry,
                }}
                setSelectedEntry={setSelectedEntry}
                setPatient={setPatient}
                onRefresh={refreshPatient}
              />
            </Modal>
          </>
        )
      )}
    </div>
  );
};

export default PatientBilling;
