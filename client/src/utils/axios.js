import axios from "axios";
import { clearUserSession } from "./auth";

const BACKEND_URL = process.env["REACT_APP_BACKEND_URL"] || "http://localhost:5000";

const API = axios.create({
  baseURL: `${BACKEND_URL}/api`,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem("token")) {
      clearUserSession();
    }

    return Promise.reject(error);
  }
);

export default API;
