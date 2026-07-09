import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Spin,
  Tag,
  Typography,
} from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  createEyeSurgeryApi,
  getEyeExamApi,
  saveDoctorEyeFindingsApi,
} from "../../services/apis";
import { handleGlassesRxPrint } from "../../utils/eyePrintHelper";

const { Title, Text } = Typography;

const diagnosisOptions = [
  "Refractive Error",
  "Immature Cataract",
  "Mature Cataract",
  "Pseudophakia",
  "Glaucoma Suspect",
  "POAG",
  "Dry Eye",
  "Allergic Conjunctivitis",
  "Diabetic Retinopathy",
  "ARMD",
  "Pterygium",
  "Squint",
  "Normal",
].map((d) => ({ value: d, label: d }));

const surgeryTypes = [
  "Cataract - PHACO",
  "Cataract - SICS",
  "Cataract - FLACS",
  "LASIK / Refractive",
  "Pterygium Excision",
  "Glaucoma Surgery",
  "Squint Correction",
  "Retina / Vitrectomy",
  "DCR / DCT",
  "Other",
].map((s) => ({ value: s, label: s }));

const rxFields = [
  ["distSph", "SPH"],
  ["distCyl", "CYL"],
  ["distAxis", "Axis"],
  ["distVA", "V/A"],
  ["nearAdd", "Add"],
];

const WorkupSummary = ({ workup }) => {
  if (!workup?.workupAt) {
    return <Tag color="orange">Workup not done yet</Tag>;
  }
  const eyeLine = (e = {}) =>
    `UCVA ${e.uncorrectedVA || "-"} | AR ${e.arSph || "-"}/${e.arCyl || "-"}x${
      e.arAxis || "-"
    } | Refr ${e.sph || "-"}/${e.cyl || "-"}x${e.axis || "-"} Add ${
      e.add || "-"
    } | BCVA ${e.bcva || "-"} | IOP ${e.iop || "-"}`;

  return (
    <Descriptions
      size="small"
      column={1}
      bordered
      className="mb-4"
      title="Optometrist Workup"
    >
      <Descriptions.Item label="Complaints">
        {(workup.chiefComplaints || []).join(", ") || "-"}{" "}
        {workup.complaintDuration ? `(${workup.complaintDuration})` : ""}
      </Descriptions.Item>
      <Descriptions.Item label="Systemic">
        {(workup.systemicIllness || []).join(", ") || "None"}
      </Descriptions.Item>
      <Descriptions.Item label="Ocular History">
        {workup.ocularHistory || "-"}
      </Descriptions.Item>
      <Descriptions.Item label="OD (Right)">
        {eyeLine(workup.rightEye)}
      </Descriptions.Item>
      <Descriptions.Item label="OS (Left)">
        {eyeLine(workup.leftEye)}
      </Descriptions.Item>
      <Descriptions.Item label="Dilated">
        {workup.dilated ? "Yes" : "No"}
        {workup.iopMethod ? ` | IOP: ${workup.iopMethod}` : ""}
      </Descriptions.Item>
    </Descriptions>
  );
};

const DoctorEyePanel = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector((state) => state?.user);
  const hospital = useSelector((state) => state?.hospital);
  const [form] = Form.useForm();
  const [surgeryForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exam, setExam] = useState(null);
  const [surgeryModalOpen, setSurgeryModalOpen] = useState(false);

  const { opdNumber, patient } = location.state || {};

  useEffect(() => {
    const load = async () => {
      if (!opdNumber) return;
      setLoading(true);
      const res = await getEyeExamApi({ opd: opdNumber });
      if (res.success) {
        setExam(res.data);
        form.setFieldsValue({
          doctorFindings: {
            ...res.data.doctorFindings,
            reviewDate: res.data.doctorFindings?.reviewDate
              ? dayjs(res.data.doctorFindings.reviewDate)
              : undefined,
          },
          glassesPrescription: res.data.glassesPrescription,
        });
      }
      setLoading(false);
    };
    load();
  }, [opdNumber, form]);

  if (!opdNumber || !patient) {
    return (
      <Card>
        <Text>
          No OPD visit selected. Please open the panel from the Eye OPD Queue.
        </Text>
        <div className="mt-4">
          <Button onClick={() => navigate("/eye/queue")}>Go to Queue</Button>
        </div>
      </Card>
    );
  }

  const buildPayload = (markCompleted) => {
    const values = form.getFieldsValue();
    return {
      patient: patient?._id,
      opd: opdNumber,
      doctorFindings: {
        ...values.doctorFindings,
        reviewDate: values.doctorFindings?.reviewDate
          ? values.doctorFindings.reviewDate.toISOString()
          : undefined,
      },
      glassesPrescription: {
        ...values.glassesPrescription,
        prescribed: true,
      },
      markCompleted,
    };
  };

  const onSave = async (markCompleted = false) => {
    setSaving(true);
    const res = await saveDoctorEyeFindingsApi(buildPayload(markCompleted));
    setSaving(false);
    if (res.success) {
      setExam(res.data);
      toast.success(markCompleted ? "Consultation completed" : "Saved");
      if (markCompleted) navigate("/eye/queue");
    } else {
      toast.error(res.message || "Failed to save");
    }
  };

  const onPrintRx = () => {
    const values = form.getFieldsValue();
    handleGlassesRxPrint({
      hospital,
      patient,
      opdNumber,
      exam: { glassesPrescription: values.glassesPrescription },
      doctorName: user?.fullName,
    });
  };

  const onAdviseSurgery = async () => {
    try {
      const values = await surgeryForm.validateFields();
      const res = await createEyeSurgeryApi({
        patient: patient?._id,
        eyeExam: exam?._id,
        opd: opdNumber,
        surgeryType: values.surgeryType,
        eye: values.eye,
        counseling: { notes: values.note },
      });
      if (res.success) {
        toast.success("Surgery advised — sent to counseling");
        setSurgeryModalOpen(false);
        surgeryForm.resetFields();
        form.setFieldsValue({
          doctorFindings: {
            advice: "Surgery",
            surgeryAdvised: `${values.surgeryType} - ${values.eye}`,
          },
        });
      } else {
        toast.error(res.message || "Failed to record surgery advice");
      }
    } catch {
      /* validation error */
    }
  };

  return (
    <Spin spinning={loading}>
      <Card className="dark:bg-neutral-900 dark:text-white">
        <div className="flex flex-wrap justify-between items-center mb-4">
          <Title level={4} className="!mb-0">
            Eye Consultation
          </Title>
          <div className="text-right">
            <div className="font-semibold">{patient?.fullName}</div>
            <Text type="secondary">
              {patient?.patientId} | OPD: {opdNumber}
            </Text>
          </div>
        </div>

        <WorkupSummary workup={exam?.workup} />

        <Form form={form} layout="vertical">
          <Divider orientation="left">Examination</Divider>
          <Row gutter={[16, 8]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Slit Lamp - OD"
                name={["doctorFindings", "slitLamp", "rightEye"]}
              >
                <Input.TextArea rows={2} placeholder="Anterior segment findings" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Slit Lamp - OS"
                name={["doctorFindings", "slitLamp", "leftEye"]}
              >
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Fundus - OD"
                name={["doctorFindings", "fundus", "rightEye"]}
              >
                <Input.TextArea rows={2} placeholder="Disc, macula, periphery" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Fundus - OS"
                name={["doctorFindings", "fundus", "leftEye"]}
              >
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
            <Col xs={12} md={4}>
              <Form.Item
                label="C:D Ratio OD"
                name={["doctorFindings", "cdRatio", "rightEye"]}
              >
                <Input placeholder="0.3" />
              </Form.Item>
            </Col>
            <Col xs={12} md={4}>
              <Form.Item
                label="C:D Ratio OS"
                name={["doctorFindings", "cdRatio", "leftEye"]}
              >
                <Input placeholder="0.3" />
              </Form.Item>
            </Col>
            <Col xs={24} md={16}>
              <Form.Item label="Diagnosis" name={["doctorFindings", "diagnosis"]}>
                <Select
                  mode="tags"
                  options={diagnosisOptions}
                  placeholder="Select or type diagnosis"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Glasses Prescription</Divider>
          {["rightEye", "leftEye"].map((side) => (
            <Row gutter={[8, 4]} key={side} align="middle">
              <Col xs={24} md={3}>
                <b>{side === "rightEye" ? "OD (Right)" : "OS (Left)"}</b>
              </Col>
              {rxFields.map(([field, label]) => (
                <Col xs={8} md={4} key={field}>
                  <Form.Item
                    label={label}
                    name={["glassesPrescription", side, field]}
                    className="mb-2"
                  >
                    <Input />
                  </Form.Item>
                </Col>
              ))}
            </Row>
          ))}
          <Row gutter={[16, 8]}>
            <Col xs={8} md={4}>
              <Form.Item label="PD (mm)" name={["glassesPrescription", "pd"]}>
                <Input placeholder="62" />
              </Form.Item>
            </Col>
            <Col xs={16} md={6}>
              <Form.Item
                label="Lens Type"
                name={["glassesPrescription", "lensType"]}
              >
                <Select
                  allowClear
                  options={[
                    "Single Vision",
                    "Bifocal",
                    "Progressive",
                    "Contact Lens",
                  ].map((v) => ({ value: v, label: v }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={7}>
              <Form.Item
                label="Lens Advice (ARC / Blue cut / Photochromic)"
                name={["glassesPrescription", "lensMaterialNote"]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={7}>
              <Form.Item label="Remarks" name={["glassesPrescription", "remarks"]}>
                <Input placeholder="Constant use / Near work only..." />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Advice & Plan</Divider>
          <Row gutter={[16, 8]}>
            <Col xs={24} md={6}>
              <Form.Item label="Advice" name={["doctorFindings", "advice"]}>
                <Select
                  allowClear
                  options={[
                    "Glasses",
                    "Medical Management",
                    "Surgery",
                    "Referral",
                    "Observation",
                  ].map((v) => ({ value: v, label: v }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label="Surgery Advised"
                name={["doctorFindings", "surgeryAdvised"]}
              >
                <Input placeholder="Filled automatically via Advise Surgery" />
              </Form.Item>
            </Col>
            <Col xs={24} md={4}>
              <Form.Item label="Review Date" name={["doctorFindings", "reviewDate"]}>
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label="Notes" name={["doctorFindings", "notes"]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <div className="flex flex-wrap justify-end gap-3 mt-2">
          <Button icon={<PrinterOutlined />} onClick={onPrintRx}>
            Print Glasses Rx
          </Button>
          <Button
            onClick={() =>
              navigate("/addPrescription", {
                state: {
                  patient,
                  opdNumber,
                  patientType: "opd",
                },
              })
            }
          >
            Medicines Rx
          </Button>
          <Button danger onClick={() => setSurgeryModalOpen(true)}>
            Advise Surgery
          </Button>
          <Button loading={saving} onClick={() => onSave(false)}>
            Save Draft
          </Button>
          <Button type="primary" loading={saving} onClick={() => onSave(true)}>
            Save & Complete
          </Button>
        </div>

        <Modal
          title="Advise Surgery"
          open={surgeryModalOpen}
          onOk={onAdviseSurgery}
          onCancel={() => setSurgeryModalOpen(false)}
          okText="Send to Counseling"
        >
          <Form form={surgeryForm} layout="vertical">
            <Form.Item
              label="Surgery Type"
              name="surgeryType"
              rules={[{ required: true, message: "Select surgery type" }]}
            >
              <Select options={surgeryTypes} showSearch />
            </Form.Item>
            <Form.Item
              label="Eye"
              name="eye"
              rules={[{ required: true, message: "Select eye" }]}
            >
              <Select
                options={[
                  "Right Eye (OD)",
                  "Left Eye (OS)",
                  "Both Eyes",
                ].map((v) => ({ value: v, label: v }))}
              />
            </Form.Item>
            <Form.Item label="Note for Counselor" name="note">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </Spin>
  );
};

export default DoctorEyePanel;
