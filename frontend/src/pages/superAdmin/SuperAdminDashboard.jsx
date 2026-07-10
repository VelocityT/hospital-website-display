import { useEffect, useState } from "react";
import {
  Card,
  Col,
  Row,
  Statistic,
  Table,
  Tag,
  Divider,
} from "antd";
import { getDashboardStaticData } from "../../services/apis";
import { toast } from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const SuperAdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getDashboardStaticData();
        if (res?.success) {
          setData(res.data);
        } else {
          toast.error(res.message || "Failed to fetch dashboard data");
        }
      } catch (error) {
        toast.error("Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const hospitalColumns = [
    {
      title: "Hospital Name",
      dataIndex: "fullName",
    },
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Phone",
      dataIndex: "phone",
    },
    {
      title: "Status",
      dataIndex: "isDisabled",
      render: (disabled) => (
        <Tag color={disabled ? "red" : "green"}>
          {disabled ? "Disabled" : "Active"}
        </Tag>
      ),
    },
  ];

  const staffChartData =
    data?.hospitalStats?.map((item) => ({
      name: item.name,
      count: item.staffCount,
    })) || [];

  const patientChartData =
    data?.hospitalStats?.map((item) => ({
      name: item.name,
      count: item.patientCount,
    })) || [];

  return (
    <div className="p-4">
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="Total Hospitals"
              value={data?.stats?.total || 0}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="Active Hospitals"
              value={data?.stats?.active || 0}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="Inactive Hospitals"
              value={data?.stats?.inactive || 0}
            />
          </Card>
        </Col>
      </Row>

      <Divider orientation="left" plain>
        Hospitals List
      </Divider>
      <Table
        dataSource={data?.hospitals || []}
        columns={hospitalColumns}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 5 }}
        scroll={{ x: true }}
      />

      <Divider orientation="left" plain>
        Hospital Staff & Patient Counts
      </Divider>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            title="Staff Count per Hospital"
            className="rounded-xl shadow-sm"
            styles={{ body: { padding: 12 } }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={staffChartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="Staff Count" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="Patient Count per Hospital"
            className="rounded-xl shadow-sm"
            styles={{ body: { padding: 12 } }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={patientChartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" name="Patient Count" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SuperAdminDashboard;
