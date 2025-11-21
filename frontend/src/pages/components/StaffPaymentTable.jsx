import { Table } from "antd";
import { formatDateTime } from "../../utils/helper";

const StaffPaymentTable = ({ payments }) => {
  const paymentColumns = [
    { title: "Payment Type", dataIndex: "paymentType", key: "paymentType" },
    {
      title: "Month",
      dataIndex: "month",
      key: "month",
      render: (text, record) =>
        record?.paymentType === "Monthly Salary" ? text : "-",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amt) => `₹${amt}`,
    },
    {
      title: "Payment Date",
      dataIndex: "paymentDate",
      key: "paymentDate",
      render: (d) => formatDateTime(d),
    },
    { title: "Notes", dataIndex: "notes", key: "notes" },
  ];

  return (
    <Table
      rowKey="_id"
      dataSource={payments || []}
      columns={paymentColumns}
      pagination={{ pageSize: 5 }}
      scroll={{ x: "max-content" }}
    />
  );
};

export default StaffPaymentTable;
