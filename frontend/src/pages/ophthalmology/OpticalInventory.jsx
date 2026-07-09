import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Table,
  Tag,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import {
  createOrUpdateOpticalItemApi,
  deleteOpticalItemApi,
  getOpticalItemsApi,
} from "../../services/apis";
import useDebounce from "../../hooks/useDebounce";

const itemTypes = ["Frame", "Lens", "Contact Lens", "Sunglasses", "Accessory"];

const OpticalInventory = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const debouncedSearch = useDebounce(search, 500);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const res = await getOpticalItemsApi({
      search: debouncedSearch,
      itemType: typeFilter,
      page,
      limit: 20,
    });
    if (res.success) {
      setItems(res.data || []);
      setTotal(res.total || 0);
    } else {
      toast.error(res.message || "Failed to load items");
    }
    setLoading(false);
  }, [debouncedSearch, typeFilter, page]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openModal = (record = null) => {
    setEditing(record);
    if (record) {
      form.setFieldsValue({
        ...record,
        recDate: record.recDate ? dayjs(record.recDate) : undefined,
        invoiceDate: record.invoiceDate ? dayjs(record.invoiceDate) : undefined,
      });
    } else {
      form.resetFields();
    }
    setModalOpen(true);
  };

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      const res = await createOrUpdateOpticalItemApi({
        ...values,
        ...(editing && { _id: editing._id, edit: true }),
      });
      if (res.success) {
        toast.success(res.message);
        setModalOpen(false);
        fetchItems();
      } else {
        toast.error(res.message || "Failed to save");
      }
    } catch {
      /* validation */
    }
  };

  const onDelete = async (id) => {
    const res = await deleteOpticalItemApi(id);
    if (res.success) {
      toast.success("Item deleted");
      fetchItems();
    } else {
      toast.error(res.message || "Failed to delete");
    }
  };

  const columns = [
    {
      title: "Type",
      dataIndex: "itemType",
      render: (t) => <Tag>{t}</Tag>,
    },
    { title: "Name", dataIndex: "name" },
    { title: "Brand", dataIndex: "brand", render: (v) => v || "-" },
    { title: "Model", dataIndex: "model", render: (v) => v || "-" },
    {
      title: "Stock",
      dataIndex: "currentStock",
      render: (v) =>
        v > 5 ? v : <Tag color={v > 0 ? "orange" : "red"}>{v}</Tag>,
    },
    { title: "Cost", dataIndex: "costPrice", render: (v) => `₹${v}` },
    { title: "Sell", dataIndex: "sellPrice", render: (v) => `₹${v}` },
    {
      title: "Actions",
      render: (_, r) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => openModal(r)}>
            Edit
          </Button>
          <Popconfirm title="Delete this item?" onConfirm={() => onDelete(r._id)}>
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <Card
      title="Optical Inventory"
      className="dark:bg-neutral-900 dark:text-white"
      extra={
        <div className="flex gap-2">
          <Input.Search
            placeholder="Search name / brand / model"
            allowClear
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 240 }}
          />
          <Select
            placeholder="Type"
            allowClear
            style={{ width: 140 }}
            value={typeFilter}
            onChange={setTypeFilter}
            options={itemTypes.map((t) => ({ value: t, label: t }))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
            Add Item
          </Button>
        </div>
      }
    >
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={items}
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: setPage,
        }}
        scroll={{ x: true }}
      />

      <Modal
        title={editing ? "Edit Item" : "Add Optical Item"}
        open={modalOpen}
        onOk={onSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editing ? "Update" : "Add"}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item
                label="Item Type"
                name="itemType"
                rules={[{ required: true, message: "Required" }]}
              >
                <Select options={itemTypes.map((t) => ({ value: t, label: t }))} />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item
                label="Name"
                name="name"
                rules={[{ required: true, message: "Required" }]}
              >
                <Input placeholder="e.g. Titan Eyeplus Full Rim" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Brand" name="brand">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Model" name="model">
                <Input />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Size" name="size">
                <Input />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Color" name="color">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Cost Price"
                name="costPrice"
                rules={[{ required: true, message: "Required" }]}
              >
                <InputNumber className="w-full" min={0} prefix="₹" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Sell Price"
                name="sellPrice"
                rules={[{ required: true, message: "Required" }]}
              >
                <InputNumber className="w-full" min={0} prefix="₹" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="MRP" name="mrp">
                <InputNumber className="w-full" min={0} prefix="₹" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Stock" name="currentStock">
                <InputNumber className="w-full" min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Supplier" name="supplier">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Received Date" name="recDate">
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Card>
  );
};

export default OpticalInventory;
