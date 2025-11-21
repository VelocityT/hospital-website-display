import {
  Row,
  Col,
  Avatar,
  Card,
  Tag,
  Typography,
  Grid,
  Tabs,
  Spin,
  Descriptions,
  Button,
} from "antd";
import {
  UserOutlined,
  EnvironmentOutlined,
  MailOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getStaffByIdApi } from "../../services/apis";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { formatDate, formatDateTime } from "../../utils/helper";
import DoctorIpds from "../Doctor/DoctorIpds";
import DoctorOpds from "../Doctor/DoctorOpds";
import IncomeOverview from "../components/IncomeOverview";
import StaffPaymentTable from "../components/StaffPaymentTable";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const StaffProfile = ({ selfProfile }) => {
  const user = useSelector((state) => state?.user);
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const [loading, setLoading] = useState(true);
  const [staffData, setStaffData] = useState(null);
  const [payments, setPayments] = useState(null);

  let _id = useLocation()?.state?._id;
  if (selfProfile) {
    _id = user?._id;
  }

  useEffect(() => {
    if (_id) {
      setLoading(true);
      getStaffByIdApi(_id)
        .then((response) => {
          if (response?.success) {
            setStaffData(response.data?.user);
            setPayments(response.data?.payments);
          } else {
            toast.error(response?.message || "Failed to fetch staff details");
          }
        })
        .catch(() =>
          toast.error("An error occurred while fetching staff details")
        )
        .finally(() => setLoading(false));
    }
  }, [_id]);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Spin size="large" />
      </div>
    );

  const labelLayout = {
    column: screens.xs ? 1 : 2,
    size: "middle",
    layout: screens.xs ? "vertical" : "horizontal",
  };
  return (
    <>
      <Row justify="end" align="center" style={{ marginBottom: 16 }}>
        {["admin", "superAdmin"].includes(user?.role) && (
          <Col
            xs={24}
            sm={8}
            md={6}
            lg={4}
            style={{
              textAlign: screens.xs ? "center" : "right",
              marginBottom: screens.xs ? 12 : 0,
            }}
          >
            <Button
              type="primary"
              icon={<EditOutlined />}
              block={screens.xs}
              onClick={() =>
                navigate(`/staff/edit/${staffData?.staffId}`, {
                  state: { staff: staffData },
                })
              }
            >
              Edit Profile
            </Button>
          </Col>
        )}
      </Row>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle" wrap>
          <Col
            xs={24}
            sm={6}
            md={4}
            lg={3}
            style={{ textAlign: "center", marginBottom: screens.xs ? 16 : 0 }}
          >
            <Avatar
              size={screens.xs ? 64 : 80}
              icon={<UserOutlined />}
              src={staffData?.profilePhoto}
              style={{ background: "#e6f7ff" }}
            />
          </Col>
          <Col xs={24} sm={18} md={20} lg={21}>
            <Row gutter={[8, 8]}>
              <Col xs={24}>
                <Row justify="space-between" align="middle">
                  <Col>
                    <Title level={screens.xs ? 5 : 4} style={{ margin: 0 }}>
                      {staffData?.fullName}
                    </Title>
                  </Col>
                  <Col>
                    <Tag
                      color="green"
                      style={{ fontSize: screens.xs ? 10 : 14 }}
                    >
                      {staffData?.role?.toUpperCase()}
                    </Tag>
                  </Col>
                </Row>
              </Col>
              <Col xs={24}>
                <Text strong>ID: {staffData?.staffId}</Text>
              </Col>
              <Col xs={24}>
                <EnvironmentOutlined style={{ marginRight: 4 }} />
                {staffData?.currentAddress || "-"}
              </Col>
              <Col xs={24}>
                <MailOutlined style={{ marginRight: 4 }} />
                {staffData?.email || "-"}
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>
      <Tabs
        defaultActiveKey="1"
        tabBarGutter={screens.xs ? 4 : 24}
        items={[
          {
            key: "1",
            label: "Profile",
            children: (
              <div className="space-y-6">
                <Descriptions
                  {...labelLayout}
                  bordered
                  column={screens.xs ? 1 : 2}
                  size={screens.xs ? "small" : "middle"}
                >
                  <Descriptions.Item label="Department">
                    {staffData?.department || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Designation">
                    {staffData?.designation || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Qualification">
                    {staffData?.qualification || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Specialist">
                    {staffData?.specialist || "-"}
                  </Descriptions.Item>
                  {staffData?.role === "doctor" && (
                    <>
                      <Descriptions.Item label="IPD Charge">
                        <span className="text-green-600 font-semibold">
                          ₹{staffData?.ipdCharge}
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label="OPD Charge">
                        <span className="text-green-600 font-semibold">
                          ₹{staffData?.opdCharge}
                        </span>
                      </Descriptions.Item>
                    </>
                  )}
                  <Descriptions.Item label="Gender">
                    {staffData?.gender || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Date of Birth">
                    {formatDate(staffData?.dob) || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Blood Group">
                    {staffData?.bloodGroup || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Marital Status">
                    {staffData?.maritalStatus || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Father's Name">
                    {staffData?.fatherName || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Mother's Name">
                    {staffData?.motherName || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Phone">
                    {staffData?.phone || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Emergency Contact">
                    {staffData?.emergencyContact || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Current Address">
                    {staffData?.currentAddress || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Permanent Address">
                    {staffData?.permanentAddress || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Joining Date">
                    {formatDate(staffData?.dateOfJoining) || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Experience">
                    {staffData?.workExperience || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Note">
                    {staffData?.note || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="PAN Number">
                    {staffData?.panNumber || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Aadhar Number">
                    {staffData?.aadharNumber || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Reference">
                    {staffData?.reference || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Last Login">
                    {staffData?.lastLogin
                      ? formatDateTime(staffData.lastLogin)
                      : "-"}
                  </Descriptions.Item>
                </Descriptions>

                <IncomeOverview user={user} />
              </div>
            ),
          },
          {
            key: "4",
            label: "Salary",
            children: <StaffPaymentTable payments={payments} />,
          },
          ...(staffData?.role === "doctor"
            ? [
                {
                  key: "2",
                  label: "IPDs",
                  children: <DoctorIpds doctor={staffData} />,
                },
                {
                  key: "3",
                  label: "OPDs",
                  children: <DoctorOpds doctor={staffData} />,
                },
              ]
            : []),
        ]}
      />
    </>
  );
};
export default StaffProfile;
