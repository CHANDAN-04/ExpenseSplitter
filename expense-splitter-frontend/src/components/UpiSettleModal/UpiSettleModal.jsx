import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { buildUpiPayLink } from "../../utils/buildUpiLink";
import styles from "./UpiSettleModal.module.css";

function UpiSettleModal({
  isOpen,
  onClose,
  groupId,
  creditor,
  maxOwed,
  onHavePaid,
  submitting,
}) {
  const [type, setType] = useState("full");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const max = Number(maxOwed) || 0;
  const pa = creditor?.upiId?.trim() || "";
  const displayName = creditor?.name || "Payee";
  const handle = creditor?.username;

  useEffect(() => {
    if (!isOpen) return;
    setType("full");
    setAmount(max > 0 ? max.toFixed(2) : "");
    setNote("");
  }, [isOpen, max, creditor?.userId]);

  const amountNum = useMemo(() => {
    const n = Math.round(parseFloat(String(amount).replace(/,/g, "")) * 100) / 100;
    return Number.isFinite(n) ? n : 0;
  }, [amount]);

  const upiLink = useMemo(() => {
    if (!pa || amountNum <= 0) return "";
    return buildUpiPayLink({
      payeeAddress: pa,
      payeeName: displayName,
      amount: amountNum,
      transactionNote: note.trim() || "Settlement",
    });
  }, [pa, amountNum, displayName, note]);

  if (!isOpen || !creditor) return null;

  const openUpiApp = () => {
    if (!upiLink) return;
    window.location.href = upiLink;
  };

  const submitPaid = async (e) => {
    e.preventDefault();
    if (amountNum <= 0 || amountNum > max + 0.001) return;
    const payloadType = type === "full" ? "full" : "partial";
    await onHavePaid({
      groupId,
      toUserId: creditor.userId,
      amount: amountNum,
      type: payloadType,
      note:
        note.trim() ||
        "UPI settlement — awaiting receiver confirmation",
      paymentMode: "upi",
    });
  };

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-labelledby="upi-settle-title"
        onClick={(ev) => ev.stopPropagation()}
      >
        <h2 id="upi-settle-title" className={styles.title}>
          Settle with UPI
        </h2>
        <p className={styles.receiver}>
          <strong>{displayName}</strong>
          {handle ? (
            <>
              {" "}
              <span className={styles.muted}>@{handle}</span>
            </>
          ) : null}
        </p>
        <p className={styles.vpa}>
          <span className={styles.vpaLabel}>UPI ID</span>
          <code className={styles.vpaValue}>{pa}</code>
        </p>

        <form onSubmit={submitPaid} className={styles.form}>
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Amount</legend>
            <label className={styles.radio}>
              <input
                type="radio"
                name="ut"
                checked={type === "full"}
                onChange={() => {
                  setType("full");
                  setAmount(max > 0 ? max.toFixed(2) : "");
                }}
              />
              Full (₹{max.toFixed(2)})
            </label>
            <label className={styles.radio}>
              <input
                type="radio"
                name="ut"
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
              max={max}
              required
              disabled={type === "full"}
              className={styles.input}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>

          <label className={styles.label}>
            Note on UPI request (optional)
            <input
              type="text"
              className={styles.input}
              maxLength={80}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Shown in UPI app"
            />
          </label>

          {upiLink ? (
            <div className={styles.payBlock}>
              <button
                type="button"
                className={styles.btnUpi}
                onClick={openUpiApp}
              >
                Pay via UPI
              </button>
              <p className={styles.qrHint}>Scan to pay</p>
              <div className={styles.qrWrap}>
                <QRCodeSVG value={upiLink} size={200} level="M" />
              </div>
              <p className={styles.desktopHint}>
                On desktop, scan the QR with your phone; on mobile, use Pay via
                UPI.
              </p>
            </div>
          ) : (
            <p className={styles.warn}>Enter a valid amount to generate UPI link.</p>
          )}

          <button
            type="submit"
            className={styles.btnPaid}
            disabled={
              submitting ||
              amountNum <= 0 ||
              amountNum > max + 0.01 ||
              !pa
            }
          >
            {submitting ? "Sending…" : "I have paid"}
          </button>
          <p className={styles.paidHint}>
            After paying in your bank app, tap above to notify the receiver for
            confirmation.
          </p>
        </form>

        <button type="button" className={styles.closeGhost} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default UpiSettleModal;
