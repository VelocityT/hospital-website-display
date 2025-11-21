import { useState } from "react";
import { Table, Input, Button, Space, Form, Select } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";


const { Option } = Select;

const PrescriptionEditor = ({ patient }) => {
  const [form] = Form.useForm();
  const [medicines, setMedicines] = useState([]);

  const medColumns = [
    { title: "Medicine", dataIndex: "name", key: "name" },
    { title: "Dosage", dataIndex: "dosage", key: "dosage" },
    { title: "Frequency", dataIndex: "frequency", key: "frequency" },
    { title: "Duration", dataIndex: "duration", key: "duration" },
    {
      title: "Action",
      key: "action",
      render: (_, __, index) => (
        <Button
          icon={<DeleteOutlined />}
          onClick={() =>
            setMedicines((meds) => meds.filter((_, i) => i !== index))
          }
        />
      ),
    },
  ];

  const onAddMedicine = (values) => {
    setMedicines([...medicines, values]);
    form.resetFields();
  };

  return (
    <div className="prescription-editor">
      <h4>Prescription for {patient.name}</h4>

      <Form form={form} onFinish={onAddMedicine} layout="inline">
        <Form.Item name="name" rules={[{ required: true }]}>
          <Select placeholder="Medicine" style={{ width: 200 }}>
            <Option value="Paracetamol">Paracetamol</Option>
            <Option value="Amoxicillin">Amoxicillin</Option>
          </Select>
        </Form.Item>

        <Form.Item name="dosage" rules={[{ required: true }]}>
          <Input placeholder="Dosage (e.g. 500mg)" />
        </Form.Item>

        <Form.Item name="frequency" rules={[{ required: true }]}>
          <Select placeholder="Frequency" style={{ width: 150 }}>
            <Option value="OD">Once Daily</Option>
            <Option value="BD">Twice Daily</Option>
          </Select>
        </Form.Item>

        <Form.Item name="duration" rules={[{ required: true }]}>
          <Input placeholder="Duration (e.g. 5 days)" />
        </Form.Item>

        <Form.Item>
          <Button type="dashed" htmlType="submit" icon={<PlusOutlined />}>
            Add
          </Button>
        </Form.Item>
      </Form>

      <Table
        columns={medColumns}
        dataSource={medicines}
        rowKey="name"
        pagination={false}
        className="mt-3"
      />

      <div className="text-end mt-4">
        <Space>
          <Button type="primary">Print Prescription</Button>
          <Button>Save Draft</Button>
        </Space>
      </div>
    </div>
  );
};

export default PrescriptionEditor;
