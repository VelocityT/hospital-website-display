import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Typography,
  Divider,
  Form,
  Select,
  Input,
  Button,
  AutoComplete,
  Spin,
  InputNumber,
} from "antd";
import { medicineCategories } from "../../utils/localStorage";
import { createMedicinesOrderApi, searchMedcineApi } from "../../services/apis";
import useDebounce from "../../hooks/useDebounce";
import toast from "react-hot-toast";
import { useForm } from "antd/es/form/Form";

const { Title, Text } = Typography;

const CreateMedicineOrder = () => {
  const [form] = useForm();
  const { state: patientRecord } = useLocation();
  const navigate = useNavigate();
  const [medicinesList, setMedicinesList] = useState([]);
  const [autoCategory, setAutoCategory] = useState(null);
  const [maxQuantity, setMaxQuantity] = useState(0);
  const [searchTermMedicine, setSearchTermMedicine] = useState("");
  const debouncedSearchMedicine = useDebounce(searchTermMedicine, 500);
  const [medicineOptions, setMedicineOptions] = useState([]);
  const [isLoadingMedicine, setIsLoadingMedicine] = useState(false);

  const handleMedicineChange = (name) => {
    const selected = medicineOptions?.find((med) => med.name === name);
    if (selected) {
      setAutoCategory(selected.category);
      setMaxQuantity(selected.currentStock || 0);
      form.setFieldsValue({
        medicineCategory: selected.category,
        sellPrice: selected?.sellPrice,
        unit: selected?.unit,
        medicine: name,
        quantity: undefined,
        medicineId: selected._id,
      });
    } else {
      setAutoCategory("");
      setMaxQuantity(0);
      form.setFieldsValue({
        medicineCategory: undefined,
        medicine: name,
        quantity: undefined,
        sellPrice: selected?.sellPrice,
        unit: undefined,
        medicineId: undefined,
      });
    }
  };

  useEffect(() => {
    if (debouncedSearchMedicine.length >= 2) {
      handleMedicineSearch(debouncedSearchMedicine);
    } else {
      setMedicineOptions([]);
    }
  }, [debouncedSearchMedicine]);

  const handleMedicineSearch = async (name) => {
    try {
      setIsLoadingMedicine(true);
      const res = await searchMedcineApi({ name, forPharmacy: true });
      setMedicineOptions(res?.data || []);
    } catch (err) {
      setMedicineOptions([]);
    } finally {
      setIsLoadingMedicine(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const cleanedMedicinesList = medicinesList.map((item) => ({
        medicineId: item.medicineId,
        medicine: item.medicine || "",
        medicineCategory: item.medicineCategory || "",
        quantity: item.quantity || "",
        sellPrice: item?.sellPrice,
        unit: item?.unit || "",
      }));

      const patientData = {
        ipd: patientRecord?.ipd,
        opd: patientRecord?.opd,
        patientId: patientRecord?.patient,
        patientType: patientRecord?.patientType,
      };

      const response = await createMedicinesOrderApi({
        medicinesList: cleanedMedicinesList,
        patientData,
      });

      if (response.success) {
        toast.success("Medicine order created successfully");
        setMedicinesList([]);
        navigate(-1);
      } else {
        toast.error(response.message || "Something went wrong");
      }
    } catch (error) {
      toast.error("Failed to create medicine order");
      // console.error(error);
    }
  };

  const handleAddMedicine = () => {
    form
      .validateFields([
        "medicine",
        "medicineCategory",
        "quantity",
        "sellPrice",
        "unit",
        "medicineId",
      ])
      .then((values) => {
        if (!values.medicine) {
          toast.error("Please select a medicine");
          return;
        }
        if (!values.quantity || values.quantity <= 0) {
          toast.error("Quantity must be greater than 0");
          return;
        }

        setMedicinesList((prev) => [
          ...prev,
          {
            ...values,
          },
        ]);
        form.resetFields([
          "medicine",
          "medicineCategory",
          "unit",
          "sellPrice",
          "quantity",
          "medicineId",
        ]);
        setSearchTermMedicine("");
        setAutoCategory(null);
        setMaxQuantity(0);
      })
      .catch(() => {});
  };

  const handleRemoveMedicine = (idx) => {
    setMedicinesList((prev) => prev.filter((_, i) => i !== idx));
  };

  if (!patientRecord) return null;

  const { opd, ipd, ...patient } = patientRecord;

  return (
    <>
      <Card className="mb-4">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Title level={5}>
              OPD/IPD No: <Text strong>{opd || ipd || "-"}</Text>
            </Title>
            <p>
              <b>Patient ID:</b> {patient?.patientId}
            </p>
            <p>
              <b>Name:</b> {patient?.fullName}
            </p>
          </Col>
        </Row>
      </Card>

      <Card className="mb-4" title="Add Medicine">
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="Medicine" name="medicine">
                <AutoComplete
                  onSearch={setSearchTermMedicine}
                  onSelect={handleMedicineChange}
                  onChange={(val) => {
                    handleMedicineChange(val);
                    form.setFieldsValue({ medicine: val });
                  }}
                  placeholder="Type or select medicine"
                  options={medicineOptions.map((med) => ({
                    key: med._id,
                    label: `${med.name} (${med.unit})`,
                    value: med.name,
                    medicineId: med._id,
                  }))}
                  allowClear
                  notFoundContent={
                    isLoadingMedicine ? <Spin size="small" /> : null
                  }
                />
              </Form.Item>
            </Col>
            <Form.Item name="medicineId" hidden>
              <Input />
            </Form.Item>
            <Col span={6}>
              <Form.Item label="Category" name="medicineCategory">
                <Select
                  placeholder="Select category"
                  value={autoCategory}
                  onChange={(value) => setAutoCategory(value)}
                >
                  {medicineCategories.map((cat) => (
                    <Select.Option key={cat.code} value={cat.code}>
                      {cat.code}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                label="Quantity"
                name="quantity"
                rules={[{ required: true, message: "Please enter quantity" }]}
              >
                <InputNumber
                  min={1}
                  max={maxQuantity || 99}
                  placeholder={`Max: ${maxQuantity}`}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Unit" name="unit">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item shouldUpdate>
                {({ getFieldValue }) => (
                  <Form.Item label="Sell Price" name="sellPrice">
                    <InputNumber
                      min={1}
                      precision={2}
                      style={{ width: "100%" }}
                      disabled={!!getFieldValue("medicineId")}
                    />
                  </Form.Item>
                )}
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end">
            <Button type="primary" onClick={handleAddMedicine}>
              Add Medicine
            </Button>
          </Row>

          {medicinesList.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <Divider>Medicines Added</Divider>
              {medicinesList.map((med, idx) => (
                <Row
                  key={idx}
                  gutter={8}
                  align="middle"
                  style={{ marginBottom: 8 }}
                >
                  <Col flex="auto">
                    <b>{med.medicine}</b> | {med.medicineCategory} | Qty:{" "}
                    {med.quantity} {med.unit} | ₹{med.sellPrice.toFixed(2)} x{" "}
                    {med.quantity} = ₹
                    {(med.sellPrice * med.quantity).toFixed(2)}
                  </Col>
                  <Col>
                    <Button
                      danger
                      size="small"
                      onClick={() => handleRemoveMedicine(idx)}
                    >
                      Remove
                    </Button>
                  </Col>
                </Row>
              ))}
            </div>
          )}
        </Form>
      </Card>
      <Row justify="end">
        <Button type="primary" onClick={handleSubmit}>
          Submit
        </Button>
      </Row>
    </>
  );
};

export default CreateMedicineOrder;
