import axios from "axios";

const API = axios.create({
  // baseURL: "http://localhost:3001/api",
  baseURL: "https://hospital-erp-9w6z.onrender.com/api",
  headers: { "Content-Type": "application/json" },
});

API.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      error.response?.data?.message === "No token provided"
    ) {
      sessionStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error?.response?.data || error);
  }
);

export default API;
