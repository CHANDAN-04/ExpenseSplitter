import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";

import {
  getGroupMembers,
  getGroupDetails,
  getGroupBalances,
  removeMember,
  leaveGroup,
  deleteGroup,
} from "../../features/group/groupSlice";

import { getGroupExpenses } from "../../features/expense/expenseSlice";
import {
  loadGroupSettlementData,
  createSettlementRequest,
  respondToSettlementRequest,
  cancelSettlementRequest,
  clearSettlementGroup,
} from "../../features/settlement/settlementSlice";
import { showSuccess, showError } from "../../utils/toast";

import AddExpenseModal from "../../components/AddExpenseModal/AddExpenseModal";
import AddMemberModal from "../../components/AddMemberModal/AddMemberModal";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import SettlementRequestModal from "../../components/SettlementRequestModal/SettlementRequestModal";
import UpiSettleModal from "../../components/UpiSettleModal/UpiSettleModal";
import styles from "./GroupPage.module.css";

const SETTLEMENT_STATUS_LABEL = {
  pending: "Waiting for approval",
  approved: "Settled",
  rejected: "Request rejected",
  cancelled: "Cancelled",
};

function outgoingPendingLabel(req) {
  if (
    req.paymentMode === "upi" &&
    req.paymentStatus === "pending_confirmation"
  ) {
    return "Waiting for confirmation";
  }
  return "Waiting for approval";
}

function historyStatusLabel(req) {
  if (req.status === "cancelled") {
    return SETTLEMENT_STATUS_LABEL.cancelled;
  }
  if (req.status === "approved") {
    return req.paymentMode === "upi"
      ? "Settled"
      : SETTLEMENT_STATUS_LABEL.approved;
  }
  if (req.status === "rejected") {
    return req.paymentMode === "upi"
      ? "Last request rejected"
      : SETTLEMENT_STATUS_LABEL.rejected;
  }
  return SETTLEMENT_STATUS_LABEL[req.status] || req.status;
}

function GroupPage() {
  const [openExpense, setOpenExpense] = useState(false);
  const [openAddMember, setOpenAddMember] = useState(false);
  const [confirmType, setConfirmType] = useState(null);
  const [removeMembersMode, setRemoveMembersMode] = useState(false);
  const [settlementModal, setSettlementModal] = useState(null);
  const [settlementSubmitting, setSettlementSubmitting] = useState(false);
  const [upiModal, setUpiModal] = useState(null);
  const [upiSubmitting, setUpiSubmitting] = useState(false);

  const { groupId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    selectedGroup,
    members,
    groupBalances,
    balancesLoading,
    loading: groupLoading,
  } = useSelector((state) => state.group);
  const { expenses, loading: expenseLoading } = useSelector(
    (state) => state.expense,
  );
  const currentUser = useSelector((state) => state.auth.user);
  const isAuthHydrated = useSelector((state) => state.auth.isHydrated);
  const {
    incomingRequests,
    outgoingRequests,
    history: settlementHistory,
    loading: settlementLoading,
  } = useSelector((state) => state.settlement);
  const [selectedMember, setSelectedMember] = useState(null);

  // ✅ ROBUST ADMIN CHECK - Safe from crashes before data loads
  const currentMember = members?.find(
    (m) =>
      currentUser &&
      String(m.userId).trim() === String(currentUser.userId).trim(),
  );
  const isAdmin = Boolean(currentMember?.isAdmin);

  const { youOweRows, owedToYouRows } = useMemo(() => {
    const uid = String(currentUser?.userId || "").trim();
    const txs = groupBalances?.transactions || [];
    const memberById = new Map(
      (members || []).map((m) => [String(m.userId).trim(), m]),
    );
    const findMember = (rawId) => {
      const id = String(rawId ?? "").trim();
      if (!id) return null;
      const hit = memberById.get(id);
      if (hit) return hit;
      for (const m of members || []) {
        if (String(m?.userId ?? "").trim() === id) return m;
      }
      return null;
    };
    const labelFor = (userId) => {
      const id = String(userId || "").trim();
      const m = findMember(id);
      if (m?.name && m?.username) return `${m.name} (@${m.username})`;
      if (m?.username) return `@${m.username}`;
      if (m?.name) return m.name;
      return "Member";
    };
    const youOwe = [];
    const owedToYou = [];
    for (const tx of txs) {
      const fromId = String(tx.fromUser ?? tx.fromUserId ?? "").trim();
      const toId = String(tx.toUser ?? tx.toUserId ?? "").trim();
      const amount = Number(tx.amount || 0);
      if (!fromId || !toId || amount <= 0) continue;
      if (fromId === uid) {
        const creditorMember = findMember(toId);
        youOwe.push({
          counterparty: labelFor(toId),
          counterpartyId: toId,
          amount,
          creditorMember,
        });
      }
      if (toId === uid) {
        owedToYou.push({
          counterparty: labelFor(fromId),
          amount,
        });
      }
    }
    return { youOweRows: youOwe, owedToYouRows: owedToYou };
  }, [groupBalances, members, currentUser?.userId]);

  // ✅ Safe fallback check
  const isLoading = !isAuthHydrated || groupLoading || expenseLoading;
  const hasRequiredData = selectedGroup && members && currentUser;

  useEffect(() => {
    if (isAuthHydrated && groupId) {
      dispatch(getGroupDetails(groupId));
      dispatch(getGroupExpenses(groupId));
      dispatch(getGroupMembers(groupId));
      dispatch(getGroupBalances(groupId));
      dispatch(loadGroupSettlementData(groupId));
    }
  }, [dispatch, groupId, isAuthHydrated]);

  useEffect(() => {
    return () => {
      dispatch(clearSettlementGroup());
    };
  }, [dispatch]);

  useEffect(() => {
    if (!isAdmin) setRemoveMembersMode(false);
  }, [isAdmin]);

  const refreshSettlementsAndBalances = () => {
    dispatch(loadGroupSettlementData(groupId));
    dispatch(getGroupBalances(groupId));
    dispatch(getGroupMembers(groupId));
  };

  const handleSettlementModalSubmit = async (payload) => {
    try {
      setSettlementSubmitting(true);
      await dispatch(createSettlementRequest(payload)).unwrap();
      showSuccess("Settlement request sent");
      setSettlementModal(null);
      refreshSettlementsAndBalances();
    } catch (err) {
      showError(
        typeof err === "string" ? err : err?.message || "Request failed",
      );
    } finally {
      setSettlementSubmitting(false);
    }
  };

  const handleRespondSettlement = async (settlementId, action) => {
    try {
      await dispatch(
        respondToSettlementRequest({ settlementId, action }),
      ).unwrap();
      showSuccess(
        action === "approve"
          ? "Settlement approved — balances updated"
          : "Request rejected",
      );
      refreshSettlementsAndBalances();
    } catch (err) {
      showError(
        typeof err === "string" ? err : err?.message || "Could not respond",
      );
    }
  };

  const handleCancelOutgoing = async (settlementId) => {
    try {
      await dispatch(cancelSettlementRequest(settlementId)).unwrap();
      showSuccess("Request cancelled");
      refreshSettlementsAndBalances();
    } catch (err) {
      showError(
        typeof err === "string" ? err : err?.message || "Could not cancel",
      );
    }
  };

  const handleUpiHavePaid = async (payload) => {
    try {
      setUpiSubmitting(true);
      await dispatch(createSettlementRequest(payload)).unwrap();
      showSuccess("Receiver will confirm your UPI payment");
      setUpiModal(null);
      refreshSettlementsAndBalances();
    } catch (err) {
      showError(
        typeof err === "string" ? err : err?.message || "Request failed",
      );
    } finally {
      setUpiSubmitting(false);
    }
  };

  const memberCountDisplay =
    selectedGroup?.memberCount ??
    selectedGroup?.members?.length ??
    members?.length ??
    0;

  // ✅ Show loading UI while data is being fetched
  if (isLoading || !hasRequiredData) {
    return (
      <div className={styles.loadingContainer}>
        <div>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Loading group details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 🔝 HEADER */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1>{selectedGroup.name}</h1>
          <p>
            {memberCountDisplay} member{memberCountDisplay !== 1 ? "s" : ""}
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            onClick={() => setOpenExpense(true)}
            className={`${styles.actionBtn} ${styles.addExpenseBtn}`}
          >
            + Expense
          </button>

          <button
            onClick={() => setConfirmType("leave")}
            className={`${styles.actionBtn} ${styles.leaveBtn}`}
          >
            Leave
          </button>

          {isAdmin && (
            <button
              onClick={() => setConfirmType("delete")}
              className={`${styles.actionBtn} ${styles.deleteBtn}`}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* 💰 YOUR BALANCES IN THIS GROUP */}
      <div className={styles.balancesSection}>
        <h2 className={styles.sectionTitle}>Your balances in this group</h2>
        <p className={styles.balancesLead}>
          Simplified debts from shared expenses (who to pay or who pays you).
        </p>

        {balancesLoading ? (
          <p className={styles.balancesLoading}>Calculating balances…</p>
        ) : youOweRows.length === 0 && owedToYouRows.length === 0 ? (
          <p className={styles.balancesSettled}>
            You&apos;re settled up with everyone in this group.
          </p>
        ) : (
          <div className={styles.balancesGrid}>
            <div className={styles.balanceColumn}>
              <h3 className={styles.balanceColumnTitle}>You owe</h3>
              {youOweRows.length === 0 ? (
                <p className={styles.balanceEmpty}>Nothing — you don&apos;t owe anyone here.</p>
              ) : (
                <ul className={styles.balanceList}>
                  {youOweRows.map((row, idx) => (
                    <li
                      key={`owe-${row.counterpartyId}-${idx}`}
                      className={styles.balanceRowWithAction}
                    >
                      <div className={styles.balanceRowTop}>
                        <span className={styles.balanceLine}>
                          You owe{" "}
                          <strong className={styles.balancePerson}>
                            {row.counterparty}
                          </strong>
                        </span>
                        <span className={styles.balanceAmountOwe}>
                          ₹{row.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className={styles.balanceActions}>
                        <button
                          type="button"
                          className={styles.requestSettlementBtn}
                          onClick={() =>
                            setSettlementModal({
                              toUserId: row.counterpartyId,
                              owedAmount: row.amount,
                              label: row.counterparty,
                            })
                          }
                        >
                          Request settlement
                        </button>
                        <button
                          type="button"
                          className={styles.settleUpiBtn}
                          disabled={!row.creditorMember?.upiId?.trim()}
                          title={
                            row.creditorMember?.upiId?.trim()
                              ? "Pay with UPI app or QR"
                              : "Receiver has no UPI ID"
                          }
                          onClick={() => {
                            if (!row.creditorMember?.upiId?.trim()) return;
                            setUpiModal({
                              creditor: {
                                userId: row.creditorMember.userId,
                                name: row.creditorMember.name,
                                username: row.creditorMember.username,
                                upiId: row.creditorMember.upiId,
                              },
                              maxOwed: row.amount,
                            });
                          }}
                        >
                          Settle
                        </button>
                      </div>
                      {!row.creditorMember?.upiId?.trim() ? (
                        <p className={styles.noUpiHint}>
                          Receiver has no UPI ID — they can add it in Settings to
                          enable UPI settle.
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className={styles.balanceColumn}>
              <h3 className={styles.balanceColumnTitle}>Owes you</h3>
              {owedToYouRows.length === 0 ? (
                <p className={styles.balanceEmpty}>No one owes you in this group.</p>
              ) : (
                <ul className={styles.balanceList}>
                  {owedToYouRows.map((row, idx) => (
                    <li key={`recv-${idx}-${row.counterparty}`} className={styles.balanceRow}>
                      <span className={styles.balancePerson}>{row.counterparty}</span>
                      <span className={styles.balanceAmountReceive}>
                        ₹{row.amount.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 📬 MANUAL SETTLEMENT REQUESTS */}
      <div className={styles.settlementRequestsSection}>
        <h2 className={styles.sectionTitle}>Settlement requests</h2>
        <p className={styles.settlementLead}>
          Request approval from the person you owe; they confirm when you’ve
          paid outside the app. Approved amounts update group balances.
        </p>

        {settlementLoading ? (
          <p className={styles.settlementLoading}>Loading requests…</p>
        ) : (
          <>
            <div className={styles.settlementSubBlock}>
              <h3 className={styles.settlementSubTitle}>Incoming</h3>
              {incomingRequests.length === 0 ? (
                <p className={styles.settlementEmpty}>No pending requests.</p>
              ) : (
                <ul className={styles.settlementList}>
                  {incomingRequests.map((req) => (
                    <li key={req.settlementId} className={styles.settlementCard}>
                      <div className={styles.settlementCardMain}>
                        <div className={styles.settlementCardTitle}>
                          <strong>
                            {req.fromUser?.name || "Member"}
                            {req.fromUser?.username
                              ? ` (@${req.fromUser.username})`
                              : ""}
                          </strong>
                          <span className={styles.settlementAmount}>
                            ₹{Number(req.amount).toFixed(2)}
                          </span>
                        </div>
                        <span className={styles.settlementMeta}>
                          {req.paymentMode === "upi" ? "UPI · " : ""}
                          {req.type === "full" ? "Full" : "Partial"}
                          {req.note ? ` · ${req.note}` : ""}
                        </span>
                      </div>
                      <div className={styles.settlementCardActions}>
                        <button
                          type="button"
                          className={styles.btnApprove}
                          onClick={() =>
                            handleRespondSettlement(req.settlementId, "approve")
                          }
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className={styles.btnReject}
                          onClick={() =>
                            handleRespondSettlement(req.settlementId, "reject")
                          }
                        >
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={styles.settlementSubBlock}>
              <h3 className={styles.settlementSubTitle}>Outgoing</h3>
              {outgoingRequests.length === 0 ? (
                <p className={styles.settlementEmpty}>
                  You have no pending outgoing requests.
                </p>
              ) : (
                <ul className={styles.settlementList}>
                  {outgoingRequests.map((req) => (
                    <li key={req.settlementId} className={styles.settlementCard}>
                      <div className={styles.settlementCardMain}>
                        <div className={styles.settlementCardTitle}>
                          <span>
                            To{" "}
                            <strong>
                              {req.toUser?.name || "Member"}
                              {req.toUser?.username
                                ? ` (@${req.toUser.username})`
                                : ""}
                            </strong>
                          </span>
                          <span className={styles.settlementAmount}>
                            ₹{Number(req.amount).toFixed(2)}
                          </span>
                        </div>
                        <span
                          className={`${styles.statusBadge} ${styles[`status_${req.status}`]}`}
                        >
                          {req.status === "pending"
                            ? outgoingPendingLabel(req)
                            : SETTLEMENT_STATUS_LABEL[req.status] ||
                              req.status}
                        </span>
                      </div>
                      {req.status === "pending" && (
                        <div className={styles.settlementCardActions}>
                          <button
                            type="button"
                            className={styles.btnCancelReq}
                            onClick={() =>
                              handleCancelOutgoing(req.settlementId)
                            }
                          >
                            Cancel request
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={styles.settlementSubBlock}>
              <h3 className={styles.settlementSubTitle}>History</h3>
              {settlementHistory.length === 0 ? (
                <p className={styles.settlementEmpty}>
                  No completed requests in this group yet.
                </p>
              ) : (
                <ul className={styles.settlementHistoryList}>
                  {settlementHistory.map((req) => (
                    <li key={req.settlementId} className={styles.settlementHistoryRow}>
                      <span className={styles.settlementHistoryParties}>
                        {req.fromUser?.username || req.fromUserId} →{" "}
                        {req.toUser?.username || req.toUserId}
                      </span>
                      <span className={styles.settlementAmount}>
                        ₹{Number(req.amount).toFixed(2)}
                      </span>
                      <span
                        className={`${styles.statusBadge} ${styles[`status_${req.status}`]}`}
                      >
                        {historyStatusLabel(req)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>

      {/* 👥 MEMBERS */}
      <div className={styles.membersSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Members</h2>

          {isAdmin && (
            <div className={styles.adminMemberToolbar}>
              <button
                type="button"
                onClick={() => setOpenAddMember(true)}
                className={styles.addMemberBtn}
              >
                + Add Member
              </button>
              <button
                type="button"
                onClick={() => setRemoveMembersMode((v) => !v)}
                className={`${styles.removeMembersToggleBtn} ${
                  removeMembersMode ? styles.removeMembersToggleBtnActive : ""
                }`}
              >
                {removeMembersMode ? "Done" : "Remove members"}
              </button>
            </div>
          )}
        </div>

        {members.length === 0 ? (
          <p className={styles.emptyState}>No members in this group</p>
        ) : (
          <div className={styles.membersGrid}>
            {members.map((member, index) => (
              <div
                key={member.userId || index}
                className={`${styles.memberCard} ${
                  removeMembersMode && isAdmin && !member.isAdmin
                    ? styles.memberCardRemoveHint
                    : ""
                }`}
              >
                <div className={styles.memberCardHeader}>
                  <div className={styles.memberInfo}>
                    <h3>{member.name}</h3>
                    <div className={styles.memberUsername}>
                      @{member.username}
                    </div>

                    {member.isAdmin && (
                      <span className={styles.adminBadge}>Admin</span>
                    )}
                  </div>

                  {isAdmin && !member.isAdmin && removeMembersMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMember(member);
                        setConfirmType("remove");
                      }}
                      className={styles.removeMemberBtn}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 💸 EXPENSES */}
      <div className={styles.expensesSection}>
        <h2 className={styles.sectionTitle}>Expenses</h2>

        {!Array.isArray(expenses) || expenses.length === 0 ? (
          <p className={styles.emptyState}>No expenses yet</p>
        ) : (
          <div className={styles.expensesList}>
            {expenses.map((exp, index) => (
              <div key={exp.expenseId || index} className={styles.expenseItem}>
                <div className={styles.expenseDetails}>
                  <h4>{exp.title}</h4>
                  <div className={styles.expenseDescription}>
                    Paid by{" "}
                    {exp.paidByDisplay ||
                      exp.paidByName ||
                      (exp.paidByUsername
                        ? `@${exp.paidByUsername}`
                        : "Member")}
                  </div>
                </div>

                <div className={styles.expenseAmount}>₹{exp.amount}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODALS */}

      <AddExpenseModal
        isOpen={openExpense}
        onClose={() => setOpenExpense(false)}
        groupId={groupId}
        members={members}
      />

      <AddMemberModal
        isOpen={openAddMember}
        onClose={() => setOpenAddMember(false)}
        groupId={groupId}
        members={members}
        onSuccess={() => {
          dispatch(getGroupMembers(groupId));
          dispatch(getGroupDetails(groupId));
        }}
      />

      <SettlementRequestModal
        isOpen={!!settlementModal}
        onClose={() => setSettlementModal(null)}
        groupId={groupId}
        toUserId={settlementModal?.toUserId}
        owedAmount={settlementModal?.owedAmount}
        counterpartyLabel={settlementModal?.label || ""}
        submitting={settlementSubmitting}
        onSubmit={handleSettlementModalSubmit}
      />

      <UpiSettleModal
        isOpen={!!upiModal}
        onClose={() => setUpiModal(null)}
        groupId={groupId}
        creditor={upiModal?.creditor}
        maxOwed={upiModal?.maxOwed}
        submitting={upiSubmitting}
        onHavePaid={handleUpiHavePaid}
      />

      <ConfirmModal
        isOpen={!!confirmType}
        onClose={() => {
          setConfirmType(null);
          setSelectedMember(null);
        }}
        message={
          confirmType === "delete"
            ? "Delete this group permanently?"
            : confirmType === "leave"
              ? "Leave this group?"
              : `Remove ${selectedMember?.name} from group?`
        }
        onConfirm={async () => {
          try {
            if (confirmType === "delete") {
              await dispatch(deleteGroup(groupId)).unwrap();
              showSuccess("Group deleted successfully!");
            } else if (confirmType === "leave") {
              await dispatch(leaveGroup(groupId)).unwrap();
              showSuccess("You left the group!");
            } else if (confirmType === "remove") {
              await dispatch(
                removeMember({
                  groupId,
                  userId: selectedMember.userId,
                }),
              ).unwrap();
              showSuccess(`${selectedMember.name} removed from group!`);
              dispatch(getGroupBalances(groupId));
              dispatch(getGroupDetails(groupId));
            }

            if (confirmType !== "remove") {
              navigate("/dashboard");
            }
          } catch (err) {
            showError(err?.message || "Action failed");
            console.error(err);
          } finally {
            setConfirmType(null);
            setSelectedMember(null);
          }
        }}
      />
    </div>
  );
}

export default GroupPage;
