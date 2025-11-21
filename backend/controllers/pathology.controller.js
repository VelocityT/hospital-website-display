import Ipd from "../models/ipd.js";
import Opd from "../models/opd.js";
import PathologyTest from "../models/pathologyTest.js";
import pathologyTestReport from "../models/pathologyTestReport.js";
import Patient from "../models/patient.js";

export const createOrUpdatePathologyTest = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const pathologyData = req.body;
    const { id } = req.params;

    const { testName, charge } = pathologyData;

    if (!testName || charge === undefined) {
      return res.status(400).json({
        success: false,
        message: "Test name and charge are required",
      });
    }

    if (id) {
      let test = await PathologyTest.findOne({
        _id: id,
        hospital,
      });

      if (!test) {
        return res.status(404).json({
          success: false,
          message: "Pathology test not found",
        });
      }

      if (pathologyData.isDeleted) {
        await PathologyTest.deleteOne({ _id: id });
        return res.status(200).json({
          success: true,
          message: "Pathology test deleted successfully",
        });
      }

      Object.assign(test, pathologyData);
      await test.save();

      return res.status(200).json({
        success: true,
        message: "Pathology test updated successfully",
        test,
      });
    } else {
      const newTest = await PathologyTest.create({
        ...pathologyData,
        hospital,
      });

      return res.status(201).json({
        success: true,
        message: "Pathology test created successfully",
        test: newTest,
      });
    }
  } catch (error) {
    // console.error("Error creating/updating test:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getAllPathologyTests = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { search = "", page = 1, limit = 10 } = req.query;

    const query = { hospital };
    if (search) {
      query.$or = [
        { testName: { $regex: search, $options: "i" } },
        { testCode: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tests, total] = await Promise.all([
      PathologyTest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      PathologyTest.countDocuments(query),
    ]);
    return res.status(200).json({
      success: true,
      message: "Pathology tests retrieved successfully",
      data: tests,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve pathology tests",
    });
  }
};

export const getPathologyTestById = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { id } = req.params;
    const test = await PathologyTest.findOne({ _id: id, hospital });
    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Pathology test not found",
      });
    }
    return res.status(200).json(test);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve pathology test",
    });
  }
};
export const createUpdateTestReport = async (req, res) => {
  try {
    const { hospital, _id: reportedBy } = req.authority;
    const { reportId, patientType, patientNumber, testId, results, remarks } =
      req.body;

    let patient = null;

    if (patientType === "Ipd") {
      const ipd = await Ipd.findOne({ hospital, ipdNumber: patientNumber });
      if (!ipd) {
        return res
          .status(404)
          .json({ success: false, message: "IPD patient not found" });
      }
      patient = { ipd: ipd._id, patient: ipd.patient };
    } else if (patientType === "Opd") {
      const opd = await Opd.findOne({ hospital, opdNumber: patientNumber });
      if (!opd) {
        return res
          .status(404)
          .json({ success: false, message: "OPD patient not found" });
      }
      patient = { opd: opd._id, patient: opd.patient };
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid patient type" });
    }

    const test = await PathologyTest.findOne({ hospital, _id: testId });
    if (!test) {
      return res
        .status(404)
        .json({ success: false, message: "Test not found" });
    }

    if (reportId) {
      const updated = await pathologyTestReport.findOneAndUpdate(
        { _id: reportId, hospital },
        {
          patientType,
          ...patient,
          test,
          results,
          remarks,
          reportedBy,
          payableAmount: test.charge,
        },
        { new: true }
      );

      if (!updated) {
        return res
          .status(404)
          .json({ success: false, message: "Report not found for update" });
      }

      await Patient.findByIdAndUpdate(
        patient.patient,
        { $push: { pathologyTestReports: updated._id } },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: "Test report updated successfully",
      });
    }

    const newReport = await pathologyTestReport.create({
      hospital,
      patientType,
      ...patient,
      test,
      results,
      remarks,
      reportedBy,
      payableAmount: test.charge,
    });

    await Patient.findByIdAndUpdate(
      patient.patient,
      { $push: { pathologyTestReports: newReport._id } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Test report created successfully",
    });
  } catch (error) {
    // console.error("Error in createUpdateTestReport:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process pathology test report",
    });
  }
};

// export const getAllPathologyTestReports = async (req, res) => {
//   try {
//     const { hospital } = req.authority;
//     const { search = "", page = 1, limit = 10 } = req.query;

//     const skip = (parseInt(page) - 1) * parseInt(limit);
//     const matchStage = { hospital: hospital };

//     const searchRegex = new RegExp(search, "i");

//     const pipeline = [
//       { $match: matchStage },
//       {
//         $lookup: {
//           from: "patients",
//           localField: "patient",
//           foreignField: "_id",
//           as: "patient",
//         },
//       },
//       { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },
//       {
//         $lookup: {
//           from: "ipds",
//           localField: "ipd",
//           foreignField: "_id",
//           as: "ipd",
//         },
//       },
//       { $unwind: { path: "$ipd", preserveNullAndEmptyArrays: true } },
//       {
//         $lookup: {
//           from: "opds",
//           localField: "opd",
//           foreignField: "_id",
//           as: "opd",
//         },
//       },
//       { $unwind: { path: "$opd", preserveNullAndEmptyArrays: true } },
//       {
//         $lookup: {
//           from: "pathologytests",
//           localField: "test",
//           foreignField: "_id",
//           as: "test",
//         },
//       },
//       { $unwind: { path: "$test", preserveNullAndEmptyArrays: true } },
//       {
//         $lookup: {
//           from: "users",
//           localField: "reportedBy",
//           foreignField: "_id",
//           as: "reportedBy",
//         },
//       },
//       { $unwind: { path: "$reportedBy", preserveNullAndEmptyArrays: true } },

//       ...(search
//         ? [
//             {
//               $match: {
//                 $or: [
//                   { "patient.patientId": searchRegex },
//                   { "ipd.ipdNumber": searchRegex },
//                   { "opd.opdNumber": searchRegex },
//                 ],
//               },
//             },
//           ]
//         : []),
//       {
//         $project: {
//           patientType: 1,
//           results: 1,
//           test: {
//             testName: 1,
//             testCode: 1,
//             _id: 1,
//           },
//           createdAt: 1,
//           patient: {
//             _id: 1,
//             fullName: 1,
//             patientId: 1,
//           },
//           ipd: {
//             _id: 1,
//             ipdNumber: 1,
//           },
//           opd: {
//             _id: 1,
//             opdNumber: 1,
//           },
//           reportedBy: {
//             _id: 1,
//             fullName: 1,
//             role: 1,
//           },
//         },
//       },
//       { $sort: { createdAt: -1 } },
//       { $skip: skip },
//       { $limit: parseInt(limit) },
//     ];

//     const [reports, totalCount] = await Promise.all([
//       pathologyTestReport.aggregate(pipeline),
//       pathologyTestReport.aggregate([
//         ...pipeline.filter(
//           (stage) => !["$skip", "$limit"].includes(Object.keys(stage)[0])
//         ),
//         { $count: "total" },
//       ]),
//     ]);

//     return res.status(200).json({
//       success: true,
//       message: "Pathology tests retrieved successfully",
//       data: reports,
//       total: totalCount[0]?.total || 0,
//       page: parseInt(page),
//       limit: parseInt(limit),
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Failed to retrieve pathology tests",
//     });
//   }
// };
export const getAllPathologyTestReports = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const {
      search = "",
      page = 1,
      limit = 10,
      startDate,
      endDate,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const searchRegex = new RegExp(search, "i");

    const matchStage = {
      hospital,
    };

    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "patients",
          localField: "patient",
          foreignField: "_id",
          as: "patient",
        },
      },
      { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "ipds",
          localField: "ipd",
          foreignField: "_id",
          as: "ipd",
        },
      },
      { $unwind: { path: "$ipd", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "opds",
          localField: "opd",
          foreignField: "_id",
          as: "opd",
        },
      },
      { $unwind: { path: "$opd", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "pathologytests",
          localField: "test",
          foreignField: "_id",
          as: "test",
        },
      },
      { $unwind: { path: "$test", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "reportedBy",
          foreignField: "_id",
          as: "reportedBy",
        },
      },
      { $unwind: { path: "$reportedBy", preserveNullAndEmptyArrays: true } },

      ...(search
        ? [
            {
              $match: {
                $or: [
                  { "patient.patientId": searchRegex },
                  { "ipd.ipdNumber": searchRegex },
                  { "opd.opdNumber": searchRegex },
                ],
              },
            },
          ]
        : []),

      {
        $project: {
          patientType: 1,
          results: 1,
          createdAt: 1,
          test: {
            testName: 1,
            testCode: 1,
            _id: 1,
          },
          patient: {
            _id: 1,
            fullName: 1,
            patientId: 1,
          },
          ipd: {
            _id: 1,
            ipdNumber: 1,
          },
          opd: {
            _id: 1,
            opdNumber: 1,
          },
          reportedBy: {
            _id: 1,
            fullName: 1,
            role: 1,
          },
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
    ];

    const [reports, totalCount] = await Promise.all([
      pathologyTestReport.aggregate(pipeline),
      pathologyTestReport.aggregate([
        ...pipeline.filter(
          (stage) => !["$skip", "$limit"].includes(Object.keys(stage)[0])
        ),
        { $count: "total" },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      message: "Pathology tests retrieved successfully",
      data: reports,
      total: totalCount[0]?.total || 0,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    // console.error("Error in getAllPathologyTestReports:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve pathology tests",
    });
  }
};

export const getTestReportById = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { id } = req.params;

    let testReport = await pathologyTestReport
      .findOne({ _id: id, hospital })
      .select("results patientType ipd opd test")
      .populate([
        { path: "ipd", select: "ipdNumber" },
        { path: "opd", select: "opdNumber" },
        { path: "test", select: "testName" },
      ]);

    if (!testReport) {
      return res.status(404).json({
        success: false,
        message: "Pathology test report not found",
      });
    }

    return res.status(200).json(testReport);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve pathology test",
    });
  }
};
export const searchPathologyTests = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { name = "" } = req.query;

    const query = { hospital };

    if (name) {
      query.testName = { $regex: name, $options: "i" };
    }
    const medicines = await PathologyTest.find(query)
      .limit(20)
      .select("testName testCode");

    res.status(200).json({
      success: true,
      message: "Medicines fetched successfully",
      data: medicines,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to search medicines",
    });
  }
};

export const pathologySales = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const {
      page = 1,
      limit = 10,
      search = "",
      filterMode = "all",
      date,
    } = req.query;

    const matchStage = { hospital: hospital._id };

    if (filterMode === "date" && date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      matchStage.createdAt = { $gte: start, $lt: end };
    }

    let aggregatePipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: "$test",
          totalReports: { $sum: 1 },
          totalPayable: { $sum: "$payableAmount" },
          allBillIds: { $push: "$payment.bill" },
        },
      },
      {
        $project: {
          testId: "$_id",
          totalReports: 1,
          totalPayable: 1,
          billIds: {
            $reduce: {
              input: "$allBillIds",
              initialValue: [],
              in: { $setUnion: ["$$value", "$$this"] },
            },
          },
        },
      },
      {
        $lookup: {
          from: "bills",
          localField: "billIds",
          foreignField: "_id",
          as: "bills",
        },
      },
      {
        $addFields: {
          totalPaid: { $sum: "$bills.totalCharge" },
        },
      },
      {
        $lookup: {
          from: "pathologytests",
          localField: "testId",
          foreignField: "_id",
          as: "testDetails",
        },
      },
      { $unwind: "$testDetails" },
      {
        $project: {
          testId: 1,
          testName: "$testDetails.testName",
          testCode: "$testDetails.testCode",
          category: "$testDetails.category",
          totalReports: 1,
          totalPayable: 1,
          totalPaid: 1,
        },
      },
    ];

    if (search) {
      aggregatePipeline.push({
        $match: {
          $or: [
            { testName: { $regex: search, $options: "i" } },
            { testCode: { $regex: search, $options: "i" } },
            { category: { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    const totalResults = await pathologyTestReport.aggregate([
      ...aggregatePipeline,
      { $count: "count" },
    ]);
    const total = totalResults[0]?.count || 0;

    aggregatePipeline.push(
      { $skip: (page - 1) * limit },
      { $limit: Number(limit) }
    );

    const reports = await pathologyTestReport.aggregate(aggregatePipeline);

    return res.status(200).json({
      success: true,
      message: "Sales fetched",
      data: reports,
      total,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch pathology sales",
    });
  }
};
