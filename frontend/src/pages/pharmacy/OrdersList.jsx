import { useEffect, useState } from "react";
import { Card, Col, DatePicker, Input, Row, Select, Table, Tag } from "antd";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import useDebounce from "../../hooks/useDebounce";
import { getPatientsMedicineOrdersApi } from "../../services/apis";
import { formatDateTime } from "../../utils/helper";

const { Search } = Input;

const OrdersList = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filterMode, setFilterMode] = useState("date");
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const debouncedSearch = useDebounce(search, 600);

  useEffect(() => {
    fetchOrders();
  }, [debouncedSearch, page, pageSize, filterMode, selectedDate]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        search: debouncedSearch,
        page,
        limit: pageSize,
        filterMode,
      };

      if (filterMode === "date" && selectedDate) {
        params.startDate = selectedDate.startOf("day").toISOString();
        params.endDate = selectedDate.endOf("day").toISOString();
      }

      const res = await getPatientsMedicineOrdersApi(params);
      if (res.success) {
        setOrders(res.data);
        setTotal(res.data.total || 0);
      } else {
        toast.error("Failed to fetch orders");
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
    setLoading(false);
  };

  const columns = [
    {
      title: "S. No.",
      render: (_, __, index) => (page - 1) * pageSize + index + 1,
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value) => formatDateTime(value),
    },
    {
      title: "Patient ID",
      dataIndex: ["patient", "patientId"],
      key: "patientId",
    },
    {
      title: "Patient Name",
      dataIndex: ["patient", "fullName"],
      key: "patientName",
    },
    {
      title: "Payable Amount",
      dataIndex: "payableAmount",
      key: "payableAmount",
      render: (value) => `₹${value.toFixed(2)}`,
    },
    {
      title: "Payment Status",
      dataIndex: ["payment", "status"],
      key: "status",
      filters: [
        { text: "Paid", value: "Paid" },
        { text: "Unpaid", value: "Unpaid" },
      ],
      onFilter: (value, record) => record.payment?.status === value,
      render: (status) => (
        <Tag color={status === "Paid" ? "green" : "red"}>{status}</Tag>
      ),
    },
  ];

  return (
    <Card
      title={
        <Row gutter={[8, 10]} align="middle" justify="space-between py-2">
          <Col flex="auto">
            <span style={{ fontWeight: 600, fontSize: 18 }}>Patient List</span>
          </Col>
          <Col>
            <Select
              value={filterMode}
              onChange={setFilterMode}
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
              onChange={(date) => setSelectedDate(date)}
              allowClear={false}
              format="DD/MM/YYYY"
              disabled={filterMode === "all"}
            />
          </Col>
          <Col>
            <Input.Search
              allowClear
              placeholder="name or patient id"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              onSearch={(val) => {
                setSearch(val);
                setPage(1);
              }}
            />
          </Col>
        </Row>
      }
    >
      <Table
        loading={loading}
        dataSource={orders}
        columns={columns}
        rowKey="_id"
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          onChange: (page, pageSize) => {
            setPage(page);
            setPageSize(pageSize);
          },
        }}
        scroll={{ x: 900 }}
        responsive
      />
    </Card>
  );
};

export default OrdersList;
