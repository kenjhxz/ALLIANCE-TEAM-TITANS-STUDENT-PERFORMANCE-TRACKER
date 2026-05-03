import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { fetchCollege, fetchProgram, fetchDiscipline, fetchStudent, fetchTeacher, DEV_MOCK } from '../api';

const STAT_ICON = {
  college: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 10L12 5L21 10L12 15L3 10Z" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 12.5V17.5H18V12.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  program: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7.5L12 4L20 7.5L12 11L4 7.5Z" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 10.5V14.2C7 15.8 9.2 17 12 17C14.8 17 17 15.8 17 14.2V10.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  course: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="14" rx="2.5" stroke="#2A3A57" strokeWidth="1.8" />
      <path d="M8 9H16M8 13H13" stroke="#2A3A57" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  student: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3" stroke="#3E5A25" strokeWidth="1.8" />
      <path d="M6.5 18C7.3 15.9 9.4 14.5 12 14.5C14.6 14.5 16.7 15.9 17.5 18" stroke="#3E5A25" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  teacher: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="7.5" r="2.8" stroke="#6F2F2F" strokeWidth="1.8" />
      <path d="M5 18L12 14L19 18" stroke="#6F2F2F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 10.3V14" stroke="#6F2F2F" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  flag: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 4V20" stroke="#9B2424" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 5H18L15.3 9.2L18 13.4H6" stroke="#9B2424" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export default function DashboardHome(){
  const navigate = useNavigate();

  const [counts, setCounts] = useState({ colleges:0, programs:0, disciplines:0, students:0, teachers:0 });
  const [collegesList, setCollegesList] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(()=>{
    const load = async ()=>{
      try{
        const [cRes,pRes,dRes,sRes,tRes] = await Promise.all([fetchCollege(), fetchProgram(), fetchDiscipline(), fetchStudent(), fetchTeacher()]);
        const collegesData = (cRes && cRes.data && cRes.data.length) ? cRes.data : DEV_MOCK.colleges;
        const programsData = (pRes && pRes.data && pRes.data.length) ? pRes.data : DEV_MOCK.programs;
        const disciplinesData = (dRes && dRes.data && dRes.data.length) ? dRes.data : DEV_MOCK.disciplines;
        const studentsData = (sRes && sRes.data && sRes.data.length) ? sRes.data : DEV_MOCK.students;
        const teachersData = (tRes && tRes.data && tRes.data.length) ? tRes.data : DEV_MOCK.teachers;

        setCounts({ colleges: collegesData.length, programs: programsData.length, disciplines: disciplinesData.length, students: studentsData.length, teachers: teachersData.length });
        setCollegesList(collegesData || []);
        setProgramsList(programsData || []);
        setStudentsList(studentsData || []);
        setTeachersList(teachersData || []);
      }catch(err){
        console.error('Error loading dashboard counts', err);
        // use mock as last resort
        setCounts({ colleges: DEV_MOCK.colleges.length, programs: DEV_MOCK.programs.length, disciplines: DEV_MOCK.disciplines.length, students: DEV_MOCK.students.length, teachers: DEV_MOCK.teachers.length });
        setCollegesList(DEV_MOCK.colleges);
        setProgramsList(DEV_MOCK.programs);
        setStudentsList(DEV_MOCK.students);
        setTeachersList(DEV_MOCK.teachers);
      }
    };
    load();
  },[]);

  const filteredColleges = collegesList
    .filter((col) => (col?.name || '').toLowerCase().includes(search.toLowerCase()))
    .slice(0, 6);

  const getProgramCount = (collegeId) => programsList.filter((p) => p.college === collegeId).length;

  const getStudentCount = (collegeId) => {
    const programIds = programsList.filter((p) => p.college === collegeId).map((p) => p.id);
    return studentsList.filter((s) => programIds.includes(s.course)).length;
  };

  const getDeanLabel = (collegeId) => {
    const deptTeacher = teachersList.find((t) => t.department === collegeId);
    if (!deptTeacher) return 'Prof. Unassigned';
    const first = deptTeacher.first_name || '';
    const last = deptTeacher.last_name || '';
    const fullName = `${first} ${last}`.trim();
    return fullName ? `Prof. ${fullName}` : 'Prof. Assigned';
  };

  const enrollmentData = collegesList.slice(0, 6).map((college) => ({
    name: college.code || college.name,
    students: getStudentCount(college.id),
  }));

  const maxEnrollment = Math.max(...enrollmentData.map((item) => item.students), 1);

  return (
    <div>
      <div className="toprow">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">Overview</div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <div className="user-chip"><div className="avatar">SA</div><div style={{fontSize:12,color:'#fff',marginLeft:8}}>Super Admin</div></div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card" onClick={() => navigate('/admin-dashboard/colleges')}>
          <div className="stat-icon" style={{background:'#6E8658'}}>{STAT_ICON.college}</div>
          <div className="stat-val">{counts.colleges}</div>
          <div className="stat-label">Colleges</div>
          <div className="stat-chip chip-green">Active</div>
        </div>

        <div className="stat-card" onClick={() => navigate('/admin-dashboard/programs')}>
          <div className="stat-icon" style={{background:'#73A1B2'}}>{STAT_ICON.program}</div>
          <div className="stat-val">{counts.programs}</div>
          <div className="stat-label">Programs</div>
          <div className="stat-chip chip-amber">Growing</div>
        </div>

        <div className="stat-card" onClick={() => navigate('/admin-dashboard/disciplines')}>
          <div className="stat-icon" style={{background:'#E6F1FB'}}>{STAT_ICON.course}</div>
          <div className="stat-val">{counts.disciplines}</div>
          <div className="stat-label">Courses</div>
          <div className="stat-chip chip-blue">New</div>
        </div>

        <div className="stat-card" onClick={() => navigate('/admin-dashboard/students')}>
          <div className="stat-icon" style={{background:'#EAF3DE'}}>{STAT_ICON.student}</div>
          <div className="stat-val">{counts.students}</div>
          <div className="stat-label">Students</div>
          <div className="stat-chip chip-green">Enrolled</div>
        </div>

        <div className="stat-card" onClick={() => navigate('/admin-dashboard/teachers')}>
          <div className="stat-icon" style={{background:'#FCEBEB'}}>{STAT_ICON.teacher}</div>
          <div className="stat-val">{counts.teachers}</div>
          <div className="stat-label">Professors</div>
          <div className="stat-chip chip-teal">Stable</div>
        </div>

        <div className="stat-card" style={{borderColor:'#F09595'}} onClick={() => navigate('/admin-dashboard/flags')}>
          <div className="stat-icon" style={{background:'#FCEBEB'}}>{STAT_ICON.flag}</div>
          <div className="stat-val">—</div>
          <div className="stat-label">Flags</div>
          <div className="stat-chip chip-red">!</div>
        </div>
      </div>

      <div className="page-grid">
        <div>
          <div className="card" style={{padding:12, marginBottom:12}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div style={{fontSize:14,fontWeight:600}}>Colleges & programs</div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <input className="search-input" placeholder="Search college..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <div className="view-all" style={{cursor:'pointer'}}>View all →</div>
              </div>
            </div>
            <table>
              <thead>
                <tr><th>College</th><th>Dean</th><th>Programs</th><th>Courses</th><th>Students</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filteredColleges.map((col, i) => {
                  const programsCount = getProgramCount(col.id);
                  const coursesCount = programsList.filter((p) => p.college === col.id).length;
                  const studentsCount = getStudentCount(col.id);
                  const statusLabel = studentsCount === 0 ? 'Low' : studentsCount > 40 ? 'Busy' : 'Active';
                  return (
                    <tr key={col.id}>
                      <td style={{display:'flex',alignItems:'center',gap:8}}><div className="college-dot" style={{background:['#6E8658','#73A1B2','#F09595','#E6F1FB','#EAF3DE','#FCEBEB'][i%6]}}></div><div>{col.name}</div></td>
                      <td>{getDeanLabel(col.id)}</td>
                      <td><span className="pill pill-blue">{programsCount} programs</span></td>
                      <td>{coursesCount}</td>
                      <td>{studentsCount}</td>
                      <td><span className={`pill ${statusLabel === 'Low' ? 'pill-red' : statusLabel === 'Busy' ? 'pill-amber' : 'pill-green'}`}>{statusLabel}</span></td>
                    </tr>
                  );
                })}
                {filteredColleges.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{textAlign:'center', color:'#7A6B60'}}>No colleges found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div className="card" style={{padding:12}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:13,fontWeight:600}}>Flags & pending requests</div>
              <div className="pill pill-red">7 open</div>
            </div>
            <div style={{marginTop:10}}>
              <div className="flag-item"><div className="flag-icon" style={{background:'#FCEBEB'}}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 8V13" stroke="#9B2424" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="17" r="1" fill="#9B2424"/><path d="M12 3.5L21 19H3L12 3.5Z" stroke="#9B2424" strokeWidth="1.8" strokeLinejoin="round"/></svg></div><div style={{flex:1}}><div style={{fontSize:12,fontWeight:500}}>Grade encoding error - COE · CS301</div><div style={{fontSize:11,color:'#57473A'}}>Finals grade mismatch</div></div><div style={{display:'flex',gap:6}}><button className="resolve-btn">Resolve</button><button className="dismiss-btn">Dismiss</button></div></div>
              <div className="flag-item"><div className="flag-icon" style={{background:'#FAEEDA'}}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 12H18" stroke="#8A5A17" strokeWidth="1.8" strokeLinecap="round"/><path d="M12 6L18 12L12 18" stroke="#8A5A17" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></div><div style={{flex:1}}><div style={{fontSize:12,fontWeight:500}}>Course overload request</div><div style={{fontSize:11,color:'#57473A'}}>3 students - awaiting approval</div></div><div style={{display:'flex',gap:6}}><button className="resolve-btn">Review</button></div></div>
              <div style={{marginTop:8,textAlign:'center'}}>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => navigate('/admin-dashboard/flags')}
                >
                  View all 7 flags →
                </button>
              </div>
            </div>
          </div>

          <div className="card" style={{padding:12}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>Enrollment by college</div>
            <div className="enrollment-chart-wrap">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={enrollmentData} margin={{ top: 8, right: 0, left: 0, bottom: 8 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#57473A' }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={[0, maxEnrollment]} />
                  <Tooltip cursor={{ fill: '#f7f1eb' }} />
                  <Bar dataKey="students" fill="#6E8658" radius={[6, 6, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
