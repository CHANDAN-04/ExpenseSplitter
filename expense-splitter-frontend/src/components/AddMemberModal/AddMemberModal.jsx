import { useState } from "react";
import API from "../../api/axios";
import { showSuccess, showError } from "../../utils/toast";
import styles from "./AddMemberModal.module.css";

function AddMemberModal({ isOpen, onClose, groupId, onSuccess, members = [] }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async () => {
    if (!input.trim()) return;

    setError("");

    try {
      setLoading(true);

      // 🔍 SEARCH USER
      const res = await API.get(`/users/search?q=${input}`);

      if (!res.data.data || res.data.data.length === 0) {
        setError("User not found");
        return;
      }

      const user = res.data.data[0];

      // ❗ CHECK ALREADY EXISTS IN GROUP
      const alreadyExists = members.some(
        (m) => String(m.userId).trim() === String(user.userId).trim(),
      );

      if (alreadyExists) {
        showError("User already in this group");
        return;
      }

      // ➕ ADD MEMBER
      await API.patch(`/groups/${groupId}/members`, {
        userId: user.userId,
      });

      // ✅ RESET
      setInput("");
      setError("");
      showSuccess(`${user.name} added successfully!`);

      onSuccess();
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to add member";
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ✅ ENTER KEY SUPPORT
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Add Member</h2>
          <button type="button" onClick={onClose} className={styles.closeBtn}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Search User</label>
            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Enter username"
                className={styles.input}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />

              <button
                type="button"
                onClick={handleAdd}
                disabled={loading}
                className={styles.addBtn}
              >
                {loading ? "..." : "Add"}
              </button>
            </div>
          </div>

          {/* 🔴 ERROR */}
          {error && <p className={styles.error}>{error}</p>}
        </div>

        {/* FOOTER */}
        <div className={styles.footer}>
          <button
            type="button"
            onClick={() => {
              setInput("");
              setError("");
              onClose();
            }}
            className={styles.btnCancel}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddMemberModal;
