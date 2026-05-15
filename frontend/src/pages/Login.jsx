import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../services/api";
import Logo from "../assets/Logo.png";

const initialForm = { email: "", password: "" };

export default function Login({ preferredRole }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.email)
      e.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      e.email = "Enter a valid email.";
    if (!form.password)
      e.password = "Password is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (event) => {
    event?.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await login(form);
      const role = data.user?.role;

      if (preferredRole && role !== preferredRole) {
        setErrors({ password: `This account is not a ${preferredRole.toLowerCase()} account.` });
        return;
      }

      if (role === "STUDENT") navigate("/studenthome");
      else if (role === "PROFESSOR") navigate("/teacherhome");
      else if (role === "ADMIN") navigate("/adminhome");
      else navigate("/");

    } catch (err) {
      const responseData = err.response?.data;
      const msg =
        responseData?.non_field_errors?.[0] ||
        responseData?.detail ||
        responseData?.error ||
        responseData?.message ||
        "Invalid email or password.";

      if (responseData) setErrors({ password: msg });
      else setErrors({ password: "Connection failed. Is Django running?" });
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = preferredRole === "STUDENT" ? "Student" : preferredRole === "PROFESSOR" ? "Professor" : preferredRole === "ADMIN" ? "Admin" : null;

  return (
    <div className="login-shell">
      <style>{`
        html, body { height: 100%; overflow: hidden; scrollbar-width: none; -ms-overflow-style: none; }
        body::-webkit-scrollbar, html::-webkit-scrollbar { width: 0; height: 0; }
      `}</style>
      <div className="login-card">
        <Link to="/">
          <img className="brand-logo" src={Logo} alt="Alliance Team Titans logo" />
        </Link>
        <div className="login-title">Login</div>
        <div className="login-sub">
          {roleLabel ? `${roleLabel} access` : 'Access your account'}
        </div>

        <div className="role-group" style={{ marginBottom: '1rem' }}>
          <Link className={`role-btn ${preferredRole === 'STUDENT' ? 'role-active' : ''}`} to="/login/student">🎒 Student</Link>
          <Link className={`role-btn ${preferredRole === 'PROFESSOR' ? 'role-active' : ''}`} to="/login/teacher">📖 Professor</Link>
          <Link className={`role-btn ${preferredRole === 'ADMIN' ? 'role-active' : ''}`} to="/login/admin">🛡️ Admin</Link>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label">Email</label>
            <div className="login-input">
              <span className="login-icon">@</span>
              <input
                className={`login-text ${errors.email ? "finput-error" : ""}`}
                type="email"
                placeholder="you@email.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
            {errors.email && <span className="error-msg">{errors.email}</span>}
          </div>

          <div className="login-field">
            <label className="login-label">Password</label>
            <div className="login-input">
              <span className="login-icon">*</span>
              <input
                className={`login-text ${errors.password ? "finput-error" : ""}`}
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
              />
            </div>
            {errors.password && <span className="error-msg">{errors.password}</span>}
          </div>

          <button
            className="btn-primary"
            type="submit"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <button
          className="btn-secondary"
          type="button"
          onClick={() => setForm(initialForm)}
          disabled={loading}
            style={{ marginTop: 8, width: '100%' }}
        >
            Clear
        </button>

        <p className="footer-text" style={{ marginTop: "0.6rem" }}>
          <Link to="/forgot-password" className="link">Forgot password?</Link>
        </p>

        <div className="or-line">or</div>

        <p className="footer-text">
          No account yet?{" "}
          <Link to="/signup" className="link">Sign up free</Link>
        </p>
        <p className="footer-text" style={{ marginTop: "0.4rem" }}>
          Didn't get the email?{" "}
          <Link to="/verify-email/resend" className="link">Resend verification</Link>
        </p>
      </div>
    </div>
  );
}
