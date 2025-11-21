import { useEffect } from "react";
import { Card, Row, Col, Form, Select } from "antd";
import TextArea from "antd/es/input/TextArea";
import { symptomsData } from "../../../utils/localStorage";

const SymptomsForm = ({
  form,
  selectedSymptoms,
  setSelectedSymptoms,
  symptomType,
  setSymptomType,
  symptomDescription,
  setSymptomDescription,
}) => {
  useEffect(() => {
    if (!Array.isArray(symptomsData)) return;
    const allTitles = symptomsData
      .filter((data) => selectedSymptoms.includes(data.symptom))
      .flatMap((data) => data.titles.map((t) => t.title));
    setSymptomType(allTitles);
  }, [selectedSymptoms, setSymptomType]);

  useEffect(() => {
    if (!Array.isArray(symptomsData)) return;
    if (selectedSymptoms.length === 0) {
      setSymptomDescription("");
      return;
    }
    const selectedTitles = form.getFieldValue("symptomType") || [];
    let descriptions = [];
    for (const symptom of selectedSymptoms) {
      const data = symptomsData.find((s) => s.symptom === symptom);
      if (data) {
        for (const title of selectedTitles) {
          const found = data.titles.find((t) => t.title === title);
          if (found) {
            descriptions.push(`${title}: ${found.description}`);
          }
        }
      }
    }
    setSymptomDescription(descriptions.join("\n"));
  }, [selectedSymptoms, symptomType, form, setSymptomDescription]);

  const handleSymptomTypeChange = (titles) => {
    form.setFieldsValue({ symptomType: titles });
    if (!Array.isArray(symptomsData)) return;
    let descriptions = [];
    for (const symptom of selectedSymptoms) {
      const data = symptomsData.find((s) => s.symptom === symptom);
      if (data) {
        for (const title of titles) {
          const found = data.titles.find((t) => t.title === title);
          if (found) {
            descriptions.push(`${title}: ${found.description}`);
          }
        }
      }
    }
    setSymptomDescription(descriptions.join("\n"));
  };

  const handleSymptomDescriptionChange = (e) => {
    setSymptomDescription(e.target.value);
  };

  return (
    <Card title="Symptoms Details" variant="borderless">
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            label="Select Symptoms"
            name="symptoms"
            rules={[
              {
                required: true,
                message: "Please select at least one symptom",
              },
            ]}
          >
            <Select
              mode="tags"
              size="large"
              placeholder="Select Symptoms"
              onChange={setSelectedSymptoms}
              options={
                Array.isArray(symptomsData)
                  ? symptomsData.map((s) => ({
                      label: s.symptom,
                      value: s.symptom,
                    }))
                  : []
              }
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label="Select Symptom Type"
            name="symptomType"
            rules={[
              {
                required: true,
                message: "Please select at least one title",
              },
            ]}
          >
            <Select
              mode="tags"
              size="large"
              placeholder="Select Symptoms"
              options={symptomType.map((t) => ({
                label: t,
                value: t,
              }))}
              onChange={handleSymptomTypeChange}
            />
          </Form.Item>
        </Col>
      </Row>
      <Col sx={24}>
        <Form.Item label="Symptoms Description">
          <TextArea
            value={symptomDescription}
            autoSize={{ minRows: 3 }}
            onChange={handleSymptomDescriptionChange}
            placeholder="Add Description"
          />
        </Form.Item>
      </Col>
    </Card>
  );
};

export default SymptomsForm;
