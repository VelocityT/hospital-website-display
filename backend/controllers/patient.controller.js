import Bed from "../models/bed.js";
import Ipd from "../models/ipd.js";
import Opd from "../models/opd.js";
import Patient from "../models/patient.js";
import dayjs from "dayjs";
import { extractArray } from "../utils/helper.js";
import { generateCustomId } from "../utils/generateCustomId.js";
import pathologyTestReport from "../models/pathologyTestReport.js";
import mongoose from "mongoose";

// Admin-only negotiated per-admission doctor rate (Ipd.doctorChargeOverride /
// Opd.doctorChargeOverride — see those schemas for the full reasoning). Any
// other role's value is silently dropped rather than rejected: none of the
// intake forms show this field to non-admins, so a non-admin value here
// would only ever come from someone bypassing the UI, and the safe response
// to that is "ignore it", not a 403 that interrupts patient registration.
const resolveDoctorChargeOverride = (raw, role) => {
  if (role !== "admin" || raw === undefined || raw === "" || raw === null) {
    return null;
  }
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export const createPatient = async (req, res) => {
  try {
    const { hospital, role } = req.authority;

    const patientData = {
      hospital,
      fullName: req.body.fullName,
      gender: req.body.gender,
      dob: dayjs(req.body.dob).toDate(),
      bloodGroup: req.body.bloodGroup,
      age: {
        years: Number(req.body.age?.years || 0),
        months: Number(req.body.age?.months || 0),
        days: Number(req.body.age?.days || 0),
      },
      contact: {
        phone: req.body.contact?.phone,
        email: req.body.contact?.email,
      },
      address: {
        line1: req.body.address?.line1,
        line2: req.body.address?.line2,
        city: req.body.address?.city,
        pincode: Number(req.body.address?.pincode || 0),
      },
    };
    const patientId = await generateCustomId(hospital, "patient");
    const patient = await Patient.create({ patientId, ...patientData });

    if (req.body.patientType === "OPD") {
      const OPDData = {
        hospital,
        patient: patient?._id,
        opdNumber: req.body.OPD?.opdNumber || "N/A",
        doctor: req.body.OPD?.doctor || null,
        notes: req.body.OPD?.opdNotes || "",
        consultationFees: Number(req.body.OPD?.consultationFees || 0),
        symptoms: {
          symptomNames: extractArray(req.body.symptoms, "symptomNames"),
          symptomType: extractArray(req.body.symptoms, "symptomType"),
          description: req.body.symptoms?.description || "",
        },
      };
      const createdOpd = await Opd.create(OPDData);

      await Patient.findByIdAndUpdate(patient._id, {
        $push: { opds: createdOpd._id },
      });
    } else if (req.body.patientType === "IPD") {
      const { bedType } = req.body;
      const IPDData = {
        hospital,
        patient: patient?._id,
        nurse: req.body?.nurse,
        ipdNumber: req.body.IPD?.ipdNumber || "",
        attendingDoctor: req.body.IPD?.doctor || null,
        attendingNurse: req.body.IPD?.nurse || null,
        ward: req.body.IPD?.ward || "",
        bed: req.body.IPD?.bed || "",
        notes: req.body.IPD?.ipdNotes || "",
        height: Number(req.body.IPD?.height || 0),
        weight: Number(req.body.IPD?.weight || 0),
        bloodPressure: req.body.IPD?.bloodPressure || "",
        doctorChargeOverride: resolveDoctorChargeOverride(
          req.body.IPD?.doctorChargeOverride,
          role
        ),
        symptoms: {
          symptomNames: extractArray(req.body.symptoms, "symptomNames"),
          symptomType: extractArray(req.body.symptoms, "symptomType"),
          description: req.body.symptoms?.description || "",
        },
      };
      const createdIpd = await Ipd.create(IPDData);

      await Patient.findByIdAndUpdate(patient._id, {
        $push: { ipds: createdIpd._id },
      });

      await Bed.findOneAndUpdate(
        { _id: req.body.IPD?.bed, hospital },
        {
          status: "Occupied",
          patient: patient._id,
          bedType,
        }
      );
    }

    return res.status(201).json({
      success: true,
      message: "Patient created successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create patient",
      error: error.message,
    });
  }
};

export const getAllPatients = async (req, res) => {
  try {
    const { hospital, role, _id: userId } = req.authority;
    const {
      page = 1,
      pageSize = 20,
      filterMode = "date",
      startDate,
      endDate,
      search,
    } = req.query;

    const limit = parseInt(pageSize);
    const skip = (parseInt(page) - 1) * limit;

    let query = { hospital };

    if (filterMode === "date" && startDate && endDate) {
      query.registrationDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { fullName: regex },
        { "contact.phone": regex },
        { patientId: regex },
      ];
    }

    let patients = [];
    let total = 0;

    if (role === "doctor") {
      query.$or = [
        { ipds: { $elemMatch: { $exists: true } } },
        { opds: { $elemMatch: { $exists: true } } },
      ];

      let pageOffset = 0;
      let validPatients = [];
      const batchSize = limit;

      while (validPatients.length < limit) {
        const batch = await Patient.find(query)
          .select(
            "fullName gender age registrationDate contact.phone bloodGroup patientId ipds opds"
          )
          .populate({
            path: "ipds",
            match: { attendingDoctor: userId },
            select: "_id",
          })
          .populate({
            path: "opds",
            match: { doctor: userId },
            select: "_id",
          })
          .sort({ createdAt: -1 })
          .skip((skip + pageOffset) * batchSize)
          .limit(batchSize);

        const filtered = batch.filter(
          (p) => p.ipds.length > 0 || p.opds.length > 0
        );
        validPatients.push(...filtered);

        if (batch.length < batchSize) break;
        pageOffset++;
      }

      patients = validPatients.slice(0, limit);
      total = validPatients.length;
    } else if (role === "nurse") {
      query.ipds = { $elemMatch: { $exists: true } };

      let pageOffset = 0;
      let validPatients = [];
      const batchSize = limit;

      while (validPatients.length < limit) {
        const batch = await Patient.find(query)
          .select(
            "fullName gender age registrationDate contact.phone bloodGroup patientId ipds"
          )
          .populate({
            path: "ipds",
            match: { attendingNurse: userId },
            select: "_id",
          })
          .sort({ createdAt: -1 })
          .skip((skip + pageOffset) * batchSize)
          .limit(batchSize);

        const filtered = batch.filter((p) => p.ipds.length > 0);
        validPatients.push(...filtered);

        if (batch.length < batchSize) break;
        pageOffset++;
      }

      patients = validPatients.slice(0, limit);
      total = validPatients.length;
    } else if (role === "pathologist") {
      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), "i");
        query.$or = [
          { fullName: regex },
          { "contact.phone": regex },
          { patientId: regex },
        ];
      }
      const candidates = await Patient.find(query)
        .select(
          "fullName gender age registrationDate contact.phone bloodGroup patientId prescriptions"
        )
        .populate({
          path: "prescriptions",
          select: "labTests",
        })
        .sort({ createdAt: -1 });

      const filteredPatients = candidates.filter((p) =>
        p.prescriptions?.some((pres) => pres.labTests?.length > 0)
      );

      total = filteredPatients.length;
      patients = filteredPatients.slice(skip, skip + limit);
    } else if (
      role === "admin" ||
      role === "pharmacist" ||
      role === "receptionist"
    ) {
      total = await Patient.countDocuments(query);

      patients = await Patient.find(query)
        .select(
          "fullName gender age registrationDate contact.phone bloodGroup patientId"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    }

    const formattedPatients = patients.map((patient) => ({
      ...patient.toObject(),
    }));

    return res.status(200).json({
      success: true,
      message: "All patients fetched successfully",
      data: {
        patients: formattedPatients,
        total,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch patients",
      error: error.message,
    });
  }
};

export const getPatientIpdOpdDetails = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { id } = req.params;
    const { isIpdPatient, isOpdPatient, detailPage } = req.query;

    if (!isIpdPatient && !isOpdPatient) {
      return res.status(400).json({
        success: false,
        message: "Either ipdPatient or opdPatient must be provided",
      });
    }

    let extractPatient = null;
    let details = null;
    let detailsKey = null;
    let model, query, populateOptions;

    const commonPrescriptionPopulation = {
      path: "prescriptions",
      populate: [
        { path: "medicines" },
        { path: "labTests" },
        { path: "createdBy", select: "fullName role" },
        // The prescribing doctor is what gets printed and signed; createdBy is
        // only the audit trail of who typed it.
        {
          path: "doctor",
          select:
            "fullName role qualification specialist prescriptionValidityDays",
        },
      ],
    };

    if (isIpdPatient === "true") {
      model = Ipd;
      query = {
        _id: id,
        hospital,
      };
      populateOptions = [
        {
          path: "attendingDoctor",
          // qualification/specialist/validity are needed by the printed
          // prescription header and footer, including the blank pad printed
          // straight off this visit.
          select:
            "fullName ipdCharge qualification specialist prescriptionValidityDays",
        },
        { path: "attendingNurse", select: "fullName" },
        {
          path: "patient",
          select:
            "fullName dob address gender age registrationDate contact bloodGroup patientId dischargeSummary",
        },
        { path: "ward", select: "name floor" },
        { path: "bed", select: "bedNumber charge bedType" },
        { path: "dischargeSummary.dischargedBy", select: "fullName role" },
        detailPage && { path: "payment.bill" },
        commonPrescriptionPopulation,
      ].filter(Boolean);

      const ipd = await model.findOne(query).populate(populateOptions);
      if (!ipd) {
        return res.status(404).json({
          success: false,
          message: "IPD record not found",
        });
      }

      const ipdObj = ipd.toObject();
      const { patient, ...restIpd } = ipdObj;
      extractPatient = patient;
      details = restIpd;
      detailsKey = "ipdDetails";
    }

    if (isOpdPatient === "true") {
      model = Opd;
      query = {
        _id: id,
        hospital,
      };
      populateOptions = [
        {
          path: "doctor",
          select:
            "fullName opdCharge qualification specialist prescriptionValidityDays",
        },
        {
          path: "patient",
          select:
            "fullName dob address gender age registrationDate contact bloodGroup patientId",
        },
        detailPage && { path: "payment.bill" },
        commonPrescriptionPopulation,
      ].filter(Boolean);

      const opd = await model.findOne(query).populate(populateOptions);
      if (!opd) {
        return res.status(404).json({
          success: false,
          message: "OPD record not found",
        });
      }

      const opdObj = opd.toObject();
      const { patient, ...restOpd } = opdObj;
      extractPatient = patient;
      details = restOpd;
      detailsKey = "opdDetails";
    }

    const pathologyTestReports = await pathologyTestReport
      .find({
        hospital,
        patientType: isIpdPatient === "true" ? "Ipd" : "Opd",
        patient: extractPatient?._id,
        ...(detailsKey === "ipdDetails" && { ipd: details?._id }),
        ...(detailsKey === "opdDetails" && { opd: details?._id }),
      })
      .populate("test", "testName testCode test")
      .populate("reportedBy", "fullName role")
      .populate("ipd", "ipdNumber")
      .populate("opd", "opdNumber");

    return res.status(200).json({
      success: true,
      message: "Patient IPD/OPD details fetched successfully",
      data: {
        ...extractPatient,
        [detailsKey]: details,
        pathologyTestReports,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch patient details",
      error: error.message,
    });
  }
};

export const getPatientDetails = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const id = req.params.id;

    const patient = await Patient.findOne({ _id: id, hospital });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const patientObj = patient.toObject();
    patientObj.dob = dayjs(patientObj.dob);

    if (patient.patientType === "IPD") {
      const ipdDoc = await Ipd.findOne({ patient: patient._id, hospital })
        .populate("attendingDoctor", "fullName ipdCharge")
        .select("-__v");

      if (ipdDoc) {
        const ipdDetails = ipdDoc.toObject();
        ipdDetails.admissionDate = dayjs(ipdDetails.admissionDate).format(
          "DD/MM/YYYY HH:mm"
        );
        patientObj.ipdDetails = ipdDetails;
      }
    } else if (patient.patientType === "OPD") {
      const opdDoc = await Opd.findOne({ patient: patient._id, hospital })
        .populate("doctor", "fullName phone opdCharge")
        .select("-__v");

      if (opdDoc) {
        const opdDetails = opdDoc.toObject();
        opdDetails.visitDateTime = dayjs(opdDetails.visitDateTime).format(
          "DD/MM/YYYY HH:mm"
        );
        patientObj.opdDetails = opdDetails;
      }
    }

    res.status(200).json({
      success: true,
      message: "Patient fetched successfully",
      data: patientObj,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient",
      error: error.message,
    });
  }
};

export const updatePatientRegistration = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const id = req.params.id;
    const patientData = {
      fullName: req.body.fullName,
      gender: req.body.gender,
      dob: req.body.dob,
      bloodGroup: req.body.bloodGroup,
      patientType: req.body.patientType,
      age: {
        years: Number(req.body.age?.years || 0),
        months: Number(req.body.age?.months || 0),
        days: Number(req.body.age?.days || 0),
      },
      contact: {
        phone: req.body.contact?.phone,
        email: req.body.contact?.email,
      },
      address: {
        line1: req.body.address?.line1,
        line2: req.body.address?.line2,
        city: req.body.address?.city,
        pincode: Number(req.body.address?.pincode || 0),
      },
    };

    const updatedPatient = await Patient.findOneAndUpdate(
      { _id: id, hospital },
      patientData,
      {
        new: true,
      }
    );

    if (!updatedPatient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Patient updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update patient",
      error: error.message,
    });
  }
};

export const switchPatientToIpd = async (req, res) => {
  try {
    const { hospital, role } = req.authority;
    const patientId = req.params.id;
    const { doctor, bedType, nurse, ...ipdInfo } = req.body;
    const existingIpd = await Ipd.findOne({
      patient: patientId,
      hospital,
      status: { $ne: "Discharged" },
    });

    if (existingIpd) {
      return res.status(400).json({
        success: false,
        message: "Patient is already admitted in IPD.",
      });
    }

    const ipdData = {
      ...ipdInfo,
      attendingNurse: nurse,
      attendingDoctor: doctor,
      patient: patientId,
      hospital,
      // Overwrite whatever came through the spread above — ipdInfo is
      // "everything except doctor/bedType/nurse" from the raw request body,
      // so a non-admin's request could otherwise smuggle a value in here.
      doctorChargeOverride: resolveDoctorChargeOverride(
        ipdInfo.doctorChargeOverride,
        role
      ),
    };

    const session = await mongoose.startSession();
    session.startTransaction();
    let newIpd;

    try {
      newIpd = await Ipd.create([ipdData], { session });

      await Bed.findByIdAndUpdate(
        ipdInfo.bed,
        {
          patient: patientId,
          status: "Occupied",
          bedType,
        },
        { new: true, session }
      );

      await Patient.findByIdAndUpdate(
        patientId,
        { $push: { ipds: newIpd[0]._id } },
        { session }
      );

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      return res.status(500).json({
        success: false,
        message: "Failed to create IPD",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Patient switched to IPD successfully",
      data: newIpd,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to switch patient",
      error: error.message,
    });
  }
};
export const getPatientFullDetails = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { patientId } = req.params;
    const { forPharmacy } = req.query;

    let patient;

    if (forPharmacy === "true") {
      patient = await Patient.findOne({ patientId, hospital })
        .select("fullName patientId gender age prescriptions contact")
        .populate({
          path: "prescriptions",
          match: { medicines: { $exists: true, $not: { $size: 0 } } },
          select:
            "hospital patient patientType ipd opd note createdAt medicines createdBy doctor",
          populate: [
            { path: "createdBy", select: "fullName role" },
            {
              path: "doctor",
              select:
            "fullName role qualification specialist prescriptionValidityDays",
            },
          ],
        })
        .lean();
    } else {
      patient = await Patient.findOne({ patientId, hospital })
        .populate({
          path: "ipds",
          populate: [
            { path: "bed", select: "bedNumber charge bedType" },
            { path: "ward", select: "name floor type" },
            {
              path: "attendingDoctor",
              select:
                "fullName role ipdCharge qualification specialist prescriptionValidityDays",
            },
            { path: "attendingNurse", select: "fullName role" },
            { path: "dischargeSummary.dischargedBy", select: "fullName role" },
            { path: "payment.bill" },
            { path: "surgeryCharges.doctor", select: "fullName role" },
          ],
        })
        .populate({
          path: "opds",
          populate: [
            {
              path: "doctor",
              select:
                "fullName role opdCharge qualification specialist prescriptionValidityDays",
            },
            { path: "payment.bill" },
          ],
        })
        .populate({
          path: "pathologyTestReports",
          populate: [
            { path: "payment.bill" },
            { path: "test", select: "testName testCode" },
            { path: "reportedBy", select: "fullName role" },
            { path: "ipd", select: "ipdNumber" },
            { path: "opd", select: "opdNumber" },
          ],
        })
        .populate({
          path: "prescriptions",
          select:
            "hospital patient patientType ipd opd note createdAt medicines labTests createdBy doctor",
          populate: [
            { path: "createdBy", select: "fullName role" },
            {
              path: "doctor",
              select:
            "fullName role qualification specialist prescriptionValidityDays",
            },
          ],
        })
        .populate({
          path: "medicineOrders",
          select:
            "hospital patient createdAt generatedBy payableAmount medicines payment",
          populate: [
            {
              path: "generatedBy",
              select: "fullName role",
            },
            {
              path: "payment.bill",
            },
          ],
        })
        .lean();
    }

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Patient full details fetched successfully",
      data: patient,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch patient full details",
      error: error.message,
    });
  }
};

export const addOpdOrIpd = async (req, res) => {
  try {
    const { hospital, role } = req.authority;
    const { type, bedType, ...payload } = req.body;

    const checkPatient = await Patient.findOne({
      _id: payload?.patient,
      hospital,
    });

    if (!checkPatient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    if (type === "ipd" && payload.ipdNumber) {
      const createdIpd = await Ipd.create({
        ...payload,
        hospital,
        // Overwrite whatever came through the spread above, same reasoning
        // as switchPatientToIpd — payload is the raw request body.
        doctorChargeOverride: resolveDoctorChargeOverride(
          payload.doctorChargeOverride,
          role
        ),
      });

      await Patient.findByIdAndUpdate(payload.patient, {
        $push: { ipds: createdIpd._id },
      });

      await Bed.updateOne(
        { _id: payload.bed, hospital },
        {
          $set: {
            status: "Occupied",
            patient: payload.patient,
            bedType,
          },
        }
      );
    } else if (type === "opd" && payload.opdNumber) {
      const createdOpd = await Opd.create({ ...payload, hospital });

      await Patient.findByIdAndUpdate(payload.patient, {
        $push: { opds: createdOpd._id },
      });
    } else {
      return res.status(403).json({
        success: false,
        message: "Something missing",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        type === "ipd" ? "IPD Added Successfully" : "OPD Added Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to add OPD/IPD record",
      error: error.message,
    });
  }
};

export const searchPatient = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { searchTerm, paymentStatus, forPharmacy } = req.query;

    const regex = new RegExp(searchTerm?.trim(), "i");

    const batchSize = 50;
    const maxPatientsToReturn = 20;
    let skip = 0;
    let finalPatients = [];

    while (finalPatients.length < maxPatientsToReturn) {
      const batch = await Patient.find({
        hospital,
        $or: [
          { "contact.phone": regex },
          { patientId: regex },
          { fullName: regex },
        ],
      })
        .select("fullName patientId contact.phone")
        .skip(skip)
        .limit(batchSize)
        .lean();

      if (batch.length === 0) break;

      if (paymentStatus === "Paid" || paymentStatus === "Unpaid") {
        for (const patient of batch) {
          const [ipds, opds] = await Promise.all([
            Ipd.find({ patient: patient._id, hospital })
              .select("payment.status")
              .lean(),
            Opd.find({ patient: patient._id, hospital })
              .select("payment.status")
              .lean(),
          ]);

          const allStatus = [...ipds, ...opds].map((r) => r.payment.status);

          if (
            (paymentStatus === "Unpaid" &&
              (allStatus.includes("Unpaid") ||
                allStatus.includes("Pending"))) ||
            (paymentStatus === "Paid" &&
              allStatus.length > 0 &&
              allStatus.every((s) => s === "Paid"))
          ) {
            finalPatients.push(patient);
            if (finalPatients.length === maxPatientsToReturn) break;
          }
        }
      } else {
        finalPatients.push(
          ...batch.slice(0, maxPatientsToReturn - finalPatients.length)
        );
      }

      skip += batchSize;
    }

    return res.status(200).json({
      success: true,
      message: "Patients Found",
      patients: finalPatients,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch patients",
      error: error.message,
    });
  }
};
