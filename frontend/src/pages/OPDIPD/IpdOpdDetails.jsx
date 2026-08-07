import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getPatientDetailsIpdOpdApi } from "../../services/apis";
import { toast } from "react-hot-toast";
import { Spin, Button, Card, Row, Col, Descriptions, Divider } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import { handleBlankPrescriptionPrint } from "../../utils/printDataHelper";
import { BillDetailsList } from "../components/billing/ChargeTable";
import { formatDate, formatDateTime } from "../../utils/helper";
import { useSelector } from "react-redux";
import PatientTestReports from "../components/PatientTestReports";
import PatientPrescriptionTable from "../components/PatientPrescriptionTable";

const IpdOpdDetails = () => {
  const user = useSelector((state) => state?.user);
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const _id = location.state?._id;
  const type = location.pathname.includes("/ipd/") ? "ipd" : "opd";
  const [loading, setLoading] = useState(true);
  const [entryDetails, setEntryDetails] = useState(null);

  useEffect(() => {
    fetchPatientDetails();
  }, [id]);

  const fetchPatientDetails = async () => {
    try {
      const response = await getPatientDetailsIpdOpdApi(_id, {
        isIpdPatient: type === "ipd",
        isOpdPatient: type === "opd",
        detailPage: true,
      });

      if (response?.success) {
        setEntryDetails(response.data);
      } else {
        toast.error(response?.message || "Failed to fetch patient details");
        navigate(-1);
      }
    } catch (error) {
      toast.error(error?.message || "An unexpected error occurred");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Spin size="large" />
      </div>
    );
  if (!entryDetails) return null;

  const details =
    type === "ipd" ? entryDetails.ipdDetails : entryDetails.opdDetails;

  // ==========for printing===========
  const { ipdDetails, opdDetails, pathologyTestReports, ...patient } =
    entryDetails;
  // ==========for printing===========

  return (
    <div className="w-full">
      <Row justify="end" gutter={8} className="mb-4">
        {/* Blank pad for this visit — patient, visit number and doctor are
            printed, the consulting area is left empty to write on. */}
        <Col>
          <Button
            icon={<PrinterOutlined />}
            onClick={() =>
              handleBlankPrescriptionPrint({ patient, visit: details, type })
            }
          >
            Blank Prescription
          </Button>
        </Col>
        <Col>
          <Button onClick={() => navigate(-1)}>Back</Button>
        </Col>
      </Row>

      <Card
        title={`Patient ${type.toUpperCase()} Details`}
        variant="borderless"
        style={{ width: "100%" }}
      >
        <Descriptions
          bordered
          size="middle"
          column={{
            xs: 1,
            sm: 1,
            md: 2,
            lg: 2,
            xl: 3,
            xxl: 3,
          }}
        >
          <Descriptions.Item label="Full Name">
            {entryDetails?.fullName}
          </Descriptions.Item>
          <Descriptions.Item label="Gender">
            {entryDetails?.gender}
          </Descriptions.Item>
          <Descriptions.Item label="DOB">
            {formatDate(entryDetails?.dob)}
          </Descriptions.Item>
          <Descriptions.Item label="Blood Group">
            {entryDetails?.bloodGroup}
          </Descriptions.Item>
          <Descriptions.Item label="Phone">
            {entryDetails?.contact?.phone}
          </Descriptions.Item>
          <Descriptions.Item label="Patient ID">
            {entryDetails?.patientId}
          </Descriptions.Item>
          <Descriptions.Item label="Registration Date">
            {formatDateTime(entryDetails?.registrationDate)}
          </Descriptions.Item>
          <Descriptions.Item label="Age">{`${entryDetails?.age?.years}y ${entryDetails?.age?.months}m ${entryDetails?.age?.days}d`}</Descriptions.Item>
          <Descriptions.Item label="Address">
            {`${entryDetails?.address?.line1}, ${entryDetails?.address?.line2}, ${entryDetails?.address?.city} - ${entryDetails?.address?.pincode}`}
          </Descriptions.Item>

          <Descriptions.Item label="Doctor">
            {details?.doctor?.fullName || details?.attendingDoctor?.fullName}
          </Descriptions.Item>
          {details?.attendingNurse?.fullName && (
            <Descriptions.Item label="Nurse">
              {details.attendingNurse.fullName}
            </Descriptions.Item>
          )}
          <Descriptions.Item
            label={`${type === "ipd" ? "IPD Number" : "OPD Number"}`}
          >
            {details?.ipdNumber || details?.opdNumber}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            {details?.status}
          </Descriptions.Item>
          {type === "ipd" && (
            <>
              <Descriptions.Item label="Admission Date">
                {details?.admissionDate}
              </Descriptions.Item>
              <Descriptions.Item label="Ward">
                {details?.ward?.name} (Floor: {details?.ward?.floor})
              </Descriptions.Item>
              <Descriptions.Item label="Bed Number">
                {`${details.bed?.bedNumber} (${details?.bed?.bedType || "General"})`}
              </Descriptions.Item>
            </>
          )}
        </Descriptions>

        <Divider orientation="left" style={{ border: "2px" }}>
          Symptoms
        </Divider>
        <p>
          <strong>Names:</strong> {details?.symptoms?.symptomNames?.join(", ")}
        </p>
        <p>
          <strong>Titles:</strong> {details?.symptoms?.symptomType?.join(", ")}
        </p>
        <p>
          <strong>Description:</strong> {details?.symptoms?.description}
        </p>

        {["admin", "receptionist"].includes(user?.role) && (
          <>
            <Divider orientation="left" style={{ border: "2px" }}>
              Payment Bills
            </Divider>
            {type === "ipd" && (
              <BillDetailsList
                patient={patient}
                ipds={[entryDetails?.ipdDetails]}
                bills={entryDetails?.ipdDetails?.payment?.bill}
              />
            )}
            {type === "opd" && (
              <BillDetailsList
                patient={patient}
                opds={[entryDetails?.opdDetails]}
                bills={
                  entryDetails?.opdDetails?.payment?.bill
                    ? [entryDetails.opdDetails.payment.bill]
                    : []
                }
              />
            )}
          </>
        )}
        <Divider orientation="left" style={{ border: "2px" }}>
          Prescriptions
        </Divider>
        <PatientPrescriptionTable
          prescriptions={
            entryDetails?.ipdDetails?.prescriptions ||
            entryDetails?.opdDetails?.prescriptions
          }
        />
        <Divider orientation="left" style={{ border: "2px" }}>
          Reports
        </Divider>
        <PatientTestReports
          pathologyTestReports={pathologyTestReports}
          patient={patient}
        />
      </Card>
    </div>
  );
};

export default IpdOpdDetails;
