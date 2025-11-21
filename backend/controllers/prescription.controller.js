import Ipd from "../models/ipd.js";
import Opd from "../models/opd.js";
import Patient from "../models/patient.js";
import Prescription from "../models/prescription.js";

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
      createdBy,
      edit,
      prescriptionId,
    } = req.body;

    const hospital = req.authority.hospital;

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

      // Update the existing prescription
      existingPrescription.medicines = medicines;
      existingPrescription.labTests = labTests;
      existingPrescription.note = note;
      await existingPrescription.save();

      return res.status(200).json({
        success: true,
        message: "Prescription Updated",
      });
    }

    // If not edit mode, create a new prescription
    const newPrescription = await Prescription.create({
      hospital,
      patientType,
      patient,
      ipd,
      opd,
      medicines,
      labTests,
      note,
      createdBy,
    });

    await Patient.findByIdAndUpdate(patient, {
      $push: { prescriptions: newPrescription._id },
    });

    if (patientType === "ipd" && ipd) {
      await Ipd.findOneAndUpdate(
        { ipdNumber: ipd },
        { $push: { prescriptions: newPrescription._id } }
      );
    } else if (patientType === "opd" && opd) {
      await Opd.findOneAndUpdate(
        { opdNumber: opd },
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
