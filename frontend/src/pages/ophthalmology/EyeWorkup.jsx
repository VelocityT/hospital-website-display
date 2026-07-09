import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  Row,
  Select,
  Spin,
  Typography,
} from "antd";
import toast from "react-hot-toast";
import { getEyeExamApi, saveEyeWorkupApi } from "../../services/apis";
import EyeSideFields from "./components/EyeSideFields";

const { Title, Text } = Typography;

const complaintOptions = [
  "Blurred Vision",
  "Diminision of Vision",
  "Watering",
  "Redness",
  "Itching",
  "Pain",
  "Headache",
  "Foreign Body Sensation",
  "Floaters",
  "Flashes of Light",
  "Double Vision",
  "Glare",
].map((c) => ({ value: c, label: c }));

const systemicOptions = [
  "Diabetes",
  "Hypertension",
  "Thyroid",
  "Asthma",
  "Cardiac",
  "Allergy",
].map((c) => ({ value: c, label: c }));

const EyeWorkup = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { opdNumber, patient } = location.state || {};

  useEffect(() => {
    const loadExisting = async () => {
      if (!opdNumber) return;
      setLoading(true);
      const res = await getEyeExamApi({ opd: opdNumber });
      if (res.success && res.data?.workup) {
        form.setFieldsValue({ workup: res.data.workup });
      }
      setLoading(false);
    };
    loadExisting();
  }, [opdNumber, form]);

  if (!opdNumber || !patient) {
    return (
      <Card>
        <Text>
          No OPD visit selected. Please open workup from the Eye OPD Queue.
        </Text>
        <div className="mt-4">
          <Button onClick={() => navigate("/eye/queue")}>Go to Queue</Button>
        </div>
      </Card>
    );
  }

  const onSave = async () => {
    const values = form.getFieldsValue();
    setSaving(true);
    const res = await saveEyeWorkupApi({
      patient: patient?._id,
      opd: opdNumber,
      workup: values.workup || {},
    });
    setSaving(false);
    if (res.success) {
      toast.success("Workup saved");
      navigate("/eye/queue");
    } else {
      toast.error(res.message || "Failed to save workup");
    }
  };

  return (
    <Spin spinning={loading}>
      <Card className="dark:bg-neutral-900 dark:text-white">
        <div className="flex flex-wrap justify-between items-center mb-4">
          <Title level={4} className="!mb-0">
            Optometrist Workup
          </Title>
          <div className="text-right">
            <div className="font-semibold">{patient?.fullName}</div>
            <Text type="secondary">
              {patient?.patientId} | OPD: {opdNumber}
            </Text>
          </div>
        </div>

        <Form form={form} layout="vertical">
          <Row gutter={[16, 8]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Chief Complaints"
                name={["workup", "chiefComplaints"]}
              >
                <Select
                  mode="tags"
                  options={complaintOptions}
                  placeholder="Select or type complaints"
                />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item label="Duration" name={["workup", "complaintDuration"]}>
                <Input placeholder="e.g. 6 months" />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item
                label="Systemic Illness"
                name={["workup", "systemicIllness"]}
              >
                <Select
                  mode="tags"
                  options={systemicOptions}
                  placeholder="Diabetes, HTN..."
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Ocular History (surgery / trauma / glasses)"
                name={["workup", "ocularHistory"]}
              >
                <Input placeholder="e.g. Cataract surgery LE 2019, wearing glasses since 5 yrs" />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item label="IOP Method" name={["workup", "iopMethod"]}>
                <Select
                  allowClear
                  options={[
                    { value: "NCT", label: "NCT" },
                    { value: "Applanation", label: "Applanation" },
                    { value: "Schiotz", label: "Schiotz" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={6} md={3}>
              <Form.Item
                label="Glasses?"
                name={["workup", "currentGlasses"]}
                valuePropName="checked"
              >
                <Checkbox />
              </Form.Item>
            </Col>
            <Col xs={6} md={3}>
              <Form.Item
                label="Dilated?"
                name={["workup", "dilated"]}
                valuePropName="checked"
              >
                <Checkbox />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]} className="mt-2">
            <Col xs={24} lg={12}>
              <EyeSideFields
                parent="workup"
                side="rightEye"
                title="Right Eye (OD)"
              />
            </Col>
            <Col xs={24} lg={12}>
              <EyeSideFields
                parent="workup"
                side="leftEye"
                title="Left Eye (OS)"
              />
            </Col>
          </Row>

          <Form.Item label="Notes" name={["workup", "notes"]} className="mt-4">
            <Input.TextArea rows={2} placeholder="Any additional observations" />
          </Form.Item>
        </Form>

        <div className="flex justify-end gap-3">
          <Button onClick={() => navigate("/eye/queue")}>Cancel</Button>
          <Button type="primary" loading={saving} onClick={onSave}>
            Save Workup & Send to Doctor
          </Button>
        </div>
      </Card>
    </Spin>
  );
};

export default EyeWorkup;
