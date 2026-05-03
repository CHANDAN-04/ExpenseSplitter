import { useEffect, useState } from "react";
import styles from "./SettlementRequestModal.module.css";

function SettlementRequestModal({
  isOpen,
  onClose,
  groupId,
  toUserId,
  owedAmount,
  counterpartyLabel,
  onSubmit,
  submitting,
}) {
  const [type, setType] = useState("full");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const maxOwed = Number(owedAmount) || 0;

  useEffect(() => {
    if (!isOpen) return;
    setType("full");
    setAmount(maxOwed > 0 ? String(maxOwed.toFixed(2)) : "");
    setNote("");
  }, [isOpen, maxOwed, toUserId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = Math.round(parseFloat(String(amount).replace(/,/g, "")) * 100) / 100;
    if (Number.isNaN(num) || num <= 0) return;
    await onSubmit({
      groupId,
      toUserId,
      amount: num,
      type,
      note: note.trim() || undefined,
    });
  };

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-labelledby="settlement-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="settlement-modal-title" className={styles.title}>
          Request settlement
        </h2>
        <p className={styles.sub}>
          To <strong>{counterpartyLabel}</strong> · You owe up to{" "}
          <strong>₹{maxOwed.toFixed(2)}</strong> in simplified debts for this
          group.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Type</legend>
            <label className={styles.radio}>
              <input
                type="radio"
                name="stype"
                checked={type === "full"}
                onChange={() => {
                  setType("full");
                  setAmount(maxOwed > 0 ? maxOwed.toFixed(2) : "");
                }}
              />
              Full (₹{maxOwed.toFixed(2)})
            </label>
            <label className={styles.radio}>
              <input
                type="radio"
                name="stype"
                checked={type === "partial"}
                onChange={() => setType("partial")}
              />
              Partial
            </label>
          </fieldset>

          <label className={styles.label}>
            Amount (₹)
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={maxOwed}
              required
              disabled={type === "full"}
              className={styles.input}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>

          <label className={styles.label}>
            Note (optional)
            <textarea
              className={styles.textarea}
              rows={2}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Paid cash, UPI ref…"
            />
          </label>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnGhost}
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={submitting}>
              {submitting ? "Sending…" : "Send request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SettlementRequestModal;
