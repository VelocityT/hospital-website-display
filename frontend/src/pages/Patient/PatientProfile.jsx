import { useEffect, useState } from "react";
import {
  Card,
  Descriptions,
  Avatar,
  Row,
  Col,
  Tag,
  Tabs,
  Button,
  Empty,
  Table,
  Grid,
  Spin,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  EnvironmentOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getPatientFullDetailsApi } from "../../services/apis";
import {
  handlePatientBillPrint,
  handleBlankPrescriptionPrint,
} from "../../utils/printDataHelper";
import { useSelector } from "react-redux";
import { formatDate, formatDateTime } from "../../utils/helper";
import PatientTestReports from "../components/PatientTestReports";
import PatientPrescriptionTable from "../components/PatientPrescriptionTable";
import PatientMedicineOrders from "../components/PatientMedicineOrders";

const { useBreakpoint } = Grid;

const PatientProfile = () => {
  const user = useSelector((state) => state?.user);
  const { patientId } = useParams();
  const [data, setData] = useState(null);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPatientAdmitted, setIsPatientAdmitted] = useState(false);
  const navigate = useNavigate();
  const screens = useBreakpoint();

  useEffect(() => {
    const fetchPatientDetails = async () => {
      setLoading(true);
      try {
        const response = await getPatientFullDetailsApi({ patientId });
        if (response.success) {
          setData(response.data);

          const ipdBills =
            response?.data?.ipds?.flatMap((ipd) => {
              const bills = ipd?.payment?.bill;
              if (!bills) return [];
              return Array.isArray(bills) ? bills : [bills];
            }) || [];

          const opdBills =
            response?.data?.opds?.flatMap((opd) => {
              const bills = opd?.payment?.bill;
              if (!bills) return [];
              return Array.isArray(bills) ? bills : [bills];
            }) || [];

          const pathologyReportBills =
            response?.data?.pathologyTestReports?.flatMap((report) => {
              const bills = report?.payment?.bill;
              if (!bills) return [];
              return Array.isArray(bills) ? bills : [bills];
            }) || [];

          const medicineOrdersBills =
            response?.data?.medicineOrders?.flatMap((report) => {
              const bills = report?.payment?.bill;
              if (!bills) return [];

              return Array.isArray(bills) ? bills : [bills];
            }) || [];

          const allBills = [
            ...ipdBills,
            ...opdBills,
            ...pathologyReportBills,
            ...medicineOrdersBills,
          ];
          allBills.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          setBills(allBills);
        } else {
          toast.error(response.message);
          navigate(-1);
        }
      } catch (err) {
        toast.error("Failed to load patient details");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientDetails();
  }, [patientId]);

  useEffect(() => {
    const admitted = data?.ipds?.some((ipd) => ipd.status === "Admitted");
    setIsPatientAdmitted(admitted);
  }, [data]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="flex justify-center items-center min-h-[200px]">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <p>Patient not found.</p>
        <Button onClick={() => navigate(-1)}>Back</Button>
      </Card>
    );
  }

  const {
    ipds = [],
    opds = [],
    pathologyTestReports = [],
    prescriptions = [],
    medicineOrders = [],
    ...patient
  } = data;

  return (
    <div>
      <Row justify="end" className="mb-3" gutter={[8, 8]}>
        <Col>
          <Button onClick={() => navigate(-1)}>Back</Button>
        </Col>
        {["admin", "receptionist"].includes(user?.role) && (
          <>
            <Col>
              <Button
                type="primary"
                onClick={() => {
                  if (isPatientAdmitted) {
                    toast.error("Patient is already in IPD");
                    return;
                  }
                  navigate(`/ipd/add/${patientId}`, {
                    state: {
                      fullName: data?.fullName,
                      _id: data?._id,
                    },
                  });
                }}
              >
                New IPD
              </Button>
            </Col>
            <Col>
              <Button
                type="primary"
                onClick={() => {
                  if (isPatientAdmitted) {
                    toast.error("Patient is already in IPD");
                    return;
                  }
                  navigate(`/opd/add/${patientId}`, {
                    state: {
                      fullName: data?.fullName,
                      _id: data?._id,
                    },
                  });
                }}
              >
                New OPD
              </Button>
            </Col>
          </>
        )}
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle" wrap>
          <Col
            xs={24}
            sm={6}
            md={4}
            lg={3}
            style={{ textAlign: screens.xs ? "center" : "left" }}
          >
            <Avatar
              size={screens.xs ? 64 : 80}
              icon={<UserOutlined />}
              src={patient?.photoUrl}
              style={{ background: "#e6f7ff" }}
            />
          </Col>

          <Col xs={24} sm={18} md={20} lg={21}>
            <Row gutter={[4, 4]}>
              <Col span={24}>
                <span style={{ fontWeight: 600, fontSize: 20 }}>
                  {patient?.fullName}
                </span>
              </Col>
              <Col span={24}>
                <EnvironmentOutlined style={{ marginRight: 4 }} />
                {patient?.address?.line1}
                {patient?.address?.line2 ? `, ${patient?.address.line2}` : ""}
                {patient?.address?.city ? `, ${patient?.address.city}` : ""}
                {patient?.address?.pincode
                  ? `, ${patient?.address.pincode}`
                  : ""}
              </Col>
              <Col span={24}>
                <MailOutlined style={{ marginRight: 4 }} />
                {patient?.contact?.email || "-"}
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Card>
        <Tabs
          defaultActiveKey="overview"
          items={[
            {
              key: "overview",
              label: "Overview",
              children: (
                <Descriptions
                  column={screens.xs ? 1 : 2}
                  bordered
                  size="small"
                  layout={screens.xs ? "vertical" : "horizontal"}
                >
                  <Descriptions.Item label="Full Name">
                    {patient?.fullName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Gender">
                    {patient?.gender}
                  </Descriptions.Item>
                  <Descriptions.Item label="DOB">
                    {formatDate(patient?.dob)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Age">
                    {patient?.age?.years}y {patient?.age?.months}m{" "}
                    {patient?.age?.days}d
                  </Descriptions.Item>
                  <Descriptions.Item label="Blood Group">
                    {patient?.bloodGroup}
                  </Descriptions.Item>
                  <Descriptions.Item label="Patient ID">
                    {patient?.patientId}
                  </Descriptions.Item>
                  <Descriptions.Item label="Mobile">
                    {patient?.contact?.phone}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    {patient?.contact?.email}
                  </Descriptions.Item>
                  <Descriptions.Item label="Address">
                    {[
                      patient?.address?.line1,
                      patient?.address?.line2,
                      patient?.address?.city,
                      patient?.address?.pincode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </Descriptions.Item>
                  <Descriptions.Item label="Registration Date">
                    {formatDateTime(patient?.registrationDate)}
                  </Descriptions.Item>
                </Descriptions>
              ),
            },
            {
              key: "ipd",
              label: "IPD",
              children: ipds.length ? (
                <Table
                  dataSource={ipds}
                  rowKey="_id"
                  pagination={false}
                  scroll={{ x: true }}
                  columns={[
                    {
                      title: "IPD Number",
                      dataIndex: "ipdNumber",
                    },
                    {
                      title: "Admission Date",
                      dataIndex: "admissionDate",
                      render: (date) => formatDateTime(date),
                    },
                    {
                      title: "Ward",
                      render: (_, rec) =>
                        rec.ward
                          ? `${rec.ward.name} (${rec.ward.type}, Floor: ${rec.ward.floor})`
                          : "-",
                    },
                    {
                      title: "Bed",
                      render: (_, rec) =>
                        rec.bed
                          ? `${rec.bed.bedNumber} ${rec.bed?.bedType || "General"}  (₹${rec.bed.charge})`
                          : "-",
                    },
                    {
                      title: "Doctor",
                      render: (_, rec) => rec.attendingDoctor?.fullName || "-",
                    },
                    {
                      title: "Status",
                      dataIndex: "status",
                      render: (status) =>
                        status === "Admitted" ? (
                          <Tag color="green">Admitted</Tag>
                        ) : status === "Discharged" ? (
                          <Tag color="red">Discharged</Tag>
                        ) : (
                          <Tag>{status}</Tag>
                        ),
                    },
                  ]}
                  expandable={{
                    expandedRowRender: (rec) => (
                      <>
                        <Descriptions column={1} size="small" bordered>
                          <Descriptions.Item label="IPD Number">
                            {rec.ipdNumber}
                          </Descriptions.Item>
                          <Descriptions.Item label="Admission Date">
                            {formatDateTime(rec.admissionDate)}
                          </Descriptions.Item>
                          <Descriptions.Item label="Ward">
                            {rec.ward
                              ? `${rec.ward.name} (${rec.ward.type}, Floor: ${rec.ward.floor})`
                              : "-"}
                          </Descriptions.Item>
                          <Descriptions.Item label="Bed">
                            {rec.bed
                              ? `${rec.bed.bedNumber} ${rec.bed.bedType || "General"} (₹${rec.bed.charge})`
                              : "-"}
                          </Descriptions.Item>
                          <Descriptions.Item label="Doctor">
                            {rec.attendingDoctor?.fullName || "-"}
                          </Descriptions.Item>
                          <Descriptions.Item label="Nurse">
                            {rec.attendingNurse?.fullName || "-"}
                          </Descriptions.Item>
                          <Descriptions.Item label="Symptoms">
                            {(rec.symptoms?.symptomNames || []).join(", ")}
                          </Descriptions.Item>
                          <Descriptions.Item label="Symptoms Titles">
                            {(rec.symptoms?.symptomType || []).join(", ")}
                          </Descriptions.Item>
                          <Descriptions.Item label="Symptoms Description">
                            {rec.symptoms?.description}
                          </Descriptions.Item>
                          <Descriptions.Item label="Consent Forms">
                            {(rec.consentForms || []).length
                              ? rec.consentForms.join(", ")
                              : "-"}
                          </Descriptions.Item>
                          <Descriptions.Item label="Notes">
                            {rec.notes || "-"}
                          </Descriptions.Item>
                        </Descriptions>
                        {rec.dischargeSummary && (
                          <Card
                            size="small"
                            title="Discharge Summary"
                            style={{ marginTop: 16 }}
                          >
                            <Descriptions column={1} size="small" bordered>
                              <Descriptions.Item label="Discharge Date">
                                {formatDateTime(
                                  rec.dischargeSummary.dischargeDate
                                )}
                              </Descriptions.Item>
                              <Descriptions.Item label="Discharged By">
                                {rec.dischargeSummary.dischargedBy?.fullName}
                              </Descriptions.Item>
                              <Descriptions.Item label="Discharge Reason">
                                {rec.dischargeSummary.dischargeReason}
                              </Descriptions.Item>
                              <Descriptions.Item label="Discharge Condition">
                                {rec.dischargeSummary.dischargeCondition}
                              </Descriptions.Item>
                            </Descriptions>
                          </Card>
                        )}
                      </>
                    ),
                  }}
                />
              ) : (
                <Empty description="No IPD Records" />
              ),
            },
            {
              key: "opd",
              label: "OPD",
              children: opds.length ? (
                <Table
                  dataSource={opds}
                  rowKey="_id"
                  pagination={false}
                  scroll={{ x: true }}
                  columns={[
                    {
                      title: "OPD Number",
                      dataIndex: "opdNumber",
                    },
                    {
                      title: "Visit Date/Time",
                      dataIndex: "visitDateTime",
                      render: (date) => formatDateTime(date),
                    },
                    {
                      title: "Doctor",
                      render: (_, rec) => rec.doctor?.fullName || "-",
                    },
                    {
                      title: "Consultation Fees",
                      render: (_, rec) => rec.doctor?.opdCharge || "-",
                    },
                    {
                      title: "Status",
                      dataIndex: "status",
                    },
                    {
                      title: "Symptoms",
                      render: (_, rec) =>
                        (rec.symptoms?.symptomNames || []).join(", "),
                    },
                    {
                      // Letterhead + this visit's details, empty middle for the
                      // doctor to write on by hand.
                      title: "Blank Rx",
                      key: "blankRx",
                      render: (_, rec) => (
                        <Button
                          size="small"
                          icon={<PrinterOutlined />}
                          onClick={() =>
                            handleBlankPrescriptionPrint({
                              patient,
                              visit: rec,
                              type: "opd",
                            })
                          }
                          title="Print blank prescription"
                        />
                      ),
                    },
                  ]}
                  expandable={{
                    expandedRowRender: (rec) => (
                      <Descriptions column={1} size="small" bordered>
                        <Descriptions.Item label="Symptoms">
                          {(rec.symptoms?.symptomNames || []).join(", ")}
                        </Descriptions.Item>
                        <Descriptions.Item label="Symptoms Titles">
                          {(rec.symptoms?.symptomType || []).join(", ")}
                        </Descriptions.Item>
                        <Descriptions.Item label="Symptoms Description">
                          {rec.symptoms?.description}
                        </Descriptions.Item>
                        <Descriptions.Item label="Notes">
                          {rec?.notes || "-"}
                        </Descriptions.Item>
                      </Descriptions>
                    ),
                  }}
                />
              ) : (
                <Empty description="No OPD Records" />
              ),
            },
            ...(["admin", "receptionist"].includes(user?.role)
              ? [
                  {
                    key: "bills",
                    label: "Bills",
                    children:
                      bills && bills.length > 0 ? (
                        <Table
                          expandable
                          scroll={{ x: true }}
                          dataSource={bills.map((bill, idx) => ({
                            ...bill,
                            key: bill._id || idx,
                          }))}
                          columns={[
                            {
                              title: "Date",
                              dataIndex: "createdAt",
                              key: "createdAt",
                              sorter: (a, b) =>
                                new Date(a.createdAt) - new Date(b.createdAt),
                              render: (date) => formatDateTime(date),
                            },
                            {
                              title: "Bill Number",
                              dataIndex: "billNumber",
                              key: "billNumber",
                            },
                            {
                              title: "Type",
                              dataIndex: ["entry", "type"],
                              key: "type",
                            },
                            {
                              title: "Check ID",
                              dataIndex: ["entry", "checkId"],
                              key: "checkId",
                            },
                            {
                              title: "Total Charge",
                              dataIndex: "totalCharge",
                              key: "totalCharge",
                            },
                            {
                              title: "Discount",
                              dataIndex: "discount",
                              key: "discount",
                            },
                            {
                              title: "Tax",
                              dataIndex: "tax",
                              key: "tax",
                            },
                            {
                              title: "Paid Amount",
                              dataIndex: "paidAmount",
                              key: "paidAmount",
                            },
                            {
                              title: "Payment Method",
                              dataIndex: "paymentMethod",
                              key: "paymentMethod",
                            },
                            {
                              title: "Actions",
                              key: "actions",
                              render: (text, record) => (
                                <Button
                                  className="border-green-600"
                                  icon={
                                    <PrinterOutlined className="text-green-600" />
                                  }
                                  onClick={() =>
                                    handlePatientBillPrint({
                                      record,
                                      patient,
                                      ipds,
                                      opds,
                                      testReports: pathologyTestReports,
                                      medicineOrder: medicineOrders,
                                    })
                                  }
                                />
                              ),
                            },
                          ]}
                          pagination={false}
                        />
                      ) : (
                        <Empty description="No Data Found" />
                      ),
                  },
                ]
              : []),
            {
              key: "reports",
              label: "Reports",
              children: (
                <PatientTestReports
                  pathologyTestReports={pathologyTestReports}
                  patient={patient}
                />
              ),
            },
            {
              key: "prescriptions",
              label: "Prescriptions",
              children: (
                <PatientPrescriptionTable
                  prescriptions={prescriptions}
                  patient={patient}
                />
              ),
            },
            {
              key: "medicines",
              label: "Medicines",
              children: (
                <PatientMedicineOrders
                  medicineOrders={medicineOrders}
                  patient={{ ...patient, onlyMedicine: true }}
                />
              ),
            },
            // {
            //   key: "invoices",
            //   label: "Invoices",
            //   children: <Empty description="No Data Found" />,
            // },
            // {
            //   key: "documents",
            //   label: "Documents",
            //   children: <Empty description="No Data Found" />,
            // },
            // {
            //   key: "vaccinations",
            //   label: "Vaccinations",
            //   children: <Empty description="No Data Found" />,
            // },
          ]}
        />
      </Card>
    </div>
  );
};

export default PatientProfile;
