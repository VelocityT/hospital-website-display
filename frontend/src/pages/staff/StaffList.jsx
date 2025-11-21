import { useEffect, useState } from "react";
import { getAllStaffApi } from "../../services/apis";
import {
  Row,
  Col,
  Input,
  Tag,
  Spin,
  Empty,
  Select,
  Pagination,
  Button,
} from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import useDebounce from "../../hooks/useDebounce";
import { FaFileExcel } from "react-icons/fa";
import { exportToExcel } from "../../utils/exportToExcel";
import toast from "react-hot-toast";

const dummyImg =
  "https://static.vecteezy.com/system/resources/previews/023/876/301/non_2x/smiling-anime-boy-logo-vector.jpg";

const StaffList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const initialRole = location?.state?.role || "all";
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [selectedGender, setSelectedGender] = useState("All");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const [total, setTotal] = useState(0);
  const debouncedSearchText = useDebounce(searchText, 500);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  useEffect(() => {
    if (location?.state?.role) {
      setSelectedRole(location.state.role);
      setPagination({ current: 1, pageSize: pagination.pageSize });
    } else {
      setSelectedRole("all");
      setPagination({ current: 1, pageSize: pagination.pageSize });
    }
  }, [location?.state?.role]);

  useEffect(() => {
    if (debouncedSearchText && debouncedSearchText.length < 2) return;
    const getStaffList = async () => {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
      };
      if (selectedRole !== "all") {
        params.role = selectedRole;
      }
      if (selectedGender !== "All") {
        params.gender = selectedGender;
      }

      params.search = debouncedSearchText;

      const response = await getAllStaffApi(params);
      const data = response?.data || [];
      setStaffs(data);
      setTotal(response?.total || 0);
      setLoading(false);
    };
    getStaffList();
  }, [
    debouncedSearchText,
    selectedRole,
    selectedGender,
    pagination.current,
    pagination.pageSize,
  ]);

  const handleExcelExport = () => {
    if (staffs.length > 0) {
      const cleanData = staffs.map((staff) => ({
        "Full Name": staff?.fullName,
        "Staff ID": staff?.staffId,
        Role: staff?.role,
        Department: staff?.department,
        Gender: staff?.gender,
      }));
      exportToExcel(cleanData, "Staff_List.xlsx");
    } else {
      toast.apply("No data to export");
    }
  };

  const roleOptions = [
    { label: "All", value: "all" },
    { label: "Admin", value: "admin" },
    { label: "Doctor", value: "doctor" },
    { label: "Receptionist", value: "receptionist" },
    { label: "Pharmacist", value: "pharmacist" },
    { label: "Nurse", value: "nurse" },
  ];

  return (
    <div className="overflow-hidden min-h-screen">
      <div className="flex justify-end mb-4 gap-2 ">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow"
          onClick={() => navigate("/staff/registration")}
          type="button"
        >
          + Add New Staff
        </button>
        <Button icon={<FaFileExcel />} onClick={handleExcelExport}>
          Export
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 w-full">
        <h2 className="font-bold text-lg text-gray-900 dark:text-white">
          Staff Management
        </h2>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Select
            value={selectedGender}
            onChange={(val) => {
              setSelectedGender(val);
              setPagination((prev) => ({ ...prev, current: 1 }));
            }}
            options={[
              { label: "All", value: "All" },
              { label: "Male", value: "Male" },
              { label: "Female", value: "Female" },
              { label: "Other", value: "Other" },
            ]}
            placeholder="Select gender"
            style={{ width: "100%", maxWidth: 140 }}
            className="dark:bg-neutral-800 dark:text-white dark:border-none w-full sm:w-[140px]"
          />
          <Select
            value={selectedRole}
            onChange={(val) => {
              setSelectedRole(val);
              setPagination((prev) => ({ ...prev, current: 1 }));
            }}
            options={roleOptions}
            style={{ width: "100%", maxWidth: 140 }}
            className="dark:bg-neutral-800 dark:text-white dark:border-none w-full sm:w-[140px]"
          />

          <Input.Search
            allowClear
            placeholder="Search by Staff ID or Name"
            onSearch={(val) => {
              setSearchText(val);
              setPagination((prev) => ({ ...prev, current: 1 }));
            }}
            onChange={(e) => {
              setSearchText(e.target.value);
              setPagination((prev) => ({ ...prev, current: 1 }));
            }}
            value={searchText}
            style={{ width: "100%", maxWidth: 250 }}
            className="dark:bg-neutral-800 dark:text-white dark:border-none w-full sm:w-[250px]"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Spin size="large" />
        </div>
      ) : staffs.length === 0 ? (
        <Empty description="No staff found" />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {staffs.map((staff) => (
              <Col
                key={staff.staffId}
                xs={24}
                sm={12}
                md={8}
                lg={6}
                xl={6}
                xxl={4}
                className="flex"
              >
                <div
                  className="flex flex-col justify-between h-full w-full rounded-xl shadow-md dark:shadow-black hover:shadow-lg dark:hover:shadow-gray-900 transition-all duration-200 p-4 bg-white dark:bg-gray-900 cursor-pointer"
                  onClick={() =>
                    navigate("/staff/profile/" + staff?.staffId, {
                      state: { _id: staff._id },
                    })
                  }
                >
                  <div className="flex items-center gap-4 mb-3">
                    <img
                      alt={staff.fullName}
                      src={dummyImg}
                      className="w-16 h-16 rounded-full object-cover border dark:border-gray-600"
                    />
                    <div className="flex-1 overflow-hidden">
                      <div className="font-semibold text-base text-gray-800 dark:text-white truncate">
                        {staff.fullName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-300 truncate">
                        ID: {staff.staffId}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-sm">
                    <div className="flex gap-1 flex-wrap">
                      <Tag color="blue" className="truncate max-w-[90%]">
                        {staff.role}
                      </Tag>
                      <Tag color="green" className="truncate max-w-[90%]">
                        {staff.department}
                      </Tag>
                    </div>
                    <div className="text-gray-600 dark:text-gray-300 truncate">
                      Gender: {staff.gender}
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
          <div className="flex justify-end mt-4">
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={total}
              showSizeChanger
              pageSizeOptions={["10", "20", "50", "100"]}
              onChange={(page, pageSize) => {
                setPagination({ current: page, pageSize });
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default StaffList;
