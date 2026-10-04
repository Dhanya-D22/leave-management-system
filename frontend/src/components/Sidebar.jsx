import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const iconPaths = {
  dashboard: "M3 3h8v8H3z M13 3h8v5h-8z M13 10h8v11h-8z M3 13h8v8H3z",
  apply: "M12 5v14 M5 12h14",
  history: "M3 12a9 9 0 1 0 2.64-6.36L3 8 M3 3v5h5 M12 7v5l3 2",
  balance: "M4 5h16v15H4z M4 9h16 M8 15h4",
  requests: "M7 3h10v3h3v15H4V6h3z M8 13l2.5 2.5L16 10",
  employees: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
};

function SidebarIcon({ name }) {
  return (
    <svg
      className="sidebar-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={iconPaths[name]} />
    </svg>
  );
}

function Sidebar({ mobileOpen, setMobileOpen }) {
  const { user } = useAuth();

  const employeeLinks = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: "⌂",
    },
    {
      path: "/apply-leave",
      label: "Apply Leave",
      icon: "＋",
    },
    {
      path: "/leave-history",
      label: "Leave History",
      icon: "▤",
    },
    {
      path: "/leave-balance",
      label: "Leave Balance",
      icon: "◫",
    },
  ];

  const adminLinks = [
    {
      path: "/admin/dashboard",
      label: "Dashboard",
      icon: "⌂",
    },
    {
      path: "/admin/requests",
      label: "Leave Requests",
      icon: "▤",
    },
    {
      path: "/admin/employees",
      label: "Employees",
      icon: "♙",
    },
  ];

  const links = user?.role === "ADMIN" ? adminLinks : employeeLinks;
  const iconByPath = {
    "/dashboard": "dashboard",
    "/apply-leave": "apply",
    "/leave-history": "history",
    "/leave-balance": "balance",
    "/admin/dashboard": "dashboard",
    "/admin/requests": "requests",
    "/admin/employees": "employees",
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        ></div>
      )}

      <aside
        className={`sidebar ${
          mobileOpen ? "sidebar-mobile-open" : ""
        }`}
      >
        <div className="sidebar-logo">
          <div className="logo-icon" aria-hidden="true"><span>L</span><i></i></div>

          <div>
            <h2>LeaveFlow</h2>
            <span>Management System</span>
          </div>
        </div>

        <div className="sidebar-section-title">
          <span>{user?.role === "ADMIN" ? "ADMIN WORKSPACE" : "EMPLOYEE WORKSPACE"}</span>
          <span className="sidebar-section-line"></span>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <span className="sidebar-icon-wrap">
                <SidebarIcon name={iconByPath[link.path]} />
              </span>
              <span className="sidebar-link-label">{link.label}</span>
              <span className="sidebar-link-arrow" aria-hidden="true">›</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <div className="help-icon">?</div>

            <div>
              <strong>Need help?</strong>
              <p>Contact your administrator</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
