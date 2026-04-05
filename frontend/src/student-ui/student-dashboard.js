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

  const generateReport = () => {
    // Simple report generation
    const report = grades.map(g => `${g.discipline_name}: ${g.score} (${g.remarks})`).join('\n');
    alert(`Grade Report:\n${report}`);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Student Dashboard - My Grades</h2>
      <button onClick={generateReport}>Generate Report</button>
      <ul>
        {grades.map((grade) => (
          <li key={grade.id}>
            {grade.discipline_name}: {grade.score} - {grade.remarks} (by {grade.teacher_name})
          </li>
        ))}
      </ul>
      {message && <p>{message}</p>}
    </div>
  );
}