import API from "./axios";
import { logout } from "../features/auth/authSlice";

/** Paths where 401 is expected (bad credentials), not an expired session */
function isAuthFailureResponse(config) {
  const url = config?.url || "";
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/refresh")
  );
}

export function setupAxiosAuth(store) {
  API.interceptors.response.use(
    (res) => res,
    (err) => {
      const status = err.response?.status;
      if (status === 401 && !isAuthFailureResponse(err.config)) {
        store.dispatch(logout());
      }
      return Promise.reject(err);
    },
  );
}
