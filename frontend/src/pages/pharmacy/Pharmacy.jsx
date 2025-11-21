import { Tabs } from "antd";
import MedicineList from "./MedicineList";
import SearchPrescription from "./SearchPrescription";
import OrdersList from "./OrdersList";
import { useLocation } from "react-router-dom";

const Pharmacy = () => {
  const { state } = useLocation();
  const items = [
    {
      key: "1",
      label: "Orders",
      children: <OrdersList />,
    },
    {
      key: "2",
      label: "Medicine List",
      children: <MedicineList />,
    },
    {
      key: "3",
      label: "New Order",
      children: <SearchPrescription />,
    },
  ];

  return (
    <div>
      <Tabs defaultActiveKey={state?.key?.toString() || "1"} items={items} />
    </div>
  );
};

export default Pharmacy;
