import { Modal, Form, Input } from "antd";
import { useSelector } from "react-redux";

const DischargeModal = ({ visible, onClose, onSuccess, ipdPatient }) => {
  const userData = useSelector((state) => state.user);
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSuccess({
        ipdId: ipdPatient?._id,
        dischargedBy: userData._id,
        patientId: ipdPatient?.patient?._id,
        ...values,
      });
      form.resetFields();
      onClose();
    } catch (err) {
      return;
    }
  };

  return (
    <Modal
      title={`Discharge ${ipdPatient?.patient?.fullName || "Patient"}`}
      open={visible}
      onCancel={() => {
        onClose();
        form.resetFields();
      }}
      onOk={handleOk}
      okText="Yes, Discharge"
      cancelText="Cancel"
      okButtonProps={{ success: true }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Discharge Reason"
          name="dischargeReason"
          rules={[{ required: true, message: "Please enter a reason" }]}
        >
          <Input placeholder="e.g., Fully recovered" />
        </Form.Item>
        <Form.Item
          label="Discharge Condition"
          name="dischargeCondition"
          rules={[{ required: true, message: "Please enter condition" }]}
        >
          <Input placeholder="e.g., Stable, needs follow-up" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DischargeModal;
