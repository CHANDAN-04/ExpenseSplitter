/**
 * Bharat / NPCI style UPI deep link (amount in INR, 2 decimals).
 * @see https://npci.org.in/what-we-do/upi/product-overview/
 */
export function buildUpiPayLink({
  payeeAddress,
  payeeName,
  amount,
  transactionNote = "Settlement",
}) {
  const pa = String(payeeAddress || "").trim();
  const pn = String(payeeName || "Payee").trim();
  const am = Number(amount);
  if (!pa || Number.isNaN(am) || am <= 0) {
    return "";
  }
  const amt = am.toFixed(2);
  const tn = String(transactionNote || "Settlement").trim();
  const qs = [
    `pa=${encodeURIComponent(pa)}`,
    `pn=${encodeURIComponent(pn)}`,
    `am=${amt}`,
    "cu=INR",
    `tn=${encodeURIComponent(tn)}`,
  ].join("&");
  return `upi://pay?${qs}`;
}
