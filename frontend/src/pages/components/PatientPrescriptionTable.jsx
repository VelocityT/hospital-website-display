import { Table, Empty, Button } from "antd";
import { formatDateTime } from "../../utils/helper";
import { useNavigate } from "react-router-dom";
import { PrinterOutlined } from "@ant-design/icons";
import { handlePatientPrescriptionPrint } from "../../utils/printDataHelper";
import { useSelector } from "react-redux";

const PatientPrescriptionTable = ({
  prescriptions,
  forPharmacy = false,
  patient,
}) => {
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();
  if (!prescriptions?.length) {
    return <Empty description="No Prescriptions Found" />;
  }

  const columns = [
    {
      title: "Date",
      dataIndex: "createdAt",
      render: formatDateTime,
    },
    {
      title: "Visit Number",
      render: (_, record) =>
        record.patientType === "ipd" ? record.ipd || "-" : record.opd || "-",
    },
    {
      title: "Created By",
      render: (_, record) =>
        `${record.createdBy?.fullName || "N/A"} (${
          record.createdBy?.role || "-"
        })`,
    },
    {
      title: "Note",
      dataIndex: "note",
      render: (text) => text || "-",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        const createdAt = new Date(record.createdAt);
        const now = new Date();
        const timeDiff = now - createdAt;
        const within24Hours = timeDiff < 24 * 60 * 60 * 1000;

        return forPharmacy ? (
          <>
            <Button
              type="link"
              onClick={() =>
                navigate("/pharmacy/medicine/order", { state: record })
              }
            >
              Sale Medicine
            </Button>
          </>
        ) : (
          <>
            {" "}
            {within24Hours && ["admin", "doctor"].includes(user?.role) && (
              <Button
                type="link"
                className="text-blue-600"
                onClick={() =>
                  navigate("/editPrescription", {
                    state: { prescriptionId: record?._id },
                  })
                }
              >
                Edit
              </Button>
            )}
            <Button
              className="border-green-600"
              icon={<PrinterOutlined className="text-green-600" />}
              onClick={() =>
                handlePatientPrescriptionPrint({ record, patient })
              }
            />
          </>
        );
      },
    },
  ].filter(Boolean);

  const expandedRowRender = (record) => (
    <>
      {record?.medicines?.length > 0 && (
        <Table
          bordered
          size="small"
          pagination={false}
          className="mb-3"
          dataSource={record.medicines.map((m, i) => ({ ...m, key: i }))}
          columns={[
            { title: "Medicine", dataIndex: "medicine" },
            { title: "Category", dataIndex: "medicineCategory" },
            { title: "Duration", dataIndex: "doseDuration" },
            { title: "Interval", dataIndex: "doseInterval" },
          ]}
        />
      )}

      {record?.labTests?.length > 0 && (
        <Table
          bordered
          size="small"
          pagination={false}
          className="mt-3 pt-2 border-t border-gray-300"
          dataSource={record.labTests.map((test, i) => ({ ...test, key: i }))}
          columns={[{ title: "Test Name", dataIndex: "testName" }]}
        />
      )}
    </>
  );

  return (
    <Table
      dataSource={prescriptions.map((item, index) => ({
        ...item,
        key: item._id || index,
      }))}
      columns={columns}
      expandable={{ expandedRowRender }}
      scroll={{ x: true }}
    />
  );
};

export default PatientPrescriptionTable;
