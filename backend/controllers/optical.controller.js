import Bill from "../models/bill.js";
import OpticalItem from "../models/opticalItem.js";
import OpticalOrder from "../models/opticalOrder.js";
import {
  generateBillNumber,
  generateSequenceNumber,
} from "../utils/generateCustomId.js";

// Per-hospital order number (OPT-00001). generateSequenceNumber verifies the
// candidate is free for THIS hospital, so a drifted counter can't cause E11000.
const generateOpticalOrderNumber = (hospitalId) =>
  generateSequenceNumber(
    hospitalId,
    "opticalCounter",
    "OPT",
    "opticalorders",
    "orderNumber"
  );

// ---------------- Stock helpers ----------------

/**
 * Collapse duplicate lines into one quantity per item.
 *
 * An order can legitimately list the same frame twice. Checking each line
 * separately would let both pass a guard that only one of them can actually
 * satisfy, so the requested quantities must be summed before the check.
 * Lines without `item` are untracked (custom lens work, ad-hoc charges) and
 * hold no inventory.
 */
const collapseRequestedStock = (items = []) => {
  const needed = new Map();
  for (const it of items) {
    if (!it?.item) continue;
    const key = String(it.item);
    const qty = Number(it.quantity) || 1;
    needed.set(key, (needed.get(key) || 0) + qty);
  }
  return needed;
};

/** Put held stock back. Used to unwind a partially-held order. */
const releaseStock = async (hospital, held = []) => {
  for (const [itemId, qty] of held) {
    await OpticalItem.findOneAndUpdate(
      { _id: itemId, hospital },
      { $inc: { currentStock: qty } }
    );
  }
};

/**
 * Atomically hold stock for every tracked line on an order.
 *
 * The availability check lives in the FILTER (`currentStock: { $gte: qty }`),
 * not in application code — a read-then-write lets two people sell the last
 * frame at the same time and drive stock negative. A null result means the
 * guard failed: item missing, belongs to another hospital, deleted, or not
 * enough stock.
 *
 * If any line fails, everything already held is released before returning, so
 * a rejected order never leaves inventory short.
 */
const holdStock = async (hospital, items) => {
  const needed = collapseRequestedStock(items);
  const held = [];

  for (const [itemId, qty] of needed) {
    const updated = await OpticalItem.findOneAndUpdate(
      { _id: itemId, hospital, isDeleted: false, currentStock: { $gte: qty } },
      { $inc: { currentStock: -qty } },
      { new: true }
    );

    if (!updated) {
      await releaseStock(hospital, held);

      const item = await OpticalItem.findOne({ _id: itemId, hospital })
        .select("name currentStock isDeleted")
        .lean();

      return {
        ok: false,
        message:
          item && !item.isDeleted
            ? `Insufficient stock for "${item.name}" — ${item.currentStock} in stock, ${qty} requested`
            : "One of the selected items is no longer available in inventory",
      };
    }

    held.push([itemId, qty]);
  }

  return { ok: true, held };
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
      (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
      0
    );

    const advance = Number(advanceAmount) || 0;

    if (advance < 0) {
      return res.status(400).json({
        success: false,
        message: "Advance amount cannot be negative",
      });
    }

    // Never let an order be booked with more collected than it is worth —
    // that writes a negative balance the rest of the module cannot reason about.
    if (advance > totalAmount) {
      return res.status(400).json({
        success: false,
        message: `Advance (₹${advance}) is more than the order total (₹${totalAmount}).`,
        data: { totalAmount, advanceAmount: advance },
      });
    }

    // Hold inventory BEFORE the order exists. If this fails, nothing has been
    // written yet and the customer simply gets told what is out of stock.
    const hold = await holdStock(hospital, items);
    if (!hold.ok) {
      return res.status(400).json({ success: false, message: hold.message });
    }

    let order;
    try {
      const orderNumber = await generateOpticalOrderNumber(hospital);

      order = await OpticalOrder.create({
        hospital,
        orderNumber,
        patient,
        eyeExam,
        opd,
        rx,
        items,
        totalAmount,
        advanceAmount: advance,
        expectedDelivery,
        note,
        createdBy: userId,
        payment: {
          status:
            advance >= totalAmount && totalAmount > 0
              ? "Paid"
              : advance > 0
              ? "Partial"
              : "Unpaid",
        },
      });

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
        // NOTE ON SHAPE: unlike Ipd/Opd/Surgery, an optical order still keeps a
        // SINGLE bill that later collections mutate (opticalOrder.payment.bill
        // is one ref, not an array). So on this bill:
        //   totalCharge   = the full order charge
        //   paidAmount    = running total collected so far
        //   payableAmount = what is still outstanding
        // Converting this module to one-bill-per-instalment is still worth
        // doing — it is the only module without a payment history — but it is
        // a schema change, so keep these three fields coherent until then.
        totalCharge: totalAmount,
        paidAmount: advance,
        payableAmount: Math.max(totalAmount - advance, 0),
        paymentMethod: paymentMethod || "Cash",
      });

      order.payment.bill = bill._id;
      await order.save();
    } catch (err) {
      // The order never completed, so the stock it was holding must go back.
      await releaseStock(hospital, hold.held);
      throw err;
    }

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

    // Capture the status BEFORE any mutation. The stock-restore below keys off
    // this: without it, sending {status:"Cancelled"} twice restores the same
    // items twice and inflates inventory.
    const previousStatus = order.status;

    const collecting = Number(collectAmount) || 0;

    // ---- Overpayment guard ----
    // Enforced server-side, independently of the UI. A stale tab or a direct
    // API call could otherwise push advanceAmount past totalAmount and leave a
    // negative balance the billing screen cannot represent.
    // (Same protection IPD and Medicine received in c331d56.)
    if (collecting !== 0) {
      const remainingBalance = Math.max(
        (order.totalAmount || 0) - (order.advanceAmount || 0),
        0
      );

      // On rejection return the authoritative figures so the client can
      // re-sync instead of showing a balance the API will never accept.
      const balanceSnapshot = {
        totalAmount: order.totalAmount || 0,
        paidAmount: order.advanceAmount || 0,
        remainingBalance,
      };

      if (collecting < 0) {
        return res.status(400).json({
          success: false,
          message: "Payment amount must be greater than zero.",
          data: balanceSnapshot,
        });
      }

      if (remainingBalance <= 0) {
        return res.status(400).json({
          success: false,
          message: "This optical order is already fully paid. Nothing is pending.",
          data: balanceSnapshot,
        });
      }

      if (collecting > remainingBalance) {
        return res.status(400).json({
          success: false,
          message: `Amount exceeds the pending balance of ₹${remainingBalance}.`,
          data: balanceSnapshot,
        });
      }
    }

    if (status) order.status = status;
    if (status === "Delivered") order.deliveredAt = new Date();

    if (collecting > 0) {
      order.advanceAmount = (order.advanceAmount || 0) + collecting;
      order.payment.status =
        order.totalAmount > 0 && order.advanceAmount >= order.totalAmount
          ? "Paid"
          : "Partial";

      if (order.payment.bill) {
        // $inc and $set are kept explicit: mixing an operator with bare fields
        // in one update document is invalid in MongoDB, and relying on
        // Mongoose to silently re-wrap the bare keys is not worth the risk on
        // a financial record.
        await Bill.findByIdAndUpdate(order.payment.bill, {
          $inc: { paidAmount: collecting },
          $set: {
            // Keep the outstanding figure on the bill in step with the order.
            payableAmount: Math.max(
              (order.totalAmount || 0) - order.advanceAmount,
              0
            ),
            ...(paymentMethod && { paymentMethod }),
          },
        });
      }
    }

    // Restore stock on cancellation — but only on the transition INTO
    // "Cancelled", never on a repeat call for an already-cancelled order.
    if (status === "Cancelled" && previousStatus !== "Cancelled") {
      for (const it of order.items) {
        if (it.item) {
          await OpticalItem.findOneAndUpdate(
            { _id: it.item, hospital },
            { $inc: { currentStock: Number(it.quantity) || 1 } }
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
