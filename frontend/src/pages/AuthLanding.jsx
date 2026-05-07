import { Link } from 'react-router-dom';

const cards = [
  {
    title: 'Student Login',
    desc: 'Open your student dashboard, grades, enrollment, and export tools.',
    to: '/login/student',
    accent: '#4ade80',
  },
  {
    title: 'Professor Login',
    desc: 'Access the teacher dashboard to post and edit grades by term.',
    to: '/login/teacher',
    accent: '#38bdf8',
  },
  {
    title: 'Admin Login',
    desc: 'Manage users, programs, offerings, and enrollment queues.',
    to: '/login/admin',
    accent: '#f59e0b',
  },
];

export default function AuthLanding() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0f1117 0%, #121827 100%)', color: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ width: 'min(980px, 100%)' }}>
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{ textTransform: 'uppercase', letterSpacing: '0.24em', color: '#94a3b8', fontSize: 12 }}>Alliance Team Titans</div>
          <h1 style={{ margin: '12px 0 8px', fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}>Student Performance Tracker</h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: 16 }}>Choose the login path that matches your role.</p>
        </div>

        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {cards.map((card) => (
            <Link key={card.title} to={card.to} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ height: '100%', padding: 24, borderRadius: 18, border: '1px solid #2a3050', background: 'rgba(24, 28, 39, 0.95)', boxShadow: '0 12px 40px rgba(0,0,0,0.22)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: card.accent, boxShadow: `0 0 18px ${card.accent}`, marginBottom: 18 }} />
                <h2 style={{ margin: '0 0 10px', fontSize: 22 }}>{card.title}</h2>
                <p style={{ margin: '0 0 20px', color: '#94a3b8', lineHeight: 1.5 }}>{card.desc}</p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: card.accent, fontWeight: 600 }}>Continue →</span>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/signup" style={{ color: '#e2e8f0', textDecoration: 'underline', textUnderlineOffset: 4 }}>Create a new account</Link>
        </div>
      </div>
    </div>
  );
}
