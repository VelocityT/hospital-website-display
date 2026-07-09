import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Input,
  InputNumber,
  Modal,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import {
  getOpticalOrdersApi,
  updateOpticalOrderStatusApi,
} from "../../services/apis";
import useDebounce from "../../hooks/useDebounce";

const { Text } = Typography;

const statusColor = {
  Ordered: "orange",
  Lab: "blue",
  Ready: "purple",
  Delivered: "green",
  Cancelled: "red",
};

const nextStatuses = {
  Ordered: ["Lab", "Ready", "Cancelled"],
  Lab: ["Ready", "Cancelled"],
  Ready: ["Delivered", "Cancelled"],
  Delivered: [],
  Cancelled: [],
};

const OpticalOrders = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(undefined);
  const debouncedSearch = useDebounce(search, 500);

  const [updateModal, setUpdateModal] = useState(null); // { order, status }
  const [collectAmount, setCollectAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [updating, setUpdating] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const res = await getOpticalOrdersApi({
      search: debouncedSearch,
      status: statusFilter,
      page,
      limit: 20,
    });
    if (res.success) {
      setOrders(res.data || []);
      setTotal(res.total || 0);
    } else {
      toast.error(res.message || "Failed to load orders");
    }
    setLoading(false);
  }, [debouncedSearch, statusFilter, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const openUpdate = (order, status) => {
    setUpdateModal({ order, status });
    const balance = order.totalAmount - order.advanceAmount;
    setCollectAmount(status === "Delivered" ? balance : 0);
  };

  const onUpdate = async () => {
    setUpdating(true);
    const res = await updateOpticalOrderStatusApi(updateModal.order._id, {
      status: updateModal.status,
      collectAmount: collectAmount || 0,
      paymentMethod,
    });
    setUpdating(false);
    if (res.success) {
      toast.success("Order updated");
      setUpdateModal(null);
      fetchOrders();
    } else {
      toast.error(res.message || "Failed to update");
    }
  };

  const columns = [
    { title: "Order No.", dataIndex: "orderNumber" },
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
      title: "Items",
      render: (_, r) =>
        r.items?.map((it, i) => (
          <div key={i} className="text-xs">
            {it.name} × {it.quantity}
          </div>
        )),
    },
    {
      title: "Total / Balance",
      render: (_, r) => (
        <div>
          <div>₹{r.totalAmount}</div>
          {r.totalAmount - r.advanceAmount > 0 ? (
            <Text type="danger" className="text-xs">
              Bal: ₹{r.totalAmount - r.advanceAmount}
            </Text>
          ) : (
            <Tag color="green">Paid</Tag>
          )}
        </div>
      ),
    },
    {
      title: "Delivery",
      render: (_, r) =>
        r.expectedDelivery
          ? dayjs(r.expectedDelivery).format("DD MMM YYYY")
          : "-",
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
          {(nextStatuses[r.status] || []).map((s) => (
            <Button
              key={s}
              size="small"
              danger={s === "Cancelled"}
              type={s === "Delivered" ? "primary" : "default"}
              onClick={() => openUpdate(r, s)}
            >
              {s}
            </Button>
          ))}
        </div>
      ),
    },
  ];

  return (
    <Card
      title="Optical Orders"
      className="dark:bg-neutral-900 dark:text-white"
      extra={
        <div className="flex gap-2">
          <Input.Search
            placeholder="Order number"
            allowClear
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 180 }}
          />
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 140 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={Object.keys(statusColor).map((s) => ({
              value: s,
              label: s,
            }))}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/optical/order/new")}
          >
            New Order
          </Button>
        </div>
      }
    >
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={orders}
        loading={loading}
        pagination={{ current: page, total, pageSize: 20, onChange: setPage }}
        scroll={{ x: true }}
      />

      <Modal
        title={`Mark as ${updateModal?.status}`}
        open={!!updateModal}
        onOk={onUpdate}
        confirmLoading={updating}
        onCancel={() => setUpdateModal(null)}
      >
        {updateModal && (
          <>
            <p className="mb-3">
              Order <b>{updateModal.order.orderNumber}</b> —{" "}
              {updateModal.order.patient?.fullName}
            </p>
            {["Delivered", "Ready", "Lab"].includes(updateModal.status) && (
              <div className="flex items-center gap-3 mb-3">
                <Text>Collect payment:</Text>
                <InputNumber
                  min={0}
                  max={
                    updateModal.order.totalAmount -
                    updateModal.order.advanceAmount
                  }
                  prefix="₹"
                  value={collectAmount}
                  onChange={setCollectAmount}
                />
                <Select
                  value={paymentMethod}
                  style={{ width: 100 }}
                  onChange={setPaymentMethod}
                  options={["Cash", "Card", "UPI"].map((v) => ({
                    value: v,
                    label: v,
                  }))}
                />
              </div>
            )}
            {updateModal.status === "Cancelled" && (
              <Text type="danger">
                Stock for inventory items will be restored.
              </Text>
            )}
          </>
        )}
      </Modal>
    </Card>
  );
};

export default OpticalOrders;
