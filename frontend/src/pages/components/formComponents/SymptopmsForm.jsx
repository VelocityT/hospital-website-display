import { useEffect, useMemo } from "react";
import { Card, Row, Col, Form, Select } from "antd";
import TextArea from "antd/es/input/TextArea";
import { getSymptoms, rememberCustomSymptom } from "../../../utils/symptomsStore";

const SymptomsForm = ({
  form,
  selectedSymptoms,
  setSelectedSymptoms,
  symptomType,
  setSymptomType,
  symptomDescription,
  setSymptomDescription,
}) => {
  // Read once per mount from the local cache (seeded from the bundled
  // catalogue on first ever load — see utils/symptomsStore.js).
  const symptomsData = useMemo(() => getSymptoms(), []);

  // Symptom options, grouped by body system so a 100+ item list stays
  // navigable. AntD still searches across every group as the user types.
  const symptomOptions = useMemo(() => {
    if (!Array.isArray(symptomsData)) return [];
    const byCategory = new Map();
    for (const s of symptomsData) {
      const cat = s.category || "Other";
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat).push({ label: s.symptom, value: s.symptom });
    }
    return Array.from(byCategory, ([label, options]) => ({ label, options }));
  }, [symptomsData]);

  useEffect(() => {
    if (!Array.isArray(symptomsData)) return;
    // De-duplicated: several symptoms share qualifiers such as "Mild", and a
    // repeated value in a tags Select produces duplicate-key warnings and an
    // ambiguous selection.
    const allTitles = [
      ...new Set(
        symptomsData
          .filter((data) => selectedSymptoms.includes(data.symptom))
          .flatMap((data) => (data.titles || []).map((t) => t.title))
      ),
    ];
    setSymptomType(allTitles);
  }, [selectedSymptoms, setSymptomType, symptomsData]);

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
          const found = (data.titles || []).find((t) => t.title === title);
          if (found) {
            descriptions.push(`${symptom} — ${title}: ${found.description}`);
          }
        }
      }
    }
    setSymptomDescription(descriptions.join("\n"));
  }, [selectedSymptoms, symptomType, form, setSymptomDescription, symptomsData]);

  const handleSymptomTypeChange = (titles) => {
    form.setFieldsValue({ symptomType: titles });
    if (!Array.isArray(symptomsData)) return;
    let descriptions = [];
    for (const symptom of selectedSymptoms) {
      const data = symptomsData.find((s) => s.symptom === symptom);
      if (data) {
        for (const title of titles) {
          const found = (data.titles || []).find((t) => t.title === title);
          if (found) {
            descriptions.push(`${symptom} — ${title}: ${found.description}`);
          }
        }
      }
    }
    setSymptomDescription(descriptions.join("\n"));
  };

  // The Select runs in `tags` mode, so staff can type a symptom that is not in
  // the catalogue. Remember it locally so it appears in the dropdown next time
  // instead of being retyped for every patient.
  const handleSymptomsChange = (values) => {
    setSelectedSymptoms(values);
    const known = new Set(symptomsData.map((s) => s.symptom));
    values.filter((v) => !known.has(v)).forEach(rememberCustomSymptom);
  };

  const handleSymptomDescriptionChange = (e) => {
    setSymptomDescription(e.target.value);
  };

  return (
    <Card title="Symptoms Details" variant="borderless">
      <Row gutter={16}>
        <Col xs={24} md={12}>
          {/* Optional. A patient can be registered before anyone has taken a
              history — reception often books the visit first and the symptoms
              get filled in by the doctor, or not at all for a routine review
              or a pre-op check. Blocking registration on it just made staff
              type a placeholder. */}
          <Form.Item label="Select Symptoms" name="symptoms">
            <Select
              mode="tags"
              size="large"
              placeholder="Type to search symptoms"
              onChange={handleSymptomsChange}
              options={symptomOptions}
              // A long grouped list needs real search, and virtual scrolling
              // keeps it smooth on the low-end desktops at reception.
              showSearch
              optionFilterProp="label"
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              maxTagCount="responsive"
              listHeight={320}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          {/* Also optional, and necessarily so — the options here are derived
              from whichever symptoms were chosen, so with no symptom selected
              there is nothing to pick. */}
          <Form.Item label="Select Symptom Type" name="symptomType">
            <Select
              mode="tags"
              size="large"
              placeholder={
                selectedSymptoms?.length
                  ? "Select type / severity"
                  : "Select a symptom first"
              }
              options={symptomType.map((t) => ({
                label: t,
                value: t,
              }))}
              onChange={handleSymptomTypeChange}
              showSearch
              optionFilterProp="label"
              maxTagCount="responsive"
              listHeight={320}
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
