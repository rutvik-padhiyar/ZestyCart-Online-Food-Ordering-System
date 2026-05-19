import axios from "axios";
import { clearUserSession } from "../utils/auth";

const BACKEND_URL = process.env["REACT_APP_BACKEND_URL"] || "http://localhost:5000";

const API = axios.create({
  baseURL: `${BACKEND_URL}/api`,
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

export const loginUser = (data) => API.post("/auth/login", data);

export const addFood = (data, token) =>
  API.post("/food/add", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
