import { useState, useEffect } from "react";
import {
  Table,
  Card,
  Tooltip,
  Space,
  Button,
  Tag,
  Input,
  Upload,
  Modal,
} from "antd";
import { EditOutlined, UploadOutlined } from "@ant-design/icons";
import { FaFileExcel } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  getAllMedicinesApi,
  deleteMedicineApi,
  uploadMedicineExcelApi,
} from "../../services/apis";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import useDebounce from "../../hooks/useDebounce";
import { exportToExcel } from "../../utils/exportToExcel";

const MedicineList = () => {
  const user = useSelector((state) => state?.user);
  const [loading, setLoading] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filteredInfo, setFilteredInfo] = useState({ isDeleted: [false] });
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const debouncedSearchText = useDebounce(searchText, 500);
  const [total, setTotal] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    if (debouncedSearchText && debouncedSearchText.length < 2) return;
    const fetchMedicines = async () => {
      setLoading(true);
      const res = await getAllMedicinesApi({
        search: debouncedSearchText,
        page: pagination.current,
        limit: pagination.pageSize,
      });
      setMedicines(Array.isArray(res?.data) ? res.data : []);
      setTotal(res?.total || 0);
      setLoading(false);
    };
    fetchMedicines();
  }, [debouncedSearchText, pagination.current, pagination.pageSize]);

  const handleDeleteMedicine = (record) => {
    setSelectedMedicine(record);
    setDeleteModalVisible(true);
  };
  const confirmDelete = async () => {
    if (!selectedMedicine) return;

    try {
      const response = await deleteMedicineApi(selectedMedicine._id);
      if (response?.success) {
        toast.success(response.message);
        setMedicines((prev) =>
          prev.map((med) =>
            med._id === selectedMedicine._id
              ? { ...med, isDeleted: !med.isDeleted }
              : med
          )
        );
        setDeleteModalVisible(false);
        setSelectedMedicine(null);
      } else {
        toast.error(response.message || "Failed to update status");
      }
    } catch (error) {
      toast.error(error.message || "Server error");
    }
  };

  const handleBulkMedicineUpload = async (file, onSuccess, onError) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await uploadMedicineExcelApi(formData);
      if (response?.success) {
        toast.success("Medicines imported successfully");
        setMedicines((prev) => [
          ...prev,
          ...(response?.data?.savedMedicines || []),
        ]);
        onSuccess("Ok");
      } else {
        toast.error(response?.data?.message || "Import failed");
        onError("Error");
      }
    } catch (error) {
      toast.error("Failed to upload file");
      onError("Upload Error");
    }
  };

  const handleExcelExport = () => {
    if (medicines.length > 0) {
      const cleanData = medicines.map((medicine) => ({
        Name: medicine?.name,
        Category: medicine?.category,
        Unit: medicine?.unit,
        Manufacturer: medicine?.manufacturer,
        "Cost Price": medicine?.costPrice,
        "Sell Price": medicine?.sellPrice,
        Status: medicine?.isDeleted ? "Not Available" : "Available",
      }));
      exportToExcel(cleanData, "Medicine_List.xlsx");
    } else {
      toast.apply("No data to export");
    }
  };

  const columns = [
    {
      title: "S. No.",
      key: "serial",
      render: (text, record, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    { title: "Name", dataIndex: "name" },
    { title: "Category", dataIndex: "category" },
    { title: "Unit", dataIndex: "unit" },
    { title: "Manufacturer", dataIndex: "manufacturer" },
    {
      title: "Cost Price",
      dataIndex: "costPrice",
      render: (v) => v?.toFixed(2),
    },
    {
      title: "Sell Price",
      dataIndex: "sellPrice",
      render: (v) => v?.toFixed(2),
    },
    {
      title: "Status",
      dataIndex: "isDeleted",
      filters: [
        { text: "Active", value: false },
        { text: "Deleted", value: true },
      ],
      filteredValue: filteredInfo.isDeleted || null,
      onFilter: (value, record) => record.isDeleted === value,
      render: (isDeleted, record) => (
        <Tag
          color={isDeleted ? "red" : "green"}
          onClick={() => handleDeleteMedicine(record)}
          className="cursor-pointer transition-transform duration-200 hover:scale-110"
        >
          {isDeleted ? "Deleted" : "Active"}
        </Tag>
      ),
    },
    { title: "Stock", dataIndex: "currentStock" },
    ["admin", "pharmacist"].includes(user?.role) && {
      title: "Action",
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <EditOutlined
              className="text-green-500 cursor-pointer"
              onClick={() =>
                navigate(`/pharmacy/medicine/edit/${record._id}`, {
                  state: record,
                })
              }
            />
          </Tooltip>
        </Space>
      ),
    },
  ].filter(Boolean);

  return (
    <div>
      {["admin", "pharmacist"].includes(user?.role) && (
        <div className="flex flex-col sm:flex-row justify-end gap-2 mb-3 overflow-hidden">
          <Button
            type="primary"
            onClick={() => navigate("/pharmacy/medicine/add")}
          >
            + New Medicine
          </Button>
          <Upload
            accept=".xlsx, .xls"
            showUploadList={false}
            customRequest={({ file, onSuccess, onError }) =>
              handleBulkMedicineUpload(file, onSuccess, onError)
            }
          >
            <Button icon={<UploadOutlined />}>Import Excel</Button>
          </Upload>
          <Button icon={<FaFileExcel />} onClick={handleExcelExport}>
            Export
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4">
        <h2 className="text-lg sm:text-xl font-semibold">All Medicines</h2>
        <Input.Search
          placeholder="Search by medicine name"
          allowClear
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setPagination((prev) => ({ ...prev, current: 1 }));
          }}
          className="w-full sm:w-72"
        />
      </div>

      <Card>
        <Table
          rowKey={(record) => record._id}
          columns={columns}
          dataSource={medicines}
          loading={loading}
          scroll={{ x: "max-content" }}
          onChange={(paginationObj, filters) => {
            setFilteredInfo(filters);
            setPagination({
              current: paginationObj.current,
              pageSize: paginationObj.pageSize,
            });
          }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
        />
      </Card>
      <Modal
        zIndex={9999}
        title={`Are you sure you want to ${
          selectedMedicine?.isDeleted ? "restore" : "delete"
        } this medicine?`}
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        onOk={confirmDelete}
        okText="Yes"
        okType="danger"
        cancelText="Cancel"
      >
        <p>Medicine: {selectedMedicine?.name}</p>
      </Modal>
    </div>
  );
};

export default MedicineList;
