import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

function Navbar({ setMobileOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchNotifications = async () => {
      try {
        const response = await api.get("/notifications");
        if (active) {
          setNotifications(response.data.notifications || []);
          setUnreadCount(Number(response.data.unreadCount || 0));
        }
      } catch (error) {
        console.error("Unable to load notifications", error);
      }
    };

    fetchNotifications();
    const intervalId = window.setInterval(fetchNotifications, 30000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const openNotification = async (notification) => {
    if (!notification.read_at) {
      try {
        await api.put(`/notifications/${notification.id}/read`);
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch (error) {
        console.error("Unable to mark notification as read", error);
      }
    }

    setNotifications((current) =>
      current.filter((item) => item.id !== notification.id)
    );
    setNotificationsOpen(false);
    setProfileMenuOpen(false);
    navigate(notification.link);
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          className="mobile-menu-button"
          onClick={() => setMobileOpen(true)}
        >
          ☰
        </button>

        <div>
          <h1>
            Welcome back, {user?.name?.split(" ")[0]}!
          </h1>

          <p>
            Here's what's happening with your leave today.
          </p>
        </div>
      </div>

      <div className="navbar-right">
        <div className="notification">
          <button
            type="button"
            className="notification-trigger"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen((open) => !open)}
          >
            🔔
            {unreadCount > 0 && (
              <span className="notification-count">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="notification-panel" role="dialog" aria-label="Notifications">
              <div className="notification-panel-header">
                <strong>Notifications</strong>
                <span>{unreadCount} unread</span>
              </div>
              {notifications.length === 0 ? (
                <div className="notification-empty">You’re all caught up.</div>
              ) : (
                <div className="notification-list">
                  {notifications.map((notification) => (
                    <button
                      type="button"
                      className={`notification-item${notification.read_at ? "" : " notification-unread"}`}
                      key={notification.id}
                      onClick={() => openNotification(notification)}
                    >
                      <strong>{notification.title}</strong>
                      <span>{notification.message}</span>
                      <small>
                        {new Date(notification.created_at).toLocaleString()}
                      </small>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="user-menu">
          <button
            type="button"
            className="user-profile user-profile-trigger"
            aria-label={`Open profile menu for ${user?.name || "your account"}`}
            aria-expanded={profileMenuOpen}
            onClick={() => {
              setProfileMenuOpen((open) => !open);
              setNotificationsOpen(false);
            }}
          >
            <span className="avatar" aria-hidden="true">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
            <span className="user-info">
              <strong>{user?.name}</strong>
              <small>{user?.role}</small>
            </span>
          </button>

          {profileMenuOpen && (
            <div className="profile-menu" role="menu">
              <div className="profile-menu-heading">
                <strong>{user?.name}</strong>
                <small>{user?.role}</small>
              </div>
              <button
                type="button"
                className="profile-logout-button"
                role="menuitem"
                onClick={() => {
                  if (window.confirm("Are you sure you want to log out?")) {
                    setProfileMenuOpen(false);
                    logout();
                    navigate("/login");
                  }
                }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
</div>
    </header>
  );
}

export default Navbar;
