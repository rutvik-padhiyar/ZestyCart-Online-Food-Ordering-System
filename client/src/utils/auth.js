import { jwtDecode } from "jwt-decode";

const SESSION_STORAGE_KEYS = ["token", "currentUser"];

export function getStoredToken() {
  return localStorage.getItem("token");
}

export function setStoredUser(user) {
  if (!user) {
    localStorage.removeItem("currentUser");
    return;
  }

  localStorage.setItem("currentUser", JSON.stringify(user));
}

export function clearUserSession({ notify = true } = {}) {
  SESSION_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));

  if (notify && typeof window !== "undefined") {
    window.dispatchEvent(new Event("loginSuccess"));
  }
}

export function readCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch (error) {
    return null;
  }
}

export function validateStoredToken() {
  const token = getStoredToken();
  if (!token) {
    return null;
  }

  try {
    const decoded = jwtDecode(token);
    const isExpired = decoded.exp ? Date.now() >= decoded.exp * 1000 : false;

    if (isExpired) {
      clearUserSession();
      return null;
    }

    return decoded;
  } catch (error) {
    clearUserSession();
    return null;
  }
}
