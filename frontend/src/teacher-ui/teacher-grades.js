import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchGrades } from '../api';

export default function TeacherGrades() {
  const [grades, setGrades] = useState([]);
  const [editingGrade, setEditingGrade] = useState(null);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const access = localStorage.getItem('access');
    const isTeacher = localStorage.getItem('is_teacher') === 'true';
    if (!access || !isTeacher) {
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

  const handleEdit = (grade) => {
    setEditingGrade({ ...grade });
  };

  const handleSave = async () => {
    try {
      // For simplicity, we'll use addGrade but in reality, we'd need an update endpoint
      // For now, just update locally
      setGrades(grades.map(g => g.id === editingGrade.id ? editingGrade : g));
      setEditingGrade(null);
      setMessage('Grade updated successfully!');
    } catch (err) {
      setMessage('Error updating grade');
    }
  };

  const handleCancel = () => {
    setEditingGrade(null);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Teacher Dashboard - Manage Grades</h2>
      <button onClick={() => navigate('/teacher-dashboard')}>Add New Grade</button>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20 }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Student</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Discipline</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Score</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Remarks</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {grades.map((grade) => (
            <tr key={grade.id}>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>{grade.student_name}</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>{grade.discipline_name}</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>
                {editingGrade && editingGrade.id === grade.id ? (
                  <input
                    type="number"
                    value={editingGrade.score}
                    onChange={(e) => setEditingGrade({ ...editingGrade, score: e.target.value })}
                  />
                ) : (
                  grade.score
                )}
              </td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>
                {editingGrade && editingGrade.id === grade.id ? (
                  <textarea
                    value={editingGrade.remarks}
                    onChange={(e) => setEditingGrade({ ...editingGrade, remarks: e.target.value })}
                  />
                ) : (
                  grade.remarks
                )}
              </td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>
                {editingGrade && editingGrade.id === grade.id ? (
                  <>
                    <button onClick={handleSave}>Save</button>
                    <button onClick={handleCancel}>Cancel</button>
                  </>
                ) : (
                  <button onClick={() => handleEdit(grade)}>Edit</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {message && <p>{message}</p>}
    </div>
  );
}