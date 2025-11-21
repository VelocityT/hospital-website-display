import { Drawer, Descriptions } from "antd";
import { formatDate, formatDateTime } from "../../utils/helper";

function PatientDetailsPreview({ open, onClose, patient }) {
  if (!patient) return null;

  return (
    <Drawer title="Patient Details" open={open} onClose={onClose} width={500}>
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Patient ID" className="font-semibold">
          {patient.patientId}
        </Descriptions.Item>
        <Descriptions.Item label="Name">{patient.fullName}</Descriptions.Item>
        <Descriptions.Item label="Gender">{patient.gender}</Descriptions.Item>
        <Descriptions.Item label="DOB">
          {formatDate(patient.dob)}
        </Descriptions.Item>
        <Descriptions.Item label="Age">
          {patient.age?.years || 0}y {patient.age?.months || 0}m{" "}
          {patient.age?.days || 0}d
        </Descriptions.Item>
        {patient?.ipdDetails && (
          <Descriptions.Item label="Status">
            {patient?.ipdDetails?.status || "-"}
          </Descriptions.Item>
        )}
        {patient?.ipdDetails?.status === "Discharged" && (
          <>
            <Descriptions.Item label="Discharge Reason">
              {patient.ipdDetails.dischargeSummary.dischargeReason || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Discharge Condition">
              {patient.ipdDetails.dischargeSummary.dischargeCondition || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Discharge Date">
              {formatDate(patient.ipdDetails.dischargeSummary.dischargeDate) ||
                "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Discharged By">
              {patient.ipdDetails.dischargeSummary.dischargedBy?.fullName
                ? `${patient.ipdDetails.dischargeSummary.dischargedBy.fullName} (${patient.ipdDetails.dischargeSummary.dischargedBy.role})`
                : "-"}
            </Descriptions.Item>
          </>
        )}

        <Descriptions.Item label="Phone">
          {patient.contact?.phone}
        </Descriptions.Item>
        <Descriptions.Item label="Email">
          {patient.contact?.email || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Blood Group">
          {patient.bloodGroup || ""}
        </Descriptions.Item>
        <Descriptions.Item label="Address 1">
          {patient.address?.line1 || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Address 2">
          {patient.address?.line2 || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="City">
          {patient.address?.city || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Pincode">
          {patient.address?.pincode || "-"}
        </Descriptions.Item>
        {patient?.ipdDetails?.ipdNumber && (
          <>
            <Descriptions.Item label="IPD Number">
              {patient.ipdDetails.ipdNumber}
            </Descriptions.Item>

            <Descriptions.Item label="Admission Date & Time">
              {formatDateTime(patient.ipdDetails.admissionDate)}
            </Descriptions.Item>

            <Descriptions.Item label="Height">
              {patient.ipdDetails.height !== "NaN"
                ? patient.ipdDetails.height
                : "-"}
            </Descriptions.Item>

            <Descriptions.Item label="Weight">
              {patient.ipdDetails.weight !== "NaN"
                ? patient.ipdDetails.weight
                : "-"}
            </Descriptions.Item>

            <Descriptions.Item label="Blood Pressure">
              {patient.ipdDetails?.bloodPressure || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Ward">
              {patient.ipdDetails.ward
                ? `${patient.ipdDetails.ward.name} (Floor: ${patient.ipdDetails.ward.floor})`
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Bed Number">
              {`${patient.ipdDetails.bed?.bedNumber} (${patient?.ipdDetails?.bed?.bedType})` || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Doctor">
              {patient.ipdDetails.attendingDoctor?.fullName || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Doctor Charge">
              ₹{patient.ipdDetails.attendingDoctor?.ipdCharge || 0}
            </Descriptions.Item>
            <Descriptions.Item label="Nurse">
              {patient.ipdDetails.attendingNurse?.fullName || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Symptoms">
              {(patient.ipdDetails.symptoms?.symptomNames || []).join(", ") ||
                "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Symptoms Type">
              {(patient.ipdDetails.symptoms?.symptomType || []).join(", ") ||
                "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Symptoms Description">
              {patient.ipdDetails.symptoms?.description || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="IPD Notes">
              {patient.ipdDetails.notes?.trim() || "-"}
            </Descriptions.Item>
          </>
        )}
        {patient?.opdDetails?.opdNumber && (
          <>
            <Descriptions.Item label="OPD Number">
              {patient.opdDetails?.opdNumber}
            </Descriptions.Item>
            <Descriptions.Item label="Visit Date & Time">
              {formatDateTime(patient.opdDetails?.visitDateTime)}
            </Descriptions.Item>
            <Descriptions.Item label="Doctor">
              {patient.opdDetails?.doctor?.fullName}
            </Descriptions.Item>
            <Descriptions.Item label="Consultation Fees">
              {patient.opdDetails?.doctor?.opdCharge}
            </Descriptions.Item>
            <Descriptions.Item label="Symptoms">
              {(patient?.opdDetails?.symptoms?.symptomNames || []).join(", ")}
            </Descriptions.Item>
            <Descriptions.Item label="Symptoms Type">
              {(patient?.opdDetails?.symptoms?.symptomType || []).join(", ")}
            </Descriptions.Item>
            <Descriptions.Item label="Symptoms Description">
              {patient?.opdDetails?.symptoms?.description || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="OPD Notes">
              {patient.opdDetails?.notes || "-"}
            </Descriptions.Item>
          </>
        )}
      </Descriptions>
    </Drawer>
  );
}

export default PatientDetailsPreview;
