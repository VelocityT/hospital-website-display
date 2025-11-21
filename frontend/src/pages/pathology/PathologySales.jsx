import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Input,
  Row,
  Select,
  Table,
  Tag,
  DatePicker,
} from "antd";
import dayjs from "dayjs";
import useDebounce from "../../hooks/useDebounce";
import { getPathologySales } from "../../services/apis";
import { AiOutlineDownload } from "react-icons/ai";
import { formatDate } from "../../utils/helper";
import { exportToExcel } from "../../utils/exportToExcel";

const { Search } = Input;

const PathologySales = () => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText, 500);

  const [filterMode, setFilterMode] = useState("date");
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: debouncedSearchText,
        filterMode,
      };

      if (filterMode === "date") {
        params.date = selectedDate.format("YYYY-MM-DD");
      }

      const res = await getPathologySales(params);
      setData(res?.data || []);
      setPagination((prev) => ({
        ...prev,
        total: res?.data?.total || 0,
      }));
    } catch (error) {
      // console.error("Failed to fetch sales data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, [
    debouncedSearchText,
    pagination.current,
    pagination.pageSize,
    filterMode,
    selectedDate,
  ]);

  const handleTableChange = (pag) => {
    setPagination((prev) => ({
      ...prev,
      current: pag.current,
      pageSize: pag.pageSize,
    }));
  };

  const handleExportExcel = () => {
    if (!data?.length) return;

    const exportData = data.map((d, i) => ({
      "S. No.": i + 1,
      "Test Name": d?.testName || "-",
      "Test Code": d?.testCode || "-",
      Category: d?.category || "-",
      "Total Reports": d?.totalReports || 0,
      "Total Payable (₹)": d?.totalPayable || 0,
      "Total Paid (₹)": d?.totalPaid || 0,
    }));

    exportToExcel(exportData, "Pathology_Sales_Report.xlsx");
  };

  const columns = [
    {
      title: "S. No.",
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "Test Name",
      dataIndex: "testName",
    },
    {
      title: "Test Code",
      dataIndex: "testCode",
    },
    {
      title: "Category",
      dataIndex: "category",
    },
    {
      title: "Total Reports",
      dataIndex: "totalReports",
    },
    {
      title: "Payable (₹)",
      dataIndex: "totalPayable",
    },
    {
      title: "Paid (₹)",
      dataIndex: "totalPaid",
    },
  ];

  return (
    <>
      <Row justify="end" className="mb-4">
        <Button
          type="primary"
          icon={<AiOutlineDownload />}
          onClick={handleExportExcel}
        >
          Export Excel
        </Button>
      </Row>
      <Card
        title={
          <Row gutter={[8, 10]} align="middle" justify="space-between py-2">
            <Col flex="auto">
              <span style={{ fontWeight: 600, fontSize: 18 }}>
                Pathology Sales Report
              </span>
            </Col>
            <Col>
              <Select
                value={filterMode}
                onChange={(val) => {
                  setFilterMode(val);
                  setPagination({ ...pagination, current: 1 });
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
                  setPagination({ ...pagination, current: 1 });
                }}
                allowClear={false}
                format="DD/MM/YYYY"
                disabled={filterMode === "all"}
              />
            </Col>
            <Col>
              <Search
                allowClear
                placeholder="Search by test name or code"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setPagination({ ...pagination, current: 1 });
                }}
                onSearch={(val) => {
                  setSearchText(val);
                  setPagination({ ...pagination, current: 1 });
                }}
              />
            </Col>
          </Row>
        }
        variant="borderless"
      >
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          rowKey="_id"
          scroll={{ x: "max-content" }}
        />
      </Card>
    </>
  );
};

export default PathologySales;
