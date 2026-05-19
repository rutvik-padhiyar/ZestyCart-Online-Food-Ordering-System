import axios from "axios";
import { clearUserSession, getStoredToken } from "./auth";

let isConfigured = false;

export function configureAxios() {
  if (isConfigured) {
    return;
  }

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;
      const hasSession = Boolean(error.config?.headers?.Authorization || getStoredToken());

      if (status === 401 && hasSession) {
        clearUserSession();
      }

      return Promise.reject(error);
    }
  );

  isConfigured = true;
}
