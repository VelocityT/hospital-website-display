import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { createOrUpdatePathologyTestApi } from "../../services/apis";
import {
  Form,
  Input,
  InputNumber,
  Button,
  Card,
  Row,
  Col,
  Divider,
  Checkbox,
  Typography,
  Spin,
  AutoComplete,
} from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { toast } from "react-hot-toast";
import {
  pathologyCategories,
  pathologyUnitsDropdown,
} from "../../utils/localStorage";

const { Title } = Typography;

const CreateUpdatePathology = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (id && location.state) {
      form.setFieldsValue(location?.state);
    }
  }, [id, location.state]);

  const onFinish = async (values) => {
    setLoading(true);
    const payload = {
      ...values,
      charge: Number(values.charge),
    };

    const res = await createOrUpdatePathologyTestApi(payload, id);
    if (res && res.success !== false) {
      toast.success(
        id ? "Test updated successfully" : "Test created successfully"
      );
      setTimeout(() => navigate("/pathology"), 800);
    } else {
      toast.error(res.message || "Operation failed");
    }
    setLoading(false);
  };

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24, textAlign: "left" }}>
        {id ? "Edit Pathology Test" : "Add New Pathology Test"}
      </Title>
      <Card variant="borderless" className="shadow-md rounded-lg">
        <Spin spinning={loading}>
          <Form
            layout="vertical"
            form={form}
            onFinish={onFinish}
            autoComplete="off"
            size="large"
            style={{ marginTop: 16 }}
          >
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Test Name"
                  name="testName"
                  rules={[
                    { required: true, message: "Please enter test name" },
                  ]}
                >
                  <Input placeholder="Enter test name" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Test Code" name="testCode">
                  <Input placeholder="Enter test code" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Category"
                  name="category"
                  rules={[
                    {
                      required: true,
                      message: "Please select or enter category",
                    },
                  ]}
                >
                  <AutoComplete
                    placeholder="Select or enter category"
                    options={pathologyCategories?.map((cat) => ({
                      value: cat.name,
                    }))}
                    filterOption={(inputValue, option) =>
                      option.value
                        .toLowerCase()
                        .includes(inputValue.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Charge"
                  name="charge"
                  rules={[
                    { required: true, message: "Please enter charge" },
                    {
                      type: "number",
                      min: 0,
                      message: "Charge must be positive",
                    },
                  ]}
                >
                  <InputNumber
                    min={0}
                    className="w-full"
                    placeholder="Enter charge"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Sample Type" name="sampleType">
                  <Input placeholder="Enter sample type (e.g., Blood, Urine)" />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item label="Description" name="description">
                  <Input.TextArea rows={2} placeholder="Enter description" />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.List name="tests">
                  {(fields, { add, remove }) => (
                    <>
                      <Divider>Tests</Divider>
                      {fields.map(({ key, name, ...restField }) => (
                        <Row key={key} gutter={16} align="middle">
                          <Col span={8}>
                            <Form.Item
                              {...restField}
                              name={[name, "name"]}
                              rules={[
                                {
                                  required: true,
                                  message: "Test name required",
                                },
                              ]}
                            >
                              <Input placeholder="Test name" />
                            </Form.Item>
                          </Col>
                          <Col span={8}>
                            <Form.Item {...restField} name={[name, "unit"]}>
                              <AutoComplete
                                placeholder="Unit"
                                options={pathologyUnitsDropdown?.map(
                                  (unit) => ({
                                    value: unit.value,
                                  })
                                )}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item
                              {...restField}
                              name={[name, "normalRange"]}
                            >
                              <Input placeholder="Normal range" />
                            </Form.Item>
                          </Col>
                          <Col span={1}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                height: "100%",
                              }}
                            >
                              <MinusCircleOutlined
                                onClick={() => remove(name)}
                                style={{
                                  fontSize: 18,
                                  color: "red",
                                  cursor: "pointer",
                                }}
                              />
                            </div>
                          </Col>
                        </Row>
                      ))}
                      <Form.Item>
                        <Button
                          type="dashed"
                          onClick={() => add()}
                          block
                          icon={<PlusOutlined />}
                        >
                          Add Test
                        </Button>
                      </Form.Item>
                    </>
                  )}
                </Form.List>
              </Col>

              <Col xs={24}>
                <Form.Item
                  name="isActive"
                  valuePropName="checked"
                  style={{ marginBottom: 0 }}
                >
                  <Checkbox defaultChecked>Active</Checkbox>
                </Form.Item>
                {id && (
                  <Form.Item
                    name="isDeleted"
                    valuePropName="checked"
                    style={{ marginBottom: 0 }}
                  >
                    <Checkbox>Delete This Test</Checkbox>
                  </Form.Item>
                )}
              </Col>
            </Row>

            <Divider />
            <Form.Item style={{ textAlign: "right" }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                style={{ borderRadius: 6 }}
              >
                {id ? "Update Test" : "Add Test"}
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default CreateUpdatePathology;
