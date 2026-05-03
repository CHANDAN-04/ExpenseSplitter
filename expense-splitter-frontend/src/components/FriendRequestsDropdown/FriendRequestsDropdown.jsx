import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  loadFriendsHub,
  respondFriendRequest,
} from "../../features/user/userSlice";
import styles from "./FriendRequestsDropdown.module.css";

function initial(name, username) {
  const s = name || username || "?";
  return String(s).charAt(0).toUpperCase();
}

function FriendRequestsDropdown() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);

  const { friendRequestsReceived, pendingIncomingCount, friendActionLoading } =
    useSelector((state) => state.user);

  useEffect(() => {
    dispatch(loadFriendsHub());
  }, [dispatch]);

  useEffect(() => {
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const incoming = friendRequestsReceived || [];
  const preview = incoming.slice(0, 5);
  const count = pendingIncomingCount ?? incoming.length;

  const handleAccept = async (e, requestId) => {
    e.preventDefault();
    e.stopPropagation();
    const rid = requestId ? String(requestId) : "";
    if (!rid) return;
    try {
      await dispatch(
        respondFriendRequest({ requestId: rid, action: "accept" }),
      ).unwrap();
      toast.success("Connected");
      setOpen(false);
    } catch (msg) {
      toast.error(typeof msg === "string" ? msg : "Failed");
    }
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.bellBtn}
        aria-expanded={open}
        aria-haspopup="true"
        title="Friend requests"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.bellIcon} aria-hidden>
          🔔
        </span>
        {count > 0 && (
          <span className={styles.badge}>
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className={styles.dropdown} role="menu">
          <div className={styles.dropdownHead}>
            <span className={styles.dropdownTitle}>Requests</span>
            <Link
              to="/friends"
              className={styles.seeAll}
              onClick={() => setOpen(false)}
            >
              Open hub
            </Link>
          </div>

          {preview.length === 0 ? (
            <p className={styles.empty}>You&apos;re all caught up.</p>
          ) : (
            <ul className={styles.list}>
              {preview.map((req) => {
                const other = req.senderUser || {
                  username: req.senderUsername,
                  name: req.senderUsername,
                };
                const id = req._id ? String(req._id) : "";
                return (
                  <li key={id || req.senderId} className={styles.row}>
                    <div className={styles.avatar} aria-hidden>
                      {initial(other?.name, other?.username)}
                    </div>
                    <div className={styles.rowBody}>
                      <div className={styles.rowName}>
                        {other?.name || other?.username || "Member"}
                      </div>
                      <div className={styles.rowMeta}>
                        @{other?.username || "—"}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={styles.acceptMini}
                      disabled={friendActionLoading || !id}
                      onClick={(e) => handleAccept(e, id)}
                    >
                      Accept
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {incoming.length > 5 && (
            <button
              type="button"
              className={styles.footerBtn}
              onClick={() => {
                setOpen(false);
                navigate("/friends");
              }}
            >
              View all ({incoming.length})
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default FriendRequestsDropdown;
