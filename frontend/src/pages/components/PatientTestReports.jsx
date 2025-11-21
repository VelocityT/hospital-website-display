import { Table, Empty, Button } from "antd";
import { formatDateTime } from "../../utils/helper";
import { PrinterOutlined } from "@ant-design/icons";
import { handlePatientTestReportPrint } from "../../utils/printDataHelper";

const PatientTestReports = ({ pathologyTestReports,patient }) => {
  if (!pathologyTestReports?.length) {
    return <Empty description="No Data Found" />;
  }

  return (
    <Table
      dataSource={pathologyTestReports.map((report, index) => ({
        ...report,
        key: report._id || index,
      }))}
      columns={[
        {
          title: "Test Name",
          dataIndex: ["test", "testName"],
          key: "testName",
          render: (text) => text || "N/A",
        },
        {
          title: "Test Code",
          dataIndex: ["test", "testCode"],
          key: "testCode",
          render: (text) => text || "N/A",
        },
        {
          title: "Patient Type",
          dataIndex: "patientType",
          key: "patientType",
        },
        {
          title: "OPD/IPD Number",
          key: "visitNumber",
          render: (_, record) => {
            const visitNumber =
              record.patientType === "Ipd"
                ? record.ipd?.ipdNumber
                : record.opd?.opdNumber;

            return visitNumber || "-";
          },
        },
        {
          title: "Reported By",
          key: "reportedBy",
          render: (_, record) =>
            `${record.reportedBy?.fullName || "N/A"} (${
              record.reportedBy?.role
            })`,
        },
        {
          title: "Date",
          dataIndex: "createdAt",
          key: "createdAt",
          render: (text) => formatDateTime(text),
        },
        {
          title: "Actions",
          key: "actions",
          render: (text, record) => (
            <Button
              className="border-green-600"
              icon={<PrinterOutlined className="text-green-600" />}
              onClick={() => handlePatientTestReportPrint({ record, patient })}
            />
          ),
        },
      ]}
      expandable={{
        expandedRowRender: (record) => (
          <>
            <Table
              size="small"
              pagination={false}
              dataSource={record.results.map((r, i) => ({ ...r, key: i }))}
              columns={[
                { title: "Name", dataIndex: "name", key: "name" },
                {
                  title: "Result",
                  dataIndex: "result",
                  key: "result",
                  render: (result, row) => {
                    const [min, max] = (row.normalRange || "")
                      .split("-")
                      .map((v) => parseFloat(v));
                    const numericResult = parseFloat(result);

                    const isOutOfRange =
                      !isNaN(numericResult) &&
                      ((!isNaN(min) && numericResult < min) ||
                        (!isNaN(max) && numericResult > max));

                    return (
                      <span
                        className={`px-2 py-1 rounded font-semibold ${
                          isNaN(numericResult)
                            ? "bg-gray-200 text-gray-800"
                            : isOutOfRange
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {result}
                      </span>
                    );
                  },
                },
                {
                  title: "Unit",
                  dataIndex: "unit",
                  key: "unit",
                  render: (text) => text || "-",
                },
                {
                  title: "Normal Range",
                  dataIndex: "normalRange",
                  key: "normalRange",
                  render: (text) => text || "-",
                },
              ]}
            />
            <p className="mt-2">
              <strong>Remarks:</strong> {record.remarks || "N/A"}
            </p>
          </>
        ),
      }}
      scroll={{ x: true }}
    />
  );
};

export default PatientTestReports;
