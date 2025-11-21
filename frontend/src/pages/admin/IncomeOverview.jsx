import { useEffect, useState } from "react";
import {
  Table,
  Input,
  Row,
  Col,
  DatePicker,
  Select,
  Spin,
  Card,
  Button,
} from "antd";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { getIncomeOverviewApi } from "../../services/apis";
import { useNavigate } from "react-router-dom";
import useDebounce from "../../hooks/useDebounce";
import { FaFileExcel } from "react-icons/fa";
import { exportToExcel } from "../../utils/exportToExcel";
import { useSelector } from "react-redux";

const IncomeOverview = ({ incomeSource }) => {
  const user = useSelector((state) => state?.user);
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [filterMode, setFilterMode] = useState("date");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [total, setTotal] = useState(0);
  const debouncedSearchText = useDebounce(searchText, 500);

  useEffect(() => {
    if (debouncedSearchText && debouncedSearchText.length < 2) return;
    const fetchIncomeOverview = async () => {
      try {
        setLoading(true);
        const response = await getIncomeOverviewApi({
          incomeSource,
          filterMode,
          selectedDate: selectedDate.format("YYYY-MM-DD"),
          search: debouncedSearchText,
          page: pagination.current,
          limit: pagination.pageSize,
        });

        if (response?.success) {
          setData(response.data || []);
          setTotal(response.total || 0);
        } else {
          toast.error(response?.message || "Failed to load data");
        }
      } catch (error) {
        toast.error(error?.message || "Failed to fetch income overview");
      } finally {
        setLoading(false);
      }
    };

    fetchIncomeOverview();
  }, [
    incomeSource,
    selectedDate,
    filterMode,
    debouncedSearchText,
    pagination.current,
    pagination.pageSize,
  ]);

  const handleExcelExport = () => {
    if (data.length > 0) {
      const cleanData = data.map((Patient) => ({
        "Patient Id": Patient?.patientId,
        "Full Name": Patient?.fullName,
        "Total Charge": Patient?.totalCharge,
        Discount: Patient?.discount,
        Tax: Patient?.tax,
        "Paid Amount": Patient?.paidAmount,
      }));
      exportToExcel(cleanData, `${incomeSource}_Income.xlsx`);
    } else {
      toast("No data to export");
    }
  };

  const columns = [
    {
      title: "Patient ID",
      dataIndex: "patientId",
      key: "patientId",
      render: (text) => (
        <span
          onClick={() => navigate(`/patient/profile/${text}`)}
          className="text-blue-400 hover:text-blue-500 cursor-pointer"
        >
          {text}
        </span>
      ),
    },
    { title: "Full Name", dataIndex: "fullName", key: "fullName" },
    user?.role === "admin" && {
      title: "Total Charge",
      dataIndex: "totalCharge",
      key: "totalCharge",
    },
    user?.role === "admin" && {
      title: "Discount",
      dataIndex: "discount",
      key: "discount",
    },
    user?.role === "admin" && {
      title: "Tax",
      dataIndex: "tax",
      key: "tax",
    },
    {
      title: "Paid Amount",
      dataIndex: "paidAmount",
      key: "paidAmount",
      render: (text) => (
        <span className="text-green-600 font-semibold">{text}</span>
      ),
    },
  ].filter(Boolean);

  return (
    <>
      <Row justify="end" className="mb-2">
        <Button icon={<FaFileExcel />} onClick={handleExcelExport}>
          Export
        </Button>
      </Row>
      <Card
        title={
          <Row gutter={[12, 12]} align="middle" className="py-2">
            <Col flex="auto">
              <span className="font-semibold text-lg">
                {incomeSource} Income Overview
              </span>
            </Col>
            <Col>
              <Select
                value={filterMode}
                onChange={(val) => setFilterMode(val)}
                options={[
                  { label: "Date", value: "date" },
                  { label: "All", value: "all" },
                ]}
                className="min-w-[90px]"
              />
            </Col>
            {filterMode === "date" && (
              <Col>
                <DatePicker
                  value={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  allowClear={false}
                  format="DD/MM/YYYY"
                />
              </Col>
            )}
            <Col>
              <Input.Search
                allowClear
                placeholder="Search by name or ID"
                onSearch={(val) => {
                  setSearchText(val);
                  setPagination((prev) => ({ ...prev, current: 1 }));
                }}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setPagination((prev) => ({ ...prev, current: 1 }));
                }}
                value={searchText}
              />
            </Col>
          </Row>
        }
        variant="borderless"
      >
        {loading ? (
          <div className="flex justify-center p-8">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={data.map((p, i) => ({ ...p, key: i }))}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: total,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              onChange: (page, pageSize) => {
                setPagination({ current: page, pageSize });
              },
            }}
            scroll={{ x: 900 }}
          />
        )}
      </Card>
    </>
  );
};

export default IncomeOverview;
