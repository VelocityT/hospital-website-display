import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, DatePicker, Select, Table, Tag, Space } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { getEyeQueueApi } from "../../services/apis";

const statusColor = {
  Scheduled: "orange",
  "Workup Done": "blue",
  "With Doctor": "purple",
  Completed: "green",
};

const EyeQueue = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state?.user);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [date, setDate] = useState(dayjs());
  const [statusFilter, setStatusFilter] = useState(undefined);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    const res = await getEyeQueueApi({
      date: date.format("YYYY-MM-DD"),
      ...(statusFilter && { status: statusFilter }),
    });
    if (res.success) {
      setData(res.data || []);
    } else {
      toast.error(res.message || "Failed to load queue");
    }
    setLoading(false);
  }, [date, statusFilter]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const goToWorkup = (record) => {
    navigate("/eye/workup", {
      state: {
        opdNumber: record.opdNumber,
        patient: record.patient,
        doctor: record.doctor,
      },
    });
  };

  const goToDoctorPanel = (record) => {
    navigate("/eye/doctor-panel", {
      state: {
        opdNumber: record.opdNumber,
        patient: record.patient,
        doctor: record.doctor,
      },
    });
  };

  const columns = [
    {
      title: "OPD No.",
      dataIndex: "opdNumber",
      key: "opdNumber",
    },
    {
      title: "Patient",
      key: "patient",
      render: (_, r) => (
        <div>
          <div className="font-medium">{r.patient?.fullName}</div>
          <div className="text-xs text-gray-500">{r.patient?.patientId}</div>
        </div>
      ),
    },
    {
      title: "Doctor",
      key: "doctor",
      render: (_, r) => r.doctor?.fullName || "-",
    },
    {
      title: "Time",
      key: "time",
      render: (_, r) =>
        r.visitDateTime ? dayjs(r.visitDateTime).format("hh:mm A") : "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={statusColor[status] || "default"}>{status}</Tag>
      ),
    },
    {
      title: "Workup",
      key: "workup",
      render: (_, r) =>
        r.eyeExam?.workup?.workupAt ? (
          <Tag color="green">Done</Tag>
        ) : (
          <Tag color="orange">Pending</Tag>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, r) => (
        <Space>
          {["optometrist", "admin", "doctor", "receptionist"].includes(
            user?.role
          ) && (
            <Button size="small" onClick={() => goToWorkup(r)}>
              {r.eyeExam?.workup?.workupAt ? "Edit Workup" : "Start Workup"}
            </Button>
          )}
          {["doctor", "admin"].includes(user?.role) && (
            <Button size="small" type="primary" onClick={() => goToDoctorPanel(r)}>
              Doctor Panel
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Eye OPD Queue"
      className="dark:bg-neutral-900 dark:text-white"
      extra={
        <Space>
          <DatePicker
            value={date}
            onChange={(d) => d && setDate(d)}
            allowClear={false}
          />
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 150 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "Scheduled", label: "Scheduled" },
              { value: "Workup Done", label: "Workup Done" },
              { value: "Completed", label: "Completed" },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchQueue} />
        </Space>
      }
    >
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 20 }}
        scroll={{ x: true }}
      />
    </Card>
  );
};

export default EyeQueue;
