import { Modal, Form, Input, Select, Switch } from "antd";

const AddWard = ({
  open,
  onCancel,
  onOk,
  form,
  wardTypes = [],
}) => (
  <Modal
    title="Add Ward"
    open={open}
    onCancel={onCancel}
    onOk={onOk}
    okText="Save"
  >
    <Form form={form} layout="vertical">
      <Form.Item
        label="Ward Name"
        name="name"
        rules={[
          { required: true, message: "Please enter ward name" },
          { whitespace: true, message: "Ward name cannot be empty" },
        ]}
      >
        <Input placeholder='e.g. "ICU-1", "Emergency-1", "General-2"' />
      </Form.Item>
      <Form.Item
        label="Ward Type"
        name="type"
        rules={[{ required: true, message: "Please select ward type" }]}
      >
        <Select placeholder="Select ward type">
          {wardTypes.map((type, idx) => (
            <Select.Option key={idx} value={type}>
              {type}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item label="Floor" name="floor">
        <Input placeholder='e.g. "Ground", "1st", "2nd", "3rd", "4th"' />
      </Form.Item>
      <Form.Item
        label="Active"
        name="isActive"
        valuePropName="checked"
        initialValue={true}
      >
        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
      </Form.Item>
    </Form>
  </Modal>
);

export default AddWard;
