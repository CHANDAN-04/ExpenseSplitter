import { useState } from "react";
import { useDispatch } from "react-redux";
import { login } from "../../../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import { showSuccess, showError } from "../../../utils/toast";
import styles from "./Login.module.css";

function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await dispatch(login(form)).unwrap();
      showSuccess("Login successful!");
      navigate("/");
    } catch (err) {
      showError(err?.message || "Login failed");
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.formCard}>
        <h2 className={styles.formTitle}>Login</h2>

        <div className={styles.formGroup}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            className={styles.formInput}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <input
            type="password"
            name="password"
            placeholder="Password"
            className={styles.formInput}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className={styles.submitBtn}>
          Login
        </button>

        <p className={styles.footerText}>
          Don't have an account?{" "}
          <span
            className={styles.footerLink}
            onClick={() => navigate("/register")}
          >
            Register
          </span>
        </p>
      </form>
    </div>
  );
}

export default Login;
