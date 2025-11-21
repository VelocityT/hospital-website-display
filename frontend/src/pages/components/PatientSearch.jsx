import { useState, useEffect } from "react";
import { Input, Card, Spin, Empty, Typography, Select } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import {
  searchPatientApi,
  getPatientFullDetailsApi,
} from "../../services/apis";

const { Text } = Typography;

const PatientSearch = ({
  onSelectPatient,
  disableFilter = false,
  forPharmacy = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("");

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchTerm.length >= 2) {
        setLoading(true);
        const res = await searchPatientApi({ searchTerm, paymentStatus });
        setPatients(res.success ? res.patients : []);
        setLoading(false);
      } else {
        setPatients([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, paymentStatus]);

  const handleSelect = async (patientId) => {
    setSearchTerm("");
    const res = await getPatientFullDetailsApi({
      patientId,
      params: { forPharmacy },
    });
    if (res.success) {
      onSelectPatient(res.data);
    }
  };

  return (
    <Card title="Search Patient" className="mb-4">
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        <Input
          prefix={<SearchOutlined />}
          placeholder="Name, Patient ID or Phone"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {!disableFilter && (
          <Select
            allowClear
            value={paymentStatus}
            onChange={setPaymentStatus}
            placeholder="Filter by Payment"
            className="min-w-[150px]"
            options={[
              { value: "", label: "All" },
              { value: "Paid", label: "Paid" },
              { value: "Unpaid", label: "Unpaid" },
            ]}
          />
        )}
      </div>

      {loading ? (
        <div className="flex justify-center mt-6">
          <Spin />
        </div>
      ) : patients.length ? (
        <div className="mt-4 border rounded">
          {patients.map((p) => (
            <div
              key={p.patientId}
              className="p-3 cursor-pointer"
              onClick={() => handleSelect(p.patientId)}
            >
              <Text strong>{p.fullName}</Text> - <Text>{p.patientId}</Text> -{" "}
              <Text type="secondary">📞 {p.contact?.phone || "-"}</Text>
            </div>
          ))}
        </div>
      ) : (
        searchTerm.length >= 4 && (
          <Empty description="No matching patients found" className="mt-4" />
        )
      )}
    </Card>
  );
};

export default PatientSearch;
