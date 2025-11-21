import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Typography,
  Divider,
  Form,
  Select,
  Input,
  Button,
  AutoComplete,
  Spin,
} from "antd";
import {
  medicineCategories,
  doseIntervals,
  doseDurations,
} from "../../utils/localStorage";
import {
  createPrescriptionApi,
  getPatientsPrescriptionApi,
  searchMedcineApi,
  searchPathologyTestApi,
} from "../../services/apis";
import useDebounce from "../../hooks/useDebounce";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { handlePatientPrescriptionPrint } from "../../utils/printDataHelper";

const { Title, Text } = Typography;

const Prescription = ({ edit }) => {
  const user = useSelector((state) => state?.user);
  const location = useLocation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [medicinesList, setMedicinesList] = useState([]);
  const [selectedPathology, setSelectedPathology] = useState([]);
  const [note, setNote] = useState("");
  const [autoCategory, setAutoCategory] = useState(null);
  const [searchTermMedicine, setSearchTermMedicine] = useState("");
  const [searchTermPathology, setSearchTermPathology] = useState("");
  const debouncedSearchMedicine = useDebounce(searchTermMedicine, 500);
  const debouncedSearchPathology = useDebounce(searchTermPathology, 500);
  const [medicineOptions, setMedicineOptions] = useState([]);
  const [pathologyOptions, setPathologyOptions] = useState([]);
  const [isLoadingMedicine, setIsLoadingMedicine] = useState(false);
  const [isLoadingPathology, setIsLoadingPathology] = useState(false);
  const [patientRecord, setPatientRecord] = useState(location.state || {});

  useEffect(() => {
    const fetchPrescription = async () => {
      if (edit) {
        const prescriptionId = patientRecord?.prescriptionId;

        const res = await getPatientsPrescriptionApi({ prescriptionId });

        if (res.success) {
          const prescription = res.data;
          setPatientRecord((prev) => ({
            ...prev,
            opdNumber: prescription.opd,
            ipdNumber: prescription.ipd,
            doctor: prescription.doctor,
            patient: prescription.patient,
          }));

          setMedicinesList(prescription.medicines || []);

          const labTests = (prescription.labTests || []).map((test, index) => ({
            _id: index,
            testCode: test.testCode || test.testName,
            testName: test.testName,
          }));
          setSelectedPathology(labTests);
          setNote(prescription.note || "");
          if (prescription.medicines?.[0]) {
            form.setFieldsValue({
              medicine: prescription.medicines[0].medicine,
              medicineCategory: prescription.medicines[0].medicineCategory,
              doseInterval: prescription.medicines[0].doseInterval,
              doseDuration: prescription.medicines[0].doseDuration,
            });
          }
        } else {
          toast.error(res.message || "Failed to fetch prescription");
        }
      }
    };

    fetchPrescription();
  }, [edit, patientRecord?.prescriptionId]);

  const handleMedicineChange = (name) => {
    const selected = medicineOptions?.find((med) => med.name === name);
    if (selected) {
      setAutoCategory(selected.category);
      form.setFieldsValue({
        medicineCategory: selected.category,
        medicine: name,
      });
    } else {
      setAutoCategory("");
      form.setFieldsValue({
        medicineCategory: undefined,
        medicine: name,
      });
    }
  };

  useEffect(() => {
    if (debouncedSearchMedicine.length >= 2) {
      handleMedicineSearch(debouncedSearchMedicine);
    } else {
      setMedicineOptions([]);
    }
  }, [debouncedSearchMedicine]);

  const handleMedicineSearch = async (name) => {
    try {
      setIsLoadingMedicine(true);
      const res = await searchMedcineApi({ name });
      setMedicineOptions(res?.data || []);
    } catch (err) {
      setMedicineOptions([]);
    } finally {
      setIsLoadingMedicine(false);
    }
  };

  useEffect(() => {
    if (debouncedSearchPathology.length >= 2) {
      handlePathologyTestSearch(debouncedSearchPathology);
    } else {
      setPathologyOptions([]);
    }
  }, [debouncedSearchPathology]);

  const handlePathologyTestSearch = async (name) => {
    try {
      setIsLoadingPathology(true);
      const res = await searchPathologyTestApi({ name });
      setPathologyOptions(res?.data || []);
    } catch (err) {
      setPathologyOptions([]);
    } finally {
      setIsLoadingPathology(false);
    }
  };

  if (!patientRecord) return null;

  const { opdNumber, ipdNumber, patient = {}, doctor = {} } = patientRecord;

  const handleAddMedicine = () => {
    form
      .validateFields([
        "medicine",
        "medicineCategory",
        "doseInterval",
        "doseDuration",
      ])
      .then((values) => {
        if (
          values.medicine &&
          values.medicineCategory &&
          values.doseInterval &&
          values.doseDuration
        ) {
          setMedicinesList((prev) => [...prev, values]);
          form.resetFields([
            "medicine",
            "medicineCategory",
            "doseInterval",
            "doseDuration",
          ]);
          setSearchTermMedicine("");
          setAutoCategory(null);
        }
      })
      .catch(() => {});
  };

  const handleRemoveMedicine = (idx) => {
    setMedicinesList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRemovePathologyTest = (codeToRemove) => {
    setSelectedPathology((prev) =>
      prev.filter((test) => test.testCode !== codeToRemove)
    );
  };

  const handlePrint = async () => {
    const patientDescription = {
      opd: opdNumber,
      ipd: ipdNumber,
      patientId: patient.patientId,
      fullName: patient.fullName,
      gender: patient.gender,
      dob: patient.dob,
      bloodGroup: patient.bloodGroup,
      contact: { phone: patient.contact?.phone },
      doctorFullName: doctor.fullName,
    };

    const data = {
      medicines: medicinesList,
      labTests: selectedPathology,
      note,
    };

    const success = await onFinish();

    handlePatientPrescriptionPrint({
      record: data,
      patient: patientDescription,
    });
  };

  const onFinish = async () => {
    try {
      if (medicinesList.length <= 0 && selectedPathology.length <= 0) {
        toast.error("Please add at least one medicine or Lab test");
        return;
      }
      const finalData = {
        edit: edit,
        prescriptionId: patientRecord?.prescriptionId,
        patientType: patientRecord?.patientType,
        patient: patientRecord?.patient?._id,
        ipd: patientRecord?.ipdNumber || null,
        opd: patientRecord?.opdNumber || null,
        createdBy: user?._id,
        medicines: medicinesList,
        pathologyTests: selectedPathology,
        note: note,
      };

      const response = await createPrescriptionApi(finalData);

      if (response?.success) {
        toast.success("Prescription saved successfully");

        form.resetFields();
        setMedicinesList([]);
        setSelectedPathology([]);
        setNote("");

        navigate(-1);
      } else {
        toast.error(response?.message || "Failed to save prescription");
      }
    } catch (error) {
      toast.error(
        error.message || "Something went wrong while saving prescription"
      );
    }
  };

  return (
    <>
      <Card className="m-4">
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} sm={12}>
            <Title level={5} className="mb-0">
              {ipdNumber ? "IPD Number" : "OPD Number"}{" "}
              <Text strong>{ipdNumber || opdNumber || "-"}</Text>
            </Title>
          </Col>
          <Col xs={24} sm={12}>
            <Title level={5} className="mb-0">
              Patient ID: <Text strong>{patient.patientId || "-"}</Text>
            </Title>
          </Col>
        </Row>
        <Divider className="my-3" />
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <div className="mb-2">
              <Text>
                <b>Name:</b> {patient.fullName || "-"}
              </Text>
            </div>
            <div className="mb-2">
              <Text>
                <b>Gender:</b> {patient.gender || "-"}
              </Text>
            </div>
            <div className="mb-2">
              <Text>
                <b>DOB:</b>{" "}
                {patient.dob ? new Date(patient.dob).toLocaleDateString() : "-"}
              </Text>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div className="mb-2">
              <Text>
                <b>Blood Group:</b> {patient.bloodGroup || "-"}
              </Text>
            </div>
            <div className="mb-2">
              <Text>
                <b>Phone:</b> {patient.contact?.phone || "-"}
              </Text>
            </div>
            <div className="mb-2">
              <Text>
                <b>Doctor:</b> {doctor?.fullName || "-"}
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      <Card className="m-4" title="Add Medicine & Tests">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Divider orientation="left">Medicines</Divider>
          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item label="Medicine" name="medicine">
                <AutoComplete
                  onSearch={setSearchTermMedicine}
                  onSelect={handleMedicineChange}
                  onChange={(val) => {
                    handleMedicineChange(val);
                    form.setFieldsValue({ medicine: val });
                  }}
                  placeholder="Type or select medicine"
                  options={medicineOptions.map((med) => ({
                    key: med._id,
                    label: `${med.name} (${med.unit})`,
                    value: med.name,
                  }))}
                  allowClear
                  notFoundContent={
                    isLoadingMedicine ? <Spin size="small" /> : null
                  }
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label="Medicine Category" name="medicineCategory">
                <Select
                  placeholder="Select category"
                  value={autoCategory}
                  onChange={(value) => {
                    setAutoCategory(value);
                  }}
                >
                  {medicineCategories.map((cat) => (
                    <Select.Option key={cat.code} value={cat.code}>
                      {cat.code}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label="Dose Interval" name="doseInterval">
                <Select placeholder="Select interval">
                  {doseIntervals.map((d) => (
                    <Select.Option key={d.value} value={d.value}>
                      {d.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label="Dose Duration" name="doseDuration">
                <Select placeholder="Select duration">
                  {doseDurations.map((d) => (
                    <Select.Option key={d.value} value={d.value}>
                      {d.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col xs={24} style={{ textAlign: "right" }}>
              <Button type="primary" onClick={handleAddMedicine}>
                Add Medicine
              </Button>
            </Col>
          </Row>
          {medicinesList.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <Divider>Medicines Added</Divider>
              {medicinesList.map((med, idx) => (
                <Row
                  key={idx}
                  gutter={8}
                  align="middle"
                  style={{ marginBottom: 8 }}
                >
                  <Col flex="auto">
                    <b>{med.medicine}</b> | {med.medicineCategory} |{" "}
                    {
                      doseIntervals.find((d) => d.value === med.doseInterval)
                        ?.label
                    }{" "}
                    |{" "}
                    {
                      doseDurations.find((d) => d.value === med.doseDuration)
                        ?.label
                    }
                  </Col>
                  <Col>
                    <Button
                      danger
                      size="small"
                      onClick={() => handleRemoveMedicine(idx)}
                    >
                      Remove
                    </Button>
                  </Col>
                </Row>
              ))}
            </div>
          )}

          <Divider orientation="left" className="my-3">
            Lab Tests
          </Divider>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Pathology Tests" name="pathologyTests">
                <Select
                  mode="tags"
                  placeholder="Type or select pathology tests"
                  onSearch={setSearchTermPathology}
                  // onChange={(selectedValues) => {
                  //   const updatedSelected = selectedValues.map((val) => {
                  //     const found = pathologyOptions.find(
                  //       (t) => t.testCode === val
                  //     );
                  //     return found || { testCode: val, testName: val };
                  //   });
                  //   setSelectedPathology(updatedSelected);
                  // }}
                  onChange={(selectedValues) => {
                    const updatedSelected = selectedValues.map((val) => {
                      const found = pathologyOptions.find(
                        (t) => t.testCode === val
                      );
                      return found || { testCode: val, testName: val };
                    });
                    const combined = [...selectedPathology, ...updatedSelected];
                    const unique = Array.from(
                      new Map(combined.map((t) => [t.testCode, t])).values()
                    );

                    setSelectedPathology(unique);
                  }}
                  filterOption={false}
                  showSearch
                  notFoundContent={
                    isLoadingPathology ? <Spin size="small" /> : null
                  }
                  options={pathologyOptions.map((test) => ({
                    label: test.testName,
                    value: test.testCode,
                  }))}
                  value={selectedPathology.map((test) => test.testCode)}
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>
          {selectedPathology.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <Divider>Pathology Tests Selected</Divider>
              {selectedPathology.map((test) => (
                <Row
                  key={test.testCode}
                  gutter={8}
                  align="middle"
                  style={{ marginBottom: 8 }}
                >
                  <Col flex="auto">
                    <b>{test.testName}</b>
                    {!test.testName?.includes(test.testCode) &&
                      ` (${test.testCode})`}
                  </Col>

                  <Col>
                    <Button
                      danger
                      size="small"
                      onClick={() => handleRemovePathologyTest(test.testCode)}
                    >
                      Remove
                    </Button>
                  </Col>
                </Row>
              ))}
            </div>
          )}

          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item label="Doctor's Note">
                <Input.TextArea
                  rows={3}
                  placeholder="Add any note or instruction"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Row gutter={16} justify="end" style={{ marginTop: 32 }}>
          <Col>
            <Button type="default" onClick={handlePrint}>
              Save & Print
            </Button>
          </Col>
          <Col>
            <Button type="primary" onClick={() => form.submit()}>
              Save
            </Button>
          </Col>
        </Row>
      </Card>
    </>
  );
};

export default Prescription;
