import { Table, Tag, Button, Space, Badge, Input } from "antd";
import { SearchOutlined, UserOutlined } from "@ant-design/icons";

const PatientQueue = ({ onSelectPatient, onStartConsultation }) => {
  const columns = [
    {
      title: "Token No",
      dataIndex: "token",
      key: "token",
      render: (text) => <Tag color="blue">#{text}</Tag>,
    },
    {
      title: "Patient",
      key: "patient",
      render: (_, record) => (
        <Space>
          <Badge count={<UserOutlined style={{ color: "#fff" }} />} />
          <span>
            {record.name} (ID: {record.id})
          </span>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          color={
            status === "Waiting"
              ? "orange"
              : status === "Consulting"
              ? "blue"
              : "green"
          }
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => {
            onSelectPatient(record);
            onStartConsultation();
          }}
          disabled={record.status !== "Waiting"}
        >
          Start Consultation
        </Button>
      ),
    },
  ];

  const data = [
    { id: "HOSP-1001", token: 15, name: "John Doe", status: "Waiting" },
    { id: "HOSP-1002", token: 16, name: "Jane Smith", status: "Consulting" },
    { id: "HOSP-1003", token: 17, name: "Robert Johnson", status: "Completed" },
  ];

  return (
    <div className="patient-queue">
      <div className="queue-controls mb-4">
        <Input
          placeholder="Search patients..."
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
        />
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={false}
      />
    </div>
  );
};

export default PatientQueue;
