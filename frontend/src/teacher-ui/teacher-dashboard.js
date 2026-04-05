import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addGrade, fetchCollege, fetchProgram, fetchDiscipline, fetchStudent } from '../api';

export default function TeacherDashboard() {
  const [grade, setGrade] = useState({
    student: '',
    discipline: '',
    score: '',
    remarks: '',
  });
  const [colleges, setColleges] = useState([]);
  const [programs, setPrograms] = useState([]);
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
      const [collegeRes, programRes, disciplineRes, studentRes] = await Promise.all([
        fetchCollege(),
        fetchProgram(),
        fetchDiscipline(),
        fetchStudent(),
      ]);
      setColleges(collegeRes.data);
      setPrograms(programRes.data);
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
      <h2>Teacher Dashboard - Add Grade</h2>
      <button onClick={() => navigate('/teacher-grades')}>View All Grades</button>
      <form onSubmit={handleSubmit}>
        <select
          value={grade.student}
          onChange={(e) => setGrade({ ...grade, student: e.target.value })}
          required
        >
          <option value="">Select Student</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.student_name}</option>
          ))}
        </select>
        <select
          value={grade.discipline}
          onChange={(e) => setGrade({ ...grade, discipline: e.target.value })}
          required
        >
          <option value="">Select Discipline</option>
          {disciplines.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Score"
          value={grade.score}
          onChange={(e) => setGrade({ ...grade, score: e.target.value })}
          required
        />
        <textarea
          placeholder="Remarks"
          value={grade.remarks}
          onChange={(e) => setGrade({ ...grade, remarks: e.target.value })}
        />
        <button type="submit">Add Grade</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}