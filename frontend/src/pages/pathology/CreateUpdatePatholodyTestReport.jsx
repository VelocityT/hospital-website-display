import { useEffect, useState } from "react";
import {
  Form,
  Row,
  Col,
  Select,
  Input,
  Button,
  message,
  Divider,
  Spin,
} from "antd";

import {
  createPathologyTestReportApi,
  getAllPathologyTestsApi,
  getTestReportByIdApi,
} from "../../services/apis";
import useDebounce from "../../hooks/useDebounce";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

const { Option } = Select;

const CreateUpdatePatholodyTestReport = () => {
  const { id } = useParams();
  const [form] = Form.useForm();
  const [patientType, setPatientType] = useState("Ipd");
  const [testOptions, setTestOptions] = useState([]);
  const [tests, setTests] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 500);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    const fetchOldTestReport = async () => {
      try {
        const response = await getTestReportByIdApi(id);

        const resultMap = {};
        response.results?.forEach((test) => {
          resultMap[test._id] = test.result;
        });

        form.setFieldsValue({
          patientType: response.patientType,
          patientNumber:
            response.patientType === "Ipd"
              ? response.ipd?.ipdNumber
              : response.opd?.opdNumber,
          testId: response.test?._id,
          results: resultMap,
          remarks: response.remarks || "",
        });
        if (response.test?.tests?.length) {
          setTests(response.test.tests);
        } else if (response.results?.length) {
          setTests(response.results);
        }

        setTestOptions([response.test]);
        setPatientType(response.patientType);
      } catch (error) {
        toast.error("Failed to fetch test report");
      }
    };

    fetchOldTestReport();
  }, [id]);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setSearching(true);
        const res = await getAllPathologyTestsApi({ search: debouncedSearch });
        if (res?.success) {
          setTestOptions(res.data || []);
        }
      } catch (error) {
        message.error("Failed to fetch test list");
      } finally {
        setSearching(false);
      }
    };

    if (debouncedSearch) fetchTests();
  }, [debouncedSearch]);

  const handleSubmit = async (values) => {
    const resultData = {
      ...values,
      results: tests.map((test) => ({
        ...test,
        result: values.results[test._id],
      })),
    };
    if (id) {
      resultData.reportId = id;
    }

    try {
      const res = await createPathologyTestReportApi(resultData);

      if (res.success) {
        toast.success("Report submitted successfully");
        form.resetFields();
        setTests([]);
        setTestOptions([]);
        setSearchText("");
        navigate(-1);
      } else {
        toast.error(res.message || "Failed to submit report");
      }
    } catch (err) {
      toast.error("An error occurred while submitting");
    }
  };

  const handleTestSelect = (testId) => {
    const selectedTest = testOptions.find((t) => t._id === testId);
    if (selectedTest) {
      setTests(selectedTest.tests || []);
    }
  };

  return (
    <div className="p-4 bg-white shadow rounded-md dark:bg-transparent">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onFinishFailed={() => toast.error("Please fill all required fields")}
      >
        <Row gutter={16}>
          <Col xs={24} md={6}>
            <Form.Item
              label="Patient Type"
              name="patientType"
              initialValue="Ipd"
            >
              <Select
                onChange={(value) => setPatientType(value)}
              >
                <Option value="Ipd">IPD</Option>
                <Option value="Opd">OPD</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              label={`${patientType.toUpperCase()} Number`}
              name="patientNumber"
              rules={[{ required: true, message: "Please enter number" }]}
            >
              <Input
                placeholder={`Enter ${patientType.toUpperCase()} Number`}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Select Pathology Test"
              name="testId"
              rules={[{ required: true, message: "Please select a test" }]}
            >
              <Select
                showSearch
                placeholder="Search Test by Name or ID"
                filterOption={false}
                onSearch={(value) => setSearchText(value)}
                onSelect={handleTestSelect}
                notFoundContent={searching ? <Spin size="small" /> : null}
              >
                {testOptions.map((test) => (
                  <Option key={test._id} value={test._id}>
                    {test.testName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {tests.length > 0 && (
          <>
            <Divider>Test Results</Divider>
            <Row gutter={16}>
              {tests.map((test, index) => (
                <Col xs={24} key={test._id}>
                  <Row gutter={12} align="middle">
                    <Col xs={24} sm={12} md={6}>
                      <Form.Item label="Name">
                        <Input value={test.name} disabled />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                      <Form.Item label="Unit">
                        <Input value={test.unit || "N/A"} disabled />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                      <Form.Item
                        label="Result"
                        name={["results", test._id]}
                        rules={[
                          { required: true, message: "Result is required" },
                        ]}
                      >
                        <Input placeholder="Enter Result" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                      <Form.Item label="Normal Range">
                        <Input value={test.normalRange || "N/A"} disabled />
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>
              ))}
              <Col span={24}>
                <Form.Item label="Remarks" name="remarks">
                  <Input.TextArea
                    rows={2}
                    placeholder="Enter remarks or description"
                    allowClear
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item className="text-right mt-4">
              <Button type="primary" htmlType="submit">
                Submit Report
              </Button>
            </Form.Item>
          </>
        )}
      </Form>
    </div>
  );
};

export default CreateUpdatePatholodyTestReport;
