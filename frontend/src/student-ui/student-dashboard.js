import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchGrades } from '../api';

export default function StudentDashboard() {
  const [grades, setGrades] = useState([]);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const access = localStorage.getItem('access');
    const isStudent = localStorage.getItem('is_student') === 'true';
    if (!access || !isStudent) {
      navigate('/');
      return;
    }
    loadGrades();
  }, [navigate]);

  const loadGrades = async () => {
    try {
      const res = await fetchGrades();
      setGrades(res.data);
    } catch (err) {
      setMessage('Error loading grades');
    }
  };

  const viewReport = () => {
    navigate('/student-report');
  };

  return (
    <div style={{ padding: 20 }}>
      <div className="toprow">
        <div>
          <div className="page-title">Student Dashboard</div>
          <div className="page-sub">My grades and activities</div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button className="notif-btn" title="Notifications"><div className="notif-dot"/></button>
          <div className="user-chip"><div className="avatar">S</div><div style={{color:'#fff',marginLeft:8}}>Student</div></div>
        </div>
      </div>

      <div className="stat-grid" style={{gridTemplateColumns:'repeat(4,minmax(0,1fr))'}}>
        <div className="stat-card">Enrolled</div>
        <div className="stat-card">GPA</div>
        <div className="stat-card">Credits</div>
        <div className="stat-card">Holds</div>
      </div>

      <div className="card" style={{marginTop:16}}>
        <div className="card-head"><div className="card-title">My Grades</div><div className="view-all">View report</div></div>
        <div style={{padding:12}}>
          <button className="auth-btn" onClick={viewReport} style={{marginBottom:12}}>View Detailed Report</button>
          <table>
            <thead><tr><th>Course</th><th>Grade</th><th>Remarks</th></tr></thead>
            <tbody>
              {grades.map(g => (<tr key={g.id}><td>{g.discipline_name}</td><td>{g.score}</td><td>{g.remarks}</td></tr>))}
            </tbody>
          </table>
        </div>
      </div>
      {message && <p>{message}</p>}
    </div>
  );
}