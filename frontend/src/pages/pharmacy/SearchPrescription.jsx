import { useEffect, useState } from "react";
import PatientSearch from "../components/PatientSearch";
import PatientPrescriptionTable from "../components/PatientPrescriptionTable";

const SearchPrescription = () => {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formatedPrescriptions, setFormatedPrescriptions] = useState([]);

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
  };

  useEffect(() => {
    if (selectedPatient?.prescriptions?.length > 0) {
      const formatted = selectedPatient.prescriptions.map((prescription) => ({
        fullName: selectedPatient.fullName,
        patientId: selectedPatient.patientId,
        ...prescription,
      }));
      setFormatedPrescriptions(formatted);
    } else {
      setFormatedPrescriptions([]);
    }
  }, [selectedPatient]);

  return (
    <div>
      <PatientSearch
        onSelectPatient={handleSelectPatient}
        forPharmacy={true}
        disableFilter
      />

      {selectedPatient && (
        <>
          <div>
            <p>
              <strong>Patient ID:</strong> {selectedPatient.patientId} (
              {selectedPatient.patientId})
            </p>
            <p>
              <strong>Patient:</strong> {selectedPatient.fullName} (
              {selectedPatient.patientId})
            </p>
            <p>
              <strong>Phone:</strong> {selectedPatient?.contact?.phone || "-"}
            </p>
          </div>
          <PatientPrescriptionTable
            prescriptions={formatedPrescriptions}
            forPharmacy={true}
          />
        </>
      )}
    </div>
  );
};

export default SearchPrescription;
