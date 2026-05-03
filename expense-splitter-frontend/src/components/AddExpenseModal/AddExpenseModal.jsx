import { useState } from "react";
import { useDispatch } from "react-redux";
import { createExpense } from "../../features/expense/expenseSlice";
import { showSuccess, showError } from "../../utils/toast";
import styles from "./AddExpenseModal.module.css";

function AddExpenseModal({ isOpen, onClose, groupId, members }) {
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    title: "",
    amount: "",
    paidBy: "",
    splitType: "equal",
  });

  const [splits, setSplits] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSplitChange = (userId, value) => {
    setSplits({ ...splits, [userId]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.paidBy) {
      showError("Please select who paid");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      showError("Please enter a valid amount");
      return;
    }

    let participants = [];

    // ✅ EQUAL - Divide amount equally among all members
    if (form.splitType === "equal") {
      const equalShare = Number(form.amount) / members.length;
      participants = members.map((m) => ({
        userId: m.userId,
        share: equalShare,
      }));
    }

    // ✅ EXACT - Each member gets specified exact amount
    if (form.splitType === "exact") {
      const total = Object.values(splits).reduce(
        (a, b) => a + Number(b || 0),
        0,
      );

      if (total !== Number(form.amount)) {
        showError("Total must equal the expense amount");
        return;
      }

      participants = members.map((m) => ({
        userId: m.userId,
        share: Number(splits[m.userId] || 0),
      }));
    }

    // ✅ PERCENTAGE - Calculate amount based on percentage
    if (form.splitType === "percentage") {
      const total = Object.values(splits).reduce(
        (a, b) => a + Number(b || 0),
        0,
      );

      if (total !== 100) {
        showError("Total percentage must equal 100%");
        return;
      }

      participants = members.map((m) => ({
        userId: m.userId,
        share: (Number(splits[m.userId] || 0) / 100) * Number(form.amount),
      }));
    }

    const payload = {
      title: form.title,
      amount: Number(form.amount),
      paidBy: form.paidBy,
      groupId,
      splitType: form.splitType,
      participants,
    };

    console.log("Payload:", payload);

    try {
      await dispatch(createExpense(payload)).unwrap();
      showSuccess("Expense added successfully!");

      // 🔄 reset
      setForm({
        title: "",
        amount: "",
        paidBy: "",
        splitType: "equal",
      });
      setSplits({});

      onClose();
    } catch (err) {
      console.error(err);
      showError(err?.message || "Failed to add expense");
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Add Expense</h2>
          <button type="button" onClick={onClose} className={styles.closeBtn}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.content}>
            {/* TITLE */}
            <div className={styles.formGroup}>
              <input
                type="text"
                name="title"
                placeholder="Title"
                className={styles.input}
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>

            {/* AMOUNT */}
            <div className={styles.formGroup}>
              <input
                type="number"
                name="amount"
                placeholder="Amount"
                className={styles.input}
                value={form.amount}
                onChange={handleChange}
                required
              />
            </div>

            {/* PAID BY */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Paid By</label>
              <select
                name="paidBy"
                className={styles.select}
                value={form.paidBy}
                onChange={handleChange}
                required
              >
                <option value="">Select member</option>
                {members.map((m, index) => (
                  <option key={m.userId || index} value={m.userId}>
                    {m.name} (@{m.username})
                  </option>
                ))}
              </select>
            </div>

            {/* SPLIT TYPE */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Split Type</label>
              <select
                name="splitType"
                className={styles.select}
                value={form.splitType}
                onChange={handleChange}
              >
                <option value="equal">Equal</option>
                <option value="exact">Exact Amount</option>
                <option value="percentage">Percentage</option>
              </select>
            </div>

            {/* DYNAMIC INPUTS */}
            {form.splitType !== "equal" && (
              <div className={styles.splitsContainer}>
                <div className={styles.splitTitle}>
                  {form.splitType === "percentage"
                    ? "Percentage Split"
                    : "Amount Split"}
                </div>
                {members.map((m) => (
                  <div key={m.userId} className={styles.splitRow}>
                    <span className={styles.splitName}>{m.name}</span>
                    <input
                      type="number"
                      placeholder={form.splitType === "percentage" ? "%" : "₹"}
                      className={styles.splitInput}
                      onChange={(e) =>
                        handleSplitChange(m.userId, e.target.value)
                      }
                    />
                  </div>
                ))}
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
              Add Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddExpenseModal;
