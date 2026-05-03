import toast from "react-hot-toast";

/**
 * Show success toast notification
 * @param {string} message - Success message to display
 */
export const showSuccess = (message = "Success") => {
  toast.success(message, {
    duration: 3000,
    position: "top-right",
    style: {
      background: "#10b981",
      color: "#fff",
      fontSize: "14px",
      fontWeight: "500",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    },
    iconTheme: {
      primary: "#fff",
      secondary: "#10b981",
    },
  });
};

/**
 * Show error toast notification
 * @param {string} message - Error message to display
 */
export const showError = (message = "Something went wrong") => {
  toast.error(message, {
    duration: 3000,
    position: "top-right",
    style: {
      background: "#ef4444",
      color: "#fff",
      fontSize: "14px",
      fontWeight: "500",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    },
    iconTheme: {
      primary: "#fff",
      secondary: "#ef4444",
    },
  });
};

/**
 * Show loading toast notification
 * @param {string} message - Loading message to display
 * @returns {string} - Toast ID for later dismissal
 */
export const showLoading = (message = "Loading...") => {
  return toast.loading(message, {
    position: "top-right",
    style: {
      background: "#3b82f6",
      color: "#fff",
      fontSize: "14px",
      fontWeight: "500",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    },
  });
};

/**
 * Dismiss a specific toast
 * @param {string} toastId - ID of the toast to dismiss
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

/**
 * Handle async operation with toast notifications
 * @param {Promise} promise - Async operation to execute
 * @param {Object} messages - Object with success, error, loading messages
 * @returns {Promise} - Result of the async operation
 */
export const toastAsync = async (promise, messages = {}) => {
  const {
    loading = "Loading...",
    success = "Success!",
    error: errorMsg = "Something went wrong",
  } = messages;

  const toastId = showLoading(loading);

  try {
    const result = await promise;
    dismissToast(toastId);
    showSuccess(success);
    return result;
  } catch (err) {
    dismissToast(toastId);
    const errorMessage =
      err?.message || err?.response?.data?.message || errorMsg;
    showError(errorMessage);
    throw err;
  }
};

/**
 * Show info toast notification
 * @param {string} message - Info message to display
 */
export const showInfo = (message = "Info") => {
  toast(message, {
    duration: 3000,
    position: "top-right",
    style: {
      background: "#06b6d4",
      color: "#fff",
      fontSize: "14px",
      fontWeight: "500",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    },
    iconTheme: {
      primary: "#fff",
      secondary: "#06b6d4",
    },
  });
};
