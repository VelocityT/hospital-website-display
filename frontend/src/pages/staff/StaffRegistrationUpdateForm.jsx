import { useEffect, useState } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Card,
  Row,
  Col,
  Upload,
  Switch,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  IdcardOutlined,
  TeamOutlined,
  PhoneOutlined,
  HomeOutlined,
  SolutionOutlined,
  FileTextOutlined,
  CalendarOutlined,
  ContactsOutlined,
  FileProtectOutlined,
  UploadOutlined,
  CameraOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { updateOrCreateUserApi } from "../../services/apis";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { handleNumericKeyDown } from "../../utils/helper";
import CameraCapture from "../components/CamCapture";

const { Option } = Select;
const bloodGroups = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "Unknown",
];

/**
 * "Required, but 0 is a valid answer."
 *
 * Zero was previously unreachable on the charge and commission fields for two
 * separate reasons, and both had to go:
 *
 *  1. `min={1}` on the <input type="number"> is NATIVE browser validation. The
 *     global Enter-to-submit handler in App.js clicks the submit button, which
 *     fires a real form submit, so Chrome rejects the value with "must be
 *     greater than or equal to 1" before React or AntD ever see it. No amount
 *     of rule-tweaking helps while that attribute says 1.
 *  2. A bare `required` rule reads a cleared field and a deliberate 0 the same
 *     way once the value has been through an <input> and FormData, both of
 *     which stringify.
 *
 * And 0 is a real answer: a free consultation, a charity camp, a staff family
 * member, or a salaried doctor who earns no per-visit commission. Rejecting it
 * forces staff to type 1 and quietly bill someone a rupee.
 *
 * @param {string} label  field name used in the message
 * @param {number} [max]  optional upper bound (100 for percentages)
 */
const requiredAllowingZero = (label, max) => ({
  validator: (_, value) => {
    if (value === undefined || value === null || value === "") {
      return Promise.reject(new Error(`${label} is required`));
    }
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return Promise.reject(new Error(`${label} must be a number`));
    }
    if (n < 0) {
      return Promise.reject(new Error(`${label} cannot be negative`));
    }
    if (max !== undefined && n > max) {
      return Promise.reject(new Error(`${label} cannot be more than ${max}`));
    }
    return Promise.resolve();
  },
});

function StaffRegistrationForm({ edit = false }) {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [previewImage, setPreviewImage] = useState(null);
  const { state } = useLocation();
  const staffData = state?.staff || null;
  const role = Form.useWatch("role", form);
  // Salaried doctors are paid a fixed monthly amount instead of per-visit
  // commission. IPD/OPD *charges* stay visible either way — those bill the
  // patient and are unrelated to how the doctor is paid.
  const isSalaried = Form.useWatch("isSalaried", form);
  const [userFace, setUserFace] = useState(null);
  const [isImageCaptured, setIsImageCaptured] = useState(false);
  const [imageCaptureModal, setImageCaptureModal] = useState(false);

  useEffect(() => {
    if (userFace) {
      setPreviewImage(URL.createObjectURL(userFace));
      form.setFieldsValue({ photo: [{ originFileObj: userFace }] });
    }
  }, [userFace]);

  const validatePhone = (_, value) => {
    if (!value) return Promise.resolve();
    return /^[6-9]\d{9}$/.test(value)
      ? Promise.resolve()
      : Promise.reject("Enter valid 10-digit Indian mobile number");
  };

  const onFinish = async (values) => {
    try {
      const dob = values.dob;
      const dateOfJoining = values.dateOfJoining;

      const photoFile = values.photo?.[0]?.originFileObj;

      const formData = new FormData();
      if (edit) {
        formData.append("edit", edit);
        formData.append("_id", staffData?._id || "");
      }
      for (const key in values) {
        if (key === "photo") continue;
        if (key === "dob") formData.append("dob", dob);
        else if (key === "dateOfJoining")
          formData.append("dateOfJoining", dateOfJoining);
        // FormData stringifies everything. An untouched Switch is `undefined`,
        // which would be sent as "" — and Mongoose cannot cast "" to Boolean.
        // Send an explicit "true"/"false" instead.
        else if (key === "isSalaried")
          formData.append("isSalaried", values[key] ? "true" : "false");
        else formData.append(key, values[key] ?? "");
      }

      if (photoFile) {
        formData.append("photo", photoFile);
      }
      const response = await updateOrCreateUserApi(formData);

      if (response.success) {
        toast.success(
          response.message || (edit ? "Staff updated!" : "Staff registered!")
        );
        if (edit) navigate(-1);
        form.resetFields();
        setPreviewImage(null);
      } else {
        toast.error(response || "Operation failed");
      }
    } catch (error) {
      toast.error(error.message || "Server error");
    }
  };

  const handlePhotoChange = ({ fileList }) => {
    if (fileList && fileList.length > 0) {
      const file = fileList[0].originFileObj;
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
    }
    form.setFieldsValue({ photo: fileList });
  };

  useEffect(() => {
    if (edit && staffData) {
      const dob = staffData.dob ? dayjs(staffData.dob) : null;
      const dateOfJoining = staffData.dateOfJoining
        ? dayjs(staffData.dateOfJoining)
        : null;

      form.setFieldsValue({
        ...staffData,
        dob,
        dateOfJoining,
        photo: staffData.profilePhoto
          ? [
              {
                uid: "-1",
                name: "Profile Photo",
                status: "done",
                url: staffData.profilePhoto,
              },
            ]
          : [],
      });

      if (staffData.profilePhoto) {
        setPreviewImage(staffData.profilePhoto);
      }
    }
  }, [edit, staffData]);

  return (
    <div className="pb-4">
      <Card
        title={
          <span>
            <TeamOutlined style={{ marginRight: 8 }} />
            Staff Registration
          </span>
        }
        variant="borderless"
        className="bg-transparent border-none overflow-hidden"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          onFinishFailed={() =>
            toast.error("Please fill all required fields correctly.")
          }
          autoComplete="off"
        >
          <Row gutter={[0, 24]}>
            <Col span={24}>
              <Card
                title={
                  <span>
                    <UserOutlined style={{ marginRight: 8 }} />
                    Account Details
                  </span>
                }
                variant="borderless"
                className="overflow-hidden"
              >
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="photo"
                      label="Photo"
                      valuePropName="fileList"
                      extra="Max image size 2MB"
                      getValueFromEvent={(e) =>
                        Array.isArray(e) ? e : e && e.fileList
                      }
                    >
                      <>
                        <div className="flex flex-col gap-2">
                          <Upload
                            name="photo"
                            listType="picture-card"
                            maxCount={1}
                            beforeUpload={(file) => {
                              const isLt2M = file.size / 1024 / 1024 < 2;
                              if (!isLt2M) return Upload.LIST_IGNORE;
                              return false;
                            }}
                            showUploadList={false}
                            onChange={handlePhotoChange}
                            accept="image/*"
                          >
                            {!previewImage && "Upload Photo"}
                          </Upload>
                          {!previewImage && (
                            <Button
                              className="w-fit"
                              onClick={() => setImageCaptureModal(true)}
                              icon={<CameraOutlined />}
                            >
                              Capture Photo
                            </Button>
                          )}
                        </div>
                        {previewImage && (
                          <div style={{ textAlign: "center" }}>
                            <img
                              src={previewImage}
                              alt="Preview"
                              style={{
                                width: "100px",
                                height: "100px",
                                objectFit: "cover",
                                borderRadius: 8,
                                marginBottom: 8,
                              }}
                            />
                            <div>
                              <Button
                                size="small"
                                onClick={() => {
                                  setPreviewImage(null);
                                  form.setFieldsValue({ photo: [] });
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={16} lg={8}>
                    <Form.Item
                      name="fullName"
                      label="Full Name"
                      rules={[
                        { required: true, message: "Enter full name" },
                        {
                          min: 3,
                          message: "Name must be at least 3 characters",
                        },
                      ]}
                    >
                      <Input
                        size="large"
                        placeholder="Full Name"
                        prefix={<UserOutlined />}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12} lg={8}>
                    <Form.Item
                      name="email"
                      label="Email"
                      rules={[
                        { required: true, message: "Enter email" },
                        { type: "email", message: "Enter valid email" },
                      ]}
                    >
                      <Input
                        size="large"
                        placeholder="Email"
                        prefix={<MailOutlined />}
                      />
                    </Form.Item>
                  </Col>
                  {!edit && (
                    <>
                      <Col xs={24} md={12} lg={8}>
                        <Form.Item
                          name="password"
                          label="Password"
                          rules={[
                            { required: true, message: "Enter password" },
                            {
                              min: 6,
                              message: "Password must be at least 6 characters",
                            },
                          ]}
                        >
                          <Input.Password
                            size="large"
                            placeholder="Password"
                            prefix={<LockOutlined />}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12} lg={8}>
                        <Form.Item
                          name="dateOfJoining"
                          label="Joining Date"
                          rules={[
                            { required: true, message: "Select joining date" },
                            {
                              validator: (_, value) =>
                                value && value.isAfter(dayjs())
                                  ? Promise.reject(
                                      "Joining date cannot be in the future"
                                    )
                                  : Promise.resolve(),
                            },
                          ]}
                        >
                          <DatePicker
                            size="large"
                            style={{ width: "100%" }}
                            format="DD/MM/YYYY"
                            placeholder="Select Joining Date"
                            suffixIcon={<CalendarOutlined />}
                            disabledDate={(current) =>
                              current && current > dayjs().endOf("day")
                            }
                          />
                        </Form.Item>
                      </Col>
                    </>
                  )}
                </Row>
              </Card>
            </Col>

            <Col span={24}>
              <Card
                title={
                  <span>
                    <IdcardOutlined style={{ marginRight: 8 }} />
                    Staff Info
                  </span>
                }
                variant="borderless"
                className="overflow-hidden"
              >
                <Row gutter={16}>
                  <Col xs={24} md={12} lg={8}>
                    <Form.Item
                      name="role"
                      label="Role"
                      rules={[{ required: true, message: "Select role" }]}
                    >
                      <Select
                        size="large"
                        placeholder="Select Role"
                        prefix={<TeamOutlined />}
                      >
                        <Option value="admin">Admin</Option>
                        <Option value="doctor">Doctor</Option>
                        <Option value="nurse">Nurse</Option>
                        <Option value="receptionist">Receptionist</Option>
                        <Option value="pharmacist">Pharmacist</Option>
                        <Option value="pathologist">Pathologist</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12} lg={8}>
                    <Form.Item
                      name="department"
                      label="Department"
                      rules={[{ required: true, message: "Enter department" }]}
                    >
                      <Input
                        size="large"
                        placeholder="Department"
                        prefix={<SolutionOutlined />}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12} lg={8}>
                    <Form.Item
                      name="designation"
                      label="Designation"
                      rules={[{ required: true, message: "Enter designation" }]}
                    >
                      <Input
                        size="large"
                        placeholder="Designation"
                        prefix={<SolutionOutlined />}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col span={24}>
              <Card
                title={
                  <span>
                    <ContactsOutlined style={{ marginRight: 8 }} />
                    Personal Details
                  </span>
                }
                variant="borderless"
                className="overflow-hidden"
              >
                <Row gutter={16}>
                  <Col xs={24} md={12} lg={6}>
                    <Form.Item
                      name="gender"
                      label="Gender"
                      rules={[{ required: true, message: "Select gender" }]}
                    >
                      <Select size="large" placeholder="Select Gender">
                        <Option value="Male">Male</Option>
                        <Option value="Female">Female</Option>
                        <Option value="Other">Other</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12} lg={6}>
                    <Form.Item
                      name="dob"
                      label="Date of Birth"
                      rules={[
                        { required: true, message: "Select date of birth" },
                        {
                          validator: (_, value) =>
                            value && value.isAfter(dayjs())
                              ? Promise.reject("DOB cannot be in the future")
                              : Promise.resolve(),
                        },
                      ]}
                    >
                      <DatePicker
                        size="large"
                        style={{ width: "100%" }}
                        format="DD/MM/YYYY"
                        placeholder="Select DOB"
                        suffixIcon={<CalendarOutlined />}
                        disabledDate={(current) =>
                          current && current > dayjs().endOf("day")
                        }
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12} lg={6}>
                    <Form.Item name="bloodGroup" label="Blood Group">
                      <Select size="large" placeholder="Select Blood Group">
                        {bloodGroups.map((group) => (
                          <Option key={group} value={group}>
                            {group}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12} lg={6}>
                    <Form.Item name="maritalStatus" label="Marital Status">
                      <Select size="large" placeholder="Select Status">
                        <Option value="Single">Single</Option>
                        <Option value="Married">Married</Option>
                        <Option value="Divorced">Divorced</Option>
                        <Option value="Widowed">Widowed</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} md={12} lg={6}>
                    <Form.Item
                      name="phone"
                      label="Phone"
                      rules={[
                        { required: true, message: "Enter phone number" },
                        { validator: validatePhone },
                      ]}
                    >
                      <Input
                        size="large"
                        placeholder="Phone"
                        prefix={<PhoneOutlined />}
                        maxLength={10}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12} lg={6}>
                    <Form.Item
                      name="emergencyContact"
                      label="Emergency Contact"
                    >
                      <Input
                        size="large"
                        placeholder="Emergency Contact"
                        prefix={<PhoneOutlined />}
                        maxLength={10}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12} lg={6}>
                    <Form.Item name="fatherName" label="Father's Name">
                      <Input
                        size="large"
                        placeholder="Father's Name"
                        prefix={<UserOutlined />}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12} lg={6}>
                    <Form.Item name="motherName" label="Mother's Name">
                      <Input
                        size="large"
                        placeholder="Mother's Name"
                        prefix={<UserOutlined />}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col span={24}>
              <Card
                title={
                  <span>
                    <HomeOutlined style={{ marginRight: 8 }} />
                    Address
                  </span>
                }
                variant="borderless"
                className="overflow-hidden"
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="currentAddress"
                      label="Current Address"
                      rules={[
                        { required: true, message: "Enter current address" },
                      ]}
                    >
                      <Input.TextArea
                        rows={2}
                        size="large"
                        placeholder="Current Address"
                        prefix={<HomeOutlined />}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="permanentAddress"
                      label="Permanent Address"
                      rules={[
                        { required: true, message: "Enter permanent address" },
                      ]}
                    >
                      <Input.TextArea
                        rows={2}
                        size="large"
                        placeholder="Permanent Address"
                        prefix={<HomeOutlined />}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col span={24}>
              <Card
                title={
                  <span>
                    <SolutionOutlined style={{ marginRight: 8 }} />
                    Professional Details
                  </span>
                }
                variant="borderless"
                className="overflow-hidden"
              >
                <Row gutter={16}>
                  <Col xs={24} md={12} lg={8}>
                    <Form.Item
                      name="qualification"
                      label="Qualification"
                      rules={[
                        { required: true, message: "Enter qualification" },
                      ]}
                    >
                      <Input
                        size="large"
                        placeholder="Qualification"
                        prefix={<FileTextOutlined />}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12} lg={8}>
                    <Form.Item name="specialist" label="Specialist">
                      <Input
                        size="large"
                        placeholder="Specialist"
                        prefix={<FileTextOutlined />}
                      />
                    </Form.Item>
                  </Col>
                  {role === "doctor" && (
                    <>
                      <Col xs={24} md={12} lg={8}>
                        <Form.Item
                          name="isSalaried"
                          label="Payment Type"
                          valuePropName="checked"
                          tooltip="Salaried: the doctor draws a fixed monthly amount and visit commission is disabled. Commission: the doctor earns a % of each IPD/OPD charge. Patient billing is the same either way."
                        >
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={!!isSalaried}
                              onChange={(checked) =>
                                form.setFieldsValue({ isSalaried: checked })
                              }
                            />
                            <span className="text-base">
                              {isSalaried ? "Salaried" : "Commission based"}
                            </span>
                          </div>
                        </Form.Item>
                      </Col>

                      {isSalaried && (
                        <Col xs={24} md={12} lg={8}>
                          <Form.Item
                            name="monthlySalary"
                            label="Monthly Salary"
                            rules={[
                              {
                                required: true,
                                message: "Monthly Salary is required",
                              },
                            ]}
                          >
                            <Input
                              size="large"
                              type="number"
                              placeholder="e.g. 60000"
                              min={0}
                              addonBefore="₹"
                              onKeyUp={handleNumericKeyDown}
                            />
                          </Form.Item>
                        </Col>
                      )}

                      <Col xs={24} md={12} lg={8}>
                        <Form.Item
                          name="ipdCharge"
                          label="IPD Charge"
                          rules={[requiredAllowingZero("IPD Charge")]}
                        >
                          <Input
                            size="large"
                            type="number"
                            placeholder="IPD Charge"
                            min={0}
                            onKeyUp={handleNumericKeyDown}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12} lg={8}>
                        <Form.Item
                          name="opdCharge"
                          label="OPD Charge"
                          rules={[requiredAllowingZero("OPD Charge")]}
                        >
                          <Input
                            size="large"
                            type="number"
                            placeholder="OPD Charge"
                            min={0}
                            onKeyUp={handleNumericKeyDown}
                          />
                        </Form.Item>
                      </Col>

                      {/* Printed in the prescription footer as
                          "Validity for N Days". Per doctor because a physician
                          writing a chronic regimen and a surgeon writing
                          post-op cover do not mean the same thing by "valid".
                          Left blank, the server keeps the existing value (or
                          applies the 5-day default on a new doctor). */}
                      <Col xs={24} md={12} lg={8}>
                        <Form.Item
                          name="prescriptionValidityDays"
                          label="Prescription Validity"
                          tooltip="Shown on the printed prescription footer. Leave blank to use the default of 5 days."
                        >
                          <Input
                            size="large"
                            type="number"
                            placeholder="e.g. 5"
                            min={0}
                            addonAfter="days"
                            onKeyUp={handleNumericKeyDown}
                          />
                        </Form.Item>
                      </Col>

                      {/* Commission only applies to non-salaried doctors.
                          Hidden (not deleted) when salaried, so switching back
                          restores the previously saved percentages. */}
                      <Col
                        xs={24}
                        md={12}
                        lg={8}
                        style={isSalaried ? { display: "none" } : undefined}
                      >
                        <Form.Item
                          name="ipdCommission"
                          label="IPD Commission (%)"
                          rules={
                            isSalaried
                              ? []
                              : [requiredAllowingZero("IPD Commission", 100)]
                          }
                        >
                          <Input
                            size="large"
                            type="number"
                            placeholder="e.g. 20"
                            min={0}
                            max={100}
                            addonAfter="%"
                            onKeyUp={handleNumericKeyDown}
                          />
                        </Form.Item>
                      </Col>

                      <Col
                        xs={24}
                        md={12}
                        lg={8}
                        style={isSalaried ? { display: "none" } : undefined}
                      >
                        <Form.Item
                          name="opdCommission"
                          label="OPD Commission (%)"
                          rules={
                            isSalaried
                              ? []
                              : [requiredAllowingZero("OPD Commission", 100)]
                          }
                        >
                          <Input
                            size="large"
                            type="number"
                            placeholder="e.g. 15"
                            min={0}
                            max={100}
                            addonAfter="%"
                            onKeyUp={handleNumericKeyDown}
                          />
                        </Form.Item>
                      </Col>
                    </>
                  )}
                </Row>
                <Row gutter={16}>
                  <Col xs={24} md={12} lg={8}>
                    <Form.Item name="workExperience" label="Work Experience">
                      <Input
                        size="large"
                        placeholder="Work Experience"
                        prefix={<FileTextOutlined />}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12} lg={16}>
                    <Form.Item name="note" label="Note">
                      <Input.TextArea
                        rows={2}
                        size="large"
                        placeholder="Note"
                        prefix={<FileTextOutlined />}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col span={24}>
              <Card
                title={
                  <span>
                    <FileProtectOutlined style={{ marginRight: 8 }} />
                    Document IDs
                  </span>
                }
                variant="borderless"
                className="overflow-hidden"
              >
                <Row gutter={16}>
                  <Col xs={24} md={12} lg={8}>
                    <Form.Item name="panNumber" label="PAN Number">
                      <Input
                        size="large"
                        placeholder="PAN Number"
                        prefix={<IdcardOutlined />}
                        maxLength={10}
                        style={{ textTransform: "uppercase" }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12} lg={8}>
                    <Form.Item name="aadharNumber" label="Aadhar Number">
                      <Input
                        size="large"
                        placeholder="Aadhar Number"
                        prefix={<IdcardOutlined />}
                        maxLength={12}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12} lg={8}>
                    <Form.Item name="reference" label="Reference">
                      <Input
                        size="large"
                        placeholder="Reference"
                        prefix={<UserOutlined />}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col span={24}>
              <Form.Item className="text-end mt-4">
                <Button type="primary" size="large" htmlType="submit">
                  {edit ? "Update Profile" : "Register Staff"}
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
      {imageCaptureModal && (
        <CameraCapture
          isImageCaptured={isImageCaptured}
          setIsImageCaptured={setIsImageCaptured}
          setUserFace={setUserFace}
          setImageCaptureModal={setImageCaptureModal}
        />
      )}
    </div>
  );
}

export default StaffRegistrationForm;
