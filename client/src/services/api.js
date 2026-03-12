import axios from "axios";

const BACKEND_URL = process.env["REACT_APP_BACKEND_URL"] || "http://localhost:5000";

const API = axios.create({
  baseURL: `${BACKEND_URL}/api`,
});

export const loginUser = (data) => API.post("/auth/login", data);

export const addFood = (data, token) =>
  API.post("/food/add", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
