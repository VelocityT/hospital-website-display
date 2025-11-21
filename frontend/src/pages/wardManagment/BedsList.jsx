import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getBedsByWardIdApi, deleteLastBedApi } from "../../services/apis";
import { Spin, Tooltip, Tag, Button, Modal, Row, Col, Pagination } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import AddBeds from "../components/wardComponents/AddBeds";
import BedInfo from "../components/wardComponents/BedInfo";
import { useSelector } from "react-redux";
import { FaBed, FaFileExcel } from "react-icons/fa";
import toast from "react-hot-toast";
import { exportToExcel } from "../../utils/exportToExcel";

const BedsList = () => {
  const { wardId } = useParams();
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addBedsModalOpen, setAddBedsModalOpen] = useState(false);
  const [ward, setWard] = useState(null);
  const [bedInfoModalOpen, setBedInfoModalOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);
  const [deleteLastBedModalOpen, setDeleteLastBedModalOpen] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const [total, setTotal] = useState(0);
  const user = useSelector((state) => state.user);

  const fetchBeds = async () => {
    setLoading(true);
    try {
      const res = await getBedsByWardIdApi(wardId, {
        page: pagination.current,
        limit: pagination.pageSize,
      });
      const sortedBeds = res.data.beds.sort(
        (a, b) => Number(a.bedNumber) - Number(b.bedNumber)
      );

      setBeds(sortedBeds);
      setWard(res.data.ward);
      setTotal(res.total || 0);
    } catch (err) {
      setWard(null);
      toast.error(err.message || "Failed to fetch beds.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (wardId) fetchBeds();
  }, [wardId, pagination.current, pagination.pageSize]);

  const handleDeleteLastBed = () => {
    setDeleteLastBedModalOpen(true);
  };

  const confirmDeleteLastBed = async () => {
    try {
      const res = await deleteLastBedApi(wardId);
      if (res.success) {
        toast.success(res.message || "Last bed deleted.");
        setBeds((prev) => prev.filter((b) => b._id !== res.data._id));
      } else {
        toast.error(res.message || "Failed to delete.");
      }
    } catch (err) {
      toast.error("Error deleting bed.");
    } finally {
      setDeleteLastBedModalOpen(false);
    }
  };

  const handleBedDeleteSuccess = (bedId) => {
    setBeds((prev) => prev.filter((b) => b._id !== bedId));
    setBedInfoModalOpen(false);
    setSelectedBed(null);
  };

  const handleExcelExport = () => {
    if (beds.length > 0) {
      const cleanData = beds.map((bed) => ({
        "Bed Number": bed?.bedNumber,
        Charge: bed?.charge,
        Status: bed?.status,
        Patient: bed?.patient?.fullName,
        "Ward Name": bed?.ward?.name,
        Floor: bed?.ward?.floor,
      }));
      exportToExcel(cleanData, "Bed_List.xlsx");
    } else {
      toast.apply("No data to export");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Spin size="large" />
      </div>
    );

  return (
    <>
      <Row align="middle" justify="space-between" className="mb-4">
        <Col>
          <h2 className="text-lg font-bold mb-0">
            {ward?.name || beds[0]?.ward?.name || "Beds"}
          </h2>
        </Col>
        {user?.role === "admin" && (
          <Col>
            <div className="flex gap-2 flex-wrap justify-end">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setAddBedsModalOpen(true)}
              >
                Add Beds
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleDeleteLastBed}
                disabled={beds.length === 0}
              >
                Delete Last Bed
              </Button>
              <Button icon={<FaFileExcel />} onClick={handleExcelExport}>
                Export
              </Button>
            </div>
          </Col>
        )}
      </Row>

      <Modal
        open={deleteLastBedModalOpen}
        onCancel={() => setDeleteLastBedModalOpen(false)}
        onOk={confirmDeleteLastBed}
        okText="Delete"
        okButtonProps={{ danger: true }}
        cancelText="Cancel"
        title={
          <span>
            <ExclamationCircleOutlined className="text-red-500 mr-2" />
            Confirm Delete Last Bed
          </span>
        }
      >
        <div>
          <p>Are you sure you want to delete the last bed in this ward?</p>
        </div>
      </Modal>

      <Modal
        title={`Add Beds ${ward?.name ? "to " + ward.name : ""}`}
        open={addBedsModalOpen}
        onCancel={() => setAddBedsModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <AddBeds
          ward={ward}
          setAddBedsModalOpen={setAddBedsModalOpen}
          setBeds={setBeds}
          beds={beds}
        />
      </Modal>

      <Modal
        title="Bed Info"
        open={bedInfoModalOpen}
        onCancel={() => setBedInfoModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <BedInfo
          bed={selectedBed}
          setBeds={setBeds}
          onDeleteSuccess={handleBedDeleteSuccess}
        />
      </Modal>

      {beds.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No beds found in this ward.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {beds.map((bed) => (
              <Tooltip
                title={ward.name}
                key={bed?._id}
                color={
                  bed?.status === "Available"
                    ? "#bbf7d0"
                    : bed?.status === "Occupied"
                    ? "#fecaca"
                    : "#fef08a"
                }
                styles={{
                  body: {
                    color: "#1f2937",
                  },
                }}
              >
                <div
                  className={`p-4 rounded-lg shadow-md text-center transition-all cursor-pointer min-w-[120px]
          border
          ${
            bed.status === "Available"
              ? "bg-green-100 dark:bg-green-900 border-green-400"
              : bed.status === "Occupied"
              ? "bg-red-100 dark:bg-red-900 border-red-400"
              : "bg-yellow-100 dark:bg-yellow-900 border-yellow-400"
          }`}
                  onClick={() => {
                    setSelectedBed(bed);
                    setBedInfoModalOpen(true);
                  }}
                >
                  <FaBed className="text-4xl mx-auto mb-2 text-gray-700 dark:text-gray-200" />
                  <div className="font-bold text-lg break-all text-gray-800 dark:text-white">
                    {bed.bedNumber}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    ₹{bed.charge || 0}
                  </div>
                  <Tag
                    className="mt-1"
                    color={
                      bed.status === "Available"
                        ? "green"
                        : bed.status === "Occupied"
                        ? "red"
                        : "gold"
                    }
                  >
                    {`${bed.status} (${bed?.bedType || "General"})`}
                  </Tag>
                </div>
              </Tooltip>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={total}
              showSizeChanger
              pageSizeOptions={["10", "20", "50", "100"]}
              onChange={(page, pageSize) => {
                setPagination({ current: page, pageSize });
              }}
            />
          </div>
        </>
      )}
    </>
  );
};

export default BedsList;
