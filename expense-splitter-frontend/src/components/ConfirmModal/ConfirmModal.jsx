import styles from "./ConfirmModal.module.css";

function ConfirmModal({ isOpen, onClose, onConfirm, message }) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <p className={styles.message}>{message}</p>

        <div className={styles.actions}>
          <button onClick={onClose} className={styles.btnCancel}>
            Cancel
          </button>

          <button onClick={onConfirm} className={styles.btnConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
