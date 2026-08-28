import { Col, Row, Typography } from "antd";
import { calculateStayDays, formatDateTime } from "../../utils/helper";

const { Text } = Typography;

const PrintPatientBill = ({ bill }) => {
  const { billDetails, entryData } = bill?.data || {};
  const entryType = bill?.entryType;
  const days = calculateStayDays(entryData?.admissionDate);
  // Always the doctor's standard ipdCharge/opdCharge. A negotiated rate
  // (doctorChargeOverride) is a private hospital-doctor payout arrangement
  // and must never appear on what the patient is billed or shown — see
  // pay.controller.js for the matching billing calculation.
  const doctorRate = entryData?.attendingDoctor?.ipdCharge || 0;
  const opdDoctorRate = entryData?.doctor?.opdCharge || 0;
  const surgeryCharges = entryData?.surgeryCharges || [];
  const surgeryChargesTotal = surgeryCharges.reduce(
    (sum, s) => sum + (Number(s?.charge) || 0),
    0
  );

  return (
    <div>
      <BillDetails billDetails={billDetails} />

      {entryType !== "Medicine" && (
        <Row
          className="bg-gray-100 p-2 font-semibold text-sm text-black border-t border-b border-blue-700"
          gutter={16}
        >
          <Col span={12}>Charge Type</Col>
          <Col span={4} className="text-right">
            {billDetails?.ipdNumber ? "Charge × Days" : "Charge"}
          </Col>
          <Col span={3} className="text-right">
            Discount
          </Col>
          <Col span={3} className="text-right">
            Tax
          </Col>
          <Col span={2} className="text-right">
            Total
          </Col>
        </Row>
      )}

      <div className="pt-4 space-y-2">
        {entryType === "Ipd" ? (
          <>
            <Row className="p-2" gutter={16}>
              <Col span={12}>Bed Charge</Col>
              <Col span={4} className="text-right">
                ₹{entryData?.bed?.charge || 0} × {days}
              </Col>
              <Col span={3} className="text-right">
                0
              </Col>
              <Col span={3} className="text-right">
                0
              </Col>
              <Col span={2} className="text-right">
                ₹{(entryData?.bed?.charge || 0) * days}
              </Col>
            </Row>

            <Row className="p-2" gutter={16}>
              <Col span={12}>Doctor Fee</Col>
              <Col span={4} className="text-right">
                ₹{doctorRate} × {days}
              </Col>
              <Col span={3} className="text-right">
                0
              </Col>
              <Col span={3} className="text-right">
                0
              </Col>
              <Col span={2} className="text-right">
                ₹{doctorRate * days}
              </Col>
            </Row>

            {surgeryCharges.map((s, i) => (
              <Row className="p-2" key={s._id || i} gutter={16}>
                <Col span={12}>
                  Surgery — {s.procedureName}
                  {s.doctor?.fullName ? ` (${s.doctor.fullName})` : ""}
                </Col>
                <Col span={4} className="text-right">
                  ₹{s.charge}
                </Col>
                <Col span={3} className="text-right">
                  0
                </Col>
                <Col span={3} className="text-right">
                  0
                </Col>
                <Col span={2} className="text-right">
                  ₹{s.charge}
                </Col>
              </Row>
            ))}

            <Row justify="end">
              <Col>
                <Text strong className="text-black">
                  Total: ₹
                  {doctorRate * days +
                    (entryData?.bed?.charge || 0) * days +
                    surgeryChargesTotal}
                </Text>
              </Col>
            </Row>
            <hr className="w-48 border-t border-blue-600 ml-auto" />

            <Row justify="end" className="gap-10">
              <Col>
                <Text strong className="text-black">
                  Discount: ₹{entryData?.payment?.bill?.[0]?.discount || 0}
                </Text>
              </Col>
              <Col>
                <Text strong className="text-black">
                  Tax: ₹{entryData?.payment?.bill?.[0]?.tax || 0}
                </Text>
              </Col>
              <Col>
                <Text strong className="text-black">
                  Paid Amount: ₹{entryData?.payment?.bill?.[0]?.paidAmount || 0}
                </Text>
              </Col>
            </Row>
            <Row justify="end">
              <Col>
                <Text strong className="text-black">
                  Payable Amount: ₹
                  {entryData?.payment?.bill?.[0]?.payableAmount || 0}
                </Text>
              </Col>
            </Row>
          </>
        ) : entryType === "Opd" ? (
          <>
            <Row className="p-2" gutter={16}>
              <Col span={12}>Doctor Fee</Col>
              <Col span={4} className="text-right">
                ₹{opdDoctorRate}
              </Col>
              <Col span={3} className="text-right">
                0
              </Col>
              <Col span={3} className="text-right">
                0
              </Col>
              <Col span={2} className="text-right">
                ₹{opdDoctorRate}
              </Col>
            </Row>

            <Row justify="end">
              <Col>
                <Text strong className="text-black">
                  Total: ₹{opdDoctorRate}
                </Text>
              </Col>
            </Row>
            <hr className="w-48 border-t border-blue-600 ml-auto" />

            <Row justify="end" className="gap-10">
              <Col>
                <Text strong className="text-black">
                  Discount: ₹{entryData?.payment?.bill?.discount || 0}
                </Text>
              </Col>
              <Col>
                <Text strong className="text-black">
                  Tax: ₹{entryData?.payment?.bill?.tax || 0}
                </Text>
              </Col>
              <Col>
                <Text strong className="text-black">
                  Paid Amount: ₹{entryData?.payment?.bill?.paidAmount || 0}
                </Text>
              </Col>
            </Row>
            <Row justify="end">
              <Col>
                <Text strong className="text-black">
                  Payable Amount: ₹
                  {entryData?.payment?.bill?.payableAmount || 0}
                </Text>
              </Col>
            </Row>
          </>
        ) : entryType === "Pathology" ? (
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-4 p-2 text-sm">
              <div className="col-span-12 sm:col-span-6 font-semibold">
                {entryData?.test?.testName || entryData?.medicineName} (
                {entryData?.test?.testCode || ""})
              </div>

              <div className="col-span-4 sm:col-span-2 text-right">
                ₹
                {parseFloat(
                  entryData?.payment?.bill?.[0]?.totalCharge || 0
                ).toFixed(2)}
              </div>
              <div className="col-span-4 sm:col-span-2 text-right">₹0</div>
              <div className="col-span-4 sm:col-span-1 text-right">₹0</div>
              <div className="col-span-12 sm:col-span-1 text-right font-semibold">
                ₹
                {parseFloat(
                  entryData?.payment?.bill?.[0]?.totalCharge || 0
                ).toFixed(2)}
              </div>
            </div>
            <div className="flex justify-end pr-4 mt-2 text-sm">
              <span className="font-semibold text-black">
                Total: ₹
                {parseFloat(
                  entryData?.payment?.bill?.[0]?.totalCharge || 0
                ).toFixed(2)}
              </span>
            </div>

            <hr className="w-48 border-t border-blue-600 ml-auto my-2" />

            <div className="flex justify-end pr-4 gap-10 text-sm text-black">
              <div className="font-semibold">
                Discount: ₹
                {parseFloat(
                  entryData?.payment?.bill?.[0]?.discount || 0
                ).toFixed(2)}
              </div>
              <div className="font-semibold">
                Tax: ₹
                {parseFloat(entryData?.payment?.bill?.[0]?.tax || 0).toFixed(2)}
              </div>
              <div className="font-semibold">
                Paid Amount: ₹
                {parseFloat(
                  entryData?.payment?.bill?.[0]?.paidAmount || 0
                ).toFixed(2)}
              </div>
            </div>

            <div className="flex justify-end pr-4 text-sm text-black">
              <div className="font-semibold">
                Payable Amount: ₹
                {parseFloat(
                  entryData?.payment?.bill?.[0]?.payableAmount || 0
                ).toFixed(2)}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 bg-gray-100 p-2 font-semibold text-sm text-black border-t border-b border-blue-700">
              <div className="col-span-12 sm:col-span-6">Medicine (Unit)</div>
              <div className="col-span-4 sm:col-span-2 text-right">Total</div>
              <div className="col-span-4 sm:col-span-1 text-right">
                Discount
              </div>
              <div className="col-span-4 sm:col-span-1 text-right">Tax</div>
              <div className="col-span-12 sm:col-span-2 text-right">Net</div>
            </div>

            {entryData?.medicines?.map((med, idx) => {
              const total = med.sellPrice * med.quantity;
              return (
                <div
                  key={med._id || idx}
                  className="px-4 grid grid-cols-12 text-sm border-gray-100"
                >
                  <div className="col-span-12 sm:col-span-6">
                    {med.name} ({med.unit}) — ₹{med.sellPrice.toFixed(2)} ×{" "}
                    {med.quantity}
                  </div>
                  <div className="col-span-4 sm:col-span-2 text-right">
                    ₹{total.toFixed(2)}
                  </div>
                  <div className="col-span-4 sm:col-span-1 text-right">
                    ₹0.00
                  </div>
                  <div className="col-span-4 sm:col-span-1 text-right">
                    ₹0.00
                  </div>
                  <div className="col-span-12 sm:col-span-2 text-right font-semibold">
                    ₹{total.toFixed(2)}
                  </div>
                </div>
              );
            })}

            <div className="flex justify-end pr-4 mt-2 text-sm">
              <span className="font-semibold text-black">
                Total: ₹
                {entryData?.medicines
                  ?.reduce((sum, m) => sum + m.sellPrice * m.quantity, 0)
                  .toFixed(2)}
              </span>
            </div>

            <hr className="w-48 border-t border-blue-600 ml-auto my-2" />

            <div className="flex justify-end pr-4 space-x-10 text-sm">
              <span className="font-semibold text-black">Discount: ₹0.00</span>
              <span className="font-semibold text-black">Tax: ₹0.00</span>
              <span className="font-semibold text-black">
                Paid Amount: ₹{entryData?.payment?.bill?.[0].paidAmount}
              </span>
            </div>

            <div className="flex justify-end pr-4 mt-1 text-sm">
              <span className="font-semibold text-black">
                Payable Amount: ₹{entryData?.payment?.bill?.[0]?.payableAmount}
              </span>
            </div>
          </>
        )}
        <hr className="w-48 border-t border-blue-600 ml-auto mt-2" />
      </div>
    </div>
  );
};

export const BillDetails = ({ billDetails }) => {
  const fieldData = [
    { label: "Bill Number", value: billDetails?.billNumber || "-" },
    { label: "Date", value: formatDateTime(billDetails?.date) || "-" },
    { label: "Patient Id", value: billDetails?.patientId || "-" },
    ...(billDetails?.ipdNumber
      ? [{ label: "IPD Number", value: billDetails.ipdNumber }]
      : billDetails?.opdNumber
      ? [{ label: "OPD Number", value: billDetails.opdNumber }]
      : []),
    { label: "Patient Name", value: billDetails?.patientName || "-" },
  ];

  return (
    <div className="bg-white p-6 mx-auto my-6 shadow print:shadow-none print:p-0 print:bg-white">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-10 text-sm text-gray-800">
        {fieldData.map((item, idx) => (
          <div key={idx} className="flex">
            <span className="font-medium w-36">{item.label}:</span>
            <span className="flex-1">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrintPatientBill;
