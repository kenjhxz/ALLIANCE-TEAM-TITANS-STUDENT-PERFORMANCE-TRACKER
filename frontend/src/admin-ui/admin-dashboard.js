  // src/admin-ui/AdminDashboard.js
  import React, { useEffect, useState, useRef } from "react";
  import { useNavigate, Outlet, useLocation, NavLink } from "react-router-dom";
  import { fetchFlags } from '../api';

  export default function AdminDashboard() {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const closeTimeout = useRef(null);
    const [notifOpen, setNotifOpen] = useState(false);
    const notifRef = useRef(null);
    const [notifications, setNotifications] = useState([
      {
        id: 1,
        type: 'info',
        title: 'System Update',
        message: 'System maintenance scheduled for tonight at 10 PM',
        time: '2 hours ago'
      },
      {
        id: 2,
        type: 'warning',
        title: 'Low Storage',
        message: 'Database storage is at 85% capacity',
        time: '1 day ago'
      },
      {
        id: 3,
        type: 'success',
        title: 'Backup Complete',
        message: 'Daily backup completed successfully',
        time: '2 days ago'
      }
    ]);

    useEffect(() => {
      const access = localStorage.getItem("access");
      const isAdmin = localStorage.getItem("is_admin") === "true";
      if (!access || !isAdmin) {
        navigate("/");
      }
    }, [navigate]);

    useEffect(() => {
      return () => {
        if (closeTimeout.current) clearTimeout(closeTimeout.current);
      };
    }, []);

    // Handle click outside notification dropdown
    useEffect(() => {
      const handleClickOutside = (e) => {
        if (notifRef.current && !notifRef.current.contains(e.target)) {
          setNotifOpen(false);
        }
      };
      
      if (notifOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [notifOpen]);

    const handleLogout = () => {
      localStorage.clear();
      navigate("/");
    };

    const handleClearNotifications = () => {
      setNotifications([]);
      setNotifOpen(false);
    };

    const handleRemoveNotification = (id) => {
      setNotifications(notifications.filter(n => n.id !== id));
    };

    const location = useLocation();
    const [flagsCount, setFlagsCount] = useState(0);

    useEffect(() => {
      let mounted = true;
      let timer = null;
      const loadFlags = async () => {
        try {
          const res = await fetchFlags();
          const d = res && res.data;
          let count = 0;
          if (Array.isArray(d)) count = d.length;
          else if (d && typeof d.count === 'number') count = d.count;
          else if (typeof d === 'number') count = d;
          if (mounted) setFlagsCount(count);
        } catch (err) {
          console.warn('Failed to load flags count', err);
        }
      };
      loadFlags();
      // poll every 30 seconds
      timer = setInterval(loadFlags, 30000);
      return () => { mounted = false; if (timer) clearInterval(timer); };
    }, []);

    return (
      <div className="app">
        {/* Sidebar */}
        <div
          onMouseEnter={() => {
            if (closeTimeout.current) {
              clearTimeout(closeTimeout.current);
              closeTimeout.current = null;
            }
            setSidebarOpen(true);
          }}
          onMouseLeave={() => {
            closeTimeout.current = setTimeout(() => setSidebarOpen(false), 150);
          }}
          className={`sidebar ${!sidebarOpen ? 'sidebar-minimized' : ''}`}
          style={{ width: sidebarOpen ? 220 : 50, transition: "width 0.2s", overflow: "hidden" }}
        >
          <div className="sb-logo">
            <div style={{display:'flex',gap:12,alignItems:'center'}}>
              <div className="sb-logomark" style={{flexShrink:0}}>S</div>
              <div style={{display: sidebarOpen ? 'block' : 'none'}}>
                <div className="sb-appname">Admin Panel</div>
                <div className="sb-sub">Management</div>
              </div>
            </div>
          </div>

          <div className="sb-section">
            <div className="sb-section-label">Primary</div>
            <NavLink
              to="/admin-dashboard/students"
              className={({isActive}) => `sb-item ${isActive ? 'active' : ''}`}
            >
              <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="3" stroke="#EFE9E1" strokeWidth="1.2"/><path d="M2 12c0-2.2 2.2-4 5-4s5 1.8 5 4" stroke="#EFE9E1" strokeWidth="1.2" strokeLinecap="round"/></svg>
              {sidebarOpen && "Student Fields"}
            </NavLink>
            <NavLink
              to="/admin-dashboard/teachers"
              className={({isActive}) => `sb-item ${isActive ? 'active' : ''}`}
            >
              <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><circle cx="5" cy="5" r="2.5" stroke="#EFE9E1" strokeWidth="1.2"/><circle cx="10" cy="8" r="2" stroke="#EFE9E1" strokeWidth="1.2"/><path d="M1 12c0-1.7 1.8-3 4-3" stroke="#EFE9E1" strokeWidth="1.1" strokeLinecap="round"/></svg>
              {sidebarOpen && "Professor fields"}
            </NavLink>
            <NavLink
              to="/admin-dashboard/programs"
              className={({isActive}) => `sb-item ${isActive ? 'active' : ''}`}
            >
              <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M7 1L13 4v3c0 3.3-2.5 6-6 7C1 13 1 7 1 7V4l6-3z" stroke="#EFE9E1" strokeWidth="1.2"/></svg>
              {sidebarOpen && "University Degree Programs"}
            </NavLink>
            <NavLink
              to="/admin-dashboard/colleges"
              className={({isActive}) => `sb-item ${isActive ? 'active' : ''}`}
            >
              <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="10" rx="1.5" stroke="#EFE9E1" strokeWidth="1.2"/><path d="M4 6h6M4 9h4" stroke="#EFE9E1" strokeWidth="1.1" strokeLinecap="round"/></svg>
              {sidebarOpen && "University College"}
            </NavLink>
            <NavLink
              to="/admin-dashboard/disciplines"
              className={({isActive}) => `sb-item ${isActive ? 'active' : ''}`}
            >
              <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="12" height="9" rx="1" stroke="#EFE9E1" strokeWidth="1.2"/><path d="M4 1v3M10 1v3M1 6h12" stroke="#EFE9E1" strokeWidth="1.1" strokeLinecap="round"/></svg>
              {sidebarOpen && "Program Disciplines"}
            </NavLink>
          </div>

          <div className="sb-section">
            <div className="sb-section-label">System</div>
              <button
              type="button"
                onClick={() => navigate('/admin-dashboard/flags')}
                className={`sb-item ${location.pathname.includes('/flags') ? 'active' : ''}`}
                aria-current={location.pathname.includes('/flags') ? 'page' : undefined}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M6 3v18" stroke="#EFE9E1" strokeWidth="1.4" strokeLinecap="round"/><path d="M6 6h12l-3 4 3 4H6" stroke="#EFE9E1" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {sidebarOpen && 'Flags & requests'}
                {sidebarOpen && flagsCount > 0 && <span className="sb-badge">{flagsCount}</span>}
              </button>

            <button
              type="button"
              onClick={() => navigate('/admin-dashboard/audit')}
              className={`sb-item ${location.pathname.includes('/audit') ? 'active' : ''}`}
              aria-current={location.pathname.includes('/audit') ? 'page' : undefined}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 2v6" stroke="#EFE9E1" strokeWidth="1.4" strokeLinecap="round"/><path d="M6 10h12" stroke="#EFE9E1" strokeWidth="1.4" strokeLinecap="round"/><path d="M4 20h16" stroke="#EFE9E1" strokeWidth="1.4" strokeLinecap="round"/></svg>
              {sidebarOpen && 'Audit log'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin-dashboard/settings')}
              className={`sb-item ${location.pathname.includes('/settings') ? 'active' : ''}`}
              aria-current={location.pathname.includes('/settings') ? 'page' : undefined}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 8a4 4 0 100 8 4 4 0 000-8z" stroke="#EFE9E1" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M19.4 15a1.8 1.8 0 00.3 2l.1.1a1 1 0 01-1.4 1.4l-.1-.1a1.8 1.8 0 00-2 .3 1.8 1.8 0 00-.5 1.9l-.02.07a1 1 0 01-1.1.7 1 1 0 01-.9-1l.02-.07a1.8 1.8 0 00-1.9-.5 1.8 1.8 0 00-2-.3 1.8 1.8 0 00-.5-1.9l-.02-.07a1 1 0 01-1.1-.7 1 1 0 01.9-1.3l.02.07a1.8 1.8 0 00.5-1.9 1.8 1.8 0 00.3-2l-.05-.1A1 1 0 0112 2a1 1 0 011 1v.1a1.8 1.8 0 001.9.5l.07-.02a1 1 0 011 .9 1 1 0 01-1 1.1l-.07.02a1.8 1.8 0 00-.5 1.9 1.8 1.8 0 00.3 2l.05.1a1 1 0 01.3 1.1 1 1 0 01-1.1.7l-.07-.02a1.8 1.8 0 00-1.9.5z" stroke="#EFE9E1" strokeWidth="0.9" strokeLinecap="round"/></svg>
              {sidebarOpen && 'Settings'}
            </button>
          </div>

          {/* Logout */}
          <div className="sb-bottom">
            <button type="button" onClick={handleLogout} className="sb-item">
              {sidebarOpen && "Logout"}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="main">
          {/* Header with Notifications */}
          <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', position: 'relative'}}>
            <div ref={notifRef} style={{position: 'relative'}}>
              <button
                className="notif-btn"
                onClick={() => setNotifOpen(!notifOpen)}
                aria-label="Notifications"
                title="Notifications"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19.13 16H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 20a2 2 0 0 1-4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {notifications.length > 0 && <div className="notif-dot"></div>}
              </button>

              {/* Notification Dropdown */}
              {notifOpen && (
                <div className="notif-dropdown show">
                  <div className="notif-dropdown-head">
                    <h3>Notifications</h3>
                    {notifications.length > 0 && (
                      <button
                        className="notif-clear-btn"
                        onClick={handleClearNotifications}
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="notif-empty">
                      <p>No notifications</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} className="notif-item">
                        <div className={`notif-icon ${notif.type}`}>
                          {notif.type === 'info' && '📘'}
                          {notif.type === 'warning' && '⚠️'}
                          {notif.type === 'success' && '✓'}
                          {notif.type === 'error' && '❌'}
                        </div>
                        <div className="notif-content">
                          <p className="notif-title">{notif.title}</p>
                          <p className="notif-message">{notif.message}</p>
                          <p className="notif-time">{notif.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          <Outlet />
        </div>
      </div>
    );
  }