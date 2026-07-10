import axios from "axios";

const API = axios.create({
  // API base is configured via REACT_APP_API_URL:
  //   - Vercel/production: set REACT_APP_API_URL in project env settings
  //   - Local dev: set it in frontend/.env.local (e.g. http://localhost:3001/api)
  // Falls back to the production Render backend when the var is not set.
  baseURL:
    process.env.REACT_APP_API_URL ||
    "https://hospital-erp-9w6z.onrender.com/api",
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
