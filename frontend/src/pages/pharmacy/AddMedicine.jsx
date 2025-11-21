import { useState, useEffect } from "react";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Card,
  Row,
  Col,
  Divider,
  Upload,
  DatePicker,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { medicineCategories, units } from "../../utils/localStorage";
import { createOrUpdateMedicineApi } from "../../services/apis";
import { toast } from "react-hot-toast";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import dayjs from "dayjs";

const AddMedicine = ({ isEdit }) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  useEffect(() => {
    if (isEdit && location.state) {
      const {
        name,
        category,
        unit,
        manufacturer,
        costPrice,
        purchasePrice,
        sellPrice,
        mrp,
        recDate,
        batch,
        manufactureDate,
        expiryDate,
        supplier,
        invoiceNo,
        invoiceDate,
        currentStock,
      } = location.state;

      form.setFieldsValue({
        name,
        category,
        unit,
        manufacturer,
        costPrice,
        purchasePrice,
        sellPrice,
        mrp,
        recDate: recDate ? dayjs(recDate) : null,
        batch,
        manufactureDate: manufactureDate ? dayjs(manufactureDate) : null,
        expiryDate: expiryDate ? dayjs(expiryDate) : null,
        supplier,
        invoiceNo,
        invoiceDate: invoiceDate ? dayjs(invoiceDate) : null,
        currentStock,
      });
    }
  }, [isEdit, location.state, form]);

  const onFinish = async (values) => {
    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      if (value && value.$d) {
        formData.append(key, value.toISOString());
      } else if (key !== "photo") {
        formData.append(key, value);
      }
    });

    if (isEdit && id) {
      formData.append("_id", id);
    }

    if (fileList.length > 0) {
      formData.append("medicinePhoto", fileList[0].originFileObj);
    }

    try {
      const res = await createOrUpdateMedicineApi(formData);

      if (res?.success) {
        toast.success(res.message);
        form.resetFields();
        setFileList([]);
        navigate("/pharmacy");
      } else {
        toast.error(res?.message || "Failed to save medicine");
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save medicine"
      );
    }
  };

  const normFile = (e) => (Array.isArray(e) ? e : e?.fileList);

  return (
    <div className="w-full max-w-7xl mx-auto pb-8">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
        {isEdit ? "Edit Medicine" : "Add New Medicine"}
      </h2>
      <Card variant="borderless" className="shadow-md rounded-lg">
        <Form
          layout="vertical"
          form={form}
          onFinish={onFinish}
          onFinishFailed={() =>
            toast.error("Please fill all required fields correctly.")
          }
          size="large"
          style={{ marginTop: 16 }}
        >
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="Medicine Name"
                rules={[{ required: true }]}
              >
                <Input placeholder="Enter medicine name" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12} lg={6}>
              <Form.Item
                name="category"
                label="Medicine Category"
                rules={[{ required: true }]}
              >
                <Select
                  showSearch
                  allowClear
                  placeholder="Select category"
                  filterOption={(input, option) =>
                    option?.value?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {medicineCategories.map((cat) => (
                    <Select.Option key={cat.code} value={cat.code}>
                      {cat.code}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Form.Item name="unit" label="Unit" rules={[{ required: true }]}>
                <Select
                  showSearch
                  allowClear
                  placeholder="Select unit"
                  filterOption={(input, option) =>
                    option?.value?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {units.map((u) => (
                    <Select.Option key={u.code} value={u.code}>
                      {u.code}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="manufacturer"
                label="Manufacturer"
                rules={[{ required: true }]}
              >
                <Input placeholder="Enter manufacturer name" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Form.Item name="supplier" label="Supplier">
                <Input placeholder="Enter supplier name" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Form.Item name="batch" label="Batch No.">
                <Input placeholder="Enter batch number" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Form.Item
                name="costPrice"
                label="Cost Price"
                rules={[{ required: true }]}
              >
                <InputNumber
                  min={0}
                  className="w-full"
                  placeholder="Buy price"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Form.Item
                name="purchasePrice"
                label="Purchase Price"
                rules={[{ required: true }]}
              >
                <InputNumber
                  min={0}
                  className="w-full"
                  placeholder="Purchase price"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Form.Item
                name="sellPrice"
                label="Selling Price"
                rules={[{ required: true }]}
              >
                <InputNumber
                  min={0}
                  className="w-full"
                  placeholder="Selling price"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Form.Item name="mrp" label="MRP" rules={[{ required: true }]}>
                <InputNumber min={0} className="w-full" placeholder="MRP" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12} lg={6}>
              <Form.Item
                name="recDate"
                label="Received Date"
                rules={[{ required: true }]}
              >
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12} lg={6}>
              <Form.Item name="manufactureDate" label="Manufacture Date">
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12} lg={6}>
              <Form.Item
                name="expiryDate"
                label="Expiry Date"
                rules={[{ required: true }]}
              >
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12} lg={6}>
              <Form.Item name="invoiceNo" label="Invoice Number">
                <Input placeholder="Enter invoice number" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12} lg={6}>
              <Form.Item name="invoiceDate" label="Invoice Date">
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12} lg={6}>
              <Form.Item
                name="currentStock"
                label="Current Stock"
                required
                rules={[{ required: true }]}
              >
                <InputNumber
                  min={0}
                  className="w-full"
                  placeholder="Current stock"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={6} className="hidden">
              <Form.Item
                name="photo"
                label="Medicine Photo"
                valuePropName="fileList"
                getValueFromEvent={normFile}
                extra="Upload a clear image, max size 2MB"
              >
                <Upload
                  name="photo"
                  listType="picture"
                  beforeUpload={(file) => {
                    const isLt2M = file.size / 1024 / 1024 < 2;
                    if (!isLt2M) {
                      return Upload.LIST_IGNORE;
                    }
                    return false;
                  }}
                  fileList={fileList}
                  onChange={({ fileList: newList }) => setFileList(newList)}
                  maxCount={1}
                  accept="image/*"
                >
                  <Button icon={<UploadOutlined />}>Select Photo</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Divider />
          <Form.Item style={{ textAlign: "right" }}>
            <Button type="primary" htmlType="submit" size="large">
              {isEdit ? "Update Medicine" : "Add Medicine"}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AddMedicine;
