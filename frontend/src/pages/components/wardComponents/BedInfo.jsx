import { useState } from "react";
import { Descriptions, Tag } from "antd";
import { toast } from "react-hot-toast";
import { changeBedStatusApi } from "../../../services/apis";
import { useSelector } from "react-redux";

const BedInfo = ({ bed, setBeds }) => {
  const user = useSelector(state=>state?.user)
  const [loading, setLoading] = useState(false);
  const [bedStatus, setBedStatus] = useState(bed?.status || "Available");

  const handleStatusToggle = async () => {
    if (bedStatus === "Occupied") return; // prevent status change for Occupied

    const newStatus = bedStatus === "Available" ? "Maintenance" : "Available";

    setLoading(true);
    try {
      const res = await changeBedStatusApi({ bedId: bed._id, status: newStatus });
      if (res.success) {
        toast.success(res.message || "Status updated");
        setBedStatus(newStatus);

        if (typeof setBeds === "function") {
          setBeds(prev =>
            prev.map(b => (b._id === bed._id ? { ...b, status: newStatus } : b))
          );
        }
      } else {
        toast.error(res.message || "Failed to update status");
      }
    } catch (err) {
      toast.error("Error updating status");
    } finally {
      setLoading(false);
    }
  };

  if (!bed) return null;

  return (
    <Descriptions bordered column={1} size="middle">
      <Descriptions.Item label="Bed Number">
        {`${bed.bedNumber} (${bed?.bedType || "General"})` ?? <span className="text-gray-400">-</span>}
      </Descriptions.Item>

      <Descriptions.Item label="Charge">
        {bed.charge !== undefined && bed.charge !== null ? (
          `₹${bed.charge}`
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </Descriptions.Item>

      <Descriptions.Item label="Status">
        <div
          onClick={()=>["admin"].includes(user?.role) && handleStatusToggle()}
          style={{
            cursor: bedStatus !== "Occupied" ? "pointer" : "not-allowed",
            display: "inline-block",
            transform: bedStatus !== "Occupied" ? "scale(1)" : "none",
            transition: "transform 0.2s",
          }}
          onMouseEnter={e => {
            if (bedStatus !== "Occupied") e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={e => {
            if (bedStatus !== "Occupied") e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <Tag
            color={
              bedStatus === "Available"
                ? "green"
                : bedStatus === "Occupied"
                ? "red"
                : "gold"
            }
            style={{ userSelect: "none", pointerEvents: loading ? "none" : "auto" }}
          >
            {loading ? "Updating..." : bedStatus}
          </Tag>
        </div>
      </Descriptions.Item>

      <Descriptions.Item label="Ward Name">
        {bed.ward?.name ?? <span className="text-gray-400">-</span>}
      </Descriptions.Item>

      <Descriptions.Item label="Ward Floor">
        {bed.ward?.floor ?? <span className="text-gray-400">-</span>}
      </Descriptions.Item>

      <Descriptions.Item label="Patient Name">
        {bed.patient?.fullName ?? <span className="text-gray-400">-</span>}
      </Descriptions.Item>

      <Descriptions.Item label="Patient ID">
        {bed.patient?.patientId ?? <span className="text-gray-400">-</span>}
      </Descriptions.Item>
    </Descriptions>
  );
};

export default BedInfo;
