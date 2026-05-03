import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import styles from "./ProtectedRoute.module.css";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const currentUser = useSelector((state) => state.auth.user);
  const isHydrated = useSelector((state) => state.auth.isHydrated);

  // ✅ Show loading state while Redux is rehydrating
  if (!isHydrated) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Authenticating...</p>
        </div>
      </div>
    );
  }

  // ✅ Redirect to login if no token or user
  if (!token || !currentUser) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default ProtectedRoute;
