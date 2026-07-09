import { Col, Form, Input, Row, Select } from "antd";

const vaOptions = [
  "6/6",
  "6/9",
  "6/12",
  "6/18",
  "6/24",
  "6/36",
  "6/60",
  "5/60",
  "4/60",
  "3/60",
  "2/60",
  "1/60",
  "CF", // counting fingers
  "HM", // hand movement
  "PL+", // perception of light
  "PL-",
].map((v) => ({ value: v, label: v }));

// Reusable per-eye input block. `side` = "rightEye" | "leftEye", nested under `parent` (e.g. "workup")
const EyeSideFields = ({ parent, side, title }) => {
  const name = (field) => [parent, side, field];

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
      <p className="font-semibold mb-2">{title}</p>
      <Row gutter={[8, 4]}>
        <Col span={8}>
          <Form.Item label="UCVA" name={name("uncorrectedVA")} className="mb-2">
            <Select options={vaOptions} allowClear showSearch placeholder="6/--" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Pinhole" name={name("pinholeVA")} className="mb-2">
            <Select options={vaOptions} allowClear showSearch placeholder="6/--" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="BCVA" name={name("bcva")} className="mb-2">
            <Select options={vaOptions} allowClear showSearch placeholder="6/--" />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item label="AR SPH" name={name("arSph")} className="mb-2">
            <Input placeholder="-1.25" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="AR CYL" name={name("arCyl")} className="mb-2">
            <Input placeholder="-0.50" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="AR Axis" name={name("arAxis")} className="mb-2">
            <Input placeholder="180" />
          </Form.Item>
        </Col>

        <Col span={6}>
          <Form.Item label="SPH" name={name("sph")} className="mb-2">
            <Input placeholder="-1.00" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="CYL" name={name("cyl")} className="mb-2">
            <Input placeholder="-0.50" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="Axis" name={name("axis")} className="mb-2">
            <Input placeholder="90" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="Add" name={name("add")} className="mb-2">
            <Input placeholder="+2.00" />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="IOP (mmHg)" name={name("iop")} className="mb-0">
            <Input placeholder="16" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="VA c Glasses"
            name={name("correctedVA")}
            className="mb-0"
          >
            <Select options={vaOptions} allowClear showSearch placeholder="6/--" />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
};

export default EyeSideFields;
