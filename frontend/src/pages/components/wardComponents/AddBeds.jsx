import { useState, useEffect } from "react";
import { Input, Button, InputNumber } from "antd";
import { toast } from "react-hot-toast";
import { createBedsApi } from "../../../services/apis";

const AddBeds = ({ ward, setAddBedsModalOpen, setBeds, beds }) => {
  const [bedCount, setBedCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [wardId, setWardId] = useState("");
  const [charge, setCharge] = useState();

  useEffect(() => {
    if (ward && ward._id) {
      setWardId(ward._id);
    } else {
      setWardId("");
    }
  }, [ward]);

  const handleSubmit = async () => {
    if (!bedCount || bedCount < 1 || !wardId) {
      toast.error("Please select a valid bed count.");
      return;
    }
    if (
      charge === undefined ||
      charge === null ||
      charge === "" ||
      isNaN(charge)
    ) {
      toast.error("Please enter a valid charge.");
      return;
    }

    const payload = {
      count: bedCount,
      ward: wardId,
      charge: Number(charge),
    };
    try {
      setLoading(true);
      const res = await createBedsApi(payload);
      if (res.success) {
        toast.success("Beds created successfully");
        setBeds((prevBeds) => [...prevBeds, ...res.data]);
        setBedCount(1);
        setCharge();
        if (setAddBedsModalOpen) setAddBedsModalOpen(false);
      } else {
        toast.error(res.message || "Failed to create beds");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=" p-6 max-w-xl mx-auto">
      <div className="mb-4">
        <label className="block mb-1 font-medium">Ward</label>
        <Input
          value={ward ? `${ward.name} (${ward.type} - ${ward.floor})` : ""}
          disabled
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">
          Number of Beds <span className="text-red-500">*</span>
        </label>
        <InputNumber
          min={1}
          value={bedCount}
          onChange={(value) => setBedCount(value)}
          className="w-full"
          placeholder="Enter number of beds to create"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">
          Charge <span className="text-red-500">*</span>
        </label>
        <InputNumber
          min={0}
          value={charge}
          onChange={setCharge}
          className="w-full"
          placeholder="Enter charge per bed"
        />
      </div>

      <div className="text-right">
        <Button
          type="primary"
          onClick={handleSubmit}
          loading={loading}
          disabled={!bedCount || !wardId}
        >
          Add Beds
        </Button>
      </div>
    </div>
  );
};

export default AddBeds;
