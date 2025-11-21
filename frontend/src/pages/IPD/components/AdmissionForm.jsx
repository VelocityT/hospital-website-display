import { Form, Input, Select, Alert, Descriptions, Spin, Empty } from "antd";
import usePatientTransfer from "./hooks/usePatientTransfer";

const AdmissionForm = ({ opdPatient }) => {
  const { beds, loading, handleAdmit } = usePatientTransfer(opdPatient?.id);

  if (!opdPatient) {
    return (
      <div className="p-4">
        <Empty
          description="No patient data found"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <p>Please select a valid patient from OPD</p>
        </Empty>
      </div>
    );
  }

   return (
    <Spin spinning={loading}>
      <Form onFinish={(values) => handleAdmit(values)} layout="vertical">
        <Alert
          message={`Transferring Patient from OPD to IPD`}
          type="info"
          className="mb-4"
        />

        <Descriptions bordered column={1} className="mb-4">
          <Descriptions.Item label="Patient ID">
            {opdPatient.id || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Name">
            {opdPatient.name || 'Not specified'}
          </Descriptions.Item>
          <Descriptions.Item label="Age/Sex">
            {opdPatient.age || 'N/A'} / {opdPatient.gender || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="OPD Diagnosis">
            {opdPatient.diagnosis || "Not specified"}
          </Descriptions.Item>
        </Descriptions>

      <Form.Item
        label="Admission Type"
        name="type"
        rules={[{ required: true, message: "Please select admission type" }]}
      >
        <Select
          options={[
            { value: "emergency", label: "Emergency" },
            { value: "routine", label: "Routine" },
            { value: "referral", label: "Specialist Referral" },
          ]}
          placeholder="Select admission type"
        />
      </Form.Item>

      <Form.Item
        label="Assign Bed"
        name="bedId"
        rules={[{ required: true, message: "Please select a bed" }]}
      >
        <Select
          loading={loading}
          showSearch
          optionFilterProp="children"
          placeholder="Search available beds"
          options={beds.map((bed) => ({
            value: bed.id,
            label: `Bed ${bed.number} (${bed.ward}) - ${
              bed.status === "clean" ? "🟢 Available" : "🟠 Needs Cleaning"
            }`,
            bedData: bed,
          }))}
        />
      </Form.Item>

      <Form.Item
        label="Initial Diagnosis"
        name="diagnosis"
        rules={[
          { required: true, message: "Please enter admission diagnosis" },
        ]}
      >
        <Input.TextArea
          rows={3}
          defaultValue={opdPatient.diagnosis}
          placeholder="Enter primary diagnosis for IPD"
        />
      </Form.Item>

      <Form.Item
        label="Referring Doctor"
        name="referringDoctor"
        initialValue={opdPatient.consultingDoctor}
      >
        <Input disabled />
      </Form.Item>
    </Form>
    </Spin>
  );
};

export default AdmissionForm;
