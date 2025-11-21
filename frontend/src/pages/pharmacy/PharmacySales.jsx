import { useEffect, useState } from "react";
import { Button, Card, Col, Input, Row, Select, Table, DatePicker } from "antd";
import dayjs from "dayjs";
import useDebounce from "../../hooks/useDebounce";
import { getPharmacySales } from "../../services/apis";
import { AiOutlineDownload } from "react-icons/ai";
import { exportToExcel } from "../../utils/exportToExcel";

const { Search } = Input;

const PharmacySales = () => {
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

      const res = await getPharmacySales(params);
      setData(res?.data || []);
      setPagination((prev) => ({
        ...prev,
        total: res?.total || 0,
      }));
    } catch (error) {
      // console.error("Failed to fetch pharmacy sales", error);
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
      "Medicine Name": d?.name || "-",
      "Sell Price (₹)": d?.sellPrice || 0,
      "Purchase Price (₹)": d?.purchasePrice || 0,
      "Total Quantity Sold": d?.totalQuantitySold || 0,
      "Total Revenue (₹)": d?.totalRevenue || 0,
      "Profit (₹)": d?.profit || 0,
    }));

    exportToExcel(exportData, "Pharmacy_Sales_Report.xlsx");
  };

  const columns = [
    {
      title: "S. No.",
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "Medicine Name",
      dataIndex: "name",
    },
    {
      title: "Sell Price (₹)",
      dataIndex: "sellPrice",
    },
    {
      title: "Purchase Price (₹)",
      dataIndex: "purchasePrice",
    },
    {
      title: "Quantity Sold",
      dataIndex: "totalQuantitySold",
    },
    {
      title: "Revenue (₹)",
      dataIndex: "totalRevenue",
      render: (value) => value?.toFixed(2),
    },
    {
      title: "Profit (₹)",
      dataIndex: "profit",
      render: (value) => value?.toFixed(2),
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
          <Row gutter={[8, 10]} align="middle" justify="space-between" className="py-2">
            <Col flex="auto">
              <span style={{ fontWeight: 600, fontSize: 18 }}>
                Pharmacy Sales Report
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
                placeholder="Search by medicine name"
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

export default PharmacySales;
