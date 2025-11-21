import { useEffect, useState } from "react";
import {
  Table,
  Card,
  Button,
  Drawer,
  Descriptions,
  Row,
  Col,
  Input,
  Spin,
  Select,
} from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { getStaffByIdApi, getUsersApi } from "../../services/apis";
import toast from "react-hot-toast";
import useDebounce from "../../hooks/useDebounce";
import { formatDate } from "../../utils/helper";
import { useSelector } from "react-redux";
import { Option } from "antd/es/mentions";

const roles = [
  "all",
  "admin",
  "doctor",
  "nurse",
  "receptionist",
  "pharmacist",
  "superAdmin",
  "pathologist",
];
const StaffListForPayment = () => {
  const user = useSelector((state) => state.user);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewDrawer, setViewDrawer] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const [total, setTotal] = useState(0);
  const [selectedRole, setSelectedRole] = useState(roles.length > 0 ? roles[0] : null);
  const debouncedSearchText = useDebounce(searchText, 500);
  const navigate = useNavigate();
  const location = useLocation();

  const columnsBase = [
    {
      title: "Name",
      dataIndex: "fullName",
      key: "fullName",
      sorter: (a, b) => a.fullName.localeCompare(b.fullName),
      render: (text, record) => (
        <p
          onClick={() => {
            navigate(`/staff/payments/${record.staffId}`, {
              state: { _id: record._id },
            });
          }}
          className="text-blue-600 cursor-pointer hover:underline mb-0"
        >
          {text}
        </p>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
    },
    {
      title: "Gender",
      dataIndex: "gender",
      key: "gender",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
  ];

  useEffect(() => {
    if (debouncedSearchText && debouncedSearchText.length < 2) return;
    const getStaffList = async () => {
      setLoading(true);
      try {
        const params = {
          page: pagination.current,
          limit: pagination.pageSize,
        };
        if (selectedRole !== "all") {
          params.userType = selectedRole;
        }

        params.search = debouncedSearchText;

        const response = await getUsersApi(params);
        const list =
          response?.data?.map((d, idx) => ({ ...d, key: idx })) || [];
        setData(list);
        setTotal(response?.total || 0);
      } catch (error) {
        toast.error(error?.message || "Error fetching doctors list");
      } finally {
        setLoading(false);
      }
    };
    getStaffList();
  }, [
    debouncedSearchText,
    pagination.current,
    pagination.pageSize,
    location,
    selectedRole,
  ]);
  const handleView = (record) => {
    getStaffByIdApi(record?._id)
      .then((response) => {
        if (response?.success) {
          setSelectedDoctor(response.data?.user);
          setViewDrawer(true);
        } else {
          toast.error(response?.message || "Failed to fetch staff details");
        }
      })
      .catch(() =>
        toast.error("An error occurred while fetching staff details")
      );
  };

  const columns = [
    {
      title: "S. No.",
      dataIndex: "serial",
      key: "serial",
      render: (text, record, index) =>
        (pagination?.current - 1) * pagination.pageSize + index + 1,
    },
    ...columnsBase,
  ];

  return (
    <>
      <Card
        title={
          <Row gutter={[8, 8]} className="mb-2 md:mb-0">
            <Col flex="auto">
              <span style={{ fontWeight: 600, fontSize: 18 }}>Staff List</span>
            </Col>
            <Row gutter={[8, 8]} className="mb-0 pl-2 md:pr-2">
              <Col>
                <Select
                  style={{ width: 140 }}
                  placeholder="Select Role"
                  value={selectedRole}
                  onChange={(value) => {
                    setSelectedRole(value);
                    setPagination((prev) => ({ ...prev, current: 1 }));
                  }}
                  allowClear
                >
                  {roles.map((role) => (
                    <Option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col>
                <Input.Search
                  allowClear
                  placeholder="Search by name, email or phone"
                  onSearch={setSearchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    setPagination((prev) => ({ ...prev, current: 1 }));
                  }}
                  value={searchText}
                  style={{ marginLeft: 0 }}
                />
              </Col>
            </Row>
          </Row>
        }
        variant="borderless"
      >
        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={data}
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
            scroll={{ x: 900 }}
            responsive
          />
        )}

        <Drawer
          title="Doctor Details"
          open={viewDrawer}
          onClose={() => setViewDrawer(false)}
          width={500}
        >
          {selectedDoctor && (
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Staff ID">
                {selectedDoctor.staffId}
              </Descriptions.Item>
              <Descriptions.Item label="Full Name">
                {selectedDoctor.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Gender">
                {selectedDoctor.gender}
              </Descriptions.Item>
              <Descriptions.Item label="DOB">
                {formatDate(selectedDoctor.dob)}
              </Descriptions.Item>
              <Descriptions.Item label="Blood Group">
                {selectedDoctor.bloodGroup || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                {selectedDoctor.department
                  ?.replace(/-/g, " ")
                  ?.replace(/\b\w/g, (c) => c.toUpperCase())}
              </Descriptions.Item>
              <Descriptions.Item label="Designation">
                {selectedDoctor.designation || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Qualification">
                {selectedDoctor.qualification || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Specialist">
                {selectedDoctor.specialist || "-"}
              </Descriptions.Item>

              <Descriptions.Item label="OPD Charge">
                ₹{selectedDoctor.opdCharge}
              </Descriptions.Item>

              <Descriptions.Item label="IPD Charge">
                ₹{selectedDoctor.ipdCharge}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedDoctor.email || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {selectedDoctor.phone}
              </Descriptions.Item>
              <Descriptions.Item label="Current Address">
                {selectedDoctor.currentAddress || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Permanent Address">
                {selectedDoctor.permanentAddress || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Father's Name">
                {selectedDoctor.fatherName || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Mother's Name">
                {selectedDoctor.motherName || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Marital Status">
                {selectedDoctor.maritalStatus || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Date of Joining">
                {selectedDoctor.dateOfJoining}
              </Descriptions.Item>
              <Descriptions.Item label="Work Experience">
                {selectedDoctor.workExperience || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="PAN Number">
                {selectedDoctor.panNumber || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Aadhar Number">
                {selectedDoctor.aadharNumber || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Reference">
                {selectedDoctor.reference || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Note">
                {selectedDoctor.note || "-"}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Drawer>
      </Card>
    </>
  );
};

export default StaffListForPayment;
