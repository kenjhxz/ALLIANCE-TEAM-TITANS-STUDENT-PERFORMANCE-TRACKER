import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  getStudentProfile,
  updateStudentProfile,
  getMyProspectus,
  submitDisciplineRequest,
  getApprovedForSchedule,
  selectSchedule,
  fetchTerms,
  getMyGrades,
  exportMyGrades,
} from '../services/api';

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  root: {
    display: 'flex', minHeight: '100vh',
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    background: '#0f1117', color: '#e2e8f0',
  },
  sidebar: {
    width: 220, minHeight: '100vh', background: '#181c27',
    borderRight: '1px solid #2a3050', display: 'flex',
    flexDirection: 'column', padding: '28px 16px', gap: 6, flexShrink: 0,
  },
  logo: {
    fontFamily: 'monospace', fontSize: 12, color: '#4ade80',
    letterSpacing: '0.08em', marginBottom: 28, paddingLeft: 4,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  logoDot: { width: 8, height: 8, background: '#4ade80', borderRadius: '50%', boxShadow: '0 0 8px #4ade80', flexShrink: 0 },
  navLabel: {
    fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: '#64748b',
    textTransform: 'uppercase', padding: '0 10px', margin: '12px 0 4px',
  },
  pillBtn: (active) => ({
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
    borderRadius: 50, border: active ? '1px solid #4ade80' : '1px solid transparent',
    background: active ? '#1a3a2a' : 'transparent',
    color: active ? '#4ade80' : '#94a3b8', fontSize: 13.5, fontWeight: 500,
    cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'inherit', transition: 'all 0.18s',
  }),
  sidebarFooter: {
    marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #2a3050',
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  main: { flex: 1, overflowY: 'auto', padding: '36px 40px', display: 'flex', flexDirection: 'column', gap: 24 },
  pageTitle: { fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' },
  pageSub:   { fontSize: 13, color: '#64748b', marginTop: 4 },
  panels:    { display: 'flex', gap: 20, flexWrap: 'wrap' },
  panel: {
    background: '#181c27', border: '1px solid #2a3050', borderRadius: 10,
    padding: 24, flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 14,
  },
  panelTitle: {
    fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
    color: '#4ade80', display: 'flex', alignItems: 'center', gap: 6,
  },
  hint:  { fontSize: 12, color: '#64748b', marginTop: -8, lineHeight: 1.5 },
  label: { display: 'block', fontSize: 11, fontWeight: 500, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 5 },
  input: {
    width: '100%', background: '#1e2335', border: '1px solid #2a3050', borderRadius: 7,
    padding: '9px 12px', color: '#e2e8f0', fontSize: 13.5, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  },
  inputReadonly: {
    width: '100%', background: '#161b28', border: '1px solid #1e2840', borderRadius: 7,
    padding: '9px 12px', color: '#64748b', fontSize: 13.5, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  },
  submitBtn: (disabled) => ({
    background: disabled ? '#1e2335' : '#22543d',
    border:     disabled ? '1px solid #2a3050' : '1px solid #4ade80',
    color:      disabled ? '#64748b' : '#4ade80',
    fontSize: 13, fontWeight: 600, padding: '10px 16px', borderRadius: 7,
    cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginTop: 2,
  }),
  statCard: {
    background: '#1e2335', border: '1px solid #2a3050', borderRadius: 8,
    padding: '14px 18px', flex: 1, minWidth: 120, display: 'flex', flexDirection: 'column', gap: 4,
  },
  comingSoon: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: 260, gap: 12, color: '#64748b', textAlign: 'center',
  },
  th: { padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid #2a3050' },
  td: { padding: '10px 14px', borderBottom: '1px solid #1e2335' },
};

// ─── Status colour map ────────────────────────────────────────────────────────
const STATUS_STYLE = {
  PENDING:   { bg: '#2a2010', border: '#5a4a1a', color: '#f59e0b' },
  APPROVED:  { bg: '#1a2a3a', border: '#1e4a6a', color: '#38bdf8' },
  ENROLLED:  { bg: '#1a3a2a', border: '#2d5a3d', color: '#4ade80' },
  DROPPED:   { bg: '#3a1a1a', border: '#5a2a2a', color: '#ef4444' },
  REJECTED:  { bg: '#3a1a1a', border: '#5a2a2a', color: '#ef4444' },
  WITHDRAWN: { bg: '#2a2a2a', border: '#3a3a3a', color: '#94a3b8' },
  COMPLETED: { bg: '#1a2a1a', border: '#2a4a2a', color: '#86efac' },
};

function StatusBadge({ status }) {
  const st = STATUS_STYLE[status] || STATUS_STYLE.PENDING;
  return (
    <span style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.color, borderRadius: 4, padding: '2px 9px', fontSize: 11, fontWeight: 600 }}>
      {status}
    </span>
  );
}

function PanelTitle({ children }) {
  return (
    <div style={s.panelTitle}>
      <span style={{ width: 6, height: 6, background: '#4ade80', borderRadius: '50%', opacity: 0.7, display: 'inline-block' }} />
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return <div><label style={s.label}>{label}</label>{children}</div>;
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={s.statCard}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: accent || '#e2e8f0', letterSpacing: '-0.01em' }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: 11, color: '#64748b' }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, right }) {
  return (
    <div style={{
      padding: '10px 20px', background: '#1a3a2a', borderBottom: '1px solid #2a3050',
      fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
      color: '#4ade80', display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <span style={{ width: 6, height: 6, background: '#4ade80', borderRadius: '50%', display: 'inline-block' }} />
      {title}
      {right && <span style={{ marginLeft: 'auto', fontWeight: 400, color: '#64748b', fontSize: 11 }}>{right}</span>}
    </div>
  );
}

// ─── PROFILE TAB ─────────────────────────────────────────────────────────────

function ProfileTab() {
  const [profile,    setProfile]   = useState(null);
  const [prospectus, setProspectus] = useState([]);
  const [form,       setForm]      = useState({ first_name: '', last_name: '', middle_name: '' });
  const [pwForm,     setPwForm]    = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [loading,    setLoading]   = useState(false);
  const [pwLoading,  setPwLoading] = useState(false);

  const set   = (f, v) => setForm((p)   => ({ ...p, [f]: v }));
  const setPw = (f, v) => setPwForm((p) => ({ ...p, [f]: v }));

  useEffect(() => {
    getStudentProfile()
      .then(({ data }) => {
        setProfile(data);
        setForm({ first_name: data.first_name || '', last_name: data.last_name || '', middle_name: data.middle_name || '' });
      })
      .catch(console.error);

    getMyProspectus()
      .then(({ data }) => setProspectus(data))
      .catch(console.error);
  }, []);

  const enrolledRows  = prospectus.filter((d) => d.request_status === 'ENROLLED');
  const enrolledCount = enrolledRows.length;
  const enrolledUnits = enrolledRows.reduce((sum, d) => sum + (d.units || 0), 0);

  async function handleProfileSave(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await updateStudentProfile({ first_name: form.first_name, last_name: form.last_name, middle_name: form.middle_name });
      setProfile((prev) => ({ ...prev, ...data }));
      alert('✓ Profile updated.');
    } catch (err) {
      alert('Error: ' + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
    } finally { setLoading(false); }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) { alert('New passwords do not match.'); return; }
    setPwLoading(true);
    try {
      await updateStudentProfile({ current_password: pwForm.current_password, new_password: pwForm.new_password });
      alert('✓ Password changed.');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      alert('Error: ' + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
    } finally { setPwLoading(false); }
  }

  return (
    <>
      <div>
        <div style={s.pageTitle}>My Account</div>
        <div style={s.pageSub}>Manage your personal information and security settings.</div>
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <div style={s.statCard}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b' }}>Student ID</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#4ade80', fontFamily: 'monospace' }}>{profile?.student_id || '—'}</div>
        </div>
        <StatCard label="Program"    value={profile?.program_code || '—'} sub={profile?.program_name}           accent="#e2e8f0" />
        <StatCard label="Year Level" value={profile?.year_level ? `Year ${profile.year_level}` : '—'}           accent="#e2e8f0" />
        <StatCard label="College"    value={profile?.college_name || '—'}                                        accent="#e2e8f0" />
        <StatCard label="Enrolled"   value={enrolledCount}                 sub="subjects this term"              accent="#4ade80" />
        <StatCard label="Units"      value={enrolledUnits}                 sub="enrolled units"                  accent="#4ade80" />
      </div>

      <div style={s.panels}>
        {/* Personal info */}
        <div style={s.panel}>
          <PanelTitle>Personal Information</PanelTitle>
          <p style={s.hint}>Contact the registrar for corrections to your ID, email, or program.</p>
          <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <Field label="First Name">
                <input style={s.input} type="text" value={form.first_name} onChange={(e) => set('first_name', e.target.value)} required />
              </Field>
              <Field label="Middle Name">
                <input style={s.input} type="text" value={form.middle_name} onChange={(e) => set('middle_name', e.target.value)} />
              </Field>
            </div>
            <Field label="Last Name">
              <input style={s.input} type="text" value={form.last_name} onChange={(e) => set('last_name', e.target.value)} required />
            </Field>
            <Field label="Email Address">
              <input style={s.inputReadonly} type="email" value={profile?.email || ''} readOnly />
            </Field>
            <Field label="College">
              <input style={s.inputReadonly} type="text" value={profile?.college_name || '—'} readOnly />
            </Field>
            <Field label="Degree Program">
              <input style={s.inputReadonly} type="text" value={profile?.program_name ? `${profile.program_name} (${profile.program_code})` : '—'} readOnly />
            </Field>
            <Field label="Year Level">
              <input style={s.inputReadonly} type="text" value={profile?.year_level ? `Year ${profile.year_level}` : '—'} readOnly />
            </Field>
            <button type="submit" style={s.submitBtn(loading)} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div style={{ ...s.panel, maxWidth: 340, flex: '0 0 340px' }}>
          <PanelTitle>Change Password</PanelTitle>
          <p style={s.hint}>Use a strong password — at least 8 characters.</p>
          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Current Password">
              <input style={s.input} type="password" value={pwForm.current_password} onChange={(e) => setPw('current_password', e.target.value)} required />
            </Field>
            <Field label="New Password">
              <input style={s.input} type="password" value={pwForm.new_password} onChange={(e) => setPw('new_password', e.target.value)} required />
            </Field>
            <Field label="Confirm New Password">
              <input style={s.input} type="password" value={pwForm.confirm_password} onChange={(e) => setPw('confirm_password', e.target.value)} required />
            </Field>
            <button type="submit" style={s.submitBtn(pwLoading || !pwForm.current_password || !pwForm.new_password)} disabled={pwLoading || !pwForm.current_password || !pwForm.new_password}>
              {pwLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

// ─── PROSPECTUS TAB ───────────────────────────────────────────────────────────

function ProspectusTab() {
  const [rows,       setRows]      = useState([]);
  const [selected,   setSelected]  = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    return getMyProspectus()
      .then(({ data }) => setRows(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const total         = rows.reduce((sum, d) => sum + (d.units || 0), 0);
  const enrolledCount = rows.filter((r) => r.request_status === 'ENROLLED').length;
  const pendingCount  = rows.filter((r) => r.request_status === 'PENDING').length;
  const approvedCount = rows.filter((r) => r.request_status === 'APPROVED').length;

  const selectedUnits = selected.reduce((sum, id) => {
    const d = rows.find((r) => r.discipline_id === id);
    return sum + (d?.units || 0);
  }, 0);

  function toggleSelect(disciplineId) {
    setSelected((prev) =>
      prev.includes(disciplineId)
        ? prev.filter((x) => x !== disciplineId)
        : [...prev, disciplineId]
    );
  }

  async function handleSubmitRequest() {
    if (!selected.length) return;
    setSubmitting(true);
    try {
      const { data } = await submitDisciplineRequest(selected);
      const msg = [
        data.requested?.length ? `✓ Requested: ${data.requested.join(', ')}` : null,
        data.errors?.length    ? `✗ Errors:\n${data.errors.join('\n')}`       : null,
      ].filter(Boolean).join('\n\n');
      alert(msg || '✓ Done.');
      setSelected([]);
      await load();
    } catch (err) {
      alert('Error: ' + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
    } finally { setSubmitting(false); }
  }

  return (
    <>
      <div>
        <div style={s.pageTitle}>My Prospectus</div>
        <div style={s.pageSub}>Curriculum for the active semester. Select subjects to request enrollment.</div>
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <StatCard label="Subjects"  value={rows.length}    sub="this semester"  />
        <StatCard label="Units"     value={total}          sub="total this sem"  accent="#4ade80" />
        <StatCard label="Pending"   value={pendingCount}   sub="awaiting admin"  accent="#f59e0b" />
        <StatCard label="Approved"  value={approvedCount}  sub="pick schedule"   accent="#38bdf8" />
        <StatCard label="Enrolled"  value={enrolledCount}  sub="confirmed"       accent="#4ade80" />
      </div>

      {loading && (
        <div style={{ ...s.comingSoon, minHeight: 160 }}>
          <div style={{ fontSize: 13, color: '#64748b' }}>Loading...</div>
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div style={{ ...s.comingSoon, minHeight: 200 }}>
          <div style={{ fontSize: 38, opacity: 0.25 }}>📋</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>No active term or no disciplines found for your program.</div>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div style={{ ...s.panel, gap: 0, padding: 0, overflow: 'hidden' }}>
          <SectionHeader
            title="Disciplines"
            right={
              selected.length > 0
                ? `${selected.length} selected · +${selectedUnits} units`
                : `${total} units total`
            }
          />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#1e2335' }}>
                <th style={{ ...s.th, width: 36 }}></th>
                {['Code', 'Subject', 'Units', 'Prerequisites', 'Status', 'Offer Code'].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((d, i) => {
                const alreadyReq = !!d.request_status;
                const isSelected = selected.includes(d.discipline_id);
                return (
                  <tr
                    key={d.discipline_id}
                    onClick={() => !alreadyReq && toggleSelect(d.discipline_id)}
                    style={{
                      background: isSelected ? '#0f2018' : i % 2 === 0 ? 'transparent' : '#1a1f30',
                      borderBottom: '1px solid #1e2335',
                      cursor: alreadyReq ? 'default' : 'pointer',
                      opacity: alreadyReq ? 0.6 : 1,
                      transition: 'background 0.1s',
                    }}
                  >
                    <td style={{ ...s.td, paddingLeft: 20 }}>
                      {!alreadyReq && (
                        <span style={{
                          width: 15, height: 15, borderRadius: 3,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          border: isSelected ? '1px solid #4ade80' : '1px solid #2a3050',
                          background: isSelected ? '#4ade80' : 'transparent',
                        }}>
                          {isSelected && <span style={{ fontSize: 9, color: '#0f1117', fontWeight: 700 }}>✓</span>}
                        </span>
                      )}
                    </td>
                    <td style={{ ...s.td, fontFamily: 'monospace', color: '#4ade80', fontSize: 11 }}>{d.code}</td>
                    <td style={{ ...s.td, color: '#e2e8f0' }}>{d.name}</td>
                    <td style={{ ...s.td, color: '#94a3b8', textAlign: 'center' }}>{d.units}</td>
                    <td style={{ ...s.td }}>
                      {d.prerequisites?.length > 0
                        ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            {d.prerequisites.map((p) => (
                              <span key={p} style={{ background: '#1e2335', border: '1px solid #2a3050', color: '#94a3b8', borderRadius: 4, padding: '1px 7px', fontSize: 11 }}>{p}</span>
                            ))}
                          </div>
                        )
                        : <span style={{ color: '#64748b', fontSize: 11 }}>—</span>}
                    </td>
                    <td style={{ ...s.td }}>
                      {d.request_status
                        ? <StatusBadge status={d.request_status} />
                        : <span style={{ color: '#64748b', fontSize: 11 }}>Not requested</span>}
                    </td>
                    <td style={{ ...s.td, fontFamily: 'monospace', color: '#4ade80', fontSize: 11 }}>
                      {d.offer_code || <span style={{ color: '#64748b' }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {selected.length > 0 && (
            <div style={{ padding: '14px 20px', borderTop: '1px solid #2a3050', display: 'flex', alignItems: 'center', gap: 12, background: '#131720' }}>
              <span style={{ flex: 1, fontSize: 12, color: '#94a3b8' }}>
                {selected.length} subject{selected.length !== 1 ? 's' : ''} selected &nbsp;·&nbsp;
                <span style={{ color: '#4ade80', fontWeight: 600 }}>+{selectedUnits} units</span>
              </span>
              <button
                onClick={() => setSelected([])}
                style={{ background: 'none', border: '1px solid #2a3050', color: '#94a3b8', borderRadius: 6, padding: '7px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Clear
              </button>
              <button onClick={handleSubmitRequest} disabled={submitting} style={s.submitBtn(submitting)}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ─── ENROLLMENT TAB ───────────────────────────────────────────────────────────

function EnrollmentTab() {
  const [activeTerm,  setActiveTerm]  = useState(null);
  const [prospectus,  setProspectus]  = useState([]);
  const [approved,    setApproved]    = useState([]);
  const [selected,    setSelected]    = useState([]);
  const [submitting,  setSubmitting]  = useState(false);
  const [scheduling,  setScheduling]  = useState({});
  const [expandedEnr, setExpandedEnr] = useState(null);
  const [loadingMain, setLoadingMain] = useState(true);

  const reload = useCallback(async () => {
    const [{ data: pros }, { data: app }] = await Promise.all([
      getMyProspectus(),
      getApprovedForSchedule(),
    ]);
    setProspectus(pros);
    setApproved(app);
  }, []);

  useEffect(() => {
    fetchTerms()
      .then(({ data }) => setActiveTerm(data.find((t) => t.is_active) || null))
      .catch(console.error);

    setLoadingMain(true);
    reload().catch(console.error).finally(() => setLoadingMain(false));
  }, [reload]);

  const selectedUnits = selected.reduce((sum, id) => {
    const d = prospectus.find((p) => p.discipline_id === id);
    return sum + (d?.units || 0);
  }, 0);

  const committedUnits = prospectus
    .filter((d) => ['PENDING', 'APPROVED', 'ENROLLED'].includes(d.request_status))
    .reduce((sum, d) => sum + (d.units || 0), 0);

  function toggleSelect(disciplineId) {
    setSelected((prev) =>
      prev.includes(disciplineId)
        ? prev.filter((x) => x !== disciplineId)
        : [...prev, disciplineId]
    );
  }

  async function handleSubmitRequest() {
    if (!selected.length) return;
    setSubmitting(true);
    try {
      const { data } = await submitDisciplineRequest(selected);
      const msg = [
        data.requested?.length ? `✓ Requested: ${data.requested.join(', ')}` : null,
        data.errors?.length    ? `✗ Errors:\n${data.errors.join('\n')}`       : null,
      ].filter(Boolean).join('\n\n');
      alert(msg || '✓ Done.');
      setSelected([]);
      await reload();
    } catch (err) {
      alert('Error: ' + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
    } finally { setSubmitting(false); }
  }

  async function handleSelectSchedule(enrollmentId, offeringId) {
    setScheduling((p) => ({ ...p, [enrollmentId]: true }));
    try {
      const { data } = await selectSchedule(enrollmentId, offeringId);
      alert(`✓ Enrolled in ${data.offer_code} — ${data.schedule}${data.room ? ` @ ${data.room}` : ''}`);
      setExpandedEnr(null);
      await reload();
    } catch (err) {
      alert('Error: ' + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
    } finally { setScheduling((p) => ({ ...p, [enrollmentId]: false })); }
  }

  const pendingCount  = prospectus.filter((d) => d.request_status === 'PENDING').length;
  const enrolledCount = prospectus.filter((d) => d.request_status === 'ENROLLED').length;

  return (
    <>
      <div>
        <div style={s.pageTitle}>Enrollment</div>
        <div style={s.pageSub}>
          {activeTerm ? `Active term: ${activeTerm.school_year} — Semester ${activeTerm.semester}` : 'No active enrollment period.'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <StatCard label="Term"          value={activeTerm ? activeTerm.school_year : 'Closed'} sub={activeTerm ? `Semester ${activeTerm.semester}` : 'check back later'} accent={activeTerm ? '#4ade80' : '#94a3b8'} />
        <StatCard label="Pending"       value={pendingCount}    sub="awaiting admin"         accent="#f59e0b" />
        <StatCard label="Pick Schedule" value={approved.length} sub="approved, no slot yet"  accent="#38bdf8" />
        <StatCard label="Enrolled"      value={enrolledCount}   sub="schedule confirmed"      accent="#4ade80" />
      </div>

      {!activeTerm && (
        <div style={{ ...s.comingSoon, minHeight: 200 }}>
          <div style={{ fontSize: 40, opacity: 0.25 }}>🔒</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Enrollment is currently closed.</div>
        </div>
      )}

      {activeTerm && loadingMain && (
        <div style={{ ...s.comingSoon, minHeight: 160 }}>
          <div style={{ fontSize: 13, color: '#64748b' }}>Loading enrollment data...</div>
        </div>
      )}

      {activeTerm && !loadingMain && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {approved.length > 0 && (
            <div style={{ ...s.panel, gap: 0, padding: 0, overflow: 'hidden' }}>
              <SectionHeader title="Step 2 — Pick Your Schedule" right={`${approved.length} subject${approved.length !== 1 ? 's' : ''} need a schedule`} />
              {approved.map((item) => {
                const isOpen   = expandedEnr === item.enrollment_id;
                const isActing = !!scheduling[item.enrollment_id];
                return (
                  <div key={item.id} style={{ borderBottom: '1px solid #1e2335' }}>
                    <div
                      onClick={() => setExpandedEnr(isOpen ? null : item.enrollment_id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', cursor: 'pointer', background: isOpen ? '#1a2535' : 'transparent', transition: 'background 0.15s' }}
                    >
                      <span style={{ background: '#1e2335', border: '1px solid #2a3050', color: '#94a3b8', borderRadius: 5, padding: '3px 10px', fontSize: 11, fontFamily: 'monospace', flexShrink: 0 }}>{item.discipline_code}</span>
                      <span style={{ flex: 1, fontWeight: 500, fontSize: 14, color: '#e2e8f0' }}>{item.discipline_name}</span>
                      <span style={{ fontSize: 12, color: '#64748b' }}>{item.units} units</span>
                      <StatusBadge status="APPROVED" />
                      <span style={{ color: '#64748b', fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
                    </div>
                    {isOpen && (
                      <div style={{ padding: '0 20px 16px', background: '#151a28' }}>
                        {item.offerings.length === 0
                          ? <div style={{ padding: '12px 0', fontSize: 12, color: '#64748b' }}>No offerings posted yet.</div>
                          : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 8 }}>
                              <thead>
                                <tr style={{ background: '#1e2335' }}>
                                  {['Offer Code', 'Teacher', 'Schedule', 'Room', 'Slots', ''].map((h) => (
                                    <th key={h} style={{ ...s.th, background: 'transparent' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {item.offerings.map((o) => {
                                  const full = o.available_slots <= 0;
                                  return (
                                    <tr key={o.id} style={{ borderBottom: '1px solid #1e2335' }}>
                                      <td style={{ ...s.td, fontFamily: 'monospace', color: '#4ade80', fontSize: 11 }}>{o.offer_code}</td>
                                      <td style={{ ...s.td, color: '#e2e8f0' }}>{o.teacher_name || <span style={{ color: '#64748b' }}>TBA</span>}</td>
                                      <td style={{ ...s.td, color: '#94a3b8' }}>{o.schedule}</td>
                                      <td style={{ ...s.td, color: '#94a3b8' }}>{o.room || '—'}</td>
                                      <td style={{ ...s.td }}>
                                        <span style={{ color: full ? '#ef4444' : '#4ade80', fontWeight: 600 }}>{o.current_slots}/{o.max_slots}</span>
                                        <span style={{ color: '#64748b', fontSize: 11, marginLeft: 4 }}>({o.available_slots} open)</span>
                                      </td>
                                      <td style={{ ...s.td }}>
                                        <button
                                          disabled={full || isActing}
                                          onClick={() => handleSelectSchedule(item.enrollment_id, o.id)}
                                          style={{ background: full ? '#1e2335' : '#1a3a2a', border: `1px solid ${full ? '#2a3050' : '#4ade80'}`, color: full ? '#64748b' : '#4ade80', borderRadius: 5, padding: '4px 14px', fontSize: 11, fontWeight: 600, cursor: full ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                                        >
                                          {isActing ? '...' : full ? 'Full' : 'Select'}
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Stage 1: Request subjects */}
          <div style={{ ...s.panel, gap: 0, padding: 0, overflow: 'hidden' }}>
            <SectionHeader
              title="Step 1 — Request Subjects"
              right={selected.length > 0 ? `${selected.length} selected · ${committedUnits + selectedUnits} units total` : undefined}
            />
            {prospectus.length === 0
              ? <div style={{ ...s.comingSoon, minHeight: 120 }}><div style={{ fontSize: 13, color: '#94a3b8' }}>No subjects found for this term.</div></div>
              : (
                <>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#1e2335' }}>
                        <th style={{ ...s.th, width: 36 }}></th>
                        {['Code', 'Subject', 'Units', 'Prerequisites', 'Status'].map((h) => (
                          <th key={h} style={s.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {prospectus.map((d, i) => {
                        const alreadyReq = !!d.request_status;
                        // FIX: use discipline_id as the selection key
                        const isSelected = selected.includes(d.discipline_id);
                        return (
                          <tr
                            key={d.discipline_id}
                            onClick={() => !alreadyReq && toggleSelect(d.discipline_id)}
                            style={{
                              background: isSelected ? '#0f2018' : i % 2 === 0 ? 'transparent' : '#1a1f30',
                              borderBottom: '1px solid #1e2335',
                              cursor: alreadyReq ? 'default' : 'pointer',
                              opacity: alreadyReq ? 0.6 : 1,
                              transition: 'background 0.1s',
                            }}
                          >
                            <td style={{ ...s.td, paddingLeft: 20 }}>
                              {!alreadyReq && (
                                <span style={{
                                  width: 15, height: 15, borderRadius: 3,
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  border: isSelected ? '1px solid #4ade80' : '1px solid #2a3050',
                                  background: isSelected ? '#4ade80' : 'transparent',
                                }}>
                                  {isSelected && <span style={{ fontSize: 9, color: '#0f1117', fontWeight: 700 }}>✓</span>}
                                </span>
                              )}
                            </td>
                            <td style={{ ...s.td, fontFamily: 'monospace', color: '#4ade80', fontSize: 11 }}>{d.code}</td>
                            <td style={{ ...s.td, color: '#e2e8f0' }}>{d.name}</td>
                            <td style={{ ...s.td, color: '#94a3b8', textAlign: 'center' }}>{d.units}</td>
                            <td style={{ ...s.td }}>
                              {d.prerequisites?.length > 0
                                ? (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                    {d.prerequisites.map((p) => (
                                      <span key={p} style={{ background: '#1e2335', border: '1px solid #2a3050', color: '#94a3b8', borderRadius: 4, padding: '1px 7px', fontSize: 11 }}>{p}</span>
                                    ))}
                                  </div>
                                )
                                : <span style={{ color: '#64748b', fontSize: 11 }}>—</span>}
                            </td>
                            <td style={{ ...s.td }}>
                              {d.request_status
                                ? (
                                  <>
                                    <StatusBadge status={d.request_status} />
                                    {d.offer_code && (
                                      <span style={{ marginLeft: 6, fontFamily: 'monospace', fontSize: 10, color: '#4ade80' }}>{d.offer_code}</span>
                                    )}
                                  </>
                                )
                                : <span style={{ color: '#64748b', fontSize: 11 }}>Not requested</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {selected.length > 0 && (
                    <div style={{ padding: '14px 20px', borderTop: '1px solid #2a3050', display: 'flex', alignItems: 'center', gap: 12, background: '#131720' }}>
                      <span style={{ flex: 1, fontSize: 12, color: '#94a3b8' }}>
                        {selected.length} subject{selected.length !== 1 ? 's' : ''} selected &nbsp;·&nbsp;
                        <span style={{ color: '#4ade80', fontWeight: 600 }}>+{selectedUnits} units</span>
                      </span>
                      <button
                        onClick={() => setSelected([])}
                        style={{ background: 'none', border: '1px solid #2a3050', color: '#94a3b8', borderRadius: 6, padding: '7px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        Clear
                      </button>
                      <button onClick={handleSubmitRequest} disabled={submitting} style={s.submitBtn(submitting)}>
                        {submitting ? 'Submitting...' : 'Submit Request'}
                      </button>
                    </div>
                  )}
                </>
              )}
          </div>
        </div>
      )}
    </>
  );
}

// GRADES TAB--------------------------------------
function GradesTab() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTerm, setFilterTerm] = useState('');
  const [prospectus, setProspectus] = useState([]);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    Promise.all([getMyGrades(), getMyProspectus()])
      .then(([gradesRes, prosRes]) => {
        setGrades(gradesRes.data);
        setProspectus(prosRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ─── GROUP GRADES BY TERM ───────────────────────────────────────────────
  const grouped = grades.reduce((acc, g) => {
    const key = `Year ${g.year_level || '?'} - Sem ${g.semester || '?'}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(g);
    return acc;
  }, {});

  const termKeys = Object.keys(grouped).sort().reverse();
  const visible = filterTerm ? [filterTerm] : termKeys;

  // ─── SYNC ENROLLED + GRADES (FIX) ───────────────────────────────────────
  const enrolledMap = new Map();

  prospectus.forEach((p) => {
    if (p.request_status === 'ENROLLED') {
      enrolledMap.set(p.discipline_id, {
        ...p,
        source: 'prospectus',
      });
    }
  });

  grades.forEach((g) => {
    if (enrolledMap.has(g.discipline_id)) {
      enrolledMap.set(g.discipline_id, {
        ...enrolledMap.get(g.discipline_id),
        ...g,
        source: 'merged',
      });
    } else {
      enrolledMap.set(g.discipline_id, {
        ...g,
        source: 'grades-only',
      });
    }
  });

  const syncedEnrolled = Array.from(enrolledMap.values());

  useEffect(() => {
    function handleOutsideClick(event) {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // ─── STATS ──────────────────────────────────────────────────────────────
  const gradedAll = grades.filter((g) => g.finals != null);
  const allPassed = gradedAll.filter((g) => parseFloat(g.finals) <= 3.0);
  const allFailed = gradedAll.filter((g) => parseFloat(g.finals) > 3.0);

  const totalUnitsEarned = allPassed.reduce(
    (sum, g) => sum + (g.units || 0),
    0
  );

  const gwa = gradedAll.length
    ? (
        gradedAll.reduce(
          (sum, g) => sum + parseFloat(g.finals) * (g.units || 1),
          0
        ) /
        gradedAll.reduce((sum, g) => sum + (g.units || 1), 0)
      ).toFixed(4)
    : null;

  function gradeColor(val) {
    if (val == null) return '#64748b';
    const n = parseFloat(val);
    if (n <= 1.5) return '#4ade80';
    if (n <= 2.5) return '#38bdf8';
    if (n <= 3.0) return '#f59e0b';
    return '#ef4444';
  }

  async function handleExportCsv() {
    try {
      setExporting(true);
      const res = await exportMyGrades();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'grades.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to download grades CSV.');
    } finally {
      setExporting(false);
      setExportOpen(false);
    }
  }

  function handleExportPdf() {
    try {
      const doc = new jsPDF({ orientation: 'landscape' });
      const now = new Date();

      doc.setFontSize(15);
      doc.text('Student Grade Report', 14, 16);
      doc.setFontSize(10);
      doc.text(`Generated: ${now.toLocaleString()}`, 14, 23);

      const tableRows = syncedEnrolled.map((d) => {
        const finals = d.finals ?? null;
        const finalsNum = finals == null ? null : Number(finals);
        const status = finalsNum == null ? 'IN PROGRESS' : finalsNum <= 3.0 ? 'PASSED' : 'FAILED';
        return [
          d.discipline_code || d.code || '-',
          d.discipline_name || d.name || '-',
          d.units ?? '-',
          d.prelim ?? '--',
          d.midterm ?? '--',
          d.finals ?? '--',
          status,
        ];
      });

      autoTable(doc, {
        startY: 30,
        head: [['Code', 'Subject', 'Units', 'Prelim', 'Midterm', 'Finals', 'Status']],
        body: tableRows,
        styles: { fontSize: 9, cellPadding: 2.4 },
        headStyles: { fillColor: [30, 35, 53] },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

      doc.save('grades.pdf');
    } catch (err) {
      console.error(err);
      alert('Failed to download grades PDF.');
    } finally {
      setExportOpen(false);
    }
  }

  return (
    <>
      <div>
        <div style={s.pageTitle}>My Grades</div>
        <div style={s.pageSub}>
          Academic records + currently enrolled subjects (synced view).
        </div>
        <div style={{ marginTop: 8, position: 'relative', display: 'inline-block' }} ref={exportRef}>
          <button
            onClick={() => setExportOpen((v) => !v)}
            disabled={exporting}
            style={{
              marginTop: 8,
              padding: '7px 12px',
              fontSize: 13,
              borderRadius: 8,
              border: '1px solid #2a3050',
              background: '#1e2335',
              color: '#e2e8f0',
              cursor: exporting ? 'not-allowed' : 'pointer',
            }}
          >
            {exporting ? 'Exporting...' : 'Export Grades ▾'}
          </button>
          {exportOpen && (
            <div
              style={{
                position: 'absolute',
                top: 44,
                left: 0,
                minWidth: 170,
                border: '1px solid #2a3050',
                background: '#111827',
                borderRadius: 8,
                overflow: 'hidden',
                zIndex: 5,
                boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
              }}
            >
              <button
                onClick={handleExportCsv}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  background: 'transparent',
                  color: '#e2e8f0',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Download CSV
              </button>
              <button
                onClick={handleExportPdf}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  background: 'transparent',
                  color: '#e2e8f0',
                  border: 'none',
                  borderTop: '1px solid #2a3050',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Download PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── STATS ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <StatCard
          label="GWA"
          value={gwa ?? '—'}
          sub="general weighted avg"
          accent={gwa ? gradeColor(parseFloat(gwa)) : '#94a3b8'}
        />
        <StatCard
          label="Units Earned"
          value={totalUnitsEarned}
          sub="passing units"
          accent="#4ade80"
        />
        <StatCard
          label="Passed"
          value={allPassed.length}
          sub="subjects"
          accent="#4ade80"
        />
        <StatCard
          label="Failed"
          value={allFailed.length}
          sub="below passing"
          accent={allFailed.length ? '#ef4444' : '#94a3b8'}
        />
      </div>

      {/* ─── SYNCED ENROLLED SUBJECTS ───────────────────────────────────── */}
      <div style={{ ...s.panel, padding: 0, overflow: 'hidden' }}>
        <SectionHeader title="Currently Enrolled Subjects (Synced)" />

        {syncedEnrolled.length === 0 ? (
          <div style={{ padding: 16, color: '#64748b', fontSize: 12 }}>
            No enrolled subjects found.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#1e2335' }}>
                {['Code', 'Subject', 'Units', 'PRELIM', 'MIDTERM', 'FINALS'].map(
                  (h) => (
                    <th key={h} style={s.th}>
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {syncedEnrolled.map((d, idx) => (
                <tr key={`${d.discipline_id ?? 'disc'}-${d.id ?? idx}`}>
                  <td
                    style={{
                      ...s.td,
                      fontFamily: 'monospace',
                      color: '#4ade80',
                    }}
                  >
                    {d.discipline_code || d.code}
                  </td>

                  <td style={{ ...s.td }}>
                    {d.discipline_name || d.name}
                  </td>

                  <td style={{ ...s.td, textAlign: 'center' }}>
                    {d.units || '—'}
                  </td>

                <td style={{ ...s.td, textAlign: 'center' }}>
                    {d.prelim ?? '--'}
                </td>

                <td style={{ ...s.td, textAlign: 'center' }}>
                    {d.midterm ?? '--'}
                </td>

                <td style={{ ...s.td, textAlign: 'center' }}>
                    {d.finals ?? '--'}
                </td>

                  
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── GRADE RECORDS ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <PanelTitle>Grade Records</PanelTitle>

          {termKeys.length > 1 && (
            <div style={{ marginLeft: 'auto' }}>
              <select
                style={{
                  ...s.input,
                  width: 'auto',
                  fontSize: 12,
                  padding: '6px 10px',
                }}
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
              >
                <option value="">All Terms</option>
                {termKeys.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {loading && (
          <div style={{ ...s.comingSoon, minHeight: 160 }}>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              Loading grades...
            </div>
          </div>
        )}

        {!loading &&
          visible.map((term) => {
            const tg = grouped[term];

            const tGraded = tg.filter((g) => g.finals != null);
            const tPassed = tGraded.filter(
              (g) => parseFloat(g.finals) <= 3.0
            );

            const tUnits = tPassed.reduce(
              (sum, g) => sum + (g.units || 0),
              0
            );

            const tGWA = tGraded.length
              ? (
                  tGraded.reduce(
                    (sum, g) =>
                      sum + parseFloat(g.finals) * (g.units || 1),
                    0
                  ) /
                  tGraded.reduce(
                    (sum, g) => sum + (g.units || 1),
                    0
                  )
                ).toFixed(4)
              : null;

            return (
              <div
                key={term}
                style={{
                  ...s.panel,
                  padding: 0,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '10px 20px',
                    background: '#1a3a2a',
                    borderBottom: '1px solid #2a3050',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      background: '#4ade80',
                      borderRadius: '50%',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#4ade80',
                    }}
                  >
                    {term}
                  </span>

                  <span
                    style={{
                      marginLeft: 'auto',
                      display: 'flex',
                      gap: 14,
                    }}
                  >
                    {tGWA && (
                      <span
                        style={{
                          fontSize: 11,
                          color: gradeColor(parseFloat(tGWA)),
                        }}
                      >
                        GWA <strong>{tGWA}</strong>
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: 11,
                        color: '#64748b',
                      }}
                    >
                      {tUnits} units earned
                    </span>
                  </span>
                </div>

                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 13,
                  }}
                >
                  <thead>
                    <tr style={{ background: '#1e2335' }}>
                      {[
                        'Code',
                        'Subject',
                        'Units',
                        'Prelim',
                        'Midterm',
                        'Finals',
                        'Remarks',
                      ].map((h) => (
                        <th key={h} style={s.th}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {tg.map((g, i) => {
                      const fg =
                        g.finals != null ? parseFloat(g.finals) : null;
                      const passed = fg != null && fg <= 3.0;

                      return (
                        <tr
                          key={g.id}
                          style={{
                            background:
                              i % 2 === 0 ? 'transparent' : '#1a1f30',
                            borderBottom: '1px solid #1e2335',
                          }}
                        >
                          <td
                            style={{
                              ...s.td,
                              fontFamily: 'monospace',
                              color: '#4ade80',
                            }}
                          >
                            {g.discipline_code}
                          </td>
                          <td style={{ ...s.td }}>
                            {g.discipline_name}
                          </td>
                          <td style={{ ...s.td, textAlign: 'center' }}>
                            {g.units}
                          </td>

                          <td
                            style={{
                              ...s.td,
                              textAlign: 'center',
                              color: gradeColor(g.prelim),
                            }}
                          >
                            {g.prelim ?? '—'}
                          </td>

                          <td
                            style={{
                              ...s.td,
                              textAlign: 'center',
                              color: gradeColor(g.midterm),
                            }}
                          >
                            {g.midterm ?? '—'}
                          </td>

                          <td
                            style={{
                              ...s.td,
                              textAlign: 'center',
                              color: gradeColor(fg),
                            }}
                          >
                            {fg ?? '—'}
                          </td>

                          <td style={{ ...s.td }}>
                            {fg == null ? (
                              <span style={{ color: '#64748b' }}>
                                In Progress
                              </span>
                            ) : (
                              <span
                                style={{
                                  color: passed
                                    ? '#4ade80'
                                    : '#ef4444',
                                  fontWeight: 600,
                                }}
                              >
                                {passed ? 'PASSED' : 'FAILED'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
      </div>
    </>
  );
}
// ─── Main ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'profile',    label: 'Profile / Account', icon: '👤' },
  { key: 'prospectus', label: 'Prospectus',         icon: '📋' },
  { key: 'enrollment', label: 'Enrollment',         icon: '📝' },
  { key: 'grades',     label: 'Grades',             icon: '📊' },
];

export default function StudentHome() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile,   setProfile]   = useState(null);

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || userData?.is_admin) { navigate('/'); return; }

    getStudentProfile()
      .then(({ data }) => setProfile(data))
      .catch(console.error);
  }, [navigate]);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  }

  return (
    <div style={s.root}>
      <div style={s.sidebar}>
        <div style={s.logo}><span style={s.logoDot} />STUDENT PORTAL</div>
        <div style={s.navLabel}>Navigation</div>
        {TABS.map((tab) => (
          <button key={tab.key} style={s.pillBtn(activeTab === tab.key)} onClick={() => setActiveTab(tab.key)}>
            <span style={{ fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}

        <div style={s.sidebarFooter}>
          {profile && (
            <div style={{ padding: '10px 12px', borderRadius: 8, background: '#1a2030', border: '1px solid #2a3050', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.3 }}>
                {profile.first_name} {profile.last_name}
              </div>
              <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
                {profile.student_id}
              </div>
              {profile.program_code && (
                <div style={{ fontSize: 10, color: '#4ade80', marginTop: 2 }}>
                  {profile.program_code} · Year {profile.year_level}
                </div>
              )}
            </div>
          )}
          <button onClick={handleLogout} style={{ ...s.pillBtn(false), color: '#ef4444', border: '1px solid #3a1a1a', borderRadius: 50 }}>
            <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>⏻</span>
            Log Out
          </button>
        </div>
      </div>

      <div style={s.main}>
        {activeTab === 'profile'    && <ProfileTab />}
        {activeTab === 'prospectus' && <ProspectusTab />}
        {activeTab === 'enrollment' && <EnrollmentTab />}
        {activeTab === 'grades'     && <GradesTab />}
      </div>
    </div>
  );
}