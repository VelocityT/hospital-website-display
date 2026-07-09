import Hospital from "../models/hospital.js";
import Bill from "../models/bill.js";
import OpticalItem from "../models/opticalItem.js";
import OpticalOrder from "../models/opticalOrder.js";
import { generateBillNumber } from "../utils/generateCustomId.js";

const generateOpticalOrderNumber = async (hospitalId) => {
  const updatedHospital = await Hospital.findOneAndUpdate(
    { _id: hospitalId },
    { $inc: { opticalCounter: 1 } },
    { new: true }
  ).lean();
  if (!updatedHospital) throw new Error("Hospital not found");
  const paddedCount = String(updatedHospital.opticalCounter).padStart(5, "0");
  return `OPT-${paddedCount}`;
};

// ---------------- Inventory ----------------

// POST /optical/item  (create or update)
export const createOrUpdateOpticalItem = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { _id, edit, ...itemData } = req.body;

    if (edit && _id) {
      const updated = await OpticalItem.findOneAndUpdate(
        { _id, hospital },
        itemData,
        { new: true }
      );
      if (!updated) {
        return res
          .status(404)
          .json({ success: false, message: "Item not found" });
      }
      return res
        .status(200)
        .json({ success: true, message: "Item updated", data: updated });
    }

    const item = await OpticalItem.create({ ...itemData, hospital });
    return res
      .status(201)
      .json({ success: true, message: "Item added", data: item });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to save optical item",
      error: error.message,
    });
  }
};

// GET /optical/items
export const getOpticalItems = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { search = "", itemType, page = 1, limit = 20 } = req.query;

    const query = { hospital, isDeleted: false };
    if (itemType) query.itemType = itemType;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { model: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      OpticalItem.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      OpticalItem.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: items,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch optical items",
      error: error.message,
    });
  }
};

// DELETE /optical/item/:id  (soft delete)
export const deleteOpticalItem = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { id } = req.params;

    const item = await OpticalItem.findOneAndUpdate(
      { _id: id, hospital },
      { isDeleted: true }
    );
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }
    return res.status(200).json({ success: true, message: "Item deleted" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete item",
      error: error.message,
    });
  }
};

// ---------------- Orders ----------------

// POST /optical/order
export const createOpticalOrder = async (req, res) => {
  try {
    const { hospital, _id: userId } = req.authority;
    const {
      patient,
      eyeExam,
      opd,
      rx,
      items = [],
      advanceAmount = 0,
      expectedDelivery,
      note,
      paymentMethod,
    } = req.body;

    if (!patient || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Patient and at least one item are required",
      });
    }

    const totalAmount = items.reduce(
      (sum, it) => sum + (it.price || 0) * (it.quantity || 1),
      0
    );

    const orderNumber = await generateOpticalOrderNumber(hospital);

    const order = await OpticalOrder.create({
      hospital,
      orderNumber,
      patient,
      eyeExam,
      opd,
      rx,
      items,
      totalAmount,
      advanceAmount,
      expectedDelivery,
      note,
      createdBy: userId,
      payment: {
        status:
          advanceAmount >= totalAmount
            ? "Paid"
            : advanceAmount > 0
            ? "Partial"
            : "Unpaid",
      },
    });

    // Decrement stock for tracked inventory items
    for (const it of items) {
      if (it.item) {
        await OpticalItem.findOneAndUpdate(
          { _id: it.item, hospital },
          { $inc: { currentStock: -(it.quantity || 1) } }
        );
      }
    }

    // Create bill entry (Optical) so income reports can pick it up
    const billNumber = await generateBillNumber(hospital);
    const bill = await Bill.create({
      hospital,
      billNumber,
      patient,
      entry: {
        entryId: order._id,
        checkId: orderNumber,
        type: "Optical",
      },
      totalCharge: totalAmount,
      paidAmount: advanceAmount,
      payableAmount: totalAmount,
      paymentMethod: paymentMethod || "Cash",
    });

    order.payment.bill = bill._id;
    await order.save();

    return res.status(201).json({
      success: true,
      message: "Optical order created",
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create optical order",
      error: error.message,
    });
  }
};

// GET /optical/orders
export const getOpticalOrders = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { search = "", status, page = 1, limit = 20 } = req.query;

    const query = { hospital };
    if (status) query.status = status;
    if (search) query.orderNumber = { $regex: search, $options: "i" };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [orders, total] = await Promise.all([
      OpticalOrder.find(query)
        .populate("patient", "patientId fullName contact")
        .populate("createdBy", "fullName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      OpticalOrder.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: orders,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch optical orders",
      error: error.message,
    });
  }
};

// PUT /optical/order/:id/status
export const updateOpticalOrderStatus = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { id } = req.params;
    const { status, collectAmount = 0, paymentMethod } = req.body;

    const order = await OpticalOrder.findOne({ _id: id, hospital });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (status) order.status = status;
    if (status === "Delivered") order.deliveredAt = new Date();

    if (collectAmount > 0) {
      order.advanceAmount += collectAmount;
      order.payment.status =
        order.advanceAmount >= order.totalAmount ? "Paid" : "Partial";

      if (order.payment.bill) {
        await Bill.findByIdAndUpdate(order.payment.bill, {
          $inc: { paidAmount: collectAmount },
          ...(paymentMethod && { paymentMethod }),
        });
      }
    }

    // Restore stock on cancellation
    if (status === "Cancelled") {
      for (const it of order.items) {
        if (it.item) {
          await OpticalItem.findOneAndUpdate(
            { _id: it.item, hospital },
            { $inc: { currentStock: it.quantity || 1 } }
          );
        }
      }
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order updated",
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update order",
      error: error.message,
    });
  }
};
