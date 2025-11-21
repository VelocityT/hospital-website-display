import { useState } from "react";

const usePatientTransfer = (opdPatientId) => {

  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAvailableBeds = async () => {
    setLoading(true);
    const response = await fetch(`/api/beds?status=available`);
    const data = await response.json();
    setBeds(data);
    setLoading(false);
  };

  const handleAdmit = async (values) => {
    await fetch("/api/admissions", {
      method: "POST",
      body: JSON.stringify({
        patientId: opdPatientId,
        ...values,
      }),
    });
  };

  return { beds, loading, handleAdmit, fetchAvailableBeds };
};

export default usePatientTransfer;
