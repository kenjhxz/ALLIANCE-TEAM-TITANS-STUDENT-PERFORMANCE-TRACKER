import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchTeacherOfferings,
  fetchOfferingEnrollments,
  fetchGrades,
  submitGrade,
  updateGrade,
  getTeacherProfile,
  logout as apiLogout,
} from '../services/api';

const shell = {
  page: {
    minHeight: '100vh',
    background: '#0f1117',
    color: '#e2e8f0',
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '220px 1fr',
    minHeight: '100vh',
  },
  sidebar: {
    borderRight: '1px solid #2a3050',
    background: '#181c27',
    padding: '28px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  logo: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#4ade80',
    letterSpacing: '0.08em',
    marginBottom: 16,
    paddingLeft: 4,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  logoDot: {
    width: 8,
    height: 8,
    background: '#4ade80',
    borderRadius: '50%',
    boxShadow: '0 0 8px #4ade80',
    flexShrink: 0,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.12em',
    color: '#64748b',
    textTransform: 'uppercase',
    padding: '0 10px',
    margin: '12px 0 4px',
  },
  pillBtn: (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 50,
    border: active ? '1px solid #4ade80' : '1px solid transparent',
    background: active ? '#1a3a2a' : 'transparent',
    color: active ? '#4ade80' : '#94a3b8',
    fontSize: 13.5,
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    fontFamily: 'inherit',
    transition: 'all 0.18s',
  }),
  sidebarFooter: {
    marginTop: 'auto',
    paddingTop: 16,
    borderTop: '1px solid #2a3050',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  profileCard: {
    padding: '10px 12px',
    borderRadius: 8,
    background: '#1a2030',
    border: '1px solid #2a3050',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  main: {
    padding: 28,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  offeringBtn: (active) => ({
    width: '100%',
    textAlign: 'left',
    padding: '10px 14px',
    borderRadius: 50,
    border: active ? '1px solid #4ade80' : '1px solid transparent',
    background: active ? '#1a3a2a' : 'transparent',
    color: active ? '#4ade80' : '#94a3b8',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
  }),
  badge: (tone = 'green') => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    padding: '5px 10px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: tone === 'blue' ? '#bae6fd' : tone === 'amber' ? '#fde68a' : '#86efac',
    background:
      tone === 'blue'
        ? 'rgba(30, 64, 175, 0.22)'
        : tone === 'amber'
          ? 'rgba(146, 64, 14, 0.22)'
          : 'rgba(22, 101, 52, 0.22)',
    border: '1px solid rgba(255,255,255,0.08)',
  }),
  hero: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    flexWrap: 'wrap',
  },
  title: { margin: 0, fontSize: 'clamp(1.7rem, 2.8vw, 2.4rem)', letterSpacing: '-0.04em' },
  subtitle: { margin: '8px 0 0', color: '#94a3b8', maxWidth: 720, lineHeight: 1.6 },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 14,
  },
  statCard: {
    borderRadius: 18,
    border: '1px solid rgba(42, 48, 80, 0.9)',
    background: 'rgba(24, 28, 39, 0.9)',
    padding: 18,
  },
  statLabel: { margin: 0, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#94a3b8' },
  statValue: { margin: '10px 0 0', fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em' },
  statSub: { margin: '6px 0 0', fontSize: 12, color: '#94a3b8' },
  sectionBar: {
    padding: '12px 18px',
    background: '#1a3a2a',
    borderBottom: '1px solid rgba(42, 48, 80, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionBarTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#4ade80',
  },
  panel: {
    borderRadius: 20,
    border: '1px solid rgba(42, 48, 80, 0.9)',
    background: 'rgba(24, 28, 39, 0.92)',
    overflow: 'hidden',
    boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
  },
  panelHead: {
    padding: '16px 18px',
    borderBottom: '1px solid rgba(42, 48, 80, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  panelTitle: { margin: 0, fontSize: 14, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4ade80' },
  table: { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    fontSize: 11,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#94a3b8',
    background: 'rgba(15, 17, 23, 0.62)',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  td: {
    padding: '12px 16px',
    borderTop: '1px solid rgba(42, 48, 80, 0.75)',
    verticalAlign: 'top',
  },
  input: {
    width: '100%',
    maxWidth: 92,
    borderRadius: 10,
    border: '1px solid rgba(42, 48, 80, 0.95)',
    background: '#101523',
    color: '#e2e8f0',
    padding: '8px 10px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  actionBtn: (disabled) => ({
    border: '1px solid rgba(74, 222, 128, 0.45)',
    background: disabled ? 'rgba(15, 17, 23, 0.7)' : 'linear-gradient(180deg, rgba(26, 58, 42, 0.95), rgba(22, 101, 52, 0.85))',
    color: disabled ? '#94a3b8' : '#d1fae5',
    borderRadius: 10,
    padding: '9px 12px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 700,
    minWidth: 88,
  }),
  helperText: { color: '#94a3b8', fontSize: 12, lineHeight: 1.5 },
  emptyState: {
    padding: 28,
    color: '#94a3b8',
    textAlign: 'center',
  },
  tableWrap: {
    maxHeight: 'calc(100vh - 420px)',
    overflow: 'auto',
  },
};

function fmtGrade(value) {
  if (value === '' || value == null) return '';
  const n = Number(value);
  return Number.isNaN(n) ? value : n.toFixed(2);
}

export default function TeacherHome() {
  const navigate = useNavigate();
  const [offerings, setOfferings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadOfferings();
    getTeacherProfile()
      .then(({ data }) => setTeacherProfile(data))
      .catch(() => setTeacherProfile(null));
  }, []);

  async function loadOfferings() {
    try {
      const { data } = await fetchTeacherOfferings();
      setOfferings(data);
      if (data.length && !selected) {
        selectOffering(data[0]);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load offerings.');
    }
  }

  async function handleLogout() {
    try {
      await apiLogout();
    } catch (err) {
      console.warn('logout request failed, clearing local session anyway', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
    }
  }

  async function selectOffering(off) {
    setSelected(off);
    setEnrollments([]);
    setGrades([]);
    setErrors({});
    try {
      setLoading(true);
      const [enrollmentRes, gradeRes] = await Promise.all([
        fetchOfferingEnrollments(off.id),
        fetchGrades({ offering: off.id }),
      ]);
      const gradeMap = new Map((gradeRes.data || []).map((g) => [g.student, g]));
      setGrades(gradeRes.data || []);
      const rows = enrollmentRes.data.map((r) => {
        const existing = gradeMap.get(r.student_id);
        return {
          enrollment_id: r.id,
          student_id: r.student_id,
          student_name: r.student_name,
          discipline_id: r.discipline_id,
          student_id_no: r.student_id_no,
          prelim: fmtGrade(existing?.prelim ?? ''),
          midterm: fmtGrade(existing?.midterm ?? ''),
          finals: fmtGrade(existing?.finals ?? ''),
          grade_id: existing?.id ?? null,
        };
      });
      setEnrollments(rows);
    } catch (err) {
      console.error(err);
      alert('Failed to load enrollments.');
    } finally {
      setLoading(false);
    }
  }

  function validateRow(row) {
    const next = {};
    for (const key of ['prelim', 'midterm', 'finals']) {
      const value = row[key];
      if (key === 'finals' && (value === '' || value == null)) {
        next[key] = 'Finals is required.';
        continue;
      }
      if (value === '' || value == null) continue;
      const numeric = Number(value);
      if (Number.isNaN(numeric)) next[key] = 'Must be a number.';
      else if (numeric < 1 || numeric > 5) next[key] = 'Must be between 1.00 and 5.00.';
    }
    return next;
  }

  async function handleSubmitGrade(row) {
    if (!selected) return;
    const rowErrors = validateRow(row);
    setErrors((prev) => ({ ...prev, [row.enrollment_id]: rowErrors }));
    if (Object.keys(rowErrors).length) return;

    const payload = {
      student: row.student_id,
      discipline: row.discipline_id || selected.discipline,
      offering: selected.id,
      term: selected.term,
      prelim: row.prelim === '' ? null : row.prelim,
      midterm: row.midterm === '' ? null : row.midterm,
      finals: row.finals,
    };

    try {
      setSavingId(row.enrollment_id);
      if (row.grade_id) {
        await updateGrade(row.grade_id, payload);
      } else {
        await submitGrade(payload);
      }
      await selectOffering(selected);
    } catch (err) {
      console.error(err);
      alert('Failed to save grade: ' + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
    } finally {
      setSavingId(null);
    }
  }

  const summary = useMemo(() => {
    const graded = grades.filter((g) => g.finals != null);
    const passing = graded.filter((g) => Number(g.finals) <= 3.0).length;
    return {
      offerings: offerings.length,
      students: enrollments.length,
      graded: graded.length,
      passing,
    };
  }, [offerings.length, enrollments.length, grades]);

  return (
    <div style={shell.page}>
      <div style={shell.layout}>
        <aside style={shell.sidebar}>
          <div style={shell.logo}><span style={shell.logoDot} />TEACHER PORTAL</div>
          <div style={shell.navLabel}>Navigation</div>
          <button
            onClick={() => selected ? selectOffering(selected) : loadOfferings()}
            style={shell.pillBtn(true)}
          >
            <span style={{ fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 }}>↻</span>
            Refresh Dashboard
          </button>

          <div style={shell.navLabel}>My Offerings</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: '56vh', overflowY: 'auto', paddingRight: 2 }}>
            {offerings.length === 0 && <div style={{ ...shell.helperText, padding: '0 10px' }}>No assigned offerings yet.</div>}
            {offerings.map((off) => (
              <button key={off.id} onClick={() => selectOffering(off)} style={shell.offeringBtn(selected?.id === off.id)}>
                <span style={{ fontWeight: 700 }}>{off.offer_code}</span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{off.discipline_code} • {off.term_label}</span>
              </button>
            ))}
          </div>

          <div style={shell.sidebarFooter}>
            {teacherProfile && (
              <div style={shell.profileCard}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.3 }}>
                  {teacherProfile.first_name} {teacherProfile.last_name}
                </div>
                <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
                  {teacherProfile.teacher_id || 'Faculty'}
                </div>
                {teacherProfile.college_name && (
                  <div style={{ fontSize: 10, color: '#4ade80', marginTop: 2 }}>
                    {teacherProfile.college_name}
                  </div>
                )}
              </div>
            )}
            <button onClick={handleLogout} style={{ ...shell.pillBtn(false), color: '#ef4444', border: '1px solid #3a1a1a' }}>
              <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>⏻</span>
              Log Out
            </button>
          </div>
        </aside>

        <main style={shell.main}>
          <section style={shell.hero}>
            <div>
              <h1 style={shell.title}>
                {selected ? `${selected.offer_code} · ${selected.discipline_name}` : 'Select an offering'}
              </h1>
              <p style={shell.subtitle}>
                Post preliminary, midterm, and finals grades for the students assigned to your class. Existing grades can be updated directly from this screen.
              </p>
            </div>
            {selected && <span style={shell.badge('blue')}>{selected.term_label}</span>}
          </section>

          <section style={shell.statsGrid}>
            <div style={shell.statCard}>
              <p style={shell.statLabel}>Offerings</p>
              <p style={shell.statValue}>{summary.offerings}</p>
              <p style={shell.statSub}>assigned to your account</p>
            </div>
            <div style={shell.statCard}>
              <p style={shell.statLabel}>Students</p>
              <p style={shell.statValue}>{summary.students}</p>
              <p style={shell.statSub}>in the selected section</p>
            </div>
            <div style={shell.statCard}>
              <p style={shell.statLabel}>Graded</p>
              <p style={shell.statValue}>{summary.graded}</p>
              <p style={shell.statSub}>saved grade records</p>
            </div>
            <div style={shell.statCard}>
              <p style={shell.statLabel}>Passing</p>
              <p style={shell.statValue}>{summary.passing}</p>
              <p style={shell.statSub}>finals grade ≤ 3.0</p>
            </div>
          </section>

          <section style={shell.panel}>
            <div style={shell.sectionBar}>
              <div style={shell.sectionBarTitle}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                Roster & Grade Editor
              </div>
              {selected && <span style={shell.badge('amber')}>{enrollments.length} enrolled</span>}
            </div>
            <div style={{ padding: '14px 18px 0' }}>
              <div style={shell.helperText}>Enter preliminary, midterm, and finals grades. Existing grades can be updated directly.</div>
            </div>

            {!selected ? (
              <div style={shell.emptyState}>Choose an offering from the left panel to load enrolled students.</div>
            ) : loading ? (
              <div style={shell.emptyState}>Loading students…</div>
            ) : enrollments.length === 0 ? (
              <div style={shell.emptyState}>No enrolled students are available for this offering yet.</div>
            ) : (
              <div style={shell.tableWrap}>
                <table style={shell.table}>
                  <thead>
                    <tr>
                      <th style={shell.th}>Student</th>
                      <th style={shell.th}>Student ID</th>
                      <th style={shell.th}>Prelim</th>
                      <th style={shell.th}>Midterm</th>
                      <th style={shell.th}>Finals</th>
                      <th style={shell.th}>State</th>
                      <th style={shell.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((row, index) => {
                      const rowState = row.grade_id ? 'Updated' : 'New';
                      const rowBadgeTone = row.grade_id ? 'blue' : 'green';
                      return (
                        <tr key={row.enrollment_id} style={{ background: index % 2 === 0 ? 'transparent' : 'rgba(15, 17, 23, 0.45)' }}>
                          <td style={shell.td}>
                            <div style={{ fontWeight: 700 }}>{row.student_name}</div>
                          </td>
                          <td style={shell.td}>
                            <span style={{ fontFamily: 'monospace', color: '#86efac' }}>{row.student_id_no}</span>
                          </td>
                          <td style={shell.td}>
                            <input
                              value={row.prelim}
                              onChange={(e) => {
                                const copy = [...enrollments];
                                copy[index].prelim = e.target.value;
                                setEnrollments(copy);
                              }}
                              style={shell.input}
                              placeholder="optional"
                            />
                            {errors[row.enrollment_id]?.prelim && <div style={{ color: '#fca5a5', fontSize: 11, marginTop: 6 }}>{errors[row.enrollment_id].prelim}</div>}
                          </td>
                          <td style={shell.td}>
                            <input
                              value={row.midterm}
                              onChange={(e) => {
                                const copy = [...enrollments];
                                copy[index].midterm = e.target.value;
                                setEnrollments(copy);
                              }}
                              style={shell.input}
                              placeholder="optional"
                            />
                            {errors[row.enrollment_id]?.midterm && <div style={{ color: '#fca5a5', fontSize: 11, marginTop: 6 }}>{errors[row.enrollment_id].midterm}</div>}
                          </td>
                          <td style={shell.td}>
                            <input
                              value={row.finals}
                              onChange={(e) => {
                                const copy = [...enrollments];
                                copy[index].finals = e.target.value;
                                setEnrollments(copy);
                              }}
                              style={shell.input}
                              placeholder="required"
                            />
                            {errors[row.enrollment_id]?.finals && <div style={{ color: '#fca5a5', fontSize: 11, marginTop: 6 }}>{errors[row.enrollment_id].finals}</div>}
                          </td>
                          <td style={shell.td}>
                            <span style={shell.badge(rowBadgeTone)}>{rowState}</span>
                          </td>
                          <td style={shell.td}>
                            <button
                              onClick={() => handleSubmitGrade(row)}
                              disabled={savingId === row.enrollment_id}
                              style={shell.actionBtn(savingId === row.enrollment_id)}
                            >
                              {savingId === row.enrollment_id ? 'Saving…' : row.grade_id ? 'Update' : 'Post'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
