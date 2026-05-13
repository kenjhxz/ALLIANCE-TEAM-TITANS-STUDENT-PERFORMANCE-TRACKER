import { Link } from 'react-router-dom';
import Logo from '../assets/Logo.png';

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
    <div style={{ minHeight: '100vh', background: 'var(--app-bg-gradient)', color: 'var(--app-text)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '36px 24px 24px', fontFamily: "'Space Grotesk', 'DM Sans', 'Segoe UI', sans-serif", overflow: 'hidden', scrollbarWidth: 'none' }}>
      <style>{`
        html, body { height: 100%; overflow: hidden; scrollbar-width: none; -ms-overflow-style: none; }
        body::-webkit-scrollbar, html::-webkit-scrollbar { width: 0; height: 0; }
      `}</style>
      <div style={{ width: 'min(1040px, 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, marginTop: 28 }}>
        <div style={{ textAlign: 'center', maxWidth: 720 }}>
          <img src={Logo} alt="Alliance Team Titans logo" style={{ width: 56, height: 56, marginBottom: 10 }} />
          <div style={{ textTransform: 'uppercase', letterSpacing: '0.24em', color: 'var(--app-muted)', fontSize: 12, marginBottom: 8 }}>Alliance Team Titans</div>
          <h1 style={{ margin: '0 0 10px', fontSize: 'clamp(2rem, 5vw, 3.4rem)', lineHeight: 1.05 }}>Student Performance Tracker</h1>
          <p style={{ margin: 0, color: 'var(--app-muted)', fontSize: 16 }}>Choose the login path that matches your role.</p>
        </div>

        <div style={{ width: '100%', display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', alignItems: 'stretch', marginTop: 6 }}>
          {cards.map((card) => (
            <Link key={card.title} to={card.to} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ height: '100%', padding: 26, borderRadius: 20, border: '1px solid var(--app-border)', background: 'var(--app-card)', boxShadow: 'var(--app-shadow-lg)', textAlign: 'center', display: 'flex', flexDirection: 'column', backdropFilter: 'blur(14px)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: card.accent, boxShadow: `0 0 18px ${card.accent}`, margin: '0 auto 16px' }} />
                <h2 style={{ margin: '0 0 10px', fontSize: 22 }}>{card.title}</h2>
                <p style={{ margin: '0 0 22px', color: 'var(--app-muted)', lineHeight: 1.5, flexGrow: 1 }}>{card.desc}</p>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: card.accent, fontWeight: 600, marginTop: 'auto' }}>Continue →</span>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Link to="/signup" style={{ color: 'var(--app-text)', textDecoration: 'underline', textUnderlineOffset: 4 }}>Create a new account</Link>
        </div>
      </div>
    </div>
  );
}
