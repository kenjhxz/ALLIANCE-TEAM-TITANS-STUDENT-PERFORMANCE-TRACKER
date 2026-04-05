import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchGrades } from '../api';

export default function GradeReport() {
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

  const printReport = () => {
    window.print();
  };

  const calculateGPA = () => {
    if (grades.length === 0) return 0;
    const total = grades.reduce((sum, grade) => sum + parseFloat(grade.score), 0);
    return (total / grades.length).toFixed(2);
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>Student Grade Report</h1>
      <p><strong>Student:</strong> {localStorage.getItem('profile') ? JSON.parse(localStorage.getItem('profile')).first_name + ' ' + JSON.parse(localStorage.getItem('profile')).last_name : 'N/A'}</p>
      <p><strong>Overall GPA:</strong> {calculateGPA()}</p>
      <button onClick={printReport} style={{ marginBottom: 20 }}>Print Report</button>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Discipline</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Score</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Remarks</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Teacher</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {grades.map((grade) => (
            <tr key={grade.id}>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>{grade.discipline_name}</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>{grade.score}</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>{grade.remarks}</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>{grade.teacher_name}</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>{new Date(grade.date_recorded).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {message && <p>{message}</p>}
      <style>{`
        @media print {
          button { display: none; }
        }
      `}</style>
    </div>
  );
}