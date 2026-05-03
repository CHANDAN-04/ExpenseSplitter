import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "../../context/ThemeContext";
import { updateProfile } from "../../features/auth/authSlice";
import { showSuccess, showError } from "../../utils/toast";
import styles from "./Settings.module.css";

function Settings() {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);
  const { darkMode: isDark, setDarkMode: setTheme } = useTheme();
  const toggleTheme = () => setTheme(!isDark);
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    expenseReminders: true,
    settledNotifications: true,
  });
  const [upiId, setUpiId] = useState("");
  const [upiSaving, setUpiSaving] = useState(false);

  useEffect(() => {
    setUpiId(currentUser?.upiId || "");
  }, [currentUser?.upiId]);

  const handleSaveUpi = async () => {
    try {
      setUpiSaving(true);
      await dispatch(updateProfile({ upiId: upiId.trim() })).unwrap();
      showSuccess("UPI ID saved");
    } catch (err) {
      showError(typeof err === "string" ? err : "Could not save UPI ID");
    } finally {
      setUpiSaving(false);
    }
  };

  const handleNotificationChange = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.settingsCard}>
        <h1 className={styles.title}>Settings</h1>

        {currentUser && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Account</h2>
            <div className={styles.accountCard}>
              <div className={styles.accountName}>{currentUser.name}</div>
              <div className={styles.accountUsername}>
                @{currentUser.username}
              </div>
              {currentUser.userId && (
                <div className={styles.accountId}>
                  <span className={styles.accountIdLabel}>User ID</span>
                  <code className={styles.accountIdValue}>
                    {currentUser.userId}
                  </code>
                </div>
              )}
            </div>
          </div>
        )}

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Payments</h2>
          <p className={styles.sectionIntro}>
            Add your UPI ID (VPA) so others can send you money using the Settle
            flow on group pages.
          </p>
          <label className={styles.upiLabel}>
            UPI ID
            <input
              type="text"
              className={styles.upiInput}
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="yourname@paytm"
              autoComplete="off"
              maxLength={100}
            />
          </label>
          <button
            type="button"
            className={styles.upiSaveBtn}
            onClick={handleSaveUpi}
            disabled={upiSaving}
          >
            {upiSaving ? "Saving…" : "Save"}
          </button>
        </div>

        {/* Theme Settings */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Appearance</h2>
          <div className={styles.settingItem}>
            <div className={styles.settingLabel}>
              <label className={styles.label}>Dark Mode</label>
              <p className={styles.description}>
                Toggle dark mode for a comfortable viewing experience
              </p>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={isDark}
                onChange={toggleTheme}
                className={styles.toggleInput}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>
        </div>

        {/* Notification Settings */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Notifications</h2>

          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className={styles.settingItem}>
              <div className={styles.settingLabel}>
                <label className={styles.label}>
                  {key === "emailNotifications" && "Email Notifications"}
                  {key === "pushNotifications" && "Push Notifications"}
                  {key === "expenseReminders" && "Expense Reminders"}
                  {key === "settledNotifications" && "Settlement Notifications"}
                </label>
                <p className={styles.description}>
                  {key === "emailNotifications" &&
                    "Receive email updates for important activities"}
                  {key === "pushNotifications" &&
                    "Get push notifications on your device"}
                  {key === "expenseReminders" &&
                    "Be reminded about pending expenses"}
                  {key === "settledNotifications" &&
                    "Get notified when expenses are settled"}
                </p>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => handleNotificationChange(key)}
                  className={styles.toggleInput}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>
          ))}
        </div>

        {/* Soon Features */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Privacy & Security</h2>
          <div className={styles.comingSoon}>
            <p>Privacy settings and security options coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
