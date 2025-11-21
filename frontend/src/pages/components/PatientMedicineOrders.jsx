import { Table, Empty, Tag, Button } from "antd";
import { formatDateTime } from "../../utils/helper";
import { handlePatientPrescriptionPrint } from "../../utils/printDataHelper";
import { PrinterOutlined } from "@ant-design/icons";

const PatientMedicineOrders = ({ medicineOrders, patient }) => {
  if (!medicineOrders?.length) {
    return <Empty description="No Medicine Orders Found" />;
  }

  const columns = [
    {
      title: "Date",
      dataIndex: "createdAt",
      render: formatDateTime,
    },
    {
      title: "Payable",
      dataIndex: "payableAmount",
      render: (amount) => `₹${amount.toFixed(2)}`,
    },
    {
      title: "Created By",
      dataIndex: "generatedBy",
      render: (user) => `${user?.fullName || "N/A"} (${user?.role || "-"})`,
    },
    {
      title: "Payment Status",
      dataIndex: "payment",
      render: (payment) => (
        <Tag color={payment?.status === "Paid" ? "green" : "red"}>
          {payment?.status || "-"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (text, record) => (
        <Button
          className="border-green-600"
          icon={<PrinterOutlined className="text-green-600" />}
          onClick={() => handlePatientPrescriptionPrint({ record, patient })}
        />
      ),
    },
  ];

  const expandedRowRender = (record) => {
    const columns = [
      {
        title: "Medicine",
        dataIndex: "name",
      },
      {
        title: "Quantity",
        dataIndex: "quantity",
      },
      {
        title: "Unit",
        dataIndex: "unit",
      },
      {
        title: "Sell Price (₹)",
        dataIndex: "sellPrice",
        render: (value) => value?.toFixed(2),
      },
      {
        title: "Total (₹)",
        render: (_, row) => (row.quantity * row.sellPrice).toFixed(2),
      },
    ];

    return (
      <Table
        size="small"
        pagination={false}
        dataSource={record.medicines.map((m, i) => ({ ...m, key: i }))}
        columns={columns}
      />
    );
  };

  return (
    <Table
      dataSource={medicineOrders.map((item, index) => ({
        ...item,
        key: item._id || index,
      }))}
      columns={columns}
      expandable={{ expandedRowRender }}
      scroll={{ x: true }}
    />
  );
};

export default PatientMedicineOrders;
