import API from ".";

export const loginUser = async (payload) => {
  try {
    const response = await API.post("/auth/login", payload);
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};
export const logoutUserApi = async () => {
  try {
    const response = await API.get("/auth/logout");
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};
export const getAllStaffApi = async (params = {}) => {
  try {
    const response = await API.get("/user/all-staff", { params });
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};
export const getAllPatientsApi = async (params = {}) => {
  try {
    const response = await API.get("/patient/all-patients", { params });
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};
export const createPatientApi = async (payload) => {
  try {
    const response = await API.post("/patient/patient-registration", payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};
export const getUsersApi = async (params = {}) => {
  try {
    const response = await API.get("/user/all-users", {
      params,
    });
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};
export const getStaffByIdApi = async (id) => {
  try {
    const response = await API.get(`/user/get-user/${id}`);
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};
export const getIncomeOverviewForDashApi = async (params) => {
  try {
    const response = await API.get(`/user/get-income`, { params });
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};

export const getStaffPaymentsApi = async (id) => {
  try {
    const response = await API.get(`/user/get-user-payments/${id}`);
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};
export const getStaffForAssignApi = async (staffType) => {
  try {
    const response = await API.get(`/user/staff-assing`, {
      params: { staffType },
    });
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};

export const getOpdPatientsApi = async (params = {}) => {
  try {
    const response = await API.get("/opd/all-opd-patients", { params });
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};
export const getIpdPatientsApi = async (params = {}) => {
  try {
    const response = await API.get("/ipd/all-ipd-patients", { params });
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};

export const getPatientDetailsApi = async (id) => {
  try {
    const response = await API.get(`/patient/patient-details/${id}`);
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};
export const getPatientDetailsIpdOpdApi = async (id, params) => {
  try {
    const response = await API.get(`/patient/ipd-opd-details/${id}`, {
      params,
    });
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};
export const updatePatientRegistrationApi = async (id, payload) => {
  try {
    const response = await API.put(
      `/patient/patient-registration/edit/${id}`,
      payload,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};
export const updateIpdDetailsApi = async (ipdId, payload) => {
  try {
    const response = await API.put(`/ipd/update-ipd/${ipdId}`, payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};
export const updateOpdDetailsApi = async (opdId, payload) => {
  try {
    const response = await API.put(`/opd/update-opd/${opdId}`, payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const switchToIpdApi = async (patientId, payload) => {
  try {
    const response = await API.post(
      `/patient/${patientId}/patient-switch-to-ipd`,
      payload
    );
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};

export const updateOrCreateUserApi = async (payload) => {
  try {
    const response = await API.post("/user/register-update-user", payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};
export const getAllWardTypesApi = async () => {
  try {
    const response = await API.get(`/ward/wardTypes/all`);
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};
export const createWardTypesApi = async (payload) => {
  try {
    const response = await API.post("/ward/wardTypes/create", payload);
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};
export const createAndUpdateWardApi = async (wardData) => {
  try {
    const response = await API.post("/ward/create-update-ward", wardData);
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};

export const getAllWardsApi = async (params = {}) => {
  try {
    const response = await API.get("/ward/all-wards", { params });
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};
export const createBedsApi = async (payload) => {
  try {
    const response = await API.post("/ward/create-beds", payload);
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};

export const getBedsByWardIdApi = async (wardId, params = {}) => {
  try {
    const response = await API.get(`/ward/beds/${wardId}`, { params });
    return response.data;
  } catch (error) {
    return (
      error.response?.data || { success: false, message: "Request failed" }
    );
  }
};
export const deleteWardApi = async (wardId) => {
  try {
    const res = await API.delete(`/ward/delete-ward/${wardId}`);
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const deleteLastBedApi = async (wardId) => {
  try {
    const res = await API.delete(`/ward/delete-last-bed/${wardId}`);
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};
export const getAvailableWardsAndBedsApi = async (params) => {
  try {
    const response = await API.get("/ipd/available-wards-beds", {
      params,
    });
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};
export const changeBedStatusApi = async (payload) => {
  try {
    const response = await API.put("/ward/bed/status", payload);
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const createOrUpdateMedicineApi = async (payload) => {
  try {
    const response = await API.post(
      `/pharmacy/create-update-medicine`,
      payload,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};

export const getAllMedicinesApi = async (params = {}) => {
  try {
    const res = await API.get("/pharmacy/all-medicines", { params });
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};

export const deleteMedicineApi = async (id) => {
  try {
    const res = await API.delete(`/pharmacy/delete-medicine/${id}`);
    return res.data;
  } catch (error) {
    return error.response?.data || { code: 500, message: "API Error" };
  }
};
export const dischargePatientApi = async (payload) => {
  try {
    const res = await API.put("/ipd/discharge-ipd-patient", payload);
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};
export const getPatientFullDetailsApi = async ({ patientId, params }) => {
  try {
    const response = await API.get(
      `/patient/patient-full-details/${patientId}`,
      { params }
    );
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};
export const addOpdOrIpdApi = async (payload) => {
  try {
    const res = await API.post("/patient/add-opd-ipd", payload);
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};
export const searchPatientApi = async (params) => {
  try {
    const res = await API.get(`/patient/patient-search`, { params });
    return res.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};
// NOTE on error handling for the pay* endpoints:
// the axios response interceptor in services/index.js already rejects with
// `error.response.data`, i.e. the API envelope {success,message,data}. Doing
// `error.response?.data || error.message` here unwrapped it a SECOND time and
// returned a bare string, so the caller lost both `success` and `message` and
// could only show a generic "payment failed". Return the envelope instead.
export const payPatientIpdBillApi = async (payload) => {
  try {
    const res = await API.post("/pay/patient-ipd-bill", payload);
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};
export const payPatientPathologyBillApi = async (payload) => {
  try {
    const res = await API.post("/pay/patient-pathology-bill", payload);
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};
export const payPatientMedicineBillApi = async (payload) => {
  try {
    const res = await API.post("/pay/patient-medicine-bill", payload);
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};
export const payPatientOpdBillApi = async (payload) => {
  try {
    const res = await API.post("/pay/patient-opd-bill", payload);
    return res.data;
  } catch (error) {
    return error?.response?.data || error;
  }
};
export const uploadMedicineExcelApi = async (formData) => {
  try {
    const res = await API.post("/pharmacy/import-medicines", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};
export const getDashboardStaticData = async () => {
  try {
    const response = await API.get("/auth/dashboard/static-data");
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};
export const getIncomeOverviewApi = async (params) => {
  try {
    const response = await API.get("/auth/income/overview", { params });
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};
export const createOrUpdateHospitalApi = async (formData) => {
  try {
    const res = await API.post("/auth/create-update-hospital", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};
export const checkHospitalPrefixApi = async (params = {}) => {
  try {
    const response = await API.get("/auth/check-prefix", { params });
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};
export const getHospitalsListApi = async () => {
  try {
    const response = await API.get("/auth/hospitals-list");
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};
export const getHospitalByIdApi = async (id) => {
  try {
    const response = await API.get(`/auth/hospital/${id}`);
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};
export const impersonateUserApi = async (userId) => {
  try {
    const response = await API.post(`/auth/impersonate/${userId}`);
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};
export const leaveImpersonationApi = async () => {
  try {
    const response = await API.post("/auth/leave-impersonation");
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};
export const payDoctorApi = async (payload) => {
  try {
    const res = await API.post("/doctor/pay-commission", payload);
    return res.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: error.message };
  }
};

export const getAllPathologyTestsApi = async (params = {}) => {
  try {
    const res = await API.get("/pathology/all-tests", { params });
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};

export const getPathologyTestByIdApi = async (id) => {
  try {
    const res = await API.get(`/pathology/test/${id}`);
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};

export const createOrUpdatePathologyTestApi = async (payload, id) => {
  try {
    let res;
    if (id) {
      res = await API.put(`/pathology/test/${id}`, payload);
    } else {
      res = await API.post("/pathology/test", payload);
    }
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};

export const getDoctorIpdsApi = async (doctorId, params = {}) => {
  try {
    const res = await API.get(`/doctor/ipds/${doctorId}`, { params });
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};

export const getDoctorOpdsApi = async (doctorId, params = {}) => {
  try {
    const res = await API.get(`/doctor/opds/${doctorId}`, { params });
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};
export const createPathologyTestReportApi = async (payload) => {
  try {
    const response = await API.post("/pathology/create-test-report", payload);
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};
export const getAllPathologyTestReportsApi = async (params) => {
  try {
    const res = await API.get("/pathology/all-reports", {
      params,
    });
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};

export const getTestReportByIdApi = async (id) => {
  try {
    const res = await API.get(`/pathology/test-report/${id}`);
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};
export const searchMedcineApi = async (params = {}) => {
  try {
    const res = await API.get("/pharmacy/medicines", { params });
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};
export const searchPathologyTestApi = async (params = {}) => {
  try {
    const res = await API.get("/pathology/tests", { params });
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};
export const createPrescriptionApi = async (payload) => {
  try {
    const response = await API.post(
      "/prescription/create-prescription",
      payload
    );
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};
export const getPatientsPrescriptionApi = async (params = {}) => {
  try {
    const res = await API.get("/prescription/patient-prescription", { params });
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};
export const createMedicinesOrderApi = async (payload) => {
  try {
    const response = await API.post(`/pharmacy/medicines/order`, payload);
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};
export const getPatientsMedicineOrdersApi = async (params = {}) => {
  try {
    const res = await API.get("/pharmacy/medicine-sales/patients", { params });
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};
export const getPathologySales = async (params = {}) => {
  try {
    const res = await API.get("/pathology/sales/report", { params });
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};
export const getPharmacySales = async (params = {}) => {
  try {
    const res = await API.get("/pharmacy/sales/report", { params });
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};
export const createStaffPaymentApi = async (payload) => {
  try {
    const response = await API.post(`/user/payment`, payload);
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};
export const updateStaffPaymentApi = async (id, payload) => {
  try {
    const response = await API.patch(`/user/payments/${id}`, payload);
    return response.data;
  } catch (error) {
    return error.response?.data || error.message;
  }
};

// ---------------- Ophthalmology / Eye Care ----------------
export const getEyeQueueApi = async (params = {}) => {
  try {
    const res = await API.get("/eye/queue", { params });
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};
export const saveEyeWorkupApi = async (payload) => {
  try {
    const res = await API.post("/eye/workup", payload);
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};
export const saveDoctorEyeFindingsApi = async (payload) => {
  try {
    const res = await API.post("/eye/doctor-findings", payload);
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};
export const getEyeExamApi = async (params = {}) => {
  try {
    const res = await API.get("/eye/exam", { params });
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};
export const getPatientEyeHistoryApi = async (patientId) => {
  try {
    const res = await API.get(`/eye/history/${patientId}`);
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};

// ---------------- Optical Shop ----------------
export const createOrUpdateOpticalItemApi = async (payload) => {
  try {
    const res = await API.post("/optical/item", payload);
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};
export const getOpticalItemsApi = async (params = {}) => {
  try {
    const res = await API.get("/optical/items", { params });
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};
export const deleteOpticalItemApi = async (id) => {
  try {
    const res = await API.delete(`/optical/item/${id}`);
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};
export const createOpticalOrderApi = async (payload) => {
  try {
    const res = await API.post("/optical/order", payload);
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};
export const getOpticalOrdersApi = async (params = {}) => {
  try {
    const res = await API.get("/optical/orders", { params });
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};
export const updateOpticalOrderStatusApi = async (id, payload) => {
  try {
    const res = await API.put(`/optical/order/${id}/status`, payload);
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};

// ---------------- Eye Surgery / OT ----------------
export const createEyeSurgeryApi = async (payload) => {
  try {
    const res = await API.post("/eye-surgery", payload);
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};
export const updateEyeSurgeryApi = async (id, payload) => {
  try {
    const res = await API.put(`/eye-surgery/${id}`, payload);
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};
export const getEyeSurgeriesApi = async (params = {}) => {
  try {
    const res = await API.get("/eye-surgery/list", { params });
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};
export const getEyeSurgeryByIdApi = async (id) => {
  try {
    const res = await API.get(`/eye-surgery/${id}`);
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "API Error" };
  }
};
