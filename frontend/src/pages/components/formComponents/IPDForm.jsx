import { useEffect, useState } from "react";
import { Card, Row, Col, Form, Input, InputNumber, Select, DatePicker } from "antd";
import TextArea from "antd/es/input/TextArea";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import {
  getAvailableWardsAndBedsApi,
  getStaffForAssignApi,
} from "../../../services/apis";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useForm, useWatch } from "antd/es/form/Form";

const bedTypes = [
  "General",
  "Oxygen",
  "Ventilator",
  "Infusion",
  "Monitored",
  "Dialysis",
  "Isolation",
  "Burn",
];

const IPDForm = ({ form }) => {
  const [doctors, setDoctors] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [wardOptions, setWardOptions] = useState([]);
  const [bedOptions, setBedOptions] = useState([]);
  const params = useParams();
  const bed = useWatch("bed", form);
  const user = useSelector((state) => state.user);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await getStaffForAssignApi("doctor");
        if (Array.isArray(response?.data)) {
          const mappedDoctors = response.data.map((d) => ({
            label: d.fullName,
            value: d._id,
            ipdCharge: d.ipdCharge,
          }));
          setDoctors(mappedDoctors);
        }
      } catch (err) {
        setDoctors([]);
      }
    };

    const fetchWardsAndBeds = async () => {
      try {
        const ipdId = params.ipdId;
        const res = await getAvailableWardsAndBedsApi({ isEdit: true, ipdId });
        if (res.success && Array.isArray(res.data)) {
          const mappedWards = res.data.map((ward) => ({
            label: `${ward.name} (${ward.type}, ${ward.floor})`,
            value: ward._id,
            beds: ward.beds,
          }));
          setWardOptions(mappedWards);
        } else {
          setWardOptions([]);
          toast.error("Failed to load wards and beds.");
        }
      } catch (err) {
        setWardOptions([]);
        toast.error("Failed to load wards and beds.");
      }
    };

    fetchDoctors();
    fetchWardsAndBeds();

    if (!form.getFieldValue("consultationFees")) {
      form.setFieldsValue({ consultationFees: undefined });
    }
  }, [form, params.ipdId]);

  useEffect(() => {
    const fetchNurses = async () => {
      try {
        const response = await getStaffForAssignApi("nurse");
        if (Array.isArray(response?.data)) {
          const mappedNurses = response.data.map((n) => ({
            label: n.fullName,
            value: n._id,
          }));
          setNurses(mappedNurses);
        }
      } catch (err) {
        setNurses([]);
      }
    };

    fetchNurses();
  }, []);

  useEffect(() => {
    const formValues = form.getFieldsValue(true);

    if (formValues.ward) {
      handleWardChange(formValues.ward, true, formValues.bed);
    }

    if (formValues.doctor && doctors.length > 0) {
      const selected = doctors.find((d) => d.value === formValues.doctor);
      if (selected) {
        form.setFieldsValue({
          consultationFees: selected.ipdCharge,
        });
      }
    }
  }, [wardOptions, doctors, form]);

  const handleDoctorChange = (doctorId) => {
    const selected = doctors.find((d) => d.value === doctorId);
    form.setFieldsValue({
      doctor: doctorId,
      consultationFees: selected?.ipdCharge || undefined,
      // A negotiated rate is tied to the doctor it was agreed with — carrying
      // it over to a newly-picked doctor would silently apply the wrong
      // number to someone nobody negotiated with.
      doctorChargeOverride: undefined,
    });
  };

  const handleWardChange = (
    wardId,
    retainBed = false,
    preselectedBedId = null
  ) => {
    const selectedWard = wardOptions.find((w) => w.value === wardId);
    if (selectedWard) {
      const mappedBeds = selectedWard.beds.map((b) => ({
        label: `Bed ${b.bedNumber} ₹${b.charge || 0}`,
        value: b._id,
      }));
      setBedOptions(mappedBeds);

      if (retainBed && preselectedBedId) {
        form.setFieldsValue({ bed: preselectedBedId });
      } else if (!retainBed) {
        form.setFieldsValue({ bed: undefined });
      }
    }
  };

  return (
    <Card title="IPD Details" variant="borderless">
      <Row gutter={16}>
        <Col xs={24} md={12} lg={8}>
          <Form.Item label="IPD Number" name="ipdNumber">
            <Input size="large" readOnly />
          </Form.Item>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Form.Item
            label="Admission Date"
            name="admissionDateTime"
            rules={[{ required: true, message: "Please select date and time" }]}
            initialValue={dayjs()}
          >
            <DatePicker
              size="large"
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              disabled
              value={form.getFieldValue("admissionDateTime") || dayjs()}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12} lg={8}>
          <Form.Item label="Height (cm)" name="height">
            <Input size="large" placeholder="e.g., 170" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Form.Item label="Weight (kg)" name="weight">
            <Input size="large" placeholder="e.g., 65" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Form.Item label="Blood Pressure" name="bloodPressure">
            <Input size="large" placeholder="e.g., 120/80" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12} lg={8}>
          <Form.Item
            label="Ward"
            name="ward"
            rules={[{ required: true, message: "Please select ward" }]}
          >
            <Select
              size="large"
              placeholder="Select Ward"
              options={wardOptions}
              allowClear
              onChange={handleWardChange}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Form.Item
            label="Bed"
            name="bed"
            rules={[{ required: true, message: "Please select bed" }]}
          >
            <Select
              size="large"
              placeholder="Select Bed"
              options={bedOptions}
              allowClear
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Form.Item
            initialValue={"General"}
            label="Bed Type"
            name="bedType"
            rules={[{ required: true, message: "Please select Bed Type" }]}
          >
            <Select
              disabled={!bed}
              size="large"
              placeholder="Select Bed Type"
              options={bedTypes.map((type) => ({
                label: type,
                value: type,
              }))}
              allowClear
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Form.Item
            label="Doctor"
            name="doctor"
            rules={[{ required: true, message: "Please select doctor" }]}
          >
            <Select
              size="large"
              placeholder="Assign Doctor"
              options={doctors}
              allowClear
              onChange={handleDoctorChange}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Form.Item
            label="Consultation Fees"
            name="consultationFees"
            rules={[
              { required: true, message: "Consultation fee is required" },
            ]}
          >
            <Input
              size="large"
              disabled
              placeholder="Auto-filled from doctor"
            />
          </Form.Item>
        </Col>
        {isAdmin && (
          <Col xs={24} md={12} lg={8}>
            <Form.Item
              label="Doctor Payout Rate — internal (optional)"
              name="doctorChargeOverride"
              tooltip="Does NOT change what the patient is billed — the patient is always charged Consultation Fees above. This only changes what the HOSPITAL pays this doctor for this admission, if a different rate was privately agreed with them. Leave blank to pay the doctor their normal per-day rate."
              extra="Patient billing is unaffected — this is only what the hospital pays the doctor."
              rules={[
                {
                  type: "number",
                  min: 0,
                  message: "Must be 0 or more",
                  transform: (v) => (v === undefined || v === "" ? undefined : Number(v)),
                },
              ]}
            >
              <InputNumber
                size="large"
                min={0}
                style={{ width: "100%" }}
                placeholder="Doctor's normal rate applies if left blank"
              />
            </Form.Item>
          </Col>
        )}
        <Col xs={24} md={12} lg={8}>
          <Form.Item
            label="Nurse"
            name="nurse"
            rules={[{ required: true, message: "Please select nurse" }]}
          >
            <Select
              size="large"
              placeholder="Assign Nurse"
              options={nurses}
              allowClear
              // onChange={handleDoctorChange}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24}>
          <Form.Item label="IPD Notes" name="notes">
            <TextArea
              autoSize={{ minRows: 2 }}
              placeholder="Any notes or remarks for IPD admission"
            />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
};

export default IPDForm;
