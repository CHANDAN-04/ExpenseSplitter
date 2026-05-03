import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import styles from "./Layout.module.css";

function resolveNavTitle(pathname, explicitTitle) {
  if (explicitTitle) return explicitTitle;
  const map = {
    "/dashboard": "Dashboard",
    "/groups": "Groups",
    "/friends": "People",
    "/profile": "Profile",
    "/settings": "Settings",
  };
  if (map[pathname]) return map[pathname];
  if (pathname.startsWith("/group/")) return "Group";
  if (pathname.startsWith("/profile/") && pathname !== "/profile")
    return "Member";
  return "Splitter";
}

function Layout({ title: titleProp }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = resolveNavTitle(location.pathname, titleProp);

  return (
    <div className={styles.layoutContainer}>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        {/* Navbar */}
        <Navbar
          title={title}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Content */}
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Layout;
