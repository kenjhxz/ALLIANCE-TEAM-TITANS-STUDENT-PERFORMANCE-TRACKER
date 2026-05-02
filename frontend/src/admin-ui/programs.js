import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDegreeProgram, fetchCollege } from '../api';

export default function DegreeProgram() {
  const [program, setProgram] = useState({ college: '', name: '', code: '' });
  const [college, setCollege] = useState([]);
  const navigate = useNavigate();

  // Check for admin access
  useEffect(() => {
    const access = localStorage.getItem("access");
    const isAdmin = localStorage.getItem("is_admin") === "true";
    if (!access || !isAdmin) {
      navigate("/"); 
    }
  }, [navigate]);

  useEffect(()=> {
    const loadColleges = async () => {
      const res = await fetchCollege();
      setCollege(res.data);
    };
    loadColleges();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDegreeProgram(program);
      alert(`Successfully added ${program.name} (${program.code}) for (${program.college})`);
      setProgram({ name: '', code: '', college: ''
      });
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="center" style={{ minHeight: '80vh' }}>
      <div className="card" style={{ width: 400, padding: 20 }}>
        <h2 className="page-title" style={{ textAlign: 'center', marginBottom: 20 }}>Add Degree Program</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/*select college first*/}
          <select
          value={program.college}
          onChange={(e) => setProgram({ ...program, college: parseInt( e.target.value)})}
          required
          style={{ width: '100%', padding: 10, borderRadius: 4, border: "1px solid #ccc" }}
          >
            <option value="">  Select College to Populate  </option>
            {college.map((college) => (
              <option key={college.id} value={college.id}>
                {college.name} {college.code}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Program Name"
            value={program.name}
            onChange={(e) => setProgram({ ...program, name: e.target.value })}
            required
            style={{ width: '100%', padding: 10, borderRadius: 4, border: "1px solid #ccc" }}
          />
          <input
            type="text"
            placeholder="Program Code"
            value={program.code}
            onChange={(e) => setProgram({ ...program, code: e.target.value })}
            required
            style={{ width: '100%', padding: 10, borderRadius: 4, border: "1px solid #ccc" }}
          />
          <button
            type="submit"
            style={{
              width: '100%',
              padding: 10,
              marginTop: 10,
              borderRadius: 4,
              backgroundColor: "#528f5e",
              color: "#fff",
              border: "none",
              cursor: "pointer"
            }}

            disabled={!program.college}
          >
            Add Program to University Database
          </button>
        </form>
      </div>
    </div>
  );
}