//its component
import { useEffect, useState } from "react";
import { Table, Button, Input, Modal } from "antd";
import { Link } from "react-router-dom";
import { getDoctorOpdsApi, payDoctorApi } from "../../services/apis";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  calculateTotalDoctorPayment,
  formatDateTime,
  calculateCommission,
} from "../../utils/helper";

const DoctorOpds = ({ doctor }) => {
  const user = useSelector((state) => state?.user);
  const [opds, setOpds] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [amountToPay, setAmountToPay] = useState();

  useEffect(() => {
    if (!doctor) return;
    setLoading(true);
    getDoctorOpdsApi(doctor?._id, {
      type: "opd",
      page: pagination.current,
      limit: pagination.pageSize,
    })
      .then((res) => {
        setOpds(res.data || []);
        setTotal(res.total || 0);
      })
      .catch(() => toast.error("Failed to fetch OPDs"))
      .finally(() => setLoading(false));
  }, [doctor, pagination.current, pagination.pageSize]);

  const handlePayDoctor = (record) => {
    const total = calculateCommission(record, "opd", doctor);
    const paid = calculateTotalDoctorPayment(record?.doctorPayment);
    setSelectedRecord(record);
    setAmountToPay(Math.max(total - paid, 0));
    setPayModalVisible(true);
  };

  const handleConfirmPay = async () => {
    if (!amountToPay || amountToPay <= 0)
      return toast.error("Please enter a valid amount");
    const payload = {
      opdId: selectedRecord._id,
      staffId: doctor?._id,
      amount: amountToPay,
    };
    try {
      setPaymentLoading(true);
      const res = await payDoctorApi(payload);
      toast.success(res.message);
      const updated = res.updated;
      setOpds((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
      setPayModalVisible(false);
      setSelectedRecord(null);
      setAmountToPay();
    } catch (err) {
      toast.error(err.message || "Payment failed");
    } finally {
      setPaymentLoading(false);
    }
  };

  const paymentColumns = [
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amt) => <span>{amt} ₹</span>,
    },
    {
      title: "Paid At",
      dataIndex: "paidAt",
      key: "paidAt",
      render: (date) => formatDateTime(date),
    },
  ];

  return (
    <>
      <Table
        scroll={{ x: "max-content" }}
        dataSource={opds}
        rowKey="_id"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: total,
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "20", "50"],
          onChange: (page, pageSize) => {
            setPagination({ current: page, pageSize });
          },
        }}
        columns={[
          {
            title: "OPD Number",
            dataIndex: "opdNumber",
            key: "opdNumber",
            render: (opdNumber, record) => (
              <Link
                to={`/opd/${opdNumber}`}
                state={{ _id: record?._id }}
                className="text-blue-600 hover:underline"
              >
                {opdNumber}
              </Link>
            ),
          },
          {
            title: "Patient Name",
            dataIndex: ["patient", "fullName"],
            key: "patientName",
          },
          {
            title: "Visit Date",
            dataIndex: "visitDateTime",
            key: "visitDateTime",
            render: (text) => formatDateTime(text),
          },
          {
            title: "OPD Charge",
            dataIndex: "opdCharge",
            key: "opdCharge",
            render: () => <>{doctor?.opdCharge}</>,
          },
          {
            title: "Commission",
            dataIndex: "opdCommission",
            key: "opdCommission",
            render: () => {
              const commission =
                (doctor?.opdCommission * doctor?.opdCharge) / 100;
              return <>{commission?.toFixed(2)} ₹</>;
            },
          },
          {
            title: "Paid",
            key: "doctorPayment",
            render: (_, record) => (
              <span>
                {calculateTotalDoctorPayment(record?.doctorPayment)} ₹
              </span>
            ),
          },
          ...(user?.role === "admin"
            ? [
                {
                  title: "Action",
                  key: "action",
                  render: (_, record) => (
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => handlePayDoctor(record)}
                    >
                      Pay
                    </Button>
                  ),
                },
              ]
            : []),
        ]}
        expandable={{
          expandedRowRender: (record) =>
            record.doctorPayment && record.doctorPayment.length > 0 ? (
              <Table
                columns={paymentColumns}
                dataSource={record.doctorPayment}
                rowKey="_id"
                size="small"
                pagination={false}
                scroll={{ x: 400 }}
              />
            ) : (
              <span>No payments yet.</span>
            ),
          rowExpandable: (record) =>
            record.doctorPayment && record.doctorPayment.length > 0,
        }}
      />
      <Modal
        title="Pay Doctor Commission"
        open={payModalVisible}
        onCancel={() => setPayModalVisible(false)}
        onOk={handleConfirmPay}
        okButtonProps={{ disabled: paymentLoading, loading: paymentLoading }}
        cancelButtonProps={{ disabled: paymentLoading }}
        okText="Confirm Payment"
        width={480}
      >
        <div className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Patient Name</label>
            <Input value={selectedRecord?.patient?.fullName} disabled />
          </div>
          <div>
            <label className="block mb-1 font-medium">Amount Left to Pay</label>
            <Input
              type="number"
              min={1}
              max={amountToPay}
              value={amountToPay}
              onChange={(e) => setAmountToPay(Number(e.target.value))}
              placeholder="Enter amount"
            />
            <div className="text-xs text-gray-500 mt-1">
              Already paid:{" "}
              {calculateTotalDoctorPayment(selectedRecord?.doctorPayment)} ₹
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default DoctorOpds;
