import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  loadFriendsHub,
  respondFriendRequest,
  removeFriendByUsername,
} from "../../features/user/userSlice";
import styles from "./FriendsPage.module.css";

function avatarLetter(user) {
  const n = user?.name || user?.username || "?";
  return String(n).charAt(0).toUpperCase();
}

function FriendsPage() {
  const dispatch = useDispatch();
  const {
    friendsList,
    friendRequestsReceived,
    friendRequestsSent,
    pendingIncomingCount,
    friendsHubLoading,
    friendsHubError,
    friendActionLoading,
  } = useSelector((state) => state.user);

  const [mainTab, setMainTab] = useState("friends");

  useEffect(() => {
    dispatch(loadFriendsHub());
  }, [dispatch]);

  const handleRespond = async (requestId, action) => {
    const rid = requestId ? String(requestId) : "";
    if (!rid) {
      toast.error("Invalid request");
      return;
    }
    try {
      await dispatch(
        respondFriendRequest({ requestId: rid, action }),
      ).unwrap();
      toast.success(action === "accept" ? "You're connected" : "Request declined");
    } catch (msg) {
      toast.error(typeof msg === "string" ? msg : "Something went wrong");
    }
  };

  const handleRemove = async (username) => {
    if (!username) return;
    try {
      await dispatch(removeFriendByUsername(username)).unwrap();
      toast.success("Removed from connections");
    } catch (msg) {
      toast.error(typeof msg === "string" ? msg : "Could not remove");
    }
  };

  const incoming = friendRequestsReceived || [];
  const outgoing = friendRequestsSent || [];

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Network</p>
          <h1 className={styles.title}>People</h1>
          <p className={styles.subtitle}>
            Manage connections and friend requests in one place — same flows as
            modern billing apps.
          </p>
        </div>
        <button
          type="button"
          className={styles.refreshBtn}
          disabled={friendsHubLoading}
          onClick={() => dispatch(loadFriendsHub())}
        >
          {friendsHubLoading ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${mainTab === "friends" ? styles.tabActive : ""}`}
          onClick={() => setMainTab("friends")}
        >
          Connections
          <span className={styles.tabCount}>{friendsList?.length ?? 0}</span>
        </button>
        <button
          type="button"
          className={`${styles.tab} ${mainTab === "requests" ? styles.tabActive : ""}`}
          onClick={() => setMainTab("requests")}
        >
          Requests
          {(incoming.length > 0 || outgoing.length > 0) && (
            <span className={styles.tabBadge}>
              {(incoming.length || 0) + (outgoing.length || 0)}
            </span>
          )}
        </button>
      </div>

      {mainTab === "friends" && (
        <section className={styles.section}>
          {friendsHubLoading && !friendsList?.length ? (
            <div className={styles.skeletonGrid}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.skeletonCard} />
              ))}
            </div>
          ) : friendsList?.length ? (
            <div className={styles.grid}>
              {friendsList.map((f) => (
                <article
                  key={f.username || f.userId}
                  className={styles.personCard}
                >
                  <div className={styles.personTop}>
                    <div className={styles.avatar} aria-hidden>
                      {avatarLetter(f)}
                    </div>
                    <div className={styles.personMeta}>
                      <div className={styles.personName}>{f.name}</div>
                      <div className={styles.personHandle}>@{f.username}</div>
                    </div>
                  </div>
                  <div className={styles.cardActions}>
                    <Link
                      className={styles.linkBtn}
                      to={`/profile/${encodeURIComponent(f.username)}`}
                    >
                      View profile
                    </Link>
                    <button
                      type="button"
                      className={styles.btnGhost}
                      disabled={friendActionLoading}
                      onClick={() => handleRemove(f.username)}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>👋</div>
              <h2 className={styles.emptyTitle}>No connections yet</h2>
              <p className={styles.emptyText}>
                Search for people in the bar above or open someone&apos;s profile
                and send a request.
              </p>
            </div>
          )}
        </section>
      )}

      {mainTab === "requests" && (
        <div className={styles.requestsLayout}>
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2 className={styles.panelTitle}>Incoming</h2>
              {pendingIncomingCount > 0 && (
                <span className={styles.panelBadge}>{pendingIncomingCount}</span>
              )}
            </div>
            {incoming.length === 0 ? (
              <p className={styles.panelEmpty}>No pending invites.</p>
            ) : (
              <ul className={styles.reqList}>
                {incoming.map((req) => {
                  const other =
                    req.senderUser ||
                    (req.senderUsername
                      ? { username: req.senderUsername, name: req.senderUsername }
                      : null);
                  const id = req._id ? String(req._id) : "";
                  return (
                    <li key={id || req.senderId} className={styles.reqRow}>
                      <div className={styles.reqAvatar} aria-hidden>
                        {avatarLetter(other)}
                      </div>
                      <div className={styles.reqBody}>
                        <div className={styles.reqName}>
                          {other?.name || other?.username || "User"}
                        </div>
                        <div className={styles.reqHandle}>
                          @{other?.username || "—"}
                        </div>
                      </div>
                      <div className={styles.reqActions}>
                        <button
                          type="button"
                          className={styles.btnPrimary}
                          disabled={friendActionLoading || !id}
                          onClick={() => handleRespond(id, "accept")}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className={styles.btnGhost}
                          disabled={friendActionLoading || !id}
                          onClick={() => handleRespond(id, "reject")}
                        >
                          Decline
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2 className={styles.panelTitle}>Sent</h2>
            </div>
            {outgoing.length === 0 ? (
              <p className={styles.panelEmpty}>No outgoing requests.</p>
            ) : (
              <ul className={styles.reqList}>
                {outgoing.map((req) => {
                  const other =
                    req.recipientUser ||
                    (req.recipientUsername
                      ? {
                          username: req.recipientUsername,
                          name: req.recipientUsername,
                        }
                      : null);
                  return (
                    <li key={String(req._id)} className={styles.reqRow}>
                      <div className={styles.reqAvatar} aria-hidden>
                        {avatarLetter(other)}
                      </div>
                      <div className={styles.reqBody}>
                        <div className={styles.reqName}>
                          {other?.name || other?.username || "User"}
                        </div>
                        <div className={styles.reqHandle}>
                          @{other?.username || "—"}
                        </div>
                      </div>
                      <span className={styles.pill}>Pending</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default FriendsPage;
