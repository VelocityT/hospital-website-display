import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  getEyeSurgeriesApi,
  getStaffForAssignApi,
  updateEyeSurgeryApi,
} from "../../services/apis";

const { Text } = Typography;

const statusColor = {
  Advised: "orange",
  Counseled: "blue",
  Scheduled: "purple",
  Completed: "green",
  Cancelled: "red",
};

const defaultPackages = [
  { name: "Monofocal (Indian IOL)", iolModel: "", price: 15000 },
  { name: "Monofocal (Imported IOL)", iolModel: "", price: 25000 },
  { name: "Multifocal IOL", iolModel: "", price: 45000 },
  { name: "Toric IOL", iolModel: "", price: 40000 },
];

const paymentStatusColor = {
  Paid: "green",
  Partial: "gold",
  Unpaid: "red",
};

// Total package cost agreed during counseling.
const getCost = (r) =>
  r?.counseling?.selectedPackage?.price || r?.counseling?.estimatedCost || 0;

// Amount actually collected = sum of every installment's totalCharge
// (same convention the rest of Velocare billing uses).
const getPaid = (r) =>
  (r?.payment?.bill || []).reduce((sum, b) => sum + (+b?.totalCharge || 0), 0);

// Installment history shown in the expandable row: date, amount, method,
// and the balance that remained after each payment.
const PaymentHistory = ({ record }) => {
  const bills = record?.payment?.bill || [];
  const cost = getCost(record);
  const paid = getPaid(record);
  const balance = Math.max(cost - paid, 0);

  if (!bills.length) {
    return <Text type="secondary">No payments collected yet.</Text>;
  }

  return (
    <div className="px-2">
      <div className="mb-2 font-medium">
        Package: ₹{cost} · Collected: ₹{paid} ·{" "}
        <Text type={balance > 0 ? "danger" : "success"}>
          Balance: ₹{balance}
        </Text>
      </div>
      <Table
        size="small"
        rowKey={(b) => b._id}
        pagination={false}
        dataSource={bills}
        columns={[
          { title: "Bill No.", dataIndex: "billNumber" },
          {
            title: "Date",
            render: (_, b) =>
              b?.createdAt
                ? dayjs(b.createdAt).format("DD MMM YYYY hh:mm A")
                : "-",
          },
          {
            title: "Amount Paid",
            render: (_, b) => `₹${b?.totalCharge || 0}`,
          },
          { title: "Method", dataIndex: "paymentMethod" },
          {
            title: "Balance After",
            render: (_, b) => `₹${b?.payableAmount ?? "-"}`,
          },
        ]}
      />
    </div>
  );
};

const SurgeryBoard = () => {
  const user = useSelector((state) => state?.user);
  const [loading, setLoading] = useState(false);
  const [surgeries, setSurgeries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [doctors, setDoctors] = useState([]);

  // modals
  const [counselingTarget, setCounselingTarget] = useState(null);
  const [scheduleTarget, setScheduleTarget] = useState(null);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [counselForm] = Form.useForm();
  const [scheduleForm] = Form.useForm();
  const [completeForm] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const fetchSurgeries = useCallback(async () => {
    setLoading(true);
    const res = await getEyeSurgeriesApi({
      status: statusFilter,
      page,
      limit: 20,
    });
    if (res.success) {
      setSurgeries(res.data || []);
      setTotal(res.total || 0);
    } else {
      toast.error(res.message || "Failed to load surgeries");
    }
    setLoading(false);
  }, [statusFilter, page]);

  useEffect(() => {
    fetchSurgeries();
  }, [fetchSurgeries]);

  useEffect(() => {
    const loadDoctors = async () => {
      const res = await getStaffForAssignApi("doctor");
      if (res.success) setDoctors(res.data || []);
    };
    loadDoctors();
  }, []);

  const update = async (id, payload, closeAll) => {
    setSaving(true);
    const res = await updateEyeSurgeryApi(id, payload);
    setSaving(false);
    if (res.success) {
      toast.success("Updated");
      closeAll();
      fetchSurgeries();
    } else {
      toast.error(res.message || "Failed to update");
    }
  };

  // ---- Counseling ----
  const openCounseling = (record) => {
    setCounselingTarget(record);
    counselForm.setFieldsValue({
      packagesOffered: record.counseling?.packagesOffered?.length
        ? record.counseling.packagesOffered
        : defaultPackages,
      selectedPackageName: record.counseling?.selectedPackage?.name,
      estimatedCost: record.counseling?.estimatedCost,
      notes: record.counseling?.notes,
    });
  };

  const onCounselSave = async () => {
    const v = counselForm.getFieldsValue();
    const selected = (v.packagesOffered || []).find(
      (p) => p?.name === v.selectedPackageName
    );
    await update(
      counselingTarget._id,
      {
        counseling: {
          packagesOffered: v.packagesOffered,
          selectedPackage: selected,
          estimatedCost: v.estimatedCost || selected?.price,
          notes: v.notes,
        },
      },
      () => setCounselingTarget(null)
    );
  };

  // ---- Schedule ----
  const openSchedule = (record) => {
    setScheduleTarget(record);
    scheduleForm.setFieldsValue({
      surgeon: record.surgeon?._id,
      otDate: record.otDate ? dayjs(record.otDate) : undefined,
      k1: record.biometry?.k1,
      k2: record.biometry?.k2,
      axialLength: record.biometry?.axialLength,
      iolPower: record.biometry?.iolPower,
      formula: record.biometry?.formula,
      fitnessDone: record.biometry?.fitnessDone,
    });
  };

  const onScheduleSave = async () => {
    const v = scheduleForm.getFieldsValue();
    await update(
      scheduleTarget._id,
      {
        surgeon: v.surgeon,
        otDate: v.otDate ? v.otDate.toISOString() : undefined,
        biometry: {
          k1: v.k1,
          k2: v.k2,
          axialLength: v.axialLength,
          iolPower: v.iolPower,
          formula: v.formula,
          fitnessDone: v.fitnessDone,
        },
      },
      () => setScheduleTarget(null)
    );
  };

  // ---- Complete ----
  const onCompleteSave = async () => {
    const v = completeForm.getFieldsValue();
    await update(
      completeTarget._id,
      {
        status: "Completed",
        operativeNotes: v.operativeNotes,
        followUpDate: v.followUpDate ? v.followUpDate.toISOString() : undefined,
      },
      () => setCompleteTarget(null)
    );
  };

  // ---- Payment ----
  const openPayment = (record) => {
    setPaymentTarget(record);
    const balance = Math.max(getCost(record) - getPaid(record), 0);
    paymentForm.setFieldsValue({
      collectAmount: balance || undefined,
      tax: 0,
      discount: 0,
      paymentMethod: "Cash",
    });
  };

  const onPaymentSave = async () => {
    const v = paymentForm.getFieldsValue();
    const amount = Number(v.collectAmount);
    if (!amount || amount <= 0) return toast.error("Enter a valid amount");

    const cost = getCost(paymentTarget);
    const balance = Math.max(cost - getPaid(paymentTarget), 0);
    if (cost > 0 && amount > balance) {
      return toast.error(`Amount exceeds the remaining balance of ₹${balance}`);
    }

    await update(
      paymentTarget._id,
      {
        collectAmount: amount,
        tax: Number(v.tax) || 0,
        discount: Number(v.discount) || 0,
        paymentMethod: v.paymentMethod,
      },
      () => setPaymentTarget(null)
    );
  };

  const columns = [
    { title: "Sur. No.", dataIndex: "surgeryNumber" },
    {
      title: "Patient",
      render: (_, r) => (
        <div>
          <div className="font-medium">{r.patient?.fullName}</div>
          <div className="text-xs text-gray-500">{r.patient?.patientId}</div>
        </div>
      ),
    },
    {
      title: "Surgery",
      render: (_, r) => (
        <div>
          <div>{r.surgeryType}</div>
          <div className="text-xs text-gray-500">{r.eye}</div>
        </div>
      ),
    },
    {
      title: "Package",
      render: (_, r) =>
        r.counseling?.selectedPackage?.name ? (
          <div>
            <div className="text-xs">{r.counseling.selectedPackage.name}</div>
            <div>₹{r.counseling.selectedPackage.price}</div>
          </div>
        ) : (
          "-"
        ),
    },
    {
      title: "Payment",
      render: (_, r) => {
        const cost = getCost(r);
        if (!cost) return "-";
        const paid = getPaid(r);
        const balance = Math.max(cost - paid, 0);
        const status =
          r.payment?.status ||
          (paid >= cost ? "Paid" : paid > 0 ? "Partial" : "Unpaid");
        return (
          <div>
            <div>
              ₹{paid} / ₹{cost}
            </div>
            {balance > 0 && (
              <Text type="danger" className="text-xs">
                Balance ₹{balance}
              </Text>
            )}
            <div>
              <Tag color={paymentStatusColor[status]}>{status}</Tag>
            </div>
          </div>
        );
      },
    },
    {
      title: "OT Date",
      render: (_, r) =>
        r.otDate ? dayjs(r.otDate).format("DD MMM YYYY") : "-",
    },
    {
      title: "Surgeon",
      render: (_, r) => r.surgeon?.fullName || "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) => <Tag color={statusColor[s]}>{s}</Tag>,
    },
    {
      title: "Actions",
      render: (_, r) => (
        <div className="flex gap-1 flex-wrap">
          {["Advised", "Counseled"].includes(r.status) && (
            <Button size="small" onClick={() => openCounseling(r)}>
              Counseling
            </Button>
          )}
          {["Counseled", "Scheduled"].includes(r.status) && (
            <Button size="small" onClick={() => openSchedule(r)}>
              Biometry / OT
            </Button>
          )}
          {r.status !== "Cancelled" &&
            getCost(r) > 0 &&
            getPaid(r) < getCost(r) && (
              <Button size="small" onClick={() => openPayment(r)}>
                Collect ₹
              </Button>
            )}
          {r.status === "Scheduled" &&
            ["doctor", "admin"].includes(user?.role) && (
              <Button
                size="small"
                type="primary"
                onClick={() => setCompleteTarget(r)}
              >
                Complete
              </Button>
            )}
          {["Advised", "Counseled", "Scheduled"].includes(r.status) && (
            <Button
              size="small"
              danger
              onClick={() =>
                update(r._id, { status: "Cancelled" }, () => {})
              }
            >
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Card
      title="Surgery Counseling & OT Board"
      className="dark:bg-neutral-900 dark:text-white"
      extra={
        <Select
          placeholder="Status"
          allowClear
          style={{ width: 150 }}
          value={statusFilter}
          onChange={setStatusFilter}
          options={Object.keys(statusColor).map((s) => ({
            value: s,
            label: s,
          }))}
        />
      }
    >
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={surgeries}
        loading={loading}
        pagination={{ current: page, total, pageSize: 20, onChange: setPage }}
        scroll={{ x: true }}
        expandable={{
          expandedRowRender: (r) => <PaymentHistory record={r} />,
          rowExpandable: (r) => (r.payment?.bill || []).length > 0,
        }}
      />

      {/* Counseling modal */}
      <Modal
        title={`Counseling — ${counselingTarget?.patient?.fullName || ""}`}
        open={!!counselingTarget}
        onOk={onCounselSave}
        confirmLoading={saving}
        onCancel={() => setCounselingTarget(null)}
        width={700}
        okText="Save Counseling"
      >
        <Form form={counselForm} layout="vertical">
          <Divider orientation="left" className="!mt-0">
            IOL / Surgery Packages
          </Divider>
          <Form.List name="packagesOffered">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Row gutter={8} key={field.key}>
                    <Col span={10}>
                      <Form.Item
                        {...field}
                        name={[field.name, "name"]}
                        className="mb-2"
                      >
                        <Input placeholder="Package name" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...field}
                        name={[field.name, "iolModel"]}
                        className="mb-2"
                      >
                        <Input placeholder="IOL model" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...field}
                        name={[field.name, "price"]}
                        className="mb-2"
                      >
                        <InputNumber
                          className="w-full"
                          prefix="₹"
                          min={0}
                          placeholder="Price"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Button danger onClick={() => remove(field.name)}>
                        ✕
                      </Button>
                    </Col>
                  </Row>
                ))}
                <Button type="dashed" onClick={() => add()} block>
                  + Add Package
                </Button>
              </>
            )}
          </Form.List>

          <Row gutter={16} className="mt-4">
            <Col span={12}>
              <Form.Item
                label="Selected Package"
                name="selectedPackageName"
                shouldUpdate
              >
                <Select
                  allowClear
                  options={(
                    counselForm.getFieldValue("packagesOffered") || []
                  )
                    .filter((p) => p?.name)
                    .map((p) => ({
                      value: p.name,
                      label: `${p.name} — ₹${p.price || 0}`,
                    }))}
                  onDropdownVisibleChange={() => {
                    // refresh options from current list values
                    counselForm.setFieldsValue({});
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Estimated Total Cost" name="estimatedCost">
                <InputNumber className="w-full" prefix="₹" min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Counseling Notes" name="notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Biometry / schedule modal */}
      <Modal
        title={`Biometry & OT Schedule — ${
          scheduleTarget?.patient?.fullName || ""
        }`}
        open={!!scheduleTarget}
        onOk={onScheduleSave}
        confirmLoading={saving}
        onCancel={() => setScheduleTarget(null)}
        okText="Save"
      >
        <Form form={scheduleForm} layout="vertical">
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item label="K1" name="k1">
                <Input placeholder="44.25" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="K2" name="k2">
                <Input placeholder="45.00" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="AL (mm)" name="axialLength">
                <Input placeholder="23.4" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="IOL Power" name="iolPower">
                <Input placeholder="+21.5 D" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Formula" name="formula">
                <Select
                  allowClear
                  options={["SRK/T", "SRK-II", "Barrett", "Hoffer Q"].map(
                    (v) => ({ value: v, label: v })
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Fitness Done"
                name="fitnessDone"
                valuePropName="checked"
              >
                <Select
                  options={[
                    { value: true, label: "Yes" },
                    { value: false, label: "No" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Surgeon" name="surgeon">
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={doctors.map((d) => ({
                    value: d._id,
                    label: d.fullName,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="OT Date" name="otDate">
                <DatePicker className="w-full" showTime format="DD MMM YYYY hh:mm A" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Complete modal */}
      <Modal
        title={`Complete Surgery — ${completeTarget?.patient?.fullName || ""}`}
        open={!!completeTarget}
        onOk={onCompleteSave}
        confirmLoading={saving}
        onCancel={() => setCompleteTarget(null)}
        okText="Mark Completed"
      >
        <Form form={completeForm} layout="vertical">
          <Form.Item label="Operative Notes" name="operativeNotes">
            <Input.TextArea rows={3} placeholder="Procedure, IOL implanted, complications if any" />
          </Form.Item>
          <Form.Item label="Follow-up Date" name="followUpDate">
            <DatePicker className="w-full" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Payment modal */}
      <Modal
        title={`Collect Payment — ${paymentTarget?.patient?.fullName || ""}`}
        open={!!paymentTarget}
        onOk={onPaymentSave}
        confirmLoading={saving}
        onCancel={() => setPaymentTarget(null)}
        okText="Collect"
      >
        {(() => {
          const cost = getCost(paymentTarget);
          const paid = getPaid(paymentTarget);
          const balance = Math.max(cost - paid, 0);
          return (
            <div className="mb-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded bg-gray-100 dark:bg-neutral-800 p-2">
                <div className="text-xs text-gray-500">Package Cost</div>
                <div className="font-semibold">₹{cost || 0}</div>
              </div>
              <div className="rounded bg-gray-100 dark:bg-neutral-800 p-2">
                <div className="text-xs text-gray-500">Already Paid</div>
                <div className="font-semibold">₹{paid}</div>
              </div>
              <div className="rounded bg-gray-100 dark:bg-neutral-800 p-2">
                <div className="text-xs text-gray-500">Balance</div>
                <div className="font-semibold text-red-500">₹{balance}</div>
              </div>
            </div>
          );
        })()}
        <Form
          form={paymentForm}
          layout="vertical"
          initialValues={{ paymentMethod: "Cash", tax: 0, discount: 0 }}
        >
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                label="Amount Paying Now"
                name="collectAmount"
                rules={[{ required: true, message: "Enter amount" }]}
              >
                <InputNumber
                  className="w-full"
                  prefix="₹"
                  min={0}
                  max={
                    getCost(paymentTarget) > 0
                      ? Math.max(
                          getCost(paymentTarget) - getPaid(paymentTarget),
                          0
                        )
                      : undefined
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Payment Method" name="paymentMethod">
                <Select
                  options={["Cash", "Card", "UPI", "Insurance"].map((v) => ({
                    value: v,
                    label: v,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Tax" name="tax">
                <InputNumber className="w-full" prefix="₹" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Discount" name="discount">
                <InputNumber className="w-full" prefix="₹" min={0} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Card>
  );
};

export default SurgeryBoard;
