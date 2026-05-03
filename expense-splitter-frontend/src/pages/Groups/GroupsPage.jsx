import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getGroups, createGroup } from "../../features/group/groupSlice";
import CreateGroupModal from "../../components/CreateGroupModal/CreateGroupModal";
import styles from "./GroupsPage.module.css";

function GroupsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [openGroupModal, setOpenGroupModal] = useState(false);

  const { groups, loading } = useSelector((state) => state.group);
  const currentUser = useSelector((state) => state.auth.user);

  useEffect(() => {
    dispatch(getGroups());
  }, [dispatch]);

  const handleCreateGroup = () => {
    setOpenGroupModal(true);
  };

  const handleGroupClick = (groupId) => {
    navigate(`/group/${groupId}`);
  };

  return (
    <div className={styles.container}>
      {/* 🔝 HEADER */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Your Groups</h1>
          <p className={styles.subtitle}>
            {groups?.length || 0} group{groups?.length !== 1 ? "s" : ""}
          </p>
        </div>

        <button onClick={handleCreateGroup} className={styles.createBtn}>
          <span className={styles.createIcon}>+</span>
          Create Group
        </button>
      </div>

      <CreateGroupModal
        isOpen={openGroupModal}
        onClose={() => setOpenGroupModal(false)}
      />

      {/* 📊 GROUPS GRID */}
      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading groups...</p>
        </div>
      ) : groups?.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>👥</div>
          <h2>No groups yet</h2>
          <p>Create your first group to start splitting expenses</p>
          <button onClick={handleCreateGroup} className={styles.emptyBtn}>
            Create Group
          </button>
        </div>
      ) : (
        <div className={styles.groupsGrid}>
          {groups.map((group) => (
            <div
              key={group.groupId}
              className={styles.groupCard}
              onClick={() => handleGroupClick(group.groupId)}
            >
              <div className={styles.cardHeader}>
                <div className={styles.groupIcon}>👥</div>
                <div className={styles.groupMeta}>
                  <span className={styles.memberCount}>
                    {group.memberCount ??
                      group.members?.length ??
                      0}{" "}
                    members
                  </span>
                </div>
              </div>

              <div className={styles.cardBody}>
                <h3 className={styles.groupName}>{group.name}</h3>
                {group.description && (
                  <p className={styles.groupDescription}>{group.description}</p>
                )}
              </div>

              <div className={styles.cardFooter}>
                <button className={styles.viewBtn}>View Details →</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GroupsPage;
