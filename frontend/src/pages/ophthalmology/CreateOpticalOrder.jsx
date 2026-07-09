import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AutoComplete,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Input,
  InputNumber,
  Row,
  Select,
  Table,
  Typography,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import toast from "react-hot-toast";
import {
  createOpticalOrderApi,
  getOpticalItemsApi,
  getPatientEyeHistoryApi,
  searchPatientApi,
} from "../../services/apis";
import useDebounce from "../../hooks/useDebounce";

const { Title, Text } = Typography;

const CreateOpticalOrder = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Patient can be passed from doctor panel / queue, or searched here
  const [patient, setPatient] = useState(location.state?.patient || null);
  const [opdNumber] = useState(location.state?.opdNumber || undefined);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientOptions, setPatientOptions] = useState([]);
  const debouncedPatientSearch = useDebounce(patientSearch, 500);

  const [latestExam, setLatestExam] = useState(null);

  const [itemSearch, setItemSearch] = useState("");
  const [itemOptions, setItemOptions] = useState([]);
  const debouncedItemSearch = useDebounce(itemSearch, 500);

  const [lines, setLines] = useState([]);
  const [advance, setAdvance] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [expectedDelivery, setExpectedDelivery] = useState(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Patient search
  useEffect(() => {
    const run = async () => {
      if (!debouncedPatientSearch) return;
      const res = await searchPatientApi({ search: debouncedPatientSearch });
      if (res.success) {
        setPatientOptions(
          (res.data || []).map((p) => ({
            value: p._id,
            label: `${p.fullName} (${p.patientId})`,
            patient: p,
          }))
        );
      }
    };
    run();
  }, [debouncedPatientSearch]);

  // Load latest eye exam Rx for the selected patient
  useEffect(() => {
    const run = async () => {
      if (!patient?._id) return;
      const res = await getPatientEyeHistoryApi(patient._id);
      if (res.success && res.data?.length) {
        const withRx = res.data.find(
          (e) => e.glassesPrescription?.prescribed
        );
        setLatestExam(withRx || res.data[0]);
      } else {
        setLatestExam(null);
      }
    };
    run();
  }, [patient]);

  // Optical item search
  useEffect(() => {
    const run = async () => {
      const res = await getOpticalItemsApi({
        search: debouncedItemSearch,
        limit: 10,
      });
      if (res.success) {
        setItemOptions(
          (res.data || []).map((it) => ({
            value: it._id,
            label: `${it.itemType} | ${it.name} ${it.brand || ""} — ₹${
              it.sellPrice
            } (stock: ${it.currentStock})`,
            item: it,
          }))
        );
      }
    };
    run();
  }, [debouncedItemSearch]);

  const addLine = (option) => {
    const it = option.item;
    if (lines.some((l) => l.item === it._id)) {
      toast.error("Item already added");
      return;
    }
    setLines([
      ...lines,
      {
        item: it._id,
        name: `${it.name} ${it.brand || ""}`.trim(),
        itemType: it.itemType,
        quantity: 1,
        price: it.sellPrice,
      },
    ]);
    setItemSearch("");
  };

  const addCustomLine = () => {
    setLines([
      ...lines,
      { item: null, name: "", itemType: "Lens", quantity: 1, price: 0 },
    ]);
  };

  const updateLine = (index, field, value) => {
    const next = [...lines];
    next[index] = { ...next[index], [field]: value };
    setLines(next);
  };

  const removeLine = (index) => setLines(lines.filter((_, i) => i !== index));

  const totalAmount = lines.reduce(
    (sum, l) => sum + (l.price || 0) * (l.quantity || 1),
    0
  );

  const rxOf = (side) => {
    const e = latestExam?.glassesPrescription?.[side] || {};
    return `${e.distSph || "-"} / ${e.distCyl || "-"} x ${e.distAxis || "-"} Add ${
      e.nearAdd || "-"
    }`;
  };

  const onSubmit = async () => {
    if (!patient?._id) return toast.error("Select a patient");
    if (lines.length === 0) return toast.error("Add at least one item");
    if (lines.some((l) => !l.name)) return toast.error("Item name missing");

    setSaving(true);
    const gp = latestExam?.glassesPrescription;
    const res = await createOpticalOrderApi({
      patient: patient._id,
      eyeExam: latestExam?._id,
      opd: opdNumber,
      rx: gp
        ? {
            rightEye: gp.rightEye,
            leftEye: gp.leftEye,
            pd: gp.pd,
            lensType: gp.lensType,
          }
        : undefined,
      items: lines,
      advanceAmount: advance || 0,
      paymentMethod,
      expectedDelivery: expectedDelivery
        ? expectedDelivery.toISOString()
        : undefined,
      note,
    });
    setSaving(false);
    if (res.success) {
      toast.success(`Order ${res.data?.orderNumber} created`);
      navigate("/optical/orders");
    } else {
      toast.error(res.message || "Failed to create order");
    }
  };

  const columns = [
    {
      title: "Item",
      render: (_, l, i) =>
        l.item ? (
          l.name
        ) : (
          <Input
            value={l.name}
            placeholder="Custom item (e.g. CR Lens with ARC)"
            onChange={(e) => updateLine(i, "name", e.target.value)}
          />
        ),
    },
    { title: "Type", dataIndex: "itemType" },
    {
      title: "Qty",
      render: (_, l, i) => (
        <InputNumber
          min={1}
          value={l.quantity}
          onChange={(v) => updateLine(i, "quantity", v)}
        />
      ),
    },
    {
      title: "Price",
      render: (_, l, i) => (
        <InputNumber
          min={0}
          prefix="₹"
          value={l.price}
          onChange={(v) => updateLine(i, "price", v)}
        />
      ),
    },
    {
      title: "Amount",
      render: (_, l) => `₹${(l.price || 0) * (l.quantity || 1)}`,
    },
    {
      title: "",
      render: (_, __, i) => (
        <Button
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeLine(i)}
        />
      ),
    },
  ];

  return (
    <Card className="dark:bg-neutral-900 dark:text-white">
      <Title level={4}>New Optical Order</Title>

      <Row gutter={[16, 8]}>
        <Col xs={24} md={10}>
          {patient ? (
            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label="Patient">
                {patient.fullName} ({patient.patientId}){" "}
                <Button
                  size="small"
                  type="link"
                  onClick={() => {
                    setPatient(null);
                    setLatestExam(null);
                  }}
                >
                  Change
                </Button>
              </Descriptions.Item>
              {latestExam?.glassesPrescription?.prescribed && (
                <>
                  <Descriptions.Item label="Rx OD">
                    {rxOf("rightEye")}
                  </Descriptions.Item>
                  <Descriptions.Item label="Rx OS">
                    {rxOf("leftEye")}
                  </Descriptions.Item>
                  <Descriptions.Item label="PD / Lens">
                    {latestExam.glassesPrescription.pd || "-"} mm |{" "}
                    {latestExam.glassesPrescription.lensType || "-"}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>
          ) : (
            <AutoComplete
              className="w-full"
              placeholder="Search patient by name / ID / phone"
              options={patientOptions}
              onSearch={setPatientSearch}
              onSelect={(_, option) => setPatient(option.patient)}
            />
          )}
        </Col>
      </Row>

      <Divider orientation="left">Items</Divider>
      <div className="flex gap-2 mb-3">
        <AutoComplete
          className="flex-1"
          placeholder="Search frames / lenses from inventory"
          options={itemOptions}
          value={itemSearch}
          onChange={setItemSearch}
          onSelect={(_, option) => addLine(option)}
        />
        <Button onClick={addCustomLine}>+ Custom Item</Button>
      </div>

      <Table
        rowKey={(_, i) => i}
        columns={columns}
        dataSource={lines}
        pagination={false}
        size="small"
      />

      <Row gutter={[16, 8]} className="mt-4" justify="end">
        <Col xs={24} md={8}>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <Text strong>Total</Text>
              <Text strong>₹{totalAmount}</Text>
            </div>
            <div className="flex justify-between items-center mb-2">
              <Text>Advance</Text>
              <InputNumber
                min={0}
                max={totalAmount}
                prefix="₹"
                value={advance}
                onChange={setAdvance}
              />
            </div>
            <div className="flex justify-between items-center mb-2">
              <Text>Payment</Text>
              <Select
                value={paymentMethod}
                style={{ width: 120 }}
                onChange={setPaymentMethod}
                options={["Cash", "Card", "UPI"].map((v) => ({
                  value: v,
                  label: v,
                }))}
              />
            </div>
            <div className="flex justify-between items-center mb-2">
              <Text>Delivery</Text>
              <DatePicker
                value={expectedDelivery}
                onChange={setExpectedDelivery}
              />
            </div>
            <div className="flex justify-between">
              <Text>Balance</Text>
              <Text type="danger">₹{totalAmount - (advance || 0)}</Text>
            </div>
          </div>
        </Col>
      </Row>

      <div className="mt-3">
        <Input.TextArea
          rows={2}
          placeholder="Order note (fitting instructions, tint, etc.)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-3 mt-4">
        <Button onClick={() => navigate("/optical/orders")}>Cancel</Button>
        <Button type="primary" loading={saving} onClick={onSubmit}>
          Create Order
        </Button>
      </div>
    </Card>
  );
};

export default CreateOpticalOrder;
