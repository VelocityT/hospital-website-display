import { useState, useEffect } from "react";
import { Alert, Button, Form, InputNumber, Select, Row, Col } from "antd";
import toast from "react-hot-toast";
import {
  payPatientIpdBillApi,
  payPatientMedicineBillApi,
  payPatientOpdBillApi,
  payPatientPathologyBillApi,
} from "../../../services/apis";

const PayModal = ({ data, setSelectedEntry, setPatient }) => {
  const [form] = Form.useForm();
  const [payingAmount, setPayingAmount] = useState(0);

  // `selectedEntry.total` is the REMAINING balance for this entry, not the
  // original charge. If it is 0 (or negative, meaning the patient has already
  // overpaid) there is nothing left to collect — every input is locked so no
  // one can record a payment against a settled bill.
  const balanceDue = Number(data?.selectedEntry?.total || 0);
  const isSettled = balanceDue <= 0;
  const isOverpaid = balanceDue < 0;

  useEffect(() => {
    const due = Math.max(balanceDue, 0);
    form.setFieldsValue({
      totalAmount: balanceDue,
      amountPaying: due,
      tax: 0,
      discount: 0,
      paymentMethod: "Cash",
    });
    calculateFinal(due, 0, 0);
  }, [data, form, balanceDue]);

  const calculateFinal = (amount = 0, tax = 0, discount = 0) => {
    const total =
      parseFloat(amount || 0) +
      parseFloat(tax || 0) -
      parseFloat(discount || 0);
    setPayingAmount(total.toFixed(2));
  };

  const handleValuesChange = (changedValues, allValues) => {
    calculateFinal(allValues.amountPaying, allValues.tax, allValues.discount);
  };

  const handlePayment = async () => {
    try {
      // Guard 1: nothing pending on this entry.
      if (isSettled) {
        toast.error("This bill is already fully paid. Nothing pending.");
        return;
      }

      await form.validateFields();
      const values = form.getFieldsValue();

      // Guard 2: never collect more than the outstanding balance.
      if (Number(values.amountPaying) > balanceDue) {
        toast.error(`Amount cannot exceed the pending balance of ₹${balanceDue}`);
        return;
      }

      const payload = {
        ...values,
        totalAmount: data?.selectedEntry?.total,
        patient: data?._id,
        entry: {
          type: data?.selectedEntry?.type,
          entryId: data?.selectedEntry?._id,
          checkId:
            data?.selectedEntry?.ipdNumber || data?.selectedEntry?.opdNumber,
        },
      };
      if (data?.selectedEntry?.type === "Pathology") {
        const response = await payPatientPathologyBillApi(payload);

        if (response?.success) {
          const updatedPathology = response?.data?.updatedReport;

          setPatient((prev) => ({
            ...prev,
            pathologyTestReports: prev.pathologyTestReports.map((testReport) =>
              String(testReport?._id) === String(updatedPathology?._id)
                ? { ...updatedPathology }
                : testReport
            ),
          }));

          toast.success("Lab Test Payment recorded successfully");
        } else {
          toast.error(response?.message || "Lab Test Payment failed");
        }
      }
      if (data?.selectedEntry?.type === "Medicine") {
        const response = await payPatientMedicineBillApi(payload);

        if (response?.success) {
          const updatedOrder = response?.data?.updatedOrder;

          setPatient((prev) => ({
            ...prev,
            medicineOrders: prev.medicineOrders.map((order) =>
              String(order?._id) === String(updatedOrder?._id)
                ? { ...updatedOrder }
                : order
            ),
          }));

          toast.success("Medicine Payment recorded successfully");
        } else {
          toast.error(response?.message || "Medicine Payment failed");
        }
      }
      if (data?.selectedEntry?.type === "OPD") {
        const response = await payPatientOpdBillApi(payload);

        if (response?.success) {
          const updatedOpd = response?.data?.updatedOpd;

          setPatient((prev) => ({
            ...prev,
            opds: prev.opds.map((opd) =>
              opd?._id === updatedOpd?._id ? updatedOpd : opd
            ),
          }));

          toast.success("OPD Payment recorded successfully");
        } else {
          toast.error(response?.message || "OPD Payment failed");
        }
      }

      if (data?.selectedEntry?.type === "IPD") {
        const response = await payPatientIpdBillApi(payload);

        if (response?.success) {
          const updatedIpd = response?.data?.updatedIpd;
          setPatient((prev) => ({
            ...prev,
            ipds: prev.ipds.map((ipd) =>
              ipd?._id === updatedIpd?._id ? updatedIpd : ipd
            ),
          }));
          toast.success("IPD Payment recorded successfully");
        } else {
          toast.error(response?.message || "IPD Payment failed");
        }
      }

      setSelectedEntry(null);
    } catch (error) {
      toast.error(error.message || "Payment failed");
    }
  };

  return (
    <div>
      {isSettled && (
        <Alert
          className="mb-4"
          type={isOverpaid ? "warning" : "success"}
          showIcon
          message={
            isOverpaid
              ? `Overpaid by ₹${Math.abs(balanceDue)}`
              : "Bill fully paid"
          }
          description={
            isOverpaid
              ? "More has been collected than the total charge. No further payment can be recorded — please issue a refund or adjust the earlier bill."
              : "There is no pending amount for this entry, so no further payment can be recorded."
          }
        />
      )}
      <Form layout="vertical" form={form} onValuesChange={handleValuesChange}>
        <Row gutter={16}>
          <Col md={8} xs={24}>
            <Form.Item label="Pending Amount" name="totalAmount">
              <InputNumber className="w-full" disabled />
            </Form.Item>
          </Col>

          <Col md={8} xs={24}>
            <Form.Item
              label="Amount Paying"
              name="amountPaying"
              rules={[
                { required: true, message: "Enter payment amount" },
                {
                  validator: (_, value) => {
                    if (value === undefined || value === null) {
                      return Promise.resolve();
                    }
                    if (Number(value) <= 0) {
                      return Promise.reject(
                        new Error("Amount must be greater than 0")
                      );
                    }
                    if (Number(value) > balanceDue) {
                      return Promise.reject(
                        new Error(`Cannot exceed pending ₹${balanceDue}`)
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                min={0}
                max={Math.max(balanceDue, 0)}
                className="w-full"
                placeholder="Enter amount"
                // Locked when the bill is settled, and for entry types whose
                // amount is fixed by the system (OPD consultation / lab test).
                disabled={
                  isSettled ||
                  data?.selectedEntry?.type === "OPD" ||
                  data?.selectedEntry?.type === "Pathology"
                }
              />
            </Form.Item>
          </Col>

          <Col md={8} xs={24}>
            <Form.Item label="Tax" name="tax">
              <InputNumber
                min={0}
                className="w-full"
                placeholder="Enter tax"
                disabled={isSettled}
              />
            </Form.Item>
          </Col>

          <Col md={8} xs={24}>
            <Form.Item label="Discount" name="discount">
              <InputNumber
                min={0}
                max={Math.max(balanceDue, 0) / 2}
                className="w-full"
                placeholder="Enter discount"
                disabled={isSettled}
              />
            </Form.Item>
          </Col>

          <Col md={8} xs={24}>
            <Form.Item label="Paying Amount">
              <InputNumber
                className="w-full"
                disabled
                value={Number(payingAmount)}
              />
            </Form.Item>
          </Col>

          <Col md={8} xs={24}>
            <Form.Item
              label="Payment Method"
              name="paymentMethod"
              rules={[{ required: true, message: "Select payment method" }]}
            >
              <Select disabled={isSettled}>
                <Select.Option value="Cash">Cash</Select.Option>
                <Select.Option value="Card">Card</Select.Option>
                <Select.Option value="UPI">UPI</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <div className="flex justify-end">
            <Button type="primary" onClick={handlePayment} disabled={isSettled}>
              Pay and Generate Bill
            </Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  );
};

export default PayModal;
