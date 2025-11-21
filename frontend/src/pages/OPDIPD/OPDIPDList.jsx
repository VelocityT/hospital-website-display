import { useEffect, useState } from "react";
import {
  Table,
  Card,
  Tag,
  Button,
  Input,
  Row,
  Col,
  Drawer,
  Form,
  DatePicker,
  Spin,
  Select,
} from "antd";
import {
  EyeOutlined,
  EditOutlined,
  RetweetOutlined,
  MedicineBoxOutlined,
} from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import {
  getOpdPatientsApi,
  getIpdPatientsApi,
  switchToIpdApi,
  getPatientDetailsIpdOpdApi,
  dischargePatientApi,
} from "../../services/apis";
import dayjs from "dayjs";
import PatientDetailsPreview from "../components/PatientDetailsPreview";
import IPDForm from "../components/formComponents/IPDForm";
import { formatDateTime, generateUniqueNumber } from "../../utils/helper";
import { beds, bedTypes } from "../../utils/localStorage";
import toast from "react-hot-toast";
import DischargeModal from "../components/OPDIPD/IPDDischarge";
import SymptomsForm from "../components/formComponents/SymptopmsForm";
import { useSelector } from "react-redux";
import useDebounce from "../../hooks/useDebounce";
import { exportToExcel } from "../../utils/exportToExcel";
import { FaFileExcel } from "react-icons/fa";

function OPDIPDList({ type }) {
  const user = useSelector((state) => state?.user);
  const [filterMode, setFilterMode] = useState("date");
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 500);
  const [viewDrawer, setViewDrawer] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [ipdModalOpen, setIpdModalOpen] = useState(false);
  const [ipdPatient, setIpdPatient] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [dischargeModalVisible, setDischargeModalVisible] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [symptomType, setSymptomType] = useState([]);
  const [symptomDescription, setSymptomDescription] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const handleDischargeClick = (record) => {
    if (record.status === "Admitted") {
      setSelectedPatient(record);
      setDischargeModalVisible(true);
    }
  };

  const updateStatusToDischarged = (list) =>
    list.map((p) =>
      p._id === selectedPatient._id ? { ...p, status: "Discharged" } : p
    );

  const handleDischargeSuccess = async (payload) => {
    try {
      const response = await dischargePatientApi(payload);
      if (response.success) {
        toast.success(
          `Patient "${selectedPatient?.patient?.fullName}" discharged successfully!`
        );
        setDischargeModalVisible(false);
        setSelectedPatient(null);

        setData(updateStatusToDischarged(data));
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error(error?.message || "Failed to discharge patient");
    }
  };

  useEffect(() => {
    setFilterMode("date");
    setSelectedDate(dayjs());
    setSearchText("");
    setPage(1);
  }, [type]);

  useEffect(() => {
    setPage(1);
  }, [filterMode, selectedDate, debouncedSearch, type]);

  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length >= 2) {
      fetchAndStoreAllPatients();
    }
  }, [filterMode, selectedDate, page, pageSize, debouncedSearch]);

  const fetchAndStoreAllPatients = async () => {
    setLoading(true);
    let response;
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

    if (type === "ipd") {
      response = await getIpdPatientsApi(params);
    } else {
      response = await getOpdPatientsApi(params);
    }

    const all =
      response?.data?.map((p, i) => ({ ...p, key: p._id || i })) || [];
    setTotal(response?.total || 0);
    setData(all);
    setLoading(false);
  };

  const handleView = async (record) => {
    const response = await getPatientDetailsIpdOpdApi(record?._id, {
      isIpdPatient: record?.ipdNumber ? true : false,
      isOpdPatient: record?.opdNumber ? true : false,
    });
    setSelectedPatient(response.data);
    setViewDrawer(true);
  };

  const handleEdit = (record) => {
    if (record.ipdNumber) return navigate(`/ipd/edit/${record?._id}`);
    else if (record.opdNumber) return navigate(`/opd/edit/${record?._id}`);
  };

  const handleSwitchType = (record) => {
    setIpdPatient(record);
    setIpdModalOpen(true);
    form.resetFields();
    form.setFieldsValue({ ipdNumber: generateUniqueNumber("IPD") });
  };

  const handleIpdSwitch = async () => {
    try {
      const checkValues = await form.validateFields();
      const { admissionDateTime, symptomType, ...values } = checkValues;

      const payload = {
        ...values,
        symptoms: {
          symptomNames: selectedSymptoms,
          symptomType: symptomType,
          description: symptomDescription,
        },
      };
      const response = await switchToIpdApi(ipdPatient.patient?._id, payload);

      if (response.success) {
        toast.success(
          `Patient "${ipdPatient?.patient?.fullName}" switched to IPD successfully!`
        );
        setIpdModalOpen(false);
        setIpdPatient(null);
      } else {
        toast.error(response.message || "Failed to switch to IPD");
      }
    } catch (error) {
      if (error?.errorFields) {
        toast.error("Please fill all required fields correctly.");
      } else {
        toast.error(error?.message || "Failed to switch to IPD");
      }
    }
  };

  const handleAddPrescription = (record) => {
    const newRecord =
      type === "opd"
        ? { ...record, patientType: type }
        : { ...record, doctor: record?.attendingDoctor, patientType: type };

    navigate("/addPrescription", { state: newRecord });
  };

  const handleExcelExport = () => {
    if (!data || data.length === 0) {
      toast.error("No data to export");
      return;
    }

    const cleanData = data.map((record) => {
      const baseData = {
        [type === "ipd" ? "Admission Date & Time" : "Visit Date & Time"]:
          formatDateTime(
            type === "ipd" ? record?.admissionDate : record?.visitDateTime
          ),
        [type === "ipd" ? "IPD Number" : "OPD Number"]:
          type === "ipd" ? record?.ipdNumber : record?.opdNumber,
        Name: record?.patient?.fullName || "-",
        Phone: record?.patient?.contact?.phone || "-",
        Doctor:
          type === "ipd"
            ? record?.attendingDoctor?.fullName
            : record?.doctor?.fullName,
      };

      if (type === "ipd") {
        baseData.Status = record?.status;
      }

      return baseData;
    });

    exportToExcel(cleanData, `${type.toUpperCase()}_Patients_List.xlsx`);
  };

  const columns = [
    {
      title: "S. No.",
      dataIndex: "serial",
      key: "serial",
      render: (text, record, index) => (page - 1) * pageSize + index + 1,
    },
    {
      title: type === "ipd" ? "Admission Date & Time" : "Visit Date & Time",
      key: "admitDateTime",
      render: (_, record) => {
        const rawDate =
          type === "ipd" ? record.admissionDate : record.visitDateTime;
        return rawDate ? formatDateTime(rawDate) : "-";
      },
      sorter: (a, b) => {
        const aDate = new Date(
          type === "ipd" ? a.admissionDate : a.visitDateTime
        );
        const bDate = new Date(
          type === "ipd" ? b.admissionDate : b.visitDateTime
        );
        return aDate - bDate;
      },
    },
    {
      title: type === "ipd" ? "IPD Number" : "OPD Number",
      key: "number",
      render: (_, record) => {
        const id = type === "ipd" ? record.ipdNumber : record.opdNumber;
        const path = type === "ipd" ? `/ipd/${id}` : `/opd/${id}`;
        return id ? (
          <Link
            to={path}
            state={{ _id: record?._id }}
            className="text-blue-600"
          >
            {id}
          </Link>
        ) : (
          "-"
        );
      },
    },
    {
      title: "Name",
      key: "fullName",
      render: (_, record) => record?.patient?.fullName || "-",
      sorter: (a, b) =>
        (a?.patient?.fullName || "").localeCompare(b?.patient?.fullName || ""),
    },
    {
      title: "Gender",
      dataIndex: ["patient", "gender"],
      key: "gender",
      filters: [
        { text: "Male", value: "Male" },
        { text: "Female", value: "Female" },
        { text: "Other", value: "Other" },
      ],
      onFilter: (value, record) => record?.patient?.gender === value,
    },
    {
      title: "Phone",
      dataIndex: ["patient", "contact", "phone"],
      key: "phone",
      render: (_, record) => record?.patient?.contact?.phone || "-",
      sorter: (a, b) =>
        (a?.patient?.contact?.phone || "").localeCompare(
          b?.patient?.contact?.phone || ""
        ),
    },
    {
      title: "Doctor",
      key: "doctor",
      render: (_, record) =>
        type === "ipd"
          ? record?.attendingDoctor?.fullName
          : record?.doctor?.fullName,
    },
    {
      title: "Blood Group",
      dataIndex: ["patient", "bloodGroup"],
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
      onFilter: (value, record) => record?.patient?.bloodGroup === value,
    },
    ...(type === "ipd"
      ? [
          {
            title: "Status",
            key: "status",
            sorter: (a, b) => {
              if (a.status === b.status) return 0;
              return a.status === "Admitted" ? -1 : 1;
            },
            defaultSortOrder: "ascend",
            render: (_, record) => {
              const isAdmitted = record.status === "Admitted";

              return isAdmitted ? (
                <Tag
                  color="green"
                  onClick={() =>
                    ["admin", "receptionist"].includes(user?.role) &&
                    handleDischargeClick(record)
                  }
                  className={
                    ["admin", "receptionist"].includes(user?.role) &&
                    "cursor-pointer hover:scale-110"
                  }
                >
                  {record.status}
                </Tag>
              ) : (
                <Tag color="red" className="cursor-not-allowed">
                  {record.status}
                </Tag>
              );
            },
          },
        ]
      : []),

    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Row gutter={[8, 8]}>
          <Col>
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
              title="View"
            />
          </Col>
          {["admin", "receptionist"].includes(user?.role) && (
            <>
              {type !== "ipd" && (
                <Col>
                  <Button
                    size="small"
                    type="dashed"
                    icon={<RetweetOutlined />}
                    onClick={() => handleSwitchType(record)}
                    title="Switch to IPD"
                  />
                </Col>
              )}
              {record.status !== "Discharged" && (
                <>
                  <Col>
                    <Button
                      size="small"
                      type="primary"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(record)}
                      title="Edit"
                    />
                  </Col>
                </>
              )}
            </>
          )}
          {["admin", "doctor"].includes(user?.role) &&
            record?.status !== "Discharged" && (
              <Col>
                <Button
                  size="small"
                  type="default"
                  icon={<MedicineBoxOutlined />}
                  onClick={() => handleAddPrescription(record)}
                  title="Add Prescription"
                />
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
            <Col>
              <span style={{ fontWeight: 600, fontSize: 18 }}>
                {type === "ipd" ? "IPD Patient List" : "OPD Patient List"}
              </span>
            </Col>
            <Col>
              <Row gutter={[8, 8]}>
                <Col>
                  <Select
                    value={filterMode}
                    onChange={(val) => setFilterMode(val)}
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
                    onChange={setSelectedDate}
                    allowClear={false}
                    format="DD/MM/YYYY"
                    disabled={filterMode === "all"}
                  />
                </Col>
                <Col>
                  <Input.Search
                    allowClear
                    placeholder={`name, ${type} id or phone`}
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
          <>
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

            <PatientDetailsPreview
              open={viewDrawer}
              onClose={() => setViewDrawer(false)}
              patient={selectedPatient}
              type={type}
            />

            <Drawer
              title="Switch to IPD"
              open={ipdModalOpen}
              onClose={() => setIpdModalOpen(false)}
              width={600}
              destroyOnHidden
              footer={
                <Row justify="end" gutter={8}>
                  <Col>
                    <Button onClick={() => setIpdModalOpen(false)}>
                      Cancel
                    </Button>
                  </Col>
                  <Col>
                    <Button type="primary" onClick={handleIpdSwitch}>
                      Switch
                    </Button>
                  </Col>
                </Row>
              }
            >
              <Form form={form} layout="vertical">
                <IPDForm form={form} bedTypes={bedTypes} beds={beds} />
                <SymptomsForm
                  form={form}
                  selectedSymptoms={selectedSymptoms}
                  setSelectedSymptoms={setSelectedSymptoms}
                  symptomType={symptomType}
                  setSymptomType={setSymptomType}
                  symptomDescription={symptomDescription}
                  setSymptomDescription={setSymptomDescription}
                />
              </Form>
            </Drawer>
          </>
        )}
      </Card>

      <DischargeModal
        visible={dischargeModalVisible}
        onClose={() => {
          setDischargeModalVisible(false);
          setSelectedPatient(null);
        }}
        onSuccess={handleDischargeSuccess}
        ipdPatient={selectedPatient}
      />
    </>
  );
}

export default OPDIPDList;
