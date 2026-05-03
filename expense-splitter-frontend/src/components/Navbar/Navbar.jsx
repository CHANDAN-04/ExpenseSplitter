import { useSelector } from "react-redux";
import { useTheme } from "../../context/ThemeContext";
import GlobalSearch from "../GlobalSearch/GlobalSearch";
import FriendRequestsDropdown from "../FriendRequestsDropdown/FriendRequestsDropdown";
import styles from "./Navbar.module.css";

function Navbar({ title, onMenuToggle }) {
  const currentUser = useSelector((state) => state.auth.user);
  const { darkMode, setDarkMode } = useTheme();

  return (
    <nav className={styles.navbar}>
      {/* Left Section - Menu & Title */}
      <div className={styles.navLeft}>
        <button onClick={onMenuToggle} className={styles.menuBtn}>
          ☰
        </button>
        <h1 className={styles.pageTitle}>{title}</h1>
      </div>

      {/* Center - Global Search */}
      <div className={styles.navCenter}>
        <GlobalSearch />
      </div>

      {/* Right Section - Requests, Theme Toggle & User */}
      <div className={styles.navRight}>
        <FriendRequestsDropdown />
        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={styles.themeToggle}
          title={darkMode ? "Light Mode" : "Dark Mode"}
        >
          <span>{darkMode ? "☀️" : "🌙"}</span>
        </button>

        {/* User Avatar */}
        {currentUser && (
          <div className={styles.userAvatar}>
            <span className={styles.avatarInitials}>
              {currentUser.name
                ? currentUser.name.charAt(0).toUpperCase()
                : "U"}
            </span>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
