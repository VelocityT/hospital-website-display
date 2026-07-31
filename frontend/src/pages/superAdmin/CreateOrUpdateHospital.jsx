import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  Row,
  Col,
  Upload,
  Select,
} from "antd";
import { useEffect, useState } from "react";
import { UploadOutlined, WarningOutlined } from "@ant-design/icons";
import { toast } from "react-hot-toast";
import {
  createOrUpdateHospitalApi,
  checkHospitalPrefixApi,
} from "../../services/apis";
import { useLocation, useNavigate } from "react-router-dom";
import useDebounce from "../../hooks/useDebounce";
import { TEMPLATE_OPTIONS } from "../printMaterial/templates";

const moduleList = [
  "pharmacy",
  "ipd",
  "opd",
  "pathology",
  "billing",
  "ophthalmology",
  "opticalShop",
  "ot",
];

const moduleLabels = {
  opticalShop: "Optical Shop",
  ot: "OT",
};

// Non-blocking warning shown under a prefix field when another hospital already
// uses it. Duplicate prefixes are SAFE at the database level — patient/staff IDs
// are unique per hospital, so "NA-001" in two hospitals are two distinct
// records. But duplicates confuse staff, support calls and superAdmin views,
// so we nudge the operator without preventing them from saving.
const PrefixWarning = ({ result }) => {
  if (!result?.inUse) return null;
  return (
    <div className="text-amber-600 dark:text-amber-400 text-xs -mt-4 mb-3 flex items-start gap-1">
      <WarningOutlined className="mt-0.5 shrink-0" />
      <span>
        Already used by <b>{result.hospitals.join(", ")}</b>. Records stay
        separate, but a unique prefix avoids confusion in reports and support.
      </span>
    </div>
  );
};

const CreateOrUpdateHospital = ({ edit }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const location = useLocation();
  const hospitalData = location?.state?.hospital || null;
  const navigate = useNavigate();

  // --- Soft prefix conflict check (warning only, never blocks submit) ---
  const [staffPrefix, setStaffPrefix] = useState("");
  const [patientPrefix, setPatientPrefix] = useState("");
  const [prefixCheck, setPrefixCheck] = useState(null);
  const debouncedStaffPrefix = useDebounce(staffPrefix, 500);
  const debouncedPatientPrefix = useDebounce(patientPrefix, 500);

  useEffect(() => {
    const run = async () => {
      if (!debouncedStaffPrefix && !debouncedPatientPrefix) {
        setPrefixCheck(null);
        return;
      }
      const res = await checkHospitalPrefixApi({
        staffPrefix: debouncedStaffPrefix || undefined,
        patientPrefix: debouncedPatientPrefix || undefined,
        hospitalId: hospitalData?._id, // exclude self when editing
      });
      setPrefixCheck(res.success ? res.data : null);
    };
    run();
  }, [debouncedStaffPrefix, debouncedPatientPrefix, hospitalData?._id]);

  useEffect(() => {
    if (edit && hospitalData) {
      form.setFieldsValue({
        ...hospitalData,
        ...hospitalData.modules,
      });
      setStaffPrefix(hospitalData.staffPrefix || "");
      setPatientPrefix(hospitalData.patientPrefix || "");

      if (hospitalData.logoUrl) {
        setPreviewImage(hospitalData.logoUrl);
      }
    }
  }, [edit, hospitalData, form]);

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith("image/");
    const isLt500KB = file.size / 1024 < 500;

    if (!isImage) {
      toast.error("Only image files are allowed.");
      return false;
    }
    if (!isLt500KB) {
      toast.error("Image must be smaller than 500KB.");
      return false;
    }

    const reader = new FileReader();
    reader.onload = (e) => setPreviewImage(e.target.result);
    reader.readAsDataURL(file);

    setLogoFile(file);
    return false;
  };

  const handleImageChange = (info) => {
    const file = info.file.originFileObj;
    if (file && beforeUpload(file)) {
      setLogoFile(file);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    const formData = new FormData();

    if (edit) {
      formData.append("editMode", edit);
      values.hospitalId = hospitalData?._id;
    }

    formData.append("hospitalInfo", JSON.stringify(values));

    if (logoFile) formData.append("logo", logoFile);

    try {
    const result = await createOrUpdateHospitalApi(formData);
      if (result.success) {
        toast.success(
          result?.message || "Hospital & Admin created successfully!"
        );
        form.resetFields();
        setLogoFile(null);
        setPreviewImage(null);
        navigate("/hospitals");
      } else {
        toast.error(result || "Something went wrong");
      }
    } catch (err) {
      toast.error("Server error. Try again later.");
    }

    setLoading(false);
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      onFinish(form.getFieldsValue());
    } catch (err) {
      toast.error("Please fill all required fields correctly.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black">
      <Form form={form} layout="vertical">
        <Card
          title="Add Hospital"
          className="w-full mb-6 dark:bg-neutral-900 dark:text-white"
        >
          <Row gutter={[24, 16]}>
            <Col xs={24} md={6}>
              <Form.Item label="Logo (Max: 500KB)">
                <Upload
                  name="logo"
                  listType="picture-card"
                  maxCount={1}
                  beforeUpload={beforeUpload}
                  showUploadList={false}
                  onChange={handleImageChange}
                  accept="image/*"
                >
                  {!previewImage ? (
                    <div>
                      <UploadOutlined />
                      <div className="mt-2">Upload Logo</div>
                    </div>
                  ) : (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-24 h-24 object-cover rounded-md border"
                      />
                      <Button
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImage(null);
                          setLogoFile(null);
                          form.setFieldsValue({ logo: undefined });
                        }}
                        className="mt-2 bg-red-500 text-white border-none hover:bg-red-600"
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>

            <Col xs={24} md={18}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Hospital Name"
                    name="fullName"
                    rules={[
                      { required: true, message: "Hospital name is required" },
                    ]}
                  >
                    <Input placeholder="e.g., City Care Hospital" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Address" name="address">
                    <Input placeholder="e.g., 123 Street Name, City" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    label="Phone"
                    name="phone"
                    rules={[
                      { required: true, message: "Phone number is required" },
                      {
                        pattern: /^[0-9]{10}$/,
                        message: "Enter a valid 10-digit phone number",
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[{ type: "email", message: "Enter a valid email" }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item label="Website" name="website">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={6}>
                  <Form.Item
                    label="Staff Prefix"
                    name="staffPrefix"
                    tooltip="Used to generate staff IDs, e.g. ST-001"
                    rules={[
                      { required: true, message: "Please enter staff prefix" },
                      {
                        pattern: /^[A-Z]+$/,
                        message: "Only uppercase letters allowed",
                      },
                    ]}
                  >
                    <Input
                      placeholder="E.g., ST"
                      onChange={(e) =>
                        setStaffPrefix(e.target.value.toUpperCase())
                      }
                    />
                  </Form.Item>
                  <PrefixWarning result={prefixCheck?.staffPrefix} />
                </Col>

                <Col xs={24} sm={6}>
                  <Form.Item
                    label="Patient Prefix"
                    name="patientPrefix"
                    tooltip="Used to generate patient IDs, e.g. PT-001"
                    rules={[
                      {
                        required: true,
                        message: "Please enter patient prefix",
                      },
                      {
                        pattern: /^[A-Z]+$/,
                        message: "Only uppercase letters allowed",
                      },
                    ]}
                  >
                    <Input
                      placeholder="E.g., PT"
                      onChange={(e) =>
                        setPatientPrefix(e.target.value.toUpperCase())
                      }
                    />
                  </Form.Item>
                  <PrefixWarning result={prefixCheck?.patientPrefix} />
                </Col>
              </Row>
            </Col>
          </Row>

          <Row gutter={24} className="mt-2">
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Print Letterhead"
                name="printTemplate"
                tooltip="Which letterhead this hospital's printed documents use. Bespoke templates are built per client; everyone else uses the Velocare default."
              >
                <Select
                  placeholder="Default (Velocare)"
                  options={TEMPLATE_OPTIONS}
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 mt-6">
            <p className="text-base font-semibold mb-3 text-gray-700 dark:text-white">
              Select Enabled Modules
            </p>
            <Row gutter={[24, 16]}>
              {moduleList.map((mod) => (
                <Col key={mod} xs={12} sm={8} md={6}>
                  <Form.Item name={mod} valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                  <span className="ml-3 capitalize text-base text-gray-700 dark:text-gray-300">
                    {moduleLabels[mod] || mod}
                  </span>
                </Col>
              ))}
            </Row>
          </div>
          <Row className="mt-6">
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Disable Hospital"
                name="isDisabled"
                valuePropName="checked"
                tooltip="Switch ON to mark hospital as disabled"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Delete Hospital"
                name="isDeleted"
                valuePropName="checked"
                tooltip="Switch ON to mark hospital as deleted"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {!edit && (
          <Card
            title="Add Admin"
            className="w-full dark:bg-neutral-900 dark:text-white"
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="adminFullName"
                  label="Full Name"
                  rules={[
                    { required: true, message: "Please enter full name" },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="adminEmail"
                  label="Email"
                  rules={[
                    { required: true, message: "Please enter email" },
                    { type: "email", message: "Enter valid email" },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="adminPhone"
                  label="Phone"
                  rules={[
                    { required: true, message: "Please enter phone" },
                    {
                      pattern: /^[0-9]{10}$/,
                      message: "Enter a valid 10-digit phone number",
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="adminPassword"
                  label="Password"
                  rules={[
                    { required: true, message: "Please enter password" },
                    {
                      min: 6,
                      message: "Password must be at least 6 characters",
                    },
                  ]}
                >
                  <Input.Password />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        )}

        <div className="flex justify-end mt-6">
          <Button
            type="primary"
            loading={loading}
            className="bg-blue-600 hover:bg-blue-700 border-none h-10 text-lg px-6"
            onClick={handleSubmit}
          >
            {edit ? "Update" : "Create"}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default CreateOrUpdateHospital;
