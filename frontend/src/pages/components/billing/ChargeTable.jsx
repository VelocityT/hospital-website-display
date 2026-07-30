import { PrinterOutlined } from "@ant-design/icons";
import { Row, Col, Typography, Divider, Button, Tag } from "antd";
import dayjs from "dayjs";
import { handlePatientBillPrint } from "../../../utils/printDataHelper";
import { calculateStayDays, formatDateTime } from "../../../utils/helper";
import { Link } from "react-router-dom";
const { Text } = Typography;

export const IpdChargeTable = ({
  ipdEntries = [],
  patient,
  setSelectedEntry,
  print,
}) => {
  return (
    <div className="space-y-4 print:text-black">
      <Row
        className={`${
          print ? "bg-gray-400" : "bg-gray-100 dark:bg-gray-800"
        } p-2 font-semibold`}
        gutter={16}
      >
        <Col span={8}>Charge Type</Col>
        <Col span={8}>Charge x Days</Col>
        <Col span={8}>Amount</Col>
      </Row>
      {ipdEntries.map((ipd) => {
        const admissionDate = dayjs(ipd.admissionDate);

        // `dayjs(undefined)` returns NOW and is truthy, so the old
        // `dayjs(x) || null` never produced null — it silently billed
        // undischarged patients against the current time twice over.
        const dischargeDate = ipd?.dischargeSummary?.dischargeDate
          ? dayjs(ipd.dischargeSummary.dischargeDate)
          : null;

        const days = calculateStayDays(admissionDate, dischargeDate);

        const bedCharge = (ipd.bed?.charge || 0) * days;
        const doctorCharge = (ipd.attendingDoctor?.ipdCharge || 0) * days;
        let total = bedCharge + doctorCharge;
        const paidBillSum =
          ipd?.payment?.bill?.reduce(
            (sum, bill) => sum + (+bill?.totalCharge || 0),
            0
          ) || 0;
        // Trust the arithmetic, not just payment.status — the flag only flips
        // to "Paid" on discharge, so a settled bill on an admitted patient
        // must still hide the Pay button.
        const balanceDue = +(total - paidBillSum).toFixed(2);
        const isSettled = balanceDue <= 0 || ipd?.payment?.status === "Paid";

        return (
          <div
            key={ipd._id}
            className="border-b-2 border-black drak:border-white"
          >
            <Row gutter={[16, 8]}>
              <Col xs={24} sm={8}>
                <Text strong>IPD Number:</Text>{" "}
                <Link
                  to={`/ipd/${ipd.ipdNumber}`}
                  state={{ _id: ipd?._id }}
                  className="text-blue-600"
                >
                  {ipd.ipdNumber}
                </Link>
              </Col>
              <Col xs={24} sm={8}>
                <Text strong className={`${print && "text-black"}`}>
                  Admission Date:
                </Text>{" "}
                {admissionDate.format("DD/MM/YYYY HH:mm")}
              </Col>{" "}
              <Col xs={24} sm={8}>
                <div className="flex justify-between items-center">
                  {ipd?.status === "Discharged" ? (
                    <span>
                      <Text strong className={`${print && "text-black"}`}>
                        Discharge Date:
                      </Text>{" "}
                      {dischargeDate.format("DD/MM/YYYY HH:mm")}
                    </span>
                  ) : (
                    <Tag color="green">Admitted</Tag>
                  )}
                  {!print && (
                    <>
                      {!isSettled ? (
                        <Button
                          type="primary"
                          onClick={() =>
                            setSelectedEntry({
                              ...ipd,
                              type: "IPD",
                              total: balanceDue,
                            })
                          }
                          className="bg-green-600 hover:bg-green-700 border-none rounded-full print:hidden"
                        >
                          Pay
                        </Button>
                      ) : (
                        <Tag
                          color="green"
                          className="border border-green-500 text-green-700  rounded-md text-lg print:hidden h-fit"
                        >
                          Paid
                        </Tag>
                      )}
                    </>
                  )}
                </div>
              </Col>
            </Row>

            <ChargeRow
              label="Bed Charge"
              rate={ipd.bed?.charge || 0}
              days={days}
              amount={bedCharge}
            />
            <ChargeRow
              label="Doctor Fee"
              rate={ipd.attendingDoctor?.ipdCharge || 0}
              days={days}
              amount={doctorCharge}
            />

            <Row justify="end">
              <Text strong className={`${print && "text-black"}`}>
                Total: ₹{total}
              </Text>
            </Row>
            <div className="pt-4">
              {ipd?.payment?.bill && (
                <BillDetailsList
                  ipds={[ipd]}
                  patient={patient}
                  bills={ipd?.payment?.bill}
                  print={print}
                />
              )}
            </div>
            {!print && (
              <Row justify="end">
                <Text strong className={`${print && "text-black"}`}>
                  {balanceDue > 0
                    ? `To be paid: ₹${balanceDue}`
                    : balanceDue < 0
                    ? `Overpaid by ₹${Math.abs(balanceDue)}`
                    : "Fully paid"}
                </Text>
              </Row>
            )}
            <div className="border-b-2 border-gray-500 py-2" />
          </div>
        );
      })}
    </div>
  );
};

export const OpdChargeTable = ({
  opdEntries = [],
  patient,
  setSelectedEntry,
  print,
}) => {
  if (!opdEntries) {
    return <>nothing found</>;
  }
  return (
    <div className="space-y-6">
      <Row
        className={`${
          print ? "bg-gray-400" : "bg-gray-100 dark:bg-gray-800"
        } p-2 font-semibold`}
        gutter={16}
      >
        <Col span={8}>Charge Type</Col>
        <Col span={8}>Doctor</Col>
        <Col span={8}>Amount</Col>
      </Row>

      {opdEntries.map((opd) => {
        const visitDate = dayjs(opd.visitDateTime);
        const fee = opd.doctor?.opdCharge || 0;
        const bill = opd?.payment?.bill;

        return (
          <div key={opd._id} className="px-3">
            <Row gutter={[16, 12]}>
              <Col xs={24} sm={8}>
                <Text strong className={`${print && "text-black"}`}>
                  OPD Number:
                </Text>{" "}
                <Link
                  to={`/opd/${opd.opdNumber}`}
                  state={{ _id: opd?._id }}
                  className="text-blue-600"
                >
                  {opd.opdNumber}
                </Link>
              </Col>
              <Col xs={24} sm={8}>
                <Text strong className={`${print && "text-black"}`}>
                  Visit Date:
                </Text>{" "}
                {visitDate.format("DD/MM/YYYY HH:mm")}
              </Col>
              {!print && (
                <Col xs={24} sm={8} className="flex justify-end print:hidden">
                  {!bill?.billNumber ? (
                    <Button
                      type="primary"
                      onClick={() =>
                        setSelectedEntry({
                          ...opd,
                          type: "OPD",
                          total: opd?.doctor?.opdCharge,
                        })
                      }
                      className="bg-green-600 hover:bg-green-700 border-none rounded-full"
                    >
                      Pay
                    </Button>
                  ) : (
                    <Tag
                      color="green"
                      className="border border-green-500 text-green-700  rounded-md text-lg h-fit"
                    >
                      Paid
                    </Tag>
                  )}
                </Col>
              )}
            </Row>

            <Row className="mt-2 p-2 rounded" gutter={16}>
              <Col span={8}>Consultation Fee</Col>
              <Col span={8}>{opd.doctor?.fullName || "-"}</Col>
              <Col span={8}>₹{fee}</Col>
            </Row>

            {bill?.billNumber && (
              <BillDetailsList
                opds={[opd]}
                patient={patient}
                bills={[bill]}
                print={print}
              />
            )}

            {!bill?.billNumber && (
              <Row justify="end" className="pr-4 mt-2">
                <Text strong className={`${print && "text-black"}`}>
                  Total: ₹{fee}
                </Text>
              </Row>
            )}
            <div className="border-b-2 border-gray-500 py-2" />
          </div>
        );
      })}
    </div>
  );
};

export const PrescriptionChargeTable = ({
  prescriptionEntries = [],
  setSelectedEntry,
}) => {
  return <div>PrescriptionChargeTable</div>;
};

export const PathologyChargeTable = ({
  reports = [],
  patient,
  setSelectedEntry,
}) => {
  if (!reports || reports.length === 0) {
    return (
      <div className="text-gray-500 italic">No pathology reports found.</div>
    );
  }

  return (
    <div className="space-y-6">
      <Row
        className="bg-gray-100 dark:bg-gray-800 p-2 font-semibold"
        gutter={16}
      >
        <Col span={8}>
          <div className="dark:text-white">Test Name</div>
        </Col>
        <Col span={8}>
          <div className="dark:text-white">Reported By</div>
        </Col>
        <Col span={8}>
          <div className="dark:text-white">Amount</div>
        </Col>
      </Row>

      {reports.map((report) => {
        const {
          test,
          reportedBy,
          payment,
          _id,
          payableAmount,
          createdAt,
          patientType,
        } = report;

        const paidBillSum =
          payment?.bill?.reduce(
            (sum, bill) => sum + (+bill?.totalCharge || 0),
            0
          ) || 0;

        const isPaid = paidBillSum >= payableAmount;
        const unpaidAmount = (payableAmount - paidBillSum)?.toFixed(2);

        return (
          <div
            key={_id}
            className="px-3 border-b-2 border-black drak:border-white"
          >
            <Row gutter={[16, 12]}>
              <Col xs={24} sm={8}>
                <Text strong>{patientType} Number:</Text>{" "}
                <Link
                  to={`/${patientType.toLowerCase()}/${
                    report[patientType.toLowerCase()]?.opdNumber ||
                    report[patientType.toLowerCase()]?.ipdNumber
                  }`}
                  state={{ _id: report[patientType.toLowerCase()]?._id }}
                  className="text-blue-600"
                >
                  {report[patientType.toLowerCase()]?.opdNumber ||
                    report[patientType.toLowerCase()]?.ipdNumber}
                </Link>
              </Col>

              <Col xs={24} sm={8}>
                <Text strong>Date:</Text> {formatDateTime(createdAt)}
              </Col>

              <Col xs={24} sm={8} className="flex justify-end">
                {!isPaid ? (
                  <Button
                    type="primary"
                    onClick={() =>
                      setSelectedEntry({
                        ...report,
                        type: "Pathology",
                        total: unpaidAmount,
                      })
                    }
                    className="bg-green-600 hover:bg-green-700 border-none rounded-full"
                  >
                    Pay
                  </Button>
                ) : (
                  <Tag
                    color="green"
                    className="border border-green-500 text-green-700 rounded-md text-lg h-fit"
                  >
                    Paid
                  </Tag>
                )}
              </Col>
            </Row>

            <Row className="mt-2 p-2 rounded" gutter={16}>
              <Col span={8}>{test?.testName || "-"}</Col>
              <Col span={8}>{reportedBy?.fullName || "-"}</Col>
              <Col span={8}>₹{payableAmount?.toFixed(2)}</Col>
            </Row>

            {isPaid && (
              <BillDetailsList
                testReports={[report]}
                bills={payment?.bill}
                patient={patient}
              />
            )}

            {!isPaid && (
              <>
                <Row justify="end" className="pr-4 mt-2">
                  <Text strong>Total: ₹{payableAmount?.toFixed(2)}</Text>
                </Row>
                <Row justify="end" className="pr-4 mt-1">
                  <Text strong>To be paid: ₹{unpaidAmount}</Text>
                </Row>
              </>
            )}
            <div className="border-b-2 border-gray-500 py-2" />
          </div>
        );
      })}
    </div>
  );
};

export const MedicineChargeTable = ({
  medicineOrders = [],
  patient,
  setSelectedEntry,
}) => {
  return (
    <div className="space-y-4 print:text-black">
      {medicineOrders?.length > 0 ? (
        <Row
          className="bg-gray-100 dark:bg-gray-800 p-2 font-semibold"
          gutter={16}
        >
          <Col span={10}>Date</Col>
          <Col span={4}>Quantity</Col>
          <Col span={4}>Price per piece</Col>
          <Col span={6}>Total</Col>
        </Row>
      ) : (
        <div className="text-center py-4 text-gray-500">
          No Medicine Orders found
        </div>
      )}

      {medicineOrders.map((order) => {
        const createdDate = dayjs(order.createdAt);
        const totalAmount = order.payableAmount || 0;

        const paidBillSum =
          order?.payment?.bill?.reduce(
            (sum, bill) => sum + (+bill?.totalCharge || 0),
            0
          ) || 0;

        const isPaid = paidBillSum >= totalAmount;

        return (
          <div
            key={order._id}
            className="border-b-2 border-black drak:border-white"
          >
            <Row gutter={[16, 8]}>
              <Col xs={24} sm={8}>
                <Text strong>Medicine:</Text>{" "}
                {createdDate.format("DD/MM/YYYY HH:mm")}
              </Col>

              <Col xs={24} sm={8}>
                <Text strong>Generated By:</Text>{" "}
                {order.generatedBy?.fullName || "-"}
              </Col>

              <Col xs={24} sm={8}>
                <div className="flex justify-end items-center">
                  {!isPaid ? (
                    <Button
                      type="primary"
                      onClick={() =>
                        setSelectedEntry({
                          ...order,
                          type: "Medicine",
                          total: (totalAmount - paidBillSum).toFixed(2),
                        })
                      }
                      className="bg-green-600 hover:bg-green-700 border-none rounded-full ml-4"
                    >
                      Pay
                    </Button>
                  ) : (
                    <Tag
                      color="green"
                      className="border border-green-500 text-green-700 rounded-md text-lg h-fit"
                    >
                      Paid
                    </Tag>
                  )}
                </div>
              </Col>
            </Row>

            <div className="mt-2 ml-4">
              {order.medicines?.map((med, idx) => (
                <Row key={idx} gutter={16} className="text-sm mb-1">
                  <Col span={10}>
                    <Text>{med.name}</Text>
                  </Col>
                  <Col span={4}>
                    {med.quantity} {med.unit}
                  </Col>
                  <Col span={4}>₹{med.sellPrice.toFixed(2)}</Col>
                  <Col span={6}>
                    ₹{(med.sellPrice * med.quantity).toFixed(2)}
                  </Col>
                </Row>
              ))}
            </div>

            <Row justify="end" className="pt-2">
              <Text strong>Total: ₹{totalAmount.toFixed(2)}</Text>
            </Row>

            <div className="pt-4">
              {order?.payment?.bill && (
                <BillDetailsList
                  medicineOrder={[order]}
                  patient={patient}
                  bills={order.payment.bill}
                />
              )}
            </div>

            {!isPaid && (
              <Row justify="end">
                <Text strong>
                  To be paid: ₹{(totalAmount - paidBillSum).toFixed(2)}
                </Text>
              </Row>
            )}
            <div className="border-b-2 border-gray-500 py-2" />
          </div>
        );
      })}
    </div>
  );
};

export const BillDetailsList = ({
  patient,
  bills,
  ipds,
  opds,
  testReports,
  medicineOrder,
  print = false,
}) => {
  return (
    <div className="pt-4 space-y-2">
      {bills.length > 0 ? (
        bills?.map((bill, idx) => (
          <div key={idx}>
            <Row className="mt-3 px-2" gutter={16}>
              <Col span={8}>
                <Button
                  size="small"
                  className="border-green-600 mr-2"
                  icon={<PrinterOutlined className="text-green-600" />}
                  onClick={() => {
                    handlePatientBillPrint({
                      record: bill,
                      patient,
                      ipds,
                      opds,
                      testReports,
                      medicineOrder,
                    });
                  }}
                ></Button>
                <Text strong className={`${print && "text-black"}`}>
                  Bill Date:
                </Text>{" "}
                {formatDateTime(bill?.createdAt)}
              </Col>
              <Col span={8}>
                <Text strong className={`${print && "text-black"}`}>
                  Bill No:
                </Text>{" "}
                {bill?.billNumber}
              </Col>
            </Row>
            <Row className="mt-2 px-2" gutter={16}>
              <Col span={6}>Total Charge: ₹{bill?.totalCharge || "-"}</Col>
              <Col span={6}>Tax: ₹{bill?.tax || 0}</Col>
              <Col span={6}>Discount: ₹{bill?.discount || 0}</Col>
              <Col span={6}>
                <strong>Total Paid: ₹{bill?.paidAmount || 0}</strong>
              </Col>
            </Row>
            {print && (
              <div className="pr-4 mt-2 space-y-1">
                <Row justify="end">
                  <Col>
                    <Text strong className="text-black">
                      Amount Paid: ₹{bill?.paidAmount}
                    </Text>
                  </Col>
                </Row>
                <Row justify="end">
                  <Col>
                    <Text strong className="text-black">
                      Amount Payable: ₹{bill?.payableAmount || 0}
                    </Text>
                  </Col>
                </Row>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="text-center text-gray-500 italic">
          No payment found.
        </div>
      )}
    </div>
  );
};
const ChargeRow = ({ label, rate, days, amount }) => (
  <Row className="p-2" gutter={16}>
    <Col span={8}>{label}</Col>
    <Col span={8}>
      ₹{rate} × {days}
    </Col>
    <Col span={8}>₹{amount}</Col>
  </Row>
);
