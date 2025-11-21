import { useState } from "react";
import {Tabs, Card, Space, Button } from "antd";
import AdmissionForm from "./components/AdmissionForm";
import BedAssignment from "./components/BedAssignment";

const { TabPane } = Tabs;

const IPDdashboard = () => {
  const [currentTab, setTab] = useState("admissions");
  const [selectedPatient, setPatient] = useState(null);

  return (
    <Tabs activeKey={currentTab} onChange={setTab}>
      <TabPane tab="New Admissions" key="admissions">
        <AdmissionForm opdPatient={selectedPatient} />
      </TabPane>
    </Tabs>
  );
};
export default IPDdashboard
