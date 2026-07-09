import EyeExam from "../models/eyeExam.js";
import Opd from "../models/opd.js";

// GET /eye/queue?date=YYYY-MM-DD
// Today's eye OPD queue with workup/exam status for optometrist & doctor panels
export const getEyeQueue = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { date, doctorId, status } = req.query;

    const dayStart = date ? new Date(date) : new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const query = {
      hospital,
      visitDateTime: { $gte: dayStart, $lte: dayEnd },
    };
    if (doctorId) query.doctor = doctorId;
    if (status) query.status = status;

    const opdVisits = await Opd.find(query)
      .populate("patient", "patientId fullName dob gender contact")
      .populate("doctor", "fullName specialist")
      .sort({ visitDateTime: 1 })
      .lean();

    const opdNumbers = opdVisits.map((v) => v.opdNumber);
    const exams = await EyeExam.find({
      hospital,
      opd: { $in: opdNumbers },
    })
      .select("opd status workup.workupAt doctorFindings.examinedAt")
      .lean();

    const examMap = {};
    exams.forEach((e) => (examMap[e.opd] = e));

    const data = opdVisits.map((v) => ({
      ...v,
      eyeExam: examMap[v.opdNumber] || null,
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch eye queue",
      error: error.message,
    });
  }
};

// POST /eye/workup  (create or update optometrist workup for an OPD visit)
export const upsertWorkup = async (req, res) => {
  try {
    const { hospital, _id: userId } = req.authority;
    const { patient, opd, ipd, workup } = req.body;

    if (!patient || (!opd && !ipd)) {
      return res.status(400).json({
        success: false,
        message: "Patient and OPD/IPD number are required",
      });
    }

    const filter = { hospital, ...(opd ? { opd } : { ipd }) };

    let exam = await EyeExam.findOne(filter);

    if (exam) {
      exam.workup = {
        ...exam.workup,
        ...workup,
        workupBy: userId,
        workupAt: new Date(),
      };
      if (exam.status === "Workup Pending") exam.status = "Workup Done";
      await exam.save();
    } else {
      exam = await EyeExam.create({
        hospital,
        patient,
        opd,
        ipd,
        workup: { ...workup, workupBy: userId, workupAt: new Date() },
        status: "Workup Done",
        createdBy: userId,
      });
    }

    // Move OPD status forward (does not touch non-eye flows: only called from eye module)
    if (opd) {
      await Opd.findOneAndUpdate(
        { opdNumber: opd, hospital, status: "Scheduled" },
        { status: "Workup Done" }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Workup saved",
      data: exam,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to save workup",
      error: error.message,
    });
  }
};

// POST /eye/doctor-findings (doctor exam + glasses Rx + advice)
export const upsertDoctorFindings = async (req, res) => {
  try {
    const { hospital, _id: userId } = req.authority;
    const { patient, opd, ipd, doctorFindings, glassesPrescription, markCompleted } =
      req.body;

    if (!patient || (!opd && !ipd)) {
      return res.status(400).json({
        success: false,
        message: "Patient and OPD/IPD number are required",
      });
    }

    const filter = { hospital, ...(opd ? { opd } : { ipd }) };
    let exam = await EyeExam.findOne(filter);

    if (!exam) {
      // Doctor can examine directly even without optometrist workup
      exam = new EyeExam({
        hospital,
        patient,
        opd,
        ipd,
        createdBy: userId,
      });
    }

    if (doctorFindings) {
      exam.doctorFindings = {
        ...exam.doctorFindings,
        ...doctorFindings,
        doctor: userId,
        examinedAt: new Date(),
      };
    }
    if (glassesPrescription) {
      exam.glassesPrescription = {
        ...exam.glassesPrescription,
        ...glassesPrescription,
      };
    }
    if (markCompleted) exam.status = "Completed";

    await exam.save();

    if (opd && markCompleted) {
      await Opd.findOneAndUpdate(
        { opdNumber: opd, hospital },
        { status: "Completed" }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Eye examination saved",
      data: exam,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to save eye examination",
      error: error.message,
    });
  }
};

// GET /eye/exam?opd=...  or ?examId=...
export const getEyeExam = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { opd, ipd, examId } = req.query;

    const filter = examId
      ? { _id: examId, hospital }
      : { hospital, ...(opd ? { opd } : { ipd }) };

    const exam = await EyeExam.findOne(filter)
      .populate(
        "patient",
        "patientId fullName dob gender bloodGroup contact"
      )
      .populate("workup.workupBy", "fullName role")
      .populate("doctorFindings.doctor", "fullName specialist")
      .lean();

    if (!exam) {
      return res
        .status(404)
        .json({ success: false, message: "Eye exam not found" });
    }

    return res.status(200).json({ success: true, data: exam });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch eye exam",
      error: error.message,
    });
  }
};

// GET /eye/history/:patientId  (all visits — for IOP/VA trend later)
export const getPatientEyeHistory = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { patientId } = req.params;

    const exams = await EyeExam.find({ hospital, patient: patientId })
      .sort({ createdAt: -1 })
      .populate("doctorFindings.doctor", "fullName")
      .lean();

    return res.status(200).json({ success: true, data: exams });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch eye history",
      error: error.message,
    });
  }
};
