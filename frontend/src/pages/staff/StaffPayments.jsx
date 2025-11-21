import { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Spin,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Table,
  Tabs,
} from "antd";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";
import {
  createStaffPaymentApi,
  getStaffPaymentsApi,
  updateStaffPaymentApi,
  // createStaffPaymentApi,
} from "../../services/apis";
import { formatDate } from "../../utils/helper";
import dayjs from "dayjs";
import DoctorIpds from "../Doctor/DoctorIpds";
import DoctorOpds from "../Doctor/DoctorOpds";
import StaffPaymentTable from "../components/StaffPaymentTable";

const { Option } = Select;

const StaffPayments = () => {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const { _id } = location?.state || {};
  const [editingPayment, setEditingPayment] = useState(null);

  // const openEditModal = (payment) => {
  //   setEditingPayment(payment);
  //   setModalOpen(true);
  //   form.setFieldsValue({
  //     ...payment,
  //     salaryMonth: payment.month ? dayjs(payment.month, "MMMM-YYYY") : null,
  //     paymentDate: dayjs(payment.paymentDate),
  //   });
  // };

  useEffect(() => {
    const fetchData = async () => {
      if (!_id) return;
      setLoading(true);
      try {
        const response = await getStaffPaymentsApi(_id);
        if (response?.success) {
          setUser(response?.data?.user);
          setPayments(response?.data?.payments || []);
        } else {
          toast.error(response?.message || "Something went wrong");
        }
      } catch (error) {
        toast.error(error?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [_id]);

  const handlePaymentSubmit = async (values) => {
    try {
      setPaymentLoading(true);
      const payload = {
        role: user?.role,
        ...values,
        staff: _id,
        month:
          values.paymentType === "Monthly Salary"
            ? dayjs(values.salaryMonth).format("MMMM-YYYY")
            : undefined,
        paymentDate: dayjs(values.paymentDate).toISOString(),
      };

      let response;
      if (editingPayment) {
        response = await updateStaffPaymentApi(editingPayment._id, payload);
      } else {
        response = await createStaffPaymentApi(payload);
      }

      if (response?.success) {
        toast.success(editingPayment ? "Payment updated" : "Payment added");
        if (editingPayment) {
          setPayments((prev) =>
            prev.map((p) => (p._id === editingPayment._id ? response.data : p))
          );
        } else {
          setPayments((prev) => [response.data, ...prev]);
        }
        setModalOpen(false);
        form.resetFields();
        setEditingPayment(null);
      } else {
        toast.error(response?.message || "Something went wrong");
      }
    } catch (error) {
      toast.error(error?.message || "Something went wrong");
    } finally {
      setPaymentLoading(false);
    }
  };

  const paymentColumns = [
    { title: "Payment Type", dataIndex: "paymentType", key: "paymentType" },
    {
      title: "Month",
      dataIndex: "month",
      key: "month",
      render: (text, record) =>
        record?.paymentType === "Monthly Salary" ? text : "-",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amt) => `₹${amt}`,
    },
    {
      title: "Payment Date",
      dataIndex: "paymentDate",
      key: "paymentDate",
      render: (d) => formatDate(d),
    },
    { title: "Notes", dataIndex: "notes", key: "notes" },
    // {
    //   title: "Actions",
    //   key: "actions",
    //   render: (_, record) => (
    //     <Button type="link" onClick={() => openEditModal(record)}>
    //       Edit
    //     </Button>
    //   ),
    // },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <div className="text-center py-8">No data available</div>;
  }

  return (
    <div className="mx-auto space-y-6">
      <Card
        title="Staff Details"
        className="mx-auto"
        extra={
          <Button type="primary" onClick={() => setModalOpen(true)}>
            Pay Salary
          </Button>
        }
      >
        <Row gutter={[16, 8]}>
          <Col xs={24} sm={12}>
            <p>
              <strong>Staff ID:</strong> {user.staffId}
            </p>
          </Col>
          <Col xs={24} sm={12}>
            <p>
              <strong>Full Name:</strong> {user.fullName}
            </p>
          </Col>
          <Col xs={24} sm={12}>
            <p>
              <strong>Role:</strong> {user.role}
            </p>
          </Col>
          <Col xs={24} sm={12}>
            <p>
              <strong>Phone:</strong> {user.phone}
            </p>
          </Col>
          <Col xs={24} sm={12}>
            <p>
              <strong>Date of Joining:</strong> {formatDate(user.dateOfJoining)}
            </p>
          </Col>
        </Row>
      </Card>

      {user.role === "doctor" ? (
        <Tabs
          defaultActiveKey="1"
          items={[
            {
              key: "1",
              label:
                user?.role !== "doctor" ? "Payment History" : "Other Payments",
              children: <StaffPaymentTable payments={payments} />,
            },
            {
              key: "2",
              label: "IPDs",
              children: <DoctorIpds doctor={user} />,
            },
            {
              key: "3",
              label: "OPDs",
              children: <DoctorOpds doctor={user} />,
            },
          ]}
        />
      ) : (
        <Table
          rowKey="_id"
          dataSource={payments}
          columns={paymentColumns}
          pagination={{ pageSize: 5 }}
          scroll={{ x: "max-content" }}
        />
      )}

      <Modal
        title={editingPayment ? "Edit Payment" : "Add Payment"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={handlePaymentSubmit}
          initialValues={{ paymentDate: dayjs() }}
        >
          <Form.Item
            name="paymentType"
            label="Payment Type"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select type">
              {user?.role !== "doctor" && (
                <Option value="Monthly Salary">Monthly Salary</Option>
              )}
              <Option value="Bonus">Bonus</Option>
              <Option value="Other Expense">Other Expense</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.paymentType !== curr.paymentType}
          >
            {({ getFieldValue }) =>
              getFieldValue("paymentType") === "Monthly Salary" ? (
                <Form.Item
                  name="salaryMonth"
                  label="Salary Month"
                  rules={[{ required: true, message: "Please select month" }]}
                >
                  <DatePicker
                    picker="month"
                    format="MMMM-YYYY"
                    className="w-full"
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <Input type="number" min={0} placeholder="Enter amount" />
          </Form.Item>

          <Form.Item
            name="paymentDate"
            label="Payment Date"
            rules={[{ required: true }]}
          >
            <DatePicker className="w-full" format="DD/MM/YYYY" disabled />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Optional notes" />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setModalOpen(false)}
              disabled={paymentLoading}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" disabled={paymentLoading}>
              Save
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default StaffPayments;
