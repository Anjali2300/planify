import { useNavigate, useLocation } from "react-router-dom";
import styles from "./Sidebar.module.css";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // safely get user from localStorage
  let user = {};
  try {
    const stored = localStorage.getItem("user");
    if (stored && stored !== "undefined") {
      user = JSON.parse(stored);
    }
  } catch (e) {
    user = {};
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const navItems = [
    { icon: "🏠", label: "Dashboard", path: "/dashboard" },
  ];

  return (
    <div className={styles.sidebar}>

      {/* BRAND */}
      <div className={styles.brand}>
        <div className={styles.brandIcon}>📋</div>
        <span className={styles.brandName}>Planify</span>
      </div>

      {/* NAV ITEMS */}
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <button
            key={item.path}
            className={
              location.pathname === item.path
                ? styles.navItemActive
                : styles.navItem
            }
            onClick={() => navigate(item.path)}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className={styles.spacer}></div>

      {/* USER INFO */}
      <div className={styles.userSection}>
        <div className={styles.userAvatar}>
          {user.name ? user.name.charAt(0).toUpperCase() : "U"}
        </div>
        <div className={styles.userInfo}>
          <p className={styles.userName}>{user.name || "User"}</p>
          <p className={styles.userRole}>Member</p>
        </div>
      </div>

      {/* LOGOUT */}
      <button className={styles.logoutBtn} onClick={handleLogout}>
        <span>→</span>
        <span>Logout</span>
      </button>

    </div>
  );
}

export default Sidebar;
