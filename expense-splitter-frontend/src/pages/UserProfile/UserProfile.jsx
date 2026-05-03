import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../../api/axios";
import styles from "./UserProfile.module.css";

function UserProfile() {
  const { username: usernameParam } = useParams();
  const username = decodeURIComponent(usernameParam || "").trim();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [profile, setProfile] = useState(null);
  const [relationship, setRelationship] = useState(null);
  const [pendingRequestId, setPendingRequestId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!username) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setNotFound(false);

    try {
      const res = await API.get(
        `/users/profile/${encodeURIComponent(username)}`,
      );
      const payload = res.data?.data;
      setProfile(payload?.profile || null);
      setRelationship(payload?.relationship ?? null);
      setPendingRequestId(payload?.pendingRequestId ?? null);
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true);
        setProfile(null);
        setRelationship(null);
        setPendingRequestId(null);
      } else {
        toast.error(err.response?.data?.message || "Failed to load profile");
      }
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleAddFriend = async () => {
    if (!profile?.username) return;
    setActionLoading(true);
    try {
      const res = await API.post("/users/add-friend", {
        username: profile.username,
      });
      const id = res.data?.data?._id;
      setRelationship("request_sent");
      setPendingRequestId(id ? String(id) : null);
      toast.success(res.data?.message || "Friend request sent");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRespond = async (action) => {
    if (!pendingRequestId) {
      toast.error("Missing request");
      return;
    }
    setActionLoading(true);
    try {
      const res = await API.post("/users/respond-request", {
        requestId: pendingRequestId,
        action,
      });
      toast.success(res.data?.message || "Updated");
      if (action === "accept") {
        await fetchProfile();
      } else {
        setRelationship("none");
        setPendingRequestId(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={`${styles.center} ${styles.card}`}>
          <div className={styles.loadingWrap}>
            <div className={styles.spinner} aria-hidden />
            <p className={styles.selfNote}>Loading profile…</p>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className={styles.page}>
        <div className={styles.center}>
          <Link className={styles.backLink} to="/dashboard">
            ← Back
          </Link>
          <div className={styles.card}>
            <div className={styles.errorCard}>
              <h1 className={styles.errorTitle}>User not found</h1>
              <p className={styles.errorText}>
                There is no profile for{" "}
                <strong>@{username || "this user"}</strong>.
              </p>
              <Link to="/dashboard" className={styles.btnPrimary}>
                Go to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const initial = profile.name?.charAt(0)?.toUpperCase() || "?";

  const renderFriendActions = () => {
    if (relationship === "self") {
      return <p className={styles.selfNote}>This is your profile</p>;
    }
    if (relationship === "friends") {
      return (
        <span className={styles.badgeFriends} role="status">
          Friends
        </span>
      );
    }
    if (relationship === "request_sent") {
      return (
        <button type="button" className={styles.btnPrimary} disabled>
          Request Sent
        </button>
      );
    }
    if (relationship === "request_received") {
      return (
        <>
          <button
            type="button"
            className={styles.btnPrimary}
            disabled={actionLoading}
            onClick={() => handleRespond("accept")}
          >
            Accept
          </button>
          <button
            type="button"
            className={styles.btnDanger}
            disabled={actionLoading}
            onClick={() => handleRespond("reject")}
          >
            Reject
          </button>
        </>
      );
    }
    return (
      <button
        type="button"
        className={styles.btnPrimary}
        disabled={actionLoading}
        onClick={handleAddFriend}
      >
        Add Friend
      </button>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.center}>
        <Link className={styles.backLink} to="/dashboard">
          ← Back
        </Link>
        <div className={styles.card}>
          <div className={styles.avatar} aria-hidden>
            {initial}
          </div>
          <h1 className={styles.name}>{profile.name}</h1>
          <p className={styles.username}>
            <code>@{profile.username}</code>
          </p>

          <div className={styles.meta}>
            {(relationship === "self" || relationship === "friends") &&
              profile.userId && (
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>User ID</span>
                  <span className={styles.metaValue}>
                    <code className={styles.idCode}>{profile.userId}</code>
                  </span>
                </div>
              )}
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Email</span>
              <span className={styles.metaValue}>
                {profile.email ? (
                  profile.email
                ) : (
                  <span className={styles.muted}>
                    Hidden until you are friends
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className={styles.actions}>{renderFriendActions()}</div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
