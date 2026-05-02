import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addGrade, fetchDiscipline, fetchStudent } from '../api';

export default function TeacherDashboard() {
  const [grade, setGrade] = useState({
    student: '',
    discipline: '',
    score: '',
    remarks: '',
  });
  const [disciplines, setDisciplines] = useState([]);
  const [students, setStudents] = useState([]);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const access = localStorage.getItem('access');
    const isTeacher = localStorage.getItem('is_teacher') === 'true';
    if (!access || !isTeacher) {
      navigate('/');
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      const [disciplineRes, studentRes] = await Promise.all([
        fetchDiscipline(),
        fetchStudent(),
      ]);
      setDisciplines(disciplineRes.data);
      setStudents(studentRes.data);
    } catch (err) {
      setMessage('Error loading data');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addGrade(grade);
      setMessage('Grade added successfully!');
      setGrade({ student: '', discipline: '', score: '', remarks: '' });
    } catch (err) {
      setMessage('Error adding grade');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div className="toprow">
        <div>
          <div className="page-title">Teacher Dashboard</div>
          <div className="page-sub">Add grades and manage classes</div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button className="notif-btn" title="Notifications"><div className="notif-dot"/></button>
          <div className="user-chip"><div className="avatar">T</div><div style={{color:'#fff',marginLeft:8}}>Prof. You</div></div>
        </div>
      </div>

      <div className="stat-grid" style={{gridTemplateColumns:'repeat(4,minmax(0,1fr))'}}>
        <div className="stat-card">My classes</div>
        <div className="stat-card">Pending grades</div>
        <div className="stat-card">Students</div>
        <div className="stat-card">Reports</div>
      </div>

      <div className="card" style={{marginTop:16}}>
        <div className="card-head"><div className="card-title">Add Grade</div><div className="view-all">View all</div></div>
        <div style={{padding:12}}>
          <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:8}}>
            <select value={grade.student} onChange={(e) => setGrade({ ...grade, student: e.target.value })} required>
              <option value="">Select Student</option>
              {students.map((s) => (<option key={s.id} value={s.id}>{s.student_name}</option>))}
            </select>
            <select value={grade.discipline} onChange={(e) => setGrade({ ...grade, discipline: e.target.value })} required>
              <option value="">Select Discipline</option>
              {disciplines.map((d)=> (<option key={d.id} value={d.id}>{d.name}</option>))}
            </select>
            <input type="number" placeholder="Score" value={grade.score} onChange={(e)=>setGrade({...grade,score:e.target.value})} required />
            <textarea placeholder="Remarks" value={grade.remarks} onChange={(e)=>setGrade({...grade,remarks:e.target.value})} />
            <button className="auth-btn" type="submit">Add Grade</button>
          </form>
          {message && <p>{message}</p>}
        </div>
      </div>
    </div>
  );
}