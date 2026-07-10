import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Form,
  Input,
  Select,
  DatePicker,
  Upload,
  Row,
  Col,
  Button,
  Card,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import "antd/dist/reset.css";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import {
  createPatientApi,
  getPatientDetailsApi,
  getPatientDetailsIpdOpdApi,
  updateIpdDetailsApi,
  updateOpdDetailsApi,
  updatePatientRegistrationApi,
} from "../../services/apis";
import OPDForm from "../components/formComponents/OPDForm";
import IPDForm from "../components/formComponents/IPDForm";
import SymptomsForm from "../components/formComponents/SymptopmsForm";
import {
  formatDateTime,
  generateUniqueNumber,
  handleNumericKeyDown,
} from "../../utils/helper";

const { Option } = Select;

function PatientRegistrationPage({ edit }) {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Eye-focused hospitals capture symptoms in the Eye Workup step instead,
  // so hide the generic symptoms block from registration for them.
  const modules = useSelector((state) => state?.hospital?.modules);
  const hideSymptoms = !!(
    modules?.ophthalmology ||
    modules?.opticalShop ||
    modules?.ot
  );

  // Enter moves focus to the next field; on the last field it submits.
  const handleEnterNavigation = (e) => {
    if (e.key !== "Enter") return;
    const el = e.target;
    const tag = el.tagName;
    // Let textareas add newlines and buttons trigger their own click.
    if (tag === "TEXTAREA" || tag === "BUTTON" || el.type === "submit") return;
    // If an AntD Select dropdown is open, let Enter pick the highlighted option.
    if (
      el.getAttribute("role") === "combobox" &&
      el.getAttribute("aria-expanded") === "true"
    ) {
      return;
    }
    e.preventDefault();
    const focusables = Array.from(
      e.currentTarget.querySelectorAll(
        'input:not([type="hidden"]):not([disabled]), textarea:not([disabled])'
      )
    ).filter((node) => node.offsetParent !== null && node.tabIndex !== -1);
    const idx = focusables.indexOf(el);
    if (idx > -1 && idx < focusables.length - 1) {
      focusables[idx + 1].focus();
    } else {
      form.submit();
    }
  };

  const [patientType, setPatientType] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [symptomType, setSymptomType] = useState([]);
  const [symptomDescription, setSymptomDescription] = useState("");
  const [ipdNumber, setIpdNumber] = useState("");
  const [opdNumber, setOpdNumber] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [editPatientId, setEditPatientId] = useState(null);
  const [editIpdBed, setEditIpdBed] = useState();

  const location = useLocation();
  const params = useParams();

  let patientId = null,
    ipdId = null,
    opdId = null;
  if (edit === "patient") {
    patientId = params.patientId;
  } else if (edit === "ipd") {
    ipdId = params.ipdId;
  } else if (edit === "opd") {
    opdId = params.opdId;
  } else {
    const match = location.pathname.match(
      /\/registration\/edit\/([a-zA-Z0-9]+)/
    );
    patientId = match ? match[1] : null;
  }

  useEffect(() => {
    if (edit) {
      setIsEdit(true);
      let response;
      let id = patientId;
      const fetchPatient = async () => {
        try {
          if (patientId) response = await getPatientDetailsApi(id);
          else
            response = await getPatientDetailsIpdOpdApi(ipdId || opdId, {
              isIpdPatient: ipdId ? true : false,
              isOpdPatient: opdId ? true : false,
            });
          const patient = response.data;
          setEditPatientId(patient.patientId);
          form.setFieldsValue({
            fullName: patient.fullName,
            gender: patient.gender,
            dob: patient.dob ? dayjs(patient.dob) : undefined,
            bloodGroup: patient.bloodGroup,
            patientType: patient?.ipdDetails?.ipdNumber ? "IPD" : "OPD",

            age_year: patient.age?.years,
            age_month: patient.age?.months,
            age_day: patient.age?.days,

            phone: patient.contact?.phone,
            email: patient.contact?.email || "",

            line1: patient.address?.line1 || "",
            line2: patient.address?.line2 || "",
            city: patient.address?.city || "",
            pincode: patient.address?.pincode || "",

            ...(!!patient?.ipdDetails?.ipdNumber && {
              ipdNumber: patient.ipdDetails.ipdNumber,
              admissionDateTime: patient.ipdDetails.admissionDate
                ? dayjs(patient.ipdDetails.admissionDate)
                : undefined,
              symptoms: patient.ipdDetails.symptoms?.symptomNames,
              symptomType: patient.ipdDetails.symptoms?.symptomType,
              symptomDescription: patient.ipdDetails.symptoms?.description,
              ward: patient.ipdDetails.ward?._id,
              bed: patient.ipdDetails.bed?._id,
              bedType: patient?.ipdDetails?.bed?.bedType,
              height: Number(patient.ipdDetails.height) || 0,
              weight: Number(patient.ipdDetails.weight) || 0,
              bloodPressure: patient.ipdDetails?.bloodPressure || 0,
              ipdNotes: patient.ipdDetails.notes,
              doctor: patient.ipdDetails.attendingDoctor?._id,
              nurse: patient.ipdDetails.attendingNurse?._id,
              ipdCharge: patient.ipdDetails.attendingDoctor?.ipdCharge,
            }),

            ...(!!patient?.opdDetails?.opdNumber && {
              opdNumber: patient.opdDetails.opdNumber,
              visitDateTime: patient.opdDetails.visitDateTime
                ? dayjs(patient.opdDetails.visitDateTime)
                : undefined,
              doctor: patient.opdDetails.doctor?._id,
              consultationFees: patient.opdDetails?.doctor?.opdCharge,
              notes: patient.opdDetails.notes,
              symptoms: patient.opdDetails.symptoms?.symptomNames,
              symptomType: patient.opdDetails.symptoms?.symptomType,
              symptomDescription: patient.opdDetails.symptoms?.description,
              opdCharge: patient.opdDetails.doctor?.opdCharge,
            }),
          });

          if (patient?.opdDetails?.opdNumber) {
            setSymptomDescription(
              patient.opdDetails?.symptoms?.description || ""
            );
            setSymptomType(patient.opdDetails?.symptoms?.symptomType || []);
            setSelectedSymptoms(
              patient?.ipdDetails?.symptoms?.symptomNames || []
            );
          } else if (patient?.ipdDetails?.ipdNumber) {
            setSymptomType(patient.ipdDetails?.symptoms?.symptomType || []);
            setSelectedSymptoms(
              patient?.ipdDetails?.symptoms?.symptomNames || []
            );
            setSymptomDescription(
              patient.ipdDetails?.symptoms?.description || ""
            );
          }

          setEditIpdBed(patient?.ipdDetails?.bed);
        } catch (error) {
          toast.error("Failed to fetch patient data");
        }
      };
      fetchPatient();
    } else {
      setIsEdit(false);
      setEditPatientId(null);
    }
  }, [form, patientId, ipdId, opdId, edit]);

  const handleDob = (date, dateString) => {
    if (!date || (typeof date.isValid === "function" && !date.isValid()))
      return;

    const today = dayjs();
    const birthDate = dayjs(date);

    let years = today.diff(birthDate, "year");
    let months = today.diff(birthDate.add(years, "year"), "month");
    let days = today.diff(
      birthDate.add(years, "year").add(months, "month"),
      "day"
    );

    form.setFieldsValue({
      age_year: years,
      age_month: months,
      age_day: days,
    });
  };

  useEffect(() => {
    form.setFieldsValue({ ipdNumber });
  }, [ipdNumber, form]);

  useEffect(() => {
    form.setFieldsValue({ opdNumber });
  }, [opdNumber, form]);

  useEffect(() => {
    if (!edit) {
      if (patientType === "IPD") {
        setIpdNumber(generateUniqueNumber("IPD"));
        form.setFieldsValue({ ipdNumber: generateUniqueNumber("IPD") });
      } else if (patientType === "OPD") {
        setOpdNumber(generateUniqueNumber("OPD"));
        form.setFieldsValue({ opdNumber: generateUniqueNumber("OPD") });
      }
    }
  }, [patientType, edit]);

  const onFinish = async (values) => {
    try {
      const formData = new FormData();

      formData.append("fullName", values.fullName);
      formData.append("gender", values.gender);
      formData.append("dob", values.dob);
      formData.append("age[years]", values.age_year);
      formData.append("age[months]", values.age_month);
      formData.append("age[days]", values.age_day);
      formData.append("bloodGroup", values.bloodGroup);
      formData.append("patientType", values.patientType);

      if (values.patientType === "IPD" || params.ipdId) {
        formData.append("IPD[ipdNumber]", values.ipdNumber);
        formData.append(
          "IPD[admissionDateTime]",
          formatDateTime(values.admissionDateTime)
        );
        formData.append("IPD[height]", values.height || 0);
        formData.append("IPD[weight]", values.weight || 0);
        formData.append("IPD[bloodPressure]", values.bloodPressure || 0);
        formData.append("IPD[ward]", values.ward);
        formData.append("IPD[bed]", values.bed);
        formData.append("IPD[bedType]", values.bedType);
        formData.append("IPD[doctor]", values.doctor);
        formData.append("IPD[nurse]", values.nurse);
        formData.append("IPD[notes]", values.notes || "");
      }

      if (values.patientType === "OPD" || params.opdId) {
        formData.append("OPD[opdNumber]", values.opdNumber);

        formData.append(
          "OPD[visitDateTime]",
          formatDateTime(values.visitDateTime)
        );
        formData.append("OPD[doctor]", values.doctor);
        formData.append("OPD[consultationFees]", values.consultationFees);
        formData.append("OPD[notes]", values.notes);
      }

      values?.symptoms?.forEach((s, i) =>
        formData.append(`symptoms[symptomNames][${i}]`, s)
      );
      values?.symptomType?.forEach((t, i) =>
        formData.append(`symptoms[symptomType][${i}]`, t)
      );
      formData.append("symptoms[description]", symptomDescription);

      formData.append("address[line1]", values.line1 || "");
      formData.append("address[line2]", values.line2 || "");
      formData.append("address[city]", values.city || "");
      formData.append("address[pincode]", values.pincode);

      formData.append("contact[phone]", values.phone);
      formData.append("contact[email]", values.email || "");

      values?.medicalDocuments?.forEach((file) => {
        formData.append("medicalDocuments", file.originFileObj);
      });

      if (isEdit && patientId) {
        await updatePatientRegistrationApi(patientId, formData);
        toast.success("Patient updated successfully!");
        navigate(-1);
        return;
      } else if (isEdit && ipdId) {
        await updateIpdDetailsApi(ipdId, formData);
        toast.success("Patient updated successfully!");
        navigate(-1);
        return;
      } else if (isEdit && opdId) {
        await updateOpdDetailsApi(opdId, formData);
        toast.success("Patient updated successfully!");
        navigate(-1);
        return;
      }
      // console.log("trigger")
      await createPatientApi(formData);
      toast.success("Registration successful!");
      form.resetFields();
      setPatientType("");
      setSelectedSymptoms([]);
      setSymptomType([]);
      setSymptomDescription("");
    } catch (error) {
      toast.error(error.message || "Registration failed");
    }
  };

  useEffect(() => {
    form.resetFields();
    setPatientType("");
    setSelectedSymptoms([]);
    setSymptomType([]);
    setSymptomDescription("");
  }, [params.patientId, params.ipdId, params.opdId]);

  let content = null;
  if (edit === "ipd") {
    content = (
      <>
        <Col span={24}>
          <IPDForm form={form} editIpdBed={editIpdBed} />
        </Col>
        {!hideSymptoms && (
          <Col span={24}>
            <SymptomsForm
              form={form}
              selectedSymptoms={selectedSymptoms}
              setSelectedSymptoms={setSelectedSymptoms}
              symptomType={symptomType}
              setSymptomType={setSymptomType}
              symptomDescription={symptomDescription}
              setSymptomDescription={setSymptomDescription}
            />
          </Col>
        )}
      </>
    );
  } else if (edit === "opd") {
    content = (
      <>
        <Col span={24}>
          <OPDForm form={form} />
        </Col>
        {!hideSymptoms && (
          <Col span={24}>
            <SymptomsForm
              form={form}
              selectedSymptoms={selectedSymptoms}
              setSelectedSymptoms={setSelectedSymptoms}
              symptomType={symptomType}
              setSymptomType={setSymptomType}
              symptomDescription={symptomDescription}
              setSymptomDescription={setSymptomDescription}
            />
          </Col>
        )}
      </>
    );
  } else if (edit === "patient") {
    content = (
      <>
        <Col span={24}>
          <Card title="Personal Details" variant="borderless">
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="fullName"
                  label="Full Name"
                  rules={[
                    {
                      required: true,
                      message: "Please enter patient name",
                    },
                  ]}
                >
                  <Input size="large" placeholder="John Doe" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="gender"
                  label="Gender"
                  rules={[{ required: true, message: "Please select gender" }]}
                >
                  <Select size="large" placeholder="Select gender">
                    <Option value="Male">Male</Option>
                    <Option value="Female">Female</Option>
                    <Option value="Other">Other</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16} wrap>
              <Col xs={24} md={12}>
                <Form.Item
                  name="dob"
                  label="Date of Birth"
                  rules={[
                    {
                      required: true,
                      message: "Please select date of birth",
                    },
                  ]}
                >
                  <DatePicker
                    size="large"
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY"
                    onChange={handleDob}
                    inputReadOnly={false}
                    allowClear
                    disabledDate={(current) =>
                      current && current > dayjs().endOf("day")
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Row
                  gutter={{
                    xs: 8,
                    sm: 16,
                    md: 24,
                    lg: 32,
                  }}
                >
                  <Col span={8}>
                    <Form.Item name="age_year" label="Years">
                      <Input
                        disabled
                        type="number"
                        size="large"
                        placeholder="YY"
                        className="text-center"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="age_month" label="Months">
                      <Input
                        disabled
                        type="number"
                        size="large"
                        placeholder="MM"
                        className="text-center"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="age_day" label="Days">
                      <Input
                        disabled
                        type="number"
                        size="large"
                        placeholder="DD"
                        className="text-center"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
            </Row>

            <Row gutter={[16, 0]}>
              <Col xs={24} md={12} lg={6}>
                <Form.Item name="bloodGroup" label="Blood Group">
                  <Select size="large" placeholder="Select blood group">
                    {[
                      "A+",
                      "A-",
                      "B+",
                      "B-",
                      "AB+",
                      "AB-",
                      "O+",
                      "O-",
                      "Unknown",
                    ].map((group) => (
                      <Option key={group} value={group}>
                        {group}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              {!edit && (
                <Col xs={24} md={12} lg={6}>
                  <Form.Item
                    name="patientType"
                    label="Patient Type"
                    rules={[
                      {
                        required: true,
                        message: "Please select patient type",
                      },
                    ]}
                  >
                    <Select
                      size="large"
                      placeholder="Select Patient Type"
                      onChange={(value) => setPatientType(value)}
                      allowClear
                    >
                      <Option value="OPD">OPD</Option>
                      <Option value="IPD">IPD</Option>
                    </Select>
                  </Form.Item>
                </Col>
              )}
            </Row>
          </Card>
        </Col>
        <Col span={24}>
          <Card title="Contact Details" variant="borderless">
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="line1"
                  label="Address Line 1"
                  rules={[{ required: true, message: "Enter Address Line 1" }]}
                >
                  <Input size="large" placeholder="House No, Street" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="line2"
                  label="Address Line 2"
                  rules={[{ required: false }]}
                >
                  <Input
                    size="large"
                    placeholder="Apartment, Landmark (optional)"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="city"
                  label="City"
                  rules={[{ required: true, message: "Enter City" }]}
                >
                  <Input size="large" placeholder="City" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="pincode"
                  label="Pincode"
                  rules={[
                    { required: true, message: "Enter Pincode" },
                    {
                      pattern: /^[0-9]{6}$/,
                      message: "Pincode must be 6 digits",
                    },
                  ]}
                >
                  <Input size="large" type="number" placeholder="e.g. 560001" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="phone"
                  label="Mobile Number"
                  rules={[
                    {
                      required: true,
                      message: "Please enter mobile number",
                    },
                    {
                      pattern: /^[6-9]\d{9}$/,
                      message: "Enter valid 10-digit Indian mobile number",
                    },
                  ]}
                >
                  <Input
                    size="large"
                    type="tel"
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="email"
                  label="Email Address"
                  rules={[
                    {
                      type: "email",
                      message: "Enter a valid email address",
                    },
                  ]}
                >
                  <Input
                    size="large"
                    type="email"
                    placeholder="e.g. example@email.com"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="medicalDocuments"
              label="Medical Documents"
              valuePropName="fileList"
              getValueFromEvent={(e) => {
                if (Array.isArray(e)) {
                  return e;
                }
                return e?.fileList;
              }}
              extra="You can upload up to 5 files (max 2MB each). Allowed formats: PDF, PNG, JPG."
            >
              <Upload
                multiple
                accept=".pdf,.png,.jpg,.jpeg"
                maxCount={5}
                beforeUpload={(file) => {
                  const isLt2M = file.size / 1024 / 1024 < 2;
                  if (!isLt2M) {
                    return Upload.LIST_IGNORE;
                  }
                  return false;
                }}
              >
                <Button icon={<UploadOutlined />}>Upload Files</Button>
              </Upload>
            </Form.Item>
          </Card>
        </Col>
      </>
    );
  } else {
    content = (
      <>
        <Col span={24}>
          <Card title="Personal Details" variant="borderless">
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="fullName"
                  label="Full Name"
                  rules={[
                    {
                      required: true,
                      message: "Please enter patient name",
                    },
                  ]}
                >
                  <Input size="large" placeholder="John Doe" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="gender"
                  label="Gender"
                  rules={[{ required: true, message: "Please select gender" }]}
                >
                  <Select size="large" placeholder="Select gender">
                    <Option value="Male">Male</Option>
                    <Option value="Female">Female</Option>
                    <Option value="Other">Other</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16} wrap>
              <Col xs={24} md={12}>
                <Form.Item
                  name="dob"
                  label="Date of Birth"
                  rules={[
                    {
                      required: true,
                      message: "Please select date of birth",
                    },
                  ]}
                >
                  <DatePicker
                    size="large"
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY"
                    onChange={handleDob}
                    inputReadOnly={false}
                    allowClear
                    disabledDate={(current) =>
                      current && current > dayjs().endOf("day")
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Row
                  gutter={{
                    xs: 8,
                    sm: 16,
                    md: 24,
                    lg: 32,
                  }}
                >
                  <Col span={8}>
                    <Form.Item name="age_year" label="Years">
                      <Input
                        disabled
                        type="number"
                        size="large"
                        placeholder="YY"
                        className="text-center"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="age_month" label="Months">
                      <Input
                        disabled
                        type="number"
                        size="large"
                        placeholder="MM"
                        className="text-center"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="age_day" label="Days">
                      <Input
                        disabled
                        type="number"
                        size="large"
                        placeholder="DD"
                        className="text-center"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
            </Row>

            <Row gutter={[16, 0]}>
              <Col xs={24} md={12} lg={6}>
                <Form.Item name="bloodGroup" label="Blood Group">
                  <Select size="large" placeholder="Select blood group">
                    {[
                      "A+",
                      "A-",
                      "B+",
                      "B-",
                      "AB+",
                      "AB-",
                      "O+",
                      "O-",
                      "Unknown",
                    ].map((group) => (
                      <Option key={group} value={group}>
                        {group}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12} lg={6}>
                <Form.Item
                  name="patientType"
                  label="Patient Type"
                  rules={[
                    {
                      required: true,
                      message: "Please select patient type",
                    },
                  ]}
                >
                  <Select
                    size="large"
                    placeholder="Select Patient Type"
                    onChange={(value) => setPatientType(value)}
                    allowClear
                  >
                    <Option value="OPD">OPD</Option>
                    <Option value="IPD">IPD</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Col>
        {patientType === "IPD" && (
          <Col span={24}>
            <IPDForm form={form} />
          </Col>
        )}
        {patientType === "OPD" && (
          <Col span={24}>
            <OPDForm form={form} />
          </Col>
        )}
        {!hideSymptoms && (
          <Col span={24}>
            <SymptomsForm
              form={form}
              selectedSymptoms={selectedSymptoms}
              setSelectedSymptoms={setSelectedSymptoms}
              symptomType={symptomType}
              setSymptomType={setSymptomType}
              symptomDescription={symptomDescription}
              setSymptomDescription={setSymptomDescription}
            />
          </Col>
        )}
        <Col span={24}>
          <Card title="Contact Details" variant="borderless">
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="line1"
                  label="Address Line 1"
                  rules={[{ required: true, message: "Enter Address Line 1" }]}
                >
                  <Input size="large" placeholder="House No, Street" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="line2"
                  label="Address Line 2"
                  rules={[{ required: false }]}
                >
                  <Input
                    size="large"
                    placeholder="Apartment, Landmark (optional)"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="city"
                  label="City"
                  rules={[{ required: true, message: "Enter City" }]}
                >
                  <Input size="large" placeholder="City" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="pincode"
                  label="Pincode"
                  rules={[{ required: true, message: "Enter Pincode" }]}
                >
                  <Input
                    size="large"
                    maxLength={6}
                    onKeyDown={handleNumericKeyDown}
                    placeholder="Enter 6-digit Pincode"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="phone"
                  label="Mobile Number"
                  rules={[
                    {
                      required: true,
                      message: "Please enter mobile number",
                    },
                    {
                      pattern: /^[6-9]\d{9}$/,
                      message: "Enter valid 10-digit Indian mobile number",
                    },
                  ]}
                >
                  <Input
                    size="large"
                    type="tel"
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="email"
                  label="Email Address"
                  rules={[
                    {
                      type: "email",
                      message: "Enter a valid email address",
                    },
                  ]}
                >
                  <Input
                    size="large"
                    type="email"
                    placeholder="e.g. example@email.com"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="medicalDocuments"
              label="Medical Documents"
              valuePropName="fileList"
              getValueFromEvent={(e) => {
                if (Array.isArray(e)) {
                  return e;
                }
                return e?.fileList;
              }}
              extra="You can upload up to 5 files (max 2MB each). Allowed formats: PDF, PNG, JPG."
            >
              <Upload
                multiple
                accept=".pdf,.png,.jpg,.jpeg"
                maxCount={5}
                beforeUpload={(file) => {
                  const isLt2M = file.size / 1024 / 1024 < 2;
                  if (!isLt2M) {
                    return Upload.LIST_IGNORE;
                  }
                  return false;
                }}
              >
                <Button icon={<UploadOutlined />}>Upload Files</Button>
              </Upload>
            </Form.Item>
          </Card>
        </Col>
      </>
    );
  }

  return (
    <div className="p-0">
      <Card
        title={
          <>
            {isEdit && editPatientId && (
              <div style={{ fontWeight: 500, color: "#888", marginBottom: 4 }}>
                Patient ID: <span>{editPatientId}</span>
              </div>
            )}
            {isEdit ? "Update Patient" : "Patient Registration"}
          </>
        }
        variant="borderless"
        className="bg-transparent border-none"
      >
        <Form
          form={form}
          layout="vertical"
          onKeyDown={handleEnterNavigation}
          onFinishFailed={() => toast.error("Please fill all required fields")}
          onFinish={onFinish}
          autoComplete="off"
          initialValues={{ bloodGroup: "Unknown" }}
        >
          <Row gutter={[0, 24]}>
            {content}
            <Col span={24}>
              <Form.Item className="text-end mt-4">
                <Button type="primary" size="large" htmlType="submit">
                  {isEdit ? "Update Patient" : "Register Patient"}
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
}

export default PatientRegistrationPage;
