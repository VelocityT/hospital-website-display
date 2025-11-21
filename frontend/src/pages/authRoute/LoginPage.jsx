import React, { useState } from "react";
import { Form, Input, Button, Card, Typography } from "antd";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/userSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { loginUser } from "../../services/apis";
import {
  UserOutlined,
  SolutionOutlined,
  TeamOutlined,
  UserAddOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
} from "@ant-design/icons";
import { MdSupervisedUserCircle } from "react-icons/md";
import { setHospital } from "../../redux/hospitalSlice";

const { Title } = Typography;

const roles = [
  // {
  //   key: "superAdmin",
  //   icon: <MdSupervisedUserCircle />,
  //   label: "Super Admin",
  // },
  {
    key: "admin",
    icon: <UserOutlined />,
    label: "Admin",
  },
  {
    key: "doctor",
    icon: <SolutionOutlined />,
    label: "Doctor",
  },
  {
    key: "nurse",
    icon: <TeamOutlined />,
    label: "Nurse",
  },
  {
    key: "receptionist",
    icon: <UserAddOutlined />,
    label: "Receptionist",
  },
  {
    key: "pharmacist",
    icon: <MedicineBoxOutlined />,
    label: "Pharmacist",
  },
  {
    key: "pathologist",
    icon: <ExperimentOutlined />,
    label: "Pathologist",
  },
];

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleError, setRoleError] = useState("");

  const [form] = Form.useForm();

  React.useEffect(() => {
    form.setFieldsValue({ role: selectedRole });
    if (selectedRole) setRoleError("");
  }, [selectedRole, form]);

  const onFinish = async (values) => {
    setLoading(true);
    setRoleError("");
    try {
      if (!selectedRole) {
        setRoleError("Please select your role!");
        setLoading(false);
        return;
      }

      const payload = {
        ...values,
        role: selectedRole,
      };
      const res = await loginUser(payload);
      if (res && res.success) {
        const { token } = res;
        sessionStorage.setItem("token", token);
        const { hospital, ...userData } = res.data;
        dispatch(setUser(userData));
        dispatch(setHospital(hospital));
        toast.success("Login successful!");
        navigate("/");
      } else {
        toast.error(res?.message || "Invalid credentials, please try again.");
      }
    } catch (err) {
      toast.error("Login failed! Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 transition-colors relative">
      <div
        className="absolute top-0 left-0 w-screen h-screen bg-no-repeat bg-cover bg-center z-0"
        style={{ backgroundImage: "url('./bg.jpg')" }}
      />
      <Card
        className="w-[100vw] h-[100vh] md:w-[80vw] md:h-[80vh] lg:max-w-3xl md:rounded-xl shadow-lg overflow-x-hidden md:overflow-hidden bg-white"
        styles={{
          body: { padding: 0 },
        }}
        variant="borderless"
      >
        <div className="flex flex-col-reverse md:flex-row w-full">
          <div className="w-full md:w-1/2 lg:w-3/5 p-6 relative flex flex-col items-center justify-start text-black min-h-[300px]">
            <div className="z-10 text-center">
              <h1 className="text-3xl font-bold fade-in-left fade-delay-1">
                Velo Care
              </h1>
              <p className="text-lg fade-in-left fade-delay-2">
                Your Health Our Priority
              </p>
            </div>

            <img
              src="./doctor.PNG"
              alt="Staff Illustration"
              className="absolute bottom-0 -left-12 w-[200px] md:w-[350px] z-0 opacity-80 pointer-events-none"
            />
            {/* <div className="hidden md:block absolute bottom-0 left-0 w-full h-28 bg-gradient-to-t from-blue-500 via-blue-400/60 to-transparent z-10 pointer-events-none" /> */}
          </div>

          <div className="w-full md:w-1/2 lg:w-2/5 p-6">
            <div className="text-center mb-4">
              <Title level={3} className="!mb-0 !text-gray-800">
                Hospital ERP Login
              </Title>
            </div>
            <div className="light-login">
              <Form layout="vertical" onFinish={onFinish} form={form}>
                <div className="mb-2">
                  <div className="flex flex-wrap justify-center md:gap-2">
                    {roles.map((role) => (
                      <div
                        key={role.key}
                        className="flex flex-col items-center"
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedRole(role.key)}
                          className={`w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center text-xl rounded-full transition-all outline-none border
            ${
              selectedRole === role.key
                ? "border-blue-500 bg-blue-100 text-blue-600"
                : "border-gray-300 bg-white text-gray-500"
            }`}
                          tabIndex={0}
                          aria-label={role.label}
                        >
                          {role.icon}
                        </button>
                        <span className="text-xs text-gray-600 mt-1 text-center w-20">
                          {role.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {roleError && (
                    <div className="text-red-500 text-xs mt-1 text-center">
                      {roleError}
                    </div>
                  )}
                </div>

                <Form.Item name="role" hidden>
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: "Please input your email!" },
                    { type: "email", message: "Please enter a valid email!" },
                  ]}
                >
                  <Input
                    size="large"
                    className="!bg-white text-black"
                    prefix={<UserOutlined />}
                    placeholder="Enter your email"
                    type="email"
                  />
                </Form.Item>

                <Form.Item
                  label="Password"
                  name="password"
                  rules={[
                    { required: true, message: "Please input your password!" },
                  ]}
                >
                  <Input.Password
                    size="large"
                    className="!bg-white text-black"
                    placeholder="Enter your password"
                  />
                </Form.Item>

                <Form.Item shouldUpdate>
                  {() => (
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      loading={loading}
                      size="large"
                      className="rounded-lg font-semibold tracking-wide mt-2"
                      disabled={
                        !selectedRole ||
                        !form.isFieldsTouched(true) ||
                        form
                          .getFieldsError()
                          .some(({ errors }) => errors.length)
                      }
                    >
                      Login
                    </Button>
                  )}
                </Form.Item>
              </Form>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
