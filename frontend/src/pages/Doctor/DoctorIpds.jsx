//its component
import { useEffect, useState } from "react";
import { Table, Button, Tag, Input, Modal } from "antd";
import { Link } from "react-router-dom";
import { getDoctorIpdsApi, payDoctorApi } from "../../services/apis";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  calculateStayDays,
  calculateTotalDoctorPayment,
  formatDateTime,
  calculateCommission,
} from "../../utils/helper";

const DoctorIpds = ({ doctor }) => {
  const user = useSelector((state) => state?.user);
  const [ipds, setIpds] = useState([]);
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
    getDoctorIpdsApi(doctor?._id, {
      type: "ipd",
      page: pagination.current,
      limit: pagination.pageSize,
    })
      .then((res) => {
        setIpds(res.data || []);
        setTotal(res.total || 0);
      })
      .catch(() => toast.error("Failed to fetch IPDs"))
      .finally(() => setLoading(false));
  }, [doctor, pagination.current, pagination.pageSize]);

  const handlePayDoctor = (record) => {
    const total = calculateCommission(record, "ipd", doctor);
    const paid = calculateTotalDoctorPayment(record?.doctorPayment);
    setSelectedRecord(record);
    setAmountToPay(Math.max(total - paid, 0));
    setPayModalVisible(true);
  };

  const handleConfirmPay = async () => {
    if (!amountToPay || amountToPay <= 0)
      return toast.error("Please enter a valid amount");
    const payload = {
      ipdId: selectedRecord._id,
      staffId: doctor?._id,
      amount: amountToPay,
    };
    try {
      setPaymentLoading(true);
      const res = await payDoctorApi(payload);
      toast.success(res.message);
      const updated = res.updated;
      setIpds((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
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
        dataSource={ipds}
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
            title: "IPD Number",
            dataIndex: "ipdNumber",
            key: "ipdNumber",
            render: (ipdNumber, record) => (
              <Link
                to={`/ipd/${ipdNumber}`}
                state={{ _id: record?._id }}
                className="text-blue-600 hover:underline"
              >
                {ipdNumber}
              </Link>
            ),
          },
          {
            title: "Patient Name",
            dataIndex: ["patient", "fullName"],
            key: "patientName",
          },
          {
            title: "Bed Number",
            dataIndex: ["bed", "bedNumber"],
            key: "bedNumber",
          },
          {
            title: "Ward",
            render: (_, record) =>
              `${record.ward?.name || "-"} (Floor: ${
                record.ward?.floor || "-"
              })`,
            key: "ward",
          },
          {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => (
              <Tag color={status === "Admitted" ? "green" : "red"}>
                {status}
              </Tag>
            ),
          },
          {
            title: "IPD Commission",
            key: "ipdCommission",
            render: (_, record) => {
              const days = calculateStayDays(
                record.admissionDate,
                record?.dischargeSummary?.dischargeDate
              );
              // Negotiated rate (record.doctorChargeOverride) replaces
              // ipdCharge for this admission when one was agreed — same
              // rule as calculateCommission in utils/helper.js, which this
              // used to duplicate independently and could drift from.
              const rate = record?.doctorChargeOverride ?? doctor?.ipdCharge;
              const commissionPerDay = (doctor?.ipdCommission * rate) / 100;
              const totalCommission = commissionPerDay * days;
              return (
                <>
                  {commissionPerDay.toFixed(2)} ₹ x {days} day(s) ={" "}
                  <b>{totalCommission.toFixed(2)} ₹</b>
                  {record?.doctorChargeOverride != null && (
                    <Tag color="blue" className="ml-2">
                      Negotiated rate
                    </Tag>
                  )}
                </>
              );
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
          // Salaried doctors draw a fixed monthly amount, so per-visit
          // commission must not be payable — the API rejects it too.
          ...(user?.role === "admin" && !doctor?.isSalaried
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
                scroll={{ x: "max-content" }}
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

export default DoctorIpds;
