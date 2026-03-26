  // src/admin-ui/AdminDashboard.js
  import React, { useEffect, useState } from "react";
  import { useNavigate, Outlet } from "react-router-dom";

  export default function AdminDashboard() {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
      const access = localStorage.getItem("access");
      const isAdmin = localStorage.getItem("is_admin") === "true";
      if (!access || !isAdmin) {
        navigate("/"); 
      }
    }, [navigate]);

    const handleLogout = () => {
      localStorage.clear();
      navigate("/"); 
    };

    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        {/* Sidebar */}
        <div
          onMouseEnter={() => setSidebarOpen(true)}
          onMouseLeave={() => setSidebarOpen(false)}
          style={{
            width: sidebarOpen ? 220 : 50,
            backgroundColor: "#1f2937",
            color: "#fff",
            transition: "width 0.2s",
            padding: "20px 10px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              marginBottom: 30,
              fontSize: sidebarOpen ? 20 : 0,
              transition: "font-size 0.2s",
            }}
          >
            Admin Panel
          </h2>

          {/* Sidebar Buttons */}
          <button
            onClick={() => navigate("/admin/student")}
            style={{
              marginBottom: 15,
              padding: 10,
              backgroundColor: "#6ac56b",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              width: "100%",
              whiteSpace: "nowrap",
            }}
          >
            {sidebarOpen && "Student Fields"}
          </button>
          <button
            onClick={() => navigate("/admin/teacher")}
            style={{
              marginBottom: 15,
              padding: 10,
              backgroundColor: "#6ac56b",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              width: "100%",
              whiteSpace: "nowrap",
            }}
          >
            {sidebarOpen && "Professor fields"}
          </button>
          <button
            onClick={() => navigate("/admin-dashboard/programs/")}
            style={{
              marginBottom: 15,
              padding: 10,
              backgroundColor: "#6ac56b",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              width: "100%",
              whiteSpace: "nowrap",
            }}
          >
            {sidebarOpen && "University Degree Programs"}
          </button>

          <button
            onClick={() => navigate("/admin-dashboard/colleges/")}
            style={{
              marginBottom: 15,
              padding: 10,
              backgroundColor: "#6ac56b",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              width: "100%",
              whiteSpace: "nowrap",
            }}
          >
            {sidebarOpen && "University College"}
          </button>

          <button
            onClick={() => navigate("/admin-dashboard/disciplines/")}
            style={{
              marginBottom: 15,
              padding: 10,
              backgroundColor: "#6ac56b",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              width: "100%",
              whiteSpace: "nowrap",
            }}
          >
            {sidebarOpen && "Program Disciplines"}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              marginTop: "auto",
              padding: 10,
              backgroundColor: "#ef4444",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              width: "100%",
            }}
          >
            {sidebarOpen && "Logout"}
          </button>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: 30 }}>
          {/* Replace static content with Outlet to render child routes */}
          <Outlet />
        </div>
      </div>
    );
  }