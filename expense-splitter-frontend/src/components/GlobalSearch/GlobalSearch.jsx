import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { searchUsers, clearSearchResults } from "../../features/user/userSlice";
import {
  searchGroups,
  clearSearchResults as clearGroupSearch,
} from "../../features/group/groupSlice";
import styles from "./GlobalSearch.module.css";

function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // all, users, groups
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const { searchResults: userResults, searchLoading: userLoading } =
    useSelector((state) => state.user);
  const { searchResults: groupResults, searchLoading: groupLoading } =
    useSelector((state) => state.group);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        setShowDropdown(true);
        dispatch(searchUsers(query));
        dispatch(searchGroups(query));
      } else {
        setShowDropdown(false);
        dispatch(clearSearchResults());
        dispatch(clearGroupSearch());
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, dispatch]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle user selection
  const handleSelectUser = (user) => {
    const uname = user.username;
    if (!uname) {
      return;
    }
    navigate(`/profile/${encodeURIComponent(uname)}`);
    setQuery("");
    setShowDropdown(false);
    dispatch(clearSearchResults());
  };

  // Handle group selection
  const handleSelectGroup = (group) => {
    navigate(`/group/${group.groupId || group.id}`);
    setQuery("");
    setShowDropdown(false);
    dispatch(clearGroupSearch());
  };

  const isLoading = userLoading || groupLoading;
  const hasResults = userResults?.length > 0 || groupResults?.length > 0;

  // Filter results based on tab
  const filteredUsers =
    activeTab === "all" || activeTab === "users" ? userResults : [];
  const filteredGroups =
    activeTab === "all" || activeTab === "groups" ? groupResults : [];

  return (
    <div className={styles.searchContainer} ref={dropdownRef}>
      <div className={styles.searchInputWrapper}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search users or groups..."
          className={styles.searchInput}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setShowDropdown(true)}
        />
        <span className={styles.searchIcon}>🔍</span>
      </div>

      {/* Search Dropdown */}
      {showDropdown && (
        <div className={styles.dropdown}>
          {isLoading ? (
            <div className={styles.loadingState}>
              <span className={styles.spinner}></span>
              <p>Searching...</p>
            </div>
          ) : !hasResults ? (
            <div className={styles.emptyState}>
              <p>No results found</p>
            </div>
          ) : (
            <>
              {/* Tabs */}
              {userResults?.length > 0 && groupResults?.length > 0 && (
                <div className={styles.tabs}>
                  <button
                    className={`${styles.tab} ${activeTab === "all" ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab("all")}
                  >
                    All
                  </button>
                  <button
                    className={`${styles.tab} ${activeTab === "users" ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab("users")}
                  >
                    Users
                  </button>
                  <button
                    className={`${styles.tab} ${activeTab === "groups" ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab("groups")}
                  >
                    Groups
                  </button>
                </div>
              )}

              {/* Users Section */}
              {filteredUsers?.length > 0 && (
                <div className={styles.section}>
                  {activeTab === "all" && (
                    <h4 className={styles.sectionTitle}>Users</h4>
                  )}
                  <div className={styles.resultsList}>
                    {filteredUsers.map((user) => (
                      <button
                        key={user.username || user.userId || user.id}
                        type="button"
                        className={styles.resultItem}
                        onClick={() => handleSelectUser(user)}
                        disabled={!user.username}
                      >
                        <div className={styles.resultAvatar}>
                          {user.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className={styles.resultInfo}>
                          <div className={styles.resultName}>{user.name}</div>
                          <div className={styles.resultMeta}>
                            @{user.username || "—"}
                          </div>
                        </div>
                        <span className={styles.resultIcon}>→</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Groups Section */}
              {filteredGroups?.length > 0 && (
                <div className={styles.section}>
                  {activeTab === "all" && (
                    <h4 className={styles.sectionTitle}>Groups</h4>
                  )}
                  <div className={styles.resultsList}>
                    {filteredGroups.map((group) => (
                      <button
                        key={group.groupId || group.id}
                        className={styles.resultItem}
                        onClick={() => handleSelectGroup(group)}
                      >
                        <div
                          className={styles.resultAvatar}
                          style={{ background: "var(--accent-primary)" }}
                        >
                          👥
                        </div>
                        <div className={styles.resultInfo}>
                          <div className={styles.resultName}>{group.name}</div>
                          <div className={styles.resultMeta}>
                            {group.memberCount || group.members?.length || 0}{" "}
                            members
                          </div>
                        </div>
                        <span className={styles.resultIcon}>→</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
