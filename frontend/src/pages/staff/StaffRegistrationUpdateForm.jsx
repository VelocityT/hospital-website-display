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

function StaffRegistrationForm({ edit = false }) {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [previewImage, setPreviewImage] = useState(null);
  const { state } = useLocation();
  const staffData = state?.staff || null;
  const role = Form.useWatch("role", form);
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
                          name="ipdCharge"
                          label="IPD Charge"
                          rules={[
                            {
                              required: true,
                              message: "IPD Charge is required",
                            },
                          ]}
                        >
                          <Input
                            size="large"
                            type="number"
                            placeholder="IPD Charge"
                            min={1}
                            onKeyUp={handleNumericKeyDown}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12} lg={8}>
                        <Form.Item
                          name="opdCharge"
                          label="OPD Charge"
                          rules={[
                            {
                              required: true,
                              message: "OPD Charge is required",
                            },
                          ]}
                        >
                          <Input
                            size="large"
                            type="number"
                            placeholder="OPD Charge"
                            min={1}
                            onKeyUp={handleNumericKeyDown}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12} lg={8}>
                        <Form.Item
                          name="ipdCommission"
                          label="IPD Commission (%)"
                          rules={[
                            {
                              required: true,
                              message: "IPD Commission is required",
                            },
                          ]}
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

                      <Col xs={24} md={12} lg={8}>
                        <Form.Item
                          name="opdCommission"
                          label="OPD Commission (%)"
                          rules={[
                            {
                              required: true,
                              message: "OPD Commission is required",
                            },
                          ]}
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
