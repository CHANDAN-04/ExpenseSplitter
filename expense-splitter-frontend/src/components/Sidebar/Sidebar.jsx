import { NavLink, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import styles from "./Sidebar.module.css";

function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);

  // Menu items with sections
  const menuSections = [
    {
      label: "MAIN",
      items: [
        { label: "Dashboard", path: "/dashboard", icon: "📊" },
        { label: "Groups", path: "/groups", icon: "👥" },
      ],
    },
    {
      label: "PERSONAL",
      items: [
        { label: "People", path: "/friends", icon: "🤝" },
        { label: "Profile", path: "/profile", icon: "👤" },
        { label: "Settings", path: "/settings", icon: "⚙️" },
      ],
    },
  ];

  // Check if route matches
  const isRouteActive = (path) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    if (path === "/groups")
      return (
        location.pathname === "/groups" ||
        location.pathname.startsWith("/group/")
      );
    if (path === "/friends") return location.pathname === "/friends";
    if (path === "/profile")
      return (
        location.pathname === "/profile" ||
        location.pathname.startsWith("/profile/")
      );
    if (path === "/settings") return location.pathname === "/settings";
    return false;
  };

  // Handle logout
  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("token");
    onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className={styles.overlay} onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}
      >
        {/* Logo Section */}
        <div className={styles.logoSection}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>💰</span>
            <span className={styles.logoText}>Splitter</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {menuSections.map((section) => (
            <div key={section.label} className={styles.navSection}>
              <div className={styles.sectionLabel}>{section.label}</div>
              {section.items.map((item) => {
                const isActive = isRouteActive(item.path);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={`${styles.navItem} ${
                      isActive ? styles.navItemActive : ""
                    }`}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    <span className={styles.navLabel}>{item.label}</span>
                    {isActive && <span className={styles.activeIndicator} />}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Divider */}
        <div className={styles.divider} />

        {/* User Profile Section */}
        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              <span className={styles.avatarText}>
                {currentUser?.name
                  ? currentUser.name.charAt(0).toUpperCase()
                  : "U"}
              </span>
            </div>
            <div className={styles.userDetails}>
              <div className={styles.userName}>
                {currentUser?.name || "User"}
              </div>
              <div className={styles.userEmail}>
                {currentUser?.username
                  ? `@${currentUser.username}`
                  : currentUser?.email || ""}
              </div>
            </div>
          </div>
          <button
            className={styles.logoutBtn}
            title="Logout"
            onClick={handleLogout}
          >
            <span className={styles.logoutIcon}>→</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
