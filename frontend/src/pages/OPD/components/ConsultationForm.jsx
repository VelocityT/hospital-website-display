import { Form, Input, Divider, Collapse, Row, Col, Button } from "antd";
import { SaveOutlined } from "@ant-design/icons";
const { TextArea } = Input;
const { Panel } = Collapse;

const ConsultationForm = ({ patient, onComplete }) => {
  const [form] = Form.useForm();

  const onFinish = (values) => {
    onComplete();
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Divider orientation="left">
        Patient: {patient.name} (ID: {patient.id})
      </Divider>

      <Collapse defaultActiveKey={["1"]} ghost>
        <Panel header="Vital Signs" key="1">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="BP (mmHg)" name="bp">
                <Input placeholder="120/80" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Pulse (bpm)" name="pulse">
                <Input placeholder="72" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Temp (°F)" name="temp">
                <Input placeholder="98.6" />
              </Form.Item>
            </Col>
          </Row>
        </Panel>

        <Panel header="Clinical Notes" key="2">
          <Form.Item label="Symptoms" name="symptoms">
            <TextArea rows={3} placeholder="Patient reported symptoms..." />
          </Form.Item>
          <Form.Item label="Examination Findings" name="findings">
            <TextArea rows={3} placeholder="Clinical observations..." />
          </Form.Item>
          <Form.Item label="Provisional Diagnosis" name="diagnosis">
            <TextArea rows={2} placeholder="Initial diagnosis..." />
          </Form.Item>
        </Panel>
      </Collapse>

      <Form.Item className="mt-4">
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
          Complete Consultation
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ConsultationForm;
