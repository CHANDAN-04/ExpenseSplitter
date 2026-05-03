import { useState } from "react";
import { useDispatch } from "react-redux";
import { register } from "../../../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import { showSuccess, showError } from "../../../utils/toast";
import styles from "./Register.module.css";

function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    username: "",
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(register(form)).unwrap();
      showSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      showError(err?.message || "Registration failed");
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.formCard}>
        <h2 className={styles.formTitle}>Register</h2>

        <div className={styles.formGroup}>
          <input
            type="text"
            name="name"
            placeholder="Full name"
            className={styles.formInput}
            onChange={handleChange}
            required
          />
          <p className={styles.fieldHint}>
            Display name — others can use the same name.
          </p>
        </div>

        <div className={styles.formGroup}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            className={styles.formInput}
            onChange={handleChange}
            autoComplete="username"
            required
          />
          <p className={styles.fieldHint}>
            Unique handle (letters, numbers, _ and -). Cannot match an existing
            username.
          </p>
        </div>

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
          Register
        </button>

        <p className={styles.footerText}>
          Already have an account?{" "}
          <span
            className={styles.footerLink}
            onClick={() => navigate("/login")}
          >
            Login
          </span>
        </p>
      </form>
    </div>
  );
}

export default Register;
