import React, { useEffect, useState } from "react";
import {
  createAndUpdateWardApi,
  createWardTypesApi,
  getAllWardTypesApi,
  getAllWardsApi,
  deleteWardApi,
} from "../../services/apis";
import {
  Button,
  Alert,
  Modal,
  Form,
  Input,
  Space,
  message,
  Row,
  Col,
  Card,
  Table,
  Tag,
} from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import AddWard from "../components/wardComponents/AddWard";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import useDebounce from "../../hooks/useDebounce";
import { FaFileExcel } from "react-icons/fa";
import { exportToExcel } from "../../utils/exportToExcel";

const WardManagment = () => {
  const [wardTypes, setWardTypes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [fields, setFields] = useState([{ value: "" }]);
  const [loading, setLoading] = useState(false);

  const [addWardModalOpen, setAddWardModalOpen] = useState(false);
  const [addWardForm] = Form.useForm();

  const [wards, setWards] = useState([]);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const [total, setTotal] = useState(0);
  const debouncedSearch = useDebounce(search, 500);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [wardToDelete, setWardToDelete] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editingWard, setEditingWard] = useState(null);
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);

  useEffect(() => {
    const getAllWardTypes = async () => {
      try {
        const response = await getAllWardTypesApi();
        setWardTypes(response.data);
        if (response.data && response.data.length > 0) {
          setFields(response.data.map((type) => ({ value: type })));
        }
      } catch (error) {
        toast.error("Error fetching ward types:", error);
      }
    };
    getAllWardTypes();
  }, []);

  useEffect(() => {
    if (debouncedSearch && debouncedSearch.length < 2) return;
    if (wardTypes && wardTypes.length > 0) {
      const fetchWards = async () => {
        try {
          const response = await getAllWardsApi({
            search: debouncedSearch,
            page: pagination.current,
            limit: pagination.pageSize,
          });
          const sorted = (response.data || [])
            .slice()
            .sort((a, b) =>
              (a.name || "")
                .toLowerCase()
                .localeCompare((b.name || "").toLowerCase())
            );
          setWards(sorted);
          setTotal(response.count || 0);
        } catch (error) {
          setWards([]);
          setTotal(0);
        }
      };
      fetchWards();
    }
  }, [wardTypes, debouncedSearch, pagination.current, pagination.pageSize]);

  const handleAddField = () => {
    setFields([...fields, { value: "" }]);
  };

  const handleRemoveField = (idx) => {
    if (fields.length === 1) return;
    setFields(fields.filter((_, i) => i !== idx));
  };

  const handleFieldChange = (idx, val) => {
    const newFields = [...fields];
    newFields[idx].value = val;
    setFields(newFields);
  };

  const handleSaveWardTypes = async (wardTypesArr) => {
    try {
      setLoading(true);
      const response = await createWardTypesApi({ wardTypesArr });
      setWardTypes(response.data);
      toast.success("Ward types saved successfully!");
      setModalOpen(false);
      setFields([{ value: "" }]);
    } catch (err) {
      toast.error("Failed to save ward types.");
    } finally {
      setLoading(false);
    }
  };

  const handleModalOk = async () => {
    const values = fields.map((f) => f.value.trim()).filter(Boolean);
    if (values.length === 0) {
      toast.error("Please add at least one ward type.");
      setLoading(false);
      return;
    }
    await handleSaveWardTypes(values);
  };

  const handleAddWard = () => {
    addWardForm.resetFields();
    setEditMode(false);
    setEditingWard(null);
    setAddWardModalOpen(true);
  };

  const handleEditWard = (ward) => {
    setEditMode(true);
    setEditingWard(ward);
    addWardForm.setFieldsValue({
      name: ward.name,
      type: ward.type,
      floor: ward.floor,
      isActive: ward.isActive,
    });
    setAddWardModalOpen(true);
  };

  const handleAddWardOk = async () => {
    try {
      const values = await addWardForm.validateFields();
      let response;
      if (editMode && editingWard) {
        response = await createAndUpdateWardApi({
          ...values,
          wardId: editingWard._id,
        });
        if (response.success) {
          setWards((prev) =>
            prev.map((w) =>
              w._id === editingWard._id ? { ...w, ...response.ward } : w
            )
          );
          toast.success("Ward updated successfully!");
        } else {
          toast.error(response.message || "Failed to update ward.");
        }
      } else {
        response = await createAndUpdateWardApi(values);
        setWards((prev) =>
          [...prev, response.ward].sort((a, b) =>
            (a.name || "")
              .toLowerCase()
              .localeCompare((b.name || "").toLowerCase())
          )
        );
        toast.success("Ward added successfully!");
      }
      setAddWardModalOpen(false);
      addWardForm.resetFields();
      setEditMode(false);
      setEditingWard(null);
    } catch (err) {
      toast.error(editMode ? "Failed to update ward." : "Failed to add ward.");
    }
  };

  const handleOpenUpdateWardTypes = () => {
    setFields(wardTypes.map((type) => ({ value: type })));
    setModalOpen(true);
  };

  const handleDeleteWard = async () => {
    if (!wardToDelete?._id) return;
    try {
      const res = await deleteWardApi(wardToDelete._id);
      if (res.success) {
        toast.success("Ward deleted successfully!");
        setWards((prev) => prev.filter((w) => w._id !== wardToDelete._id));
      } else {
        toast.error(res.message || "Failed to delete ward.");
      }
    } catch (err) {
      toast.error("Failed to delete ward.");
    } finally {
      setDeleteModalOpen(false);
      setWardToDelete(null);
    }
  };

  const handleExcelExport = () => {
    if (wards.length>0) {
      const cleanData = wards.map((ward) => ({
        Name: ward?.name,
        Type: ward?.type,
        Floor: ward?.floor,
        Status: ward?.isActive ? "Available" : "Not Available",
      }));
      exportToExcel(cleanData, "Ward_List.xlsx");
    } else {
      toast.apply("No data to export");
    }
  };

  if (!wardTypes || wardTypes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] overflow-hidden">
        <Alert
          message="Please add Ward Types before creating wards or beds."
          type="info"
          showIcon
          className="mb-4"
        />

        <Button type="primary" onClick={() => setModalOpen(true)}>
          Add Ward Types
        </Button>

        <Modal
          title="Ward Types"
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          onOk={handleModalOk}
          confirmLoading={loading}
          okText="Save"
        >
          <p className="text-sm text-gray-600 mb-4">
            Example: General, ICU, Private, etc.
          </p>

          <Form form={form} layout="vertical">
            {fields.map((field, idx) => (
              <Space key={idx} className="mb-3 w-full" align="start">
                <Input
                  placeholder={`Type #${idx + 1}`}
                  value={field.value}
                  onChange={(e) => handleFieldChange(idx, e.target.value)}
                />
                {fields.length > 1 && (
                  <Button
                    danger
                    type="text"
                    onClick={() => handleRemoveField(idx)}
                  >
                    Remove
                  </Button>
                )}
              </Space>
            ))}

            <Button type="dashed" block onClick={handleAddField}>
              + Add Another Type
            </Button>
          </Form>
        </Modal>
      </div>
    );
  }

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <span
          style={{
            color: "#1677ff",
            cursor: "pointer",
            textDecoration: "underline",
          }}
          onClick={() => navigate(`/wards/beds/${record._id}`)}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "Floor",
      dataIndex: "floor",
      key: "floor",
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) =>
        isActive ? (
          <Tag color="green">Active</Tag>
        ) : (
          <Tag color="red">Inactive</Tag>
        ),
    },
    ...(user?.role === "admin"
      ? [
          {
            title: "Actions",
            key: "actions",
            render: (_, item) => (
              <Space>
                <Button
                  icon={<EditOutlined />}
                  size="small"
                  type="text"
                  onClick={() => handleEditWard(item)}
                  title="Edit"
                />
                <Button
                  icon={<DeleteOutlined />}
                  size="small"
                  type="text"
                  danger
                  onClick={() => {
                    setWardToDelete(item);
                    setDeleteModalOpen(true);
                  }}
                  title="Delete"
                />
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <Row
        gutter={[8, 16]}
        align="middle"
        justify="end"
        className="mb-4 overflow-hidden"
      >
        <Col
          xs={24}
          sm="auto"
          className="flex flex-wrap gap-2 justify-end overflow-hidden"
        >
          {user?.role === "admin" && (
            <>
              <Button onClick={handleOpenUpdateWardTypes} className="mb-2">
                Update Ward Types
              </Button>
              <Button type="primary" onClick={handleAddWard} className="mb-2">
                Add Ward
              </Button>
              <Button icon={<FaFileExcel />} onClick={handleExcelExport}>
                Export
              </Button>
            </>
          )}
        </Col>
      </Row>
      <Card className="m-0">
        <Row
          align="middle"
          justify="space-between"
          className="mb-6 overflow-hidden"
        >
          <Col xs={24} sm={12}>
            <h2 className="text-lg font-bold mb-0">Ward</h2>
          </Col>
          <Col xs={24} sm={12} className="flex justify-end">
            <Input.Search
              allowClear
              placeholder="Search by ward name"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((prev) => ({ ...prev, current: 1 }));
              }}
              style={{ width: "100%", maxWidth: 220 }}
              className="mb-2"
            />
          </Col>
        </Row>
        <div className="mb-6">
          <Table
            columns={columns}
            dataSource={wards}
            rowKey="_id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: total,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              onChange: (page, pageSize) => {
                setPagination({ current: page, pageSize });
              },
            }}
            locale={{ emptyText: "No wards found." }}
            scroll={{ x: "max-content" }}
          />
        </div>

        <Modal
          title="Update Ward Types"
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          onOk={handleModalOk}
          confirmLoading={loading}
          okText="Update"
        >
          <p className="text-sm text-gray-600 mb-4">
            Example: General, ICU, Private, etc.
          </p>
          <Form form={form} layout="vertical">
            {fields.map((field, idx) => (
              <Space key={idx} className="mb-3 w-full" align="start">
                <Input
                  placeholder={`Type #${idx + 1}`}
                  value={field.value}
                  onChange={(e) => handleFieldChange(idx, e.target.value)}
                />
                {fields.length > 1 && (
                  <Button
                    danger
                    type="text"
                    onClick={() => handleRemoveField(idx)}
                  >
                    Remove
                  </Button>
                )}
              </Space>
            ))}
            <Button type="dashed" block onClick={handleAddField}>
              + Add Another Type
            </Button>
          </Form>
        </Modal>

        <AddWard
          open={addWardModalOpen}
          onCancel={() => {
            setAddWardModalOpen(false);
            setEditMode(false);
            setEditingWard(null);
          }}
          onOk={handleAddWardOk}
          form={addWardForm}
          wardTypes={wardTypes}
        />

        <Modal
          open={deleteModalOpen}
          onCancel={() => setDeleteModalOpen(false)}
          onOk={handleDeleteWard}
          okText="Delete"
          okButtonProps={{ danger: true }}
          cancelText="Cancel"
        >
          <div>
            <p>
              Are you sure you want to delete <b>{wardToDelete?.name}</b>?
            </p>
            <p className="text-red-500 font-semibold">
              All beds related to this ward will be deleted!
            </p>
          </div>
        </Modal>
      </Card>
    </div>
  );
};

export default WardManagment;
