import { useState, useEffect } from "react";
import { Alert, Button, Form, InputNumber, Select, Row, Col, Tooltip } from "antd";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import {
  payPatientIpdBillApi,
  payPatientMedicineBillApi,
  payPatientOpdBillApi,
  payPatientPathologyBillApi,
} from "../../../services/apis";

// type -> { api, key of the updated doc in the response, patient array to patch }
const ENTRY_CONFIG = {
  Pathology: {
    api: payPatientPathologyBillApi,
    resultKey: "updatedReport",
    listKey: "pathologyTestReports",
    label: "Lab Test",
  },
  Medicine: {
    api: payPatientMedicineBillApi,
    resultKey: "updatedOrder",
    listKey: "medicineOrders",
    label: "Medicine",
  },
  OPD: {
    api: payPatientOpdBillApi,
    resultKey: "updatedOpd",
    listKey: "opds",
    label: "OPD",
  },
  IPD: {
    api: payPatientIpdBillApi,
    resultKey: "updatedIpd",
    listKey: "ipds",
    label: "IPD",
  },
};

const PayModal = ({ data, setSelectedEntry, setPatient, onRefresh }) => {
  const [form] = Form.useForm();
  const [payingAmount, setPayingAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const user = useSelector((state) => state.user);
  const isAdmin = user?.role === "admin";
  // Only IPD/OPD carry a doctor rate to negotiate — Pathology/Medicine
  // charges aren't a per-doctor fee.
  const entryType = data?.selectedEntry?.type;
  const canNegotiateDoctorRate =
    isAdmin && (entryType === "IPD" || entryType === "OPD");

  // `selectedEntry.total` is the REMAINING balance for this entry, not the
  // original charge. If it is 0 (or negative, meaning the patient has already
  // overpaid) there is nothing left to collect — every input is locked so no
  // one can record a payment against a settled bill.
  // Number(undefined) is NaN, which fails every comparison and would leave the
  // form open, so anything non-numeric is treated as "nothing to collect".
  const rawBalance = Number(data?.selectedEntry?.total);
  const balanceDue = Number.isFinite(rawBalance) ? rawBalance : 0;
  const isSettled = !(balanceDue > 0);
  const isOverpaid = balanceDue < 0;

  useEffect(() => {
    const due = Math.max(balanceDue, 0);
    form.setFieldsValue({
      totalAmount: balanceDue,
      amountPaying: due,
      tax: 0,
      discount: 0,
      paymentMethod: "Cash",
      // Shows whatever negotiation is already on record for this admission
      // /visit, if any — so opening Pay doesn't look like it's clearing a
      // rate that was already agreed.
      doctorChargeOverride: data?.selectedEntry?.doctorChargeOverride ?? undefined,
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

      const config = ENTRY_CONFIG[data?.selectedEntry?.type];
      if (!config) {
        toast.error("Unknown billing entry type");
        return;
      }

      const payload = {
        ...values,
        totalAmount: balanceDue,
        patient: data?._id,
        entry: {
          type: data?.selectedEntry?.type,
          entryId: data?.selectedEntry?._id,
          checkId:
            data?.selectedEntry?.ipdNumber || data?.selectedEntry?.opdNumber,
        },
      };

      setSubmitting(true);
      const response = await config.api(payload);
      setSubmitting(false);

      if (!response?.success) {
        toast.error(response?.message || `${config.label} payment failed`);
        // The server is the source of truth for what is outstanding. If it
        // refuses the payment, the figures on screen are stale — refetch the
        // patient so staff stop looking at a balance the API will not accept.
        await onRefresh?.();
        setSelectedEntry(null);
        return;
      }

      const updated = response?.data?.[config.resultKey];
      setPatient((prev) => ({
        ...prev,
        [config.listKey]: (prev?.[config.listKey] || []).map((item) =>
          String(item?._id) === String(updated?._id) ? updated : item
        ),
      }));
      toast.success(`${config.label} payment recorded successfully`);
      setSelectedEntry(null);
    } catch (error) {
      setSubmitting(false);
      // form.validateFields() rejects with an errorFields object, not an Error
      if (error?.errorFields?.length) return;
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
      {/*
        One switch for the whole form. When the entry has nothing outstanding
        (total 0, or negative = already overpaid) AntD disables every control
        inside it — Amount Paying, Tax, Discount, Payment Method — so no one can
        record a payment against a settled bill, and any field added here later
        is locked automatically instead of having to remember a `disabled` prop.
        Individual `disabled` props below remain for the cases that are locked
        even when money IS pending (fixed OPD / lab-test amounts).
      */}
      <Form
        layout="vertical"
        form={form}
        onValuesChange={handleValuesChange}
        disabled={isSettled}
      >
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

          {canNegotiateDoctorRate && (
            <Col md={8} xs={24}>
              <Form.Item
                label="Negotiated Doctor Rate (optional)"
                name="doctorChargeOverride"
                tooltip="Overrides the doctor's normal charge for this admission/visit only — doesn't touch their rate for any other patient. Leave blank to keep whatever is already in effect."
              >
                <InputNumber
                  min={0}
                  className="w-full"
                  placeholder="Doctor's default rate applies"
                  disabled={isSettled}
                  addonAfter={
                    data?.selectedEntry?.doctorChargeOverride != null ? (
                      <Tooltip title="Clear the negotiated rate — go back to this doctor's normal charge">
                        <span
                          className="cursor-pointer"
                          onClick={() =>
                            !isSettled &&
                            form.setFieldsValue({ doctorChargeOverride: null })
                          }
                        >
                          Reset
                        </span>
                      </Tooltip>
                    ) : undefined
                  }
                />
              </Form.Item>
            </Col>
          )}
        </Row>

        <Form.Item>
          <div className="flex justify-end">
            <Button
              type="primary"
              onClick={handlePayment}
              disabled={isSettled || submitting}
              loading={submitting}
            >
              Pay and Generate Bill
            </Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  );
};

export default PayModal;
