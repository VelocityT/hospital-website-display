import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getHospitalsListApi } from "../../services/apis";
import { toast } from "react-hot-toast";
import { Spin, Table, Input, Button, Tooltip, Card, Row, Col, Tag } from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";

const Hospitals = () => {
  const [hospitalsList, setHospitalsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const getHospitalsList = async () => {
      setLoading(true);
      try {
        const response = await getHospitalsListApi();
        if (response?.success) {
          setHospitalsList(response.hospitals || []);
        } else {
          toast.error(response?.message || "Failed to fetch hospitals");
        }
      } catch (error) {
        toast.error(error.message || "Unable to get Hospitals List");
      } finally {
        setLoading(false);
      }
    };
    getHospitalsList();
  }, []);

  const filteredHospitals = hospitalsList.filter((hospital) =>
    [hospital.fullName, hospital.phone, hospital.email, hospital.website]
      .join(" ")
      .toLowerCase()
      .includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "Name",
      dataIndex: "fullName",
      key: "name",
      render: (text, record) => (
        <p
          className={`cursor-pointer m-0 ${record?.isDeleted ? "text-gray-500" : "text-blue-600"} font-semibold text-lg`}
          onClick={() => navigate(`/hospital/${record._id}`)}
        >
          {text}
        </p>
      ),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Website",
      dataIndex: "website",
      key: "website",
      render: (text) => (
        <a href={`https://${text}`} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      ),
    },
    {
      title: "Status",
      dataIndex: "isDisabled",
      key: "status",
      render: (isDisabled) => (
        <Tag color={isDisabled ? "red" : "green"}>
          {isDisabled ? "Disabled" : "Active"}
        </Tag>
      ),
    },
    {
      title: "Deleted",
      dataIndex: "isDeleted",
      key: "status",
      render: (isDeleted) => (
        <Tag color={isDeleted ? "red" : "green"}>
          {isDeleted ? "Deleted" : "Active"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="flex items-center">
          <Tooltip title="Edit Hospital">
            <EditOutlined
              className="text-blue-600 cursor-pointer text-lg"
              onClick={() =>
                navigate(`/hospitals/edit/${record._id}`, {
                  state: { hospital: record },
                })
              }
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="overflow-hidden">
      <div className="flex justify-end mb-4">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/hospitals/add")}
        >
          New Hospital
        </Button>
      </div>

      <Card>
        <Row
          justify="space-between"
          align="middle"
          className="mb-4 overflow-hidden"
        >
          <Col>
            <h2 className="text-xl font-semibold">Hospitals</h2>
          </Col>
          <Col>
            <Input
              placeholder="Search hospitals..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
        </Row>

        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredHospitals.map((item, idx) => ({
              ...item,
              key: item._id || idx,
            }))}
            pagination={{ pageSize: 5 }}
            bordered
            scroll={{ x: "max-content" }}
          />
        )}
      </Card>
    </div>
  );
};

export default Hospitals;
