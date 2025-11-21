import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getHospitalByIdApi, impersonateUserApi } from "../services/apis";
import toast from "react-hot-toast";
import { Card, Spin, Table, Tabs, Tag, Tooltip } from "antd";
import { PiDetectiveFill } from "react-icons/pi";
import { setUser } from "../redux/userSlice";
import { useDispatch } from "react-redux";
import { setHospital } from "../redux/hospitalSlice";

const { TabPane } = Tabs;

const Hospital = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const [hospitalData, setHospitalData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHospital = async () => {
      setLoading(true);
      try {
        const res = await getHospitalByIdApi(id);
        if (res.success) {
          setHospitalData(res.hospital);
        } else {
          toast.error(res.message || "Failed to fetch hospital");
        }
      } catch (err) {
        toast.error(err.message || "Error fetching hospital");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchHospital();
  }, [id]);

  const handleImpersonate = async (userId) => {
    const res = await impersonateUserApi(userId);
    if (res.success) {
      const {token} = res
      sessionStorage.setItem("token",token)
      dispatch(
        setUser({
          ...res.user.targetUser,
          impersonatedBy: res.user.impersonatedBy,
        })
      );
      dispatch(setHospital(res?.hospital));

      toast.success("Impersonation successful");
      navigate("/dashboard");
    } else {
      toast.error(res.message);
    }
  };

  const adminColumns = [
    {
      title: "Staff ID",
      dataIndex: "staffId",
      key: "staffId",
      render: (text, record) => (
        <span
          className="text-blue-600 font-medium cursor-pointer"
          onClick={() =>
            navigate("/staff/profile/" + record.staffId, {
              state: { _id: record._id },
            })
          }
        >
          {text}
        </span>
      ),
    },
    {
      title: "Name",
      dataIndex: "fullName",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Tooltip title="Impersonate">
          <PiDetectiveFill
            className="text-green-600 cursor-pointer text-xl hover:scale-110 transition-transform"
            onClick={() => handleImpersonate(record._id)}
          />
        </Tooltip>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Spin size="large" />
      </div>
    );
  }

  if (!hospitalData) {
    return <div className="text-center mt-6">No hospital found.</div>;
  }

  return (
    <div className="mx-auto space-y-6">
      <Card title="Hospital Overview">
        <p>
          <strong>Name:</strong> {hospitalData.fullName}
        </p>
        <p>
          <strong>Phone:</strong> {hospitalData.phone}
        </p>
        <p>
          <strong>Email:</strong> {hospitalData.email}
        </p>
        <p>
          <strong>Website:</strong> {hospitalData.website}
        </p>
        <p>
          <strong>Address:</strong> {hospitalData.address}
        </p>
<p>
  <strong>Staff Prefix:</strong>{" "}
  <Tag color="blue">{hospitalData.staffPrefix}</Tag>
  <strong className="ml-6">Patient Prefix:</strong>{" "}
  <Tag color="green">{hospitalData.patientPrefix}</Tag>
</p>

      </Card>

      <Tabs defaultActiveKey="1">
        <TabPane tab="Admins" key="1">
          <Table
            columns={adminColumns}
            dataSource={hospitalData.admins.map((admin, index) => ({
              ...admin,
              key: admin._id || index,
            }))}
            pagination={false}
            bordered
          />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Hospital;
