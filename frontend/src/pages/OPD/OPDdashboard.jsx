import { useState } from "react";
import { Layout, Tabs, Card, Space, Button } from "antd";
import { useNavigate } from "react-router-dom";
import {
  UserAddOutlined,
  MedicineBoxOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import PatientQueue from "./components/PatientQueue";
import ConsultationForm from "./components/ConsultationForm";
import PrescriptionEditor from "./components/PrescriptionEditor";


const { Content } = Layout;
const { TabPane } = Tabs;

const OPDDashboard = () => {
  const [activeTab, setActiveTab] = useState("queue");
  const [selectedPatient, setPatient] = useState(null);
  const navigate = useNavigate();


  return (
    <Content className="opd-container">
      <Card
        title="Outpatient Department"
        extra={
          <Space>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => navigate("/registration")}
            >
              New Registration
            </Button>
          </Space>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarStyle={{ padding: 0 }}
        >
          <TabPane
            key="queue"
            tab={
              <span>
                <UnorderedListOutlined />
                Patient Queue
              </span>
            }
          >
            <PatientQueue
              onSelectPatient={setPatient}
              onStartConsultation={() => setActiveTab("consult")}
            />
          </TabPane>
          <TabPane
            key="consult"
            tab={
              <span>
                <MedicineBoxOutlined />
                Consultation
              </span>
            }
            disabled={!selectedPatient}
          >
            {selectedPatient && (
              <ConsultationForm
                patient={selectedPatient}
                onComplete={() => setActiveTab("prescription")}
              />
            )}
          </TabPane>
          <TabPane
            key="prescription"
            tab="Prescription"
            disabled={!selectedPatient}
          >
            <PrescriptionEditor patient={selectedPatient} />
          </TabPane>
        </Tabs>
      </Card>
    </Content>
  );
};

export default OPDDashboard;
