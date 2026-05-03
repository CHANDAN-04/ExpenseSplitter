import { useState } from "react";
import { useDispatch } from "react-redux";
import { createGroup } from "../../features/group/groupSlice";
import API from "../../api/axios";
import { showSuccess, showError } from "../../utils/toast";
import styles from "./CreateGroupModal.module.css";

function CreateGroupModal({ isOpen, onClose }) {
  const dispatch = useDispatch();

  const [name, setName] = useState("");
  const [members, setMembers] = useState([]);
  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addMember = async () => {
    if (!input.trim()) return;

    setError("");

    // duplicate check
    if (members.find((m) => m.username === input)) {
      setError("User already added");
      return;
    }

    try {
      setLoading(true);

      const res = await API.get(`/users/search?q=${input}`);

      if (!res.data.data || res.data.data.length === 0) {
        setError("User not found");
        return;
      }

      const user = res.data.data[0];

      setMembers([...members, user]);
      setInput("");
      setError("");
      showSuccess(`${user.name} added to group!`);
    } catch (err) {
      const errorMsg = "Error searching user" + err;
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const removeMember = (username) => {
    setMembers(members.filter((m) => m.username !== username));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name) {
      showError("Please enter a group name");
      return;
    }

    try {
      await dispatch(
        createGroup({
          name,
          members: members.map((m) => m.userId),
        }),
      ).unwrap();

      showSuccess("Group created successfully!");
      setName("");
      setMembers([]);
      setError("");
      onClose();
    } catch (err) {
      const errorMsg =
        typeof err === "string"
          ? err
          : err?.message || "Failed to create group";
      setError(errorMsg);
      showError(errorMsg);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Create Group</h2>
          <button type="button" onClick={onClose} className={styles.closeBtn}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.content}>
            {/* GROUP NAME */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Group Name</label>
              <input
                type="text"
                placeholder="Enter group name"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* ADD MEMBER */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Add Members</label>
              <div className={styles.memberSearch}>
                <input
                  type="text"
                  placeholder="Enter username"
                  className={styles.searchInput}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />

                <button
                  type="button"
                  onClick={addMember}
                  className={styles.addBtn}
                  disabled={loading}
                >
                  {loading ? "..." : "Add"}
                </button>
              </div>
            </div>

            {/* 🔴 ERROR MESSAGE */}
            {error && <p className={styles.error}>{error}</p>}

            {/* MEMBER LIST */}
            {members.length > 0 && (
              <div className={styles.memberList}>
                <div className={styles.memberListTitle}>Added Members</div>
                <div className={styles.memberItems}>
                  {members.map((m, index) => (
                    <div key={m.userId || index} className={styles.memberItem}>
                      <div>
                        <div className={styles.memberItemName}>{m.name}</div>
                        <div className={styles.memberItemUsername}>
                          @{m.username}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMember(m.username)}
                        className={styles.removeMemberBtn}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* BUTTONS */}
          <div className={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              className={styles.btnCancel}
            >
              Cancel
            </button>

            <button type="submit" className={styles.btnSubmit}>
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateGroupModal;
