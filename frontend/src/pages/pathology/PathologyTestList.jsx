import { useEffect, useState } from "react";
import { Table, Button, Tag, Space, Typography, Input } from "antd";
import { getAllPathologyTestsApi } from "../../services/apis";
import { useNavigate } from "react-router-dom";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import { FaFileExcel } from "react-icons/fa";
import useDebounce from "../../hooks/useDebounce";
import { exportToExcel } from "../../utils/exportToExcel";
import toast from "react-hot-toast";

const { Title } = Typography;

const PathologyTestList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const [total, setTotal] = useState(0);
  const debouncedSearchText = useDebounce(searchTerm, 500);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    const res = await getAllPathologyTestsApi({
      search: debouncedSearchText,
      page: pagination.current,
      limit: pagination.pageSize,
    });
    if (res && res.success !== false && Array.isArray(res.data)) {
      setData(res.data);
      setTotal(res.total || 0);
    } else {
      setData([]);
      setTotal(0);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!debouncedSearchText || debouncedSearchText.length >= 2) {
      fetchData();
    }
  }, [debouncedSearchText, pagination.current, pagination.pageSize]);

  const handleExcelExport = () => {
    if (data.length>0) {
      const cleanData = data.map((test) => ({
        "Test Name": test?.testName,
        "Test Code": test?.testCode,
        Category: test?.category,
        Charge: test?.charge,
        Status: test?.isActive ? "Active" : "Inactive",
      }));
      exportToExcel(cleanData, "Pathology_tests_list.xlsx");
    } else {
      toast.apply("No data to export");
    }
  };

  const columns = [
    {
      title: "Test Name",
      dataIndex: "testName",
      key: "testName",
      render: (text) => <b>{text}</b>,
    },
    {
      title: "Test Code",
      dataIndex: "testCode",
      key: "testCode",
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (cat) => <Tag color="blue">{cat}</Tag>,
    },
    {
      title: "Charge",
      dataIndex: "charge",
      key: "charge",
      render: (charge) => `₹${charge}`,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (active) =>
        active ? (
          <Tag color="green">Active</Tag>
        ) : (
          <Tag color="red">Inactive</Tag>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() =>
              navigate(`/pathology/edit-test/${record._id}`, { state: record })
            }
            size="small"
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-end gap-2 mb-3 overflow-hidden">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/pathology/create-test")}
        >
          Add Test
        </Button>
        <Button
          icon={<FaFileExcel />}
          onClick={handleExcelExport}
        >
          Export
        </Button>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4">
        <Title level={4} style={{ margin: 0 }}>
          Pathology Tests
        </Title>
        <Input.Search
          placeholder="test name or test code"
          allowClear
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPagination((prev) => ({ ...prev, current: 1 }));
          }}
          className="w-full sm:w-72"
        />
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="_id"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: total,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
        }}
        onChange={(paginationObj) => {
          setPagination({
            current: paginationObj.current,
            pageSize: paginationObj.pageSize,
          });
        }}
        scroll={{ x: "max-content" }}
      />
    </div>
  );
};

export default PathologyTestList;
