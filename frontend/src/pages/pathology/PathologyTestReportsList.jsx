import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Row,
  Col,
  Input,
  Tooltip,
  DatePicker,
  Select,
} from "antd";
import { Link, useNavigate } from "react-router-dom";
import { EditOutlined, PlusOutlined, PrinterOutlined } from "@ant-design/icons";
import { FaFileExcel } from "react-icons/fa";
import useDebounce from "../../hooks/useDebounce";
import { getAllPathologyTestReportsApi } from "../../services/apis";
import { formatDateTime } from "../../utils/helper";
import toast from "react-hot-toast";
import { exportToExcel } from "../../utils/exportToExcel";
import { handlePatientTestReportPrint } from "../../utils/printDataHelper";
import dayjs from "dayjs";

const PathologyTestReportsList = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText);
  const [filterMode, setFilterMode] = useState("date");
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const fetchReports = async () => {
    setLoading(true);
    const params = {
      search: debouncedSearchText,
      page: pagination.current,
      limit: pagination.pageSize,
      isReportGenrated: true,
      filterMode,
    };

    if (filterMode === "date" && selectedDate) {
      params.startDate = selectedDate.startOf("day").toISOString();
      params.endDate = selectedDate.endOf("day").toISOString();
    }

    const res = await getAllPathologyTestReportsApi(params);

    if (res.success) {
      setData(res.data);
      setTotal(res.total);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, [
    debouncedSearchText,
    pagination.current,
    pagination.pageSize,
    selectedDate,
    filterMode,
  ]);

  const formattedData = data.map((item) => ({
    ...item,
    patientName: item.patient?.fullName || "-",
    testName: item.test?.testName || "-",
    date: formatDateTime(item.createdAt),
  }));

  const handleExcelExport = () => {
    if (data.length > 0) {
      const cleanData = data.map((report) => ({
        Date: formatDateTime(report.createdAt),
        "IPD/OPD ID": report?.ipd?.ipdNumber || report?.opd?.opdNumber,
        "Patient Name": report?.patient?.fullName,
        "Test Name": report?.test?.testName,
      }));
      exportToExcel(cleanData, "Pathology_Reports.xlsx");
    } else {
      toast.apply("No data to export");
    }
  };

  const columns = [
    {
      title: "S. No.",
      key: "serial",
      render: (text, record, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => new Date(text).toLocaleDateString(),
    },
    {
      title: "IPD/OPD ID",
      key: "visitNumber",
      render: (_, record) => {
        const visitNumber = record.ipd?.ipdNumber || record.opd?.opdNumber;
        const isOpd = record.patientType === "Opd";

        const path = isOpd ? `/opd/${visitNumber}` : `/ipd/${visitNumber}`;

        const stateId = isOpd ? record.opd?._id : record.ipd?._id;

        return visitNumber ? (
          <Link to={path} state={{ _id: stateId }} className="text-blue-600">
            {visitNumber}
          </Link>
        ) : (
          "N/A"
        );
      },
    },
    {
      title: "Patient Name",
      dataIndex: ["patient", "fullName"],
      key: "patientName",
    },
    {
      title: "Test Name",
      dataIndex: ["test", "testName"],
      key: "testName",
    },
    {
      title: "Actions",
      key: "action",
      render: (_, record) => (
        <div className="flex gap-2">
          <EditOutlined
            onClick={() => navigate(`/pathology/edit-report/${record._id}`)}
            className="text-green-600 cursor-pointer text-lg"
          />
          <PrinterOutlined
            className="text-green-600 cursor-pointer text-lg"
            onClick={() =>
              handlePatientTestReportPrint({
                patient: {
                  date: record?.createdAt,
                  patientId: record?.patient?.patientId,
                  caseNumber:
                    record?.patientType === "Ipd"
                      ? record?.ipd?.ipdNumber
                      : record?.opd?.opdNumber,
                  fullName: record?.patient?.fullName,
                },
                record,
              })
            }
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-end gap-2 mb-3 overflow-hidden">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/pathology/create-report")}
        >
          Add Report
        </Button>
        <Button icon={<FaFileExcel />} onClick={handleExcelExport}>
          Export
        </Button>
      </div>
      <Row justify="space-between" align="middle" className="mb-4">
        <Col>
          <h2 className="text-xl font-semibold">Pathology Test Reports</h2>
        </Col>
        <div className="flex items-center justify-start gap-2 md:gap-4 flex-wrap overflow-hidden">
          <Col>
            <Select
              value={filterMode}
              onChange={(val) => {
                setFilterMode(val);
                setPagination((prev) => ({ ...prev, current: 1 }));
              }}
              options={[
                { label: "Date", value: "date" },
                { label: "All", value: "all" },
              ]}
              className="min-w-[70px]"
            />
          </Col>
          <Col>
            <DatePicker
              value={selectedDate}
              onChange={(date) => {
                setSelectedDate(date);
                setPagination((prev) => ({ ...prev, current: 1 }));
              }}
              allowClear={false}
              format="DD/MM/YYYY"
              disabled={filterMode === "all"}
            />
          </Col>
          <Col>
            <Input.Search
              placeholder="patient id, opd id or ipd id"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
        </div>
      </Row>

      <Table
        dataSource={formattedData}
        columns={columns}
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total,
          showSizeChanger: true,
        }}
        rowKey="_id"
        onChange={(pagi) => {
          setPagination({
            current: pagi.current,
            pageSize: pagi.pageSize,
          });
        }}
        scroll={{ x: "max-content" }}
      />
    </div>
  );
};

export default PathologyTestReportsList;
