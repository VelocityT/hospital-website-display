import { useEffect, useState } from "react";
import {
  Table,
  Card,
  Button,
  Input,
  Row,
  Col,
  message,
  DatePicker,
  Spin,
  Select,
} from "antd";
import dayjs from "dayjs";
import { Link, useNavigate } from "react-router-dom";
import { getAllPatientsApi, getPatientDetailsApi } from "../../services/apis";
import PatientDetailsPreview from "../components/PatientDetailsPreview";
import { useSelector } from "react-redux";
import { formatDate, formatDateTime } from "../../utils/helper";
import useDebounce from "../../hooks/useDebounce";
import { exportToExcel } from "../../utils/exportToExcel";
import toast from "react-hot-toast";
import { FaFileExcel } from "react-icons/fa";

const columnsBase = [
  {
    title: "Registration Date",
    key: "registrationDate",
    render: (_, record) => formatDateTime(record.registrationDate) || "-",
    sorter: (a, b) =>
      new Date(a.registrationDate) - new Date(b.registrationDate),
  },
  {
    title: "Patient ID",
    key: "patientId",
    render: (_, record) => {
      const id = record.patientId || "-";
      return id ? (
        <Link to={`/patient/profile/${id}`} className="text-blue-600">
          {id}
        </Link>
      ) : (
        "-"
      );
    },
  },
  {
    title: "Name",
    dataIndex: "fullName",
    key: "fullName",
    sorter: (a, b) => a.fullName.localeCompare(b.fullName),
  },
  {
    title: "Gender",
    dataIndex: "gender",
    key: "gender",
    filters: [
      { text: "Male", value: "Male" },
      { text: "Female", value: "Female" },
      { text: "Other", value: "Other" },
    ],
    onFilter: (value, record) => record.gender === value,
  },
  {
    title: "Age",
    key: "age",
    render: (_, record) =>
      `${record.age?.years || "0"}y ${record.age?.months || "0"}m ${
        record.age?.days || "0"
      }d`,
  },
  {
    title: "Phone",
    dataIndex: ["contact", "phone"],
    key: "phone",
    render: (_, record) => record.contact?.phone || "-",
  },
  {
    title: "Blood Group",
    dataIndex: "bloodGroup",
    key: "bloodGroup",
    filters: [
      { text: "A+", value: "A+" },
      { text: "A-", value: "A-" },
      { text: "B+", value: "B+" },
      { text: "B-", value: "B-" },
      { text: "AB+", value: "AB+" },
      { text: "AB-", value: "AB-" },
      { text: "O+", value: "O+" },
      { text: "O-", value: "O-" },
    ],
    onFilter: (value, record) => record.bloodGroup === value,
  },
];

function PatientList() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [filterMode, setFilterMode] = useState("date");
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [loading, setLoading] = useState(true);
  const [viewDrawer, setViewDrawer] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const user = useSelector((state) => state?.user);
  const navigate = useNavigate();
  const debouncedSearch = useDebounce(searchText, 500);

  useEffect(() => {
    setPage(1);
  }, [filterMode, selectedDate, searchText]);

  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length >= 2) {
      fetchPatients();
    }
  }, [filterMode, selectedDate, page, pageSize, debouncedSearch]);

  const fetchPatients = async () => {
    setLoading(true);
    const params = {
      page,
      pageSize,
      filterMode,
    };

    if (filterMode === "date" && selectedDate) {
      params.startDate = selectedDate.startOf("day").toISOString();
      params.endDate = selectedDate.endOf("day").toISOString();
    }

    params.search = debouncedSearch;

    const response = await getAllPatientsApi(params);
    const all = response?.data?.patients || [];
    setTotal(response?.data?.total || 0);

    const formatted = all.map((p, idx) => ({
      ...p,
      key: p._id || idx,
      dob: p.dob ? formatDate(p.dob) : "N/A",
      admitDateRaw: p.admitDate || null,
      admitDate: p.admitDate ? formatDateTime(p.admitDate) : "N/A",
    }));

    setData(formatted);
    setLoading(false);
  };

  const handleView = async (record) => {
    try {
      const response = await getPatientDetailsApi(record._id);
      setViewDrawer(true);
      setSelectedPatient(response.data);
    } catch (error) {
      message.error(error.message);
    }
  };

  const handleEdit = (record) => {
    sessionStorage.setItem("editPatient", JSON.stringify(record));
    navigate(`/registration/edit/${record._id}`);
  };

  const handleExcelExport = () => {
    if (data.length > 0) {
      const cleanData = data.map((Patient) => ({
        "Registration Date": formatDateTime(Patient?.registrationDate),
        "Patient ID": Patient?.patientId,
        "Full Name": Patient?.fullName,
        Gender: Patient?.gender,
        Age: `${Patient?.age?.years || "0"}y ${Patient?.age?.months || "0"}m ${
          Patient?.age?.days || "0"
        }d`,
        Phone: Patient?.contact?.phone,
        "Blood group": Patient?.bloodGroup,
      }));
      exportToExcel(cleanData, "Patients_List.xlsx");
    } else {
      toast("No data to export");
    }
  };

  const columns = [
    {
      title: "S. No.",
      dataIndex: "serial",
      key: "serial",
      render: (text, record, index) => (page - 1) * pageSize + index + 1,
    },
    ...columnsBase,
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Row gutter={[8, 8]}>
          <Col>
            <Button size="small" onClick={() => handleView(record)}>
              View
            </Button>
          </Col>
          {["admin", "doctor", "receptionist"].includes(user?.role) && (
            <Col>
              <Button
                size="small"
                type="primary"
                onClick={() => handleEdit(record)}
              >
                Edit
              </Button>
            </Col>
          )}
        </Row>
      ),
    },
  ];

  return (
    <>
      <Row justify="end" className="mb-2">
        <Button icon={<FaFileExcel />} onClick={handleExcelExport}>
          Export
        </Button>
      </Row>
      <Card
        title={
          <Row gutter={[8, 10]} align="middle" justify="space-between py-2">
            <Col flex="auto">
              <span style={{ fontWeight: 600, fontSize: 18 }}>
                Patient List
              </span>
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
                placeholder="name, patient id or phone"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setPage(1);
                }}
                onSearch={(val) => {
                  setSearchText(val);
                  setPage(1);
                }}
              />
            </Col>
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
              pageSize,
              current: page,
              total,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
            }}
            scroll={{ x: 900 }}
            responsive
          />
        )}

        <PatientDetailsPreview
          open={viewDrawer}
          onClose={() => setViewDrawer(false)}
          patient={selectedPatient}
        />
      </Card>
    </>
  );
}

export default PatientList;
