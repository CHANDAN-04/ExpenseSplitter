import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import styles from "./Home.module.css";

function Home() {
  const navigate = useNavigate();

  const aboutRef = useRef(null);
  const contactRef = useRef(null);

  const scrollTo = (ref) => {
    ref.current.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    }
  }, []);

  return (
    <div className={styles.container}>
      {/* 🔝 NAVBAR */}
      <nav className={styles.navbar}>
        <h1 className={styles.navLogo}>SplitX</h1>

        <div className={styles.navLinks}>
          <button
            className={styles.navButton}
            onClick={() => scrollTo(aboutRef)}
          >
            About
          </button>
          <button
            className={styles.navButton}
            onClick={() => scrollTo(contactRef)}
          >
            Contact
          </button>
          <button
            className={`${styles.navButton} ${styles.navButtonLogin}`}
            onClick={() => navigate("/login")}
          >
            Login
          </button>
          <button
            className={styles.navButtonRegister}
            onClick={() => navigate("/register")}
          >
            Register
          </button>
        </div>
      </nav>

      {/* 🏠 HERO SECTION */}
      <section className={styles.heroSection}>
        <h1 className={styles.heroTitle}>Split Expenses Easily 💸</h1>
        <p className={styles.heroSubtitle}>
          Track, split, and settle with friends effortlessly
        </p>
        <button
          className={styles.heroButton}
          onClick={() => navigate("/register")}
        >
          Get Started
        </button>
      </section>

      {/* 📖 ABOUT SECTION */}
      <section className={styles.aboutSection} ref={aboutRef}>
        <h2 className={styles.sectionTitle}>About App</h2>
        <p className={styles.sectionContent}>
          This app helps you split expenses with friends, manage group spending,
          and track balances easily. Built using MERN stack with real-time
          updates.
        </p>
      </section>

      {/* 📞 CONTACT SECTION */}
      <section className={styles.contactSection} ref={contactRef}>
        <div className={styles.contactInfo}>
          <h2 className={styles.sectionTitle}>Contact Us</h2>
          <p>Email: support@splitx.com</p>
          <p>Phone: +91 9876543210</p>
        </div>
      </section>
    </div>
  );
}

export default Home;
