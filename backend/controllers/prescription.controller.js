import Ipd from "../models/ipd.js";
import Opd from "../models/opd.js";
import Patient from "../models/patient.js";
import Prescription from "../models/prescription.js";

/**
 * Work out which doctor a prescription belongs to.
 *
 * - A logged-in doctor prescribes as themselves.
 * - Anyone else (receptionist, admin) is recording it on behalf of the
 *   doctor assigned to that visit, so we read it off the OPD/IPD record.
 * - If neither resolves, returns null and the print simply omits the doctor
 *   line rather than showing a blank or a wrong name.
 *
 * Always scoped by hospital — OPD/IPD numbers come from per-hospital
 * counters, so an unscoped lookup can match another tenant's visit.
 */
const resolvePrescribingDoctor = async ({
  role,
  userId,
  hospital,
  patientType,
  opd,
  ipd,
}) => {
  if (role === "doctor") return userId;

  try {
    if (patientType === "opd" && opd) {
      const visit = await Opd.findOne({ opdNumber: opd, hospital })
        .select("doctor")
        .lean();
      return visit?.doctor || null;
    }
    if (patientType === "ipd" && ipd) {
      const admission = await Ipd.findOne({ ipdNumber: ipd, hospital })
        .select("attendingDoctor")
        .lean();
      return admission?.attendingDoctor || null;
    }
  } catch (e) {
    // Never block saving a prescription because the doctor lookup failed.
    return null;
  }
  return null;
};

export const createPrescription = async (req, res) => {
  try {
    const {
      patientType,
      patient,
      ipd,
      opd,
      medicines,
      pathologyTests = [],
      note,
      edit,
      prescriptionId,
    } = req.body;

    // `createdBy` is deliberately NOT read from the body. This is a clinical
    // record — the author comes from the authenticated token, otherwise a
    // caller could attribute a prescription to any doctor they like.
    const hospital = req.authority.hospital;
    const userId = req.authority._id;
    const role = req.authority.role;

    const labTests = pathologyTests.map((test) => {
      let testName = test.testName;
      if (!testName.includes(test.testCode)) {
        testName = `${testName} (${test.testCode})`;
      }

      return { testName };
    });

    if (edit && prescriptionId) {
      const existingPrescription = await Prescription.findOne({
        _id: prescriptionId,
        hospital,
      });

      if (!existingPrescription) {
        return res.status(404).json({
          success: false,
          message: "Prescription not found for editing",
        });
      }

      // Update the existing prescription.
      // createdBy is intentionally left alone — the original author of a
      // clinical record must not change because someone edited it.
      existingPrescription.medicines = medicines;
      existingPrescription.labTests = labTests;
      existingPrescription.note = note;

      // Backfill the doctor on records created before this field existed,
      // so older prescriptions start printing a doctor name too.
      if (!existingPrescription.doctor) {
        existingPrescription.doctor = await resolvePrescribingDoctor({
          role,
          userId,
          hospital,
          patientType: existingPrescription.patientType,
          opd: existingPrescription.opd,
          ipd: existingPrescription.ipd,
        });
      }

      await existingPrescription.save();

      return res.status(200).json({
        success: true,
        message: "Prescription Updated",
      });
    }

    // If not edit mode, create a new prescription
    const doctor = await resolvePrescribingDoctor({
      role,
      userId,
      hospital,
      patientType,
      opd,
      ipd,
    });

    const newPrescription = await Prescription.create({
      hospital,
      patientType,
      patient,
      ipd,
      opd,
      medicines,
      labTests,
      note,
      createdBy: userId,
      doctor,
    });

    await Patient.findByIdAndUpdate(patient, {
      $push: { prescriptions: newPrescription._id },
    });

    // NOTE: always scope lookups by hospital. IPD/OPD numbers are generated
    // from per-hospital counters, so an unscoped findOneAndUpdate can attach
    // this prescription to another hospital's visit record.
    if (patientType === "ipd" && ipd) {
      await Ipd.findOneAndUpdate(
        { ipdNumber: ipd, hospital },
        { $push: { prescriptions: newPrescription._id } }
      );
    } else if (patientType === "opd" && opd) {
      await Opd.findOneAndUpdate(
        { opdNumber: opd, hospital },
        { $push: { prescriptions: newPrescription._id } }
      );
    }

    res.status(201).json({
      success: true,
      message: "Prescription Added",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to process prescription",
      error: error.message,
    });
  }
};

export const getPatientPrescription = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { prescriptionId } = req.query;

    const prescription = await Prescription.findOne({
      _id: prescriptionId,
      hospital,
    })
      .populate(
        "patient",
        "patientId fullName dob gender bloodGroup contact.phone"
      )
      .populate("createdBy", "fullName role")
      .populate("doctor", "fullName role qualification specialist")
      .populate("labTests medicines");

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch prescription",
      error: error.message,
    });
  }
};
