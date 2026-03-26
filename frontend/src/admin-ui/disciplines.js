import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDiscipline, fetchCollege, fetchProgram } from '../api';

export default function Discipline(){

    const [ discipline, setDiscipline]= useState({program: '', name: '', code: ''});
    const [program, setProgram] = useState([]);
    const [college, setCollege] = useState([]);
    const navigate = useNavigate();

   //Check for admin access
     useEffect(() => {
       const access = localStorage.getItem("access");
       const isAdmin = localStorage.getItem("is_admin") === "true";
       if (!access || !isAdmin) {
         navigate("/"); 
       }
     }, [navigate]);

      useEffect(()=>{
        const loadData = async () => {
            try {
            const resPrograms = await fetchProgram();
            const resColleges = await fetchCollege();
            setProgram(resPrograms.data);
            setCollege(resColleges.data);
            } catch (err) {
            console.error("Error fetching data:", err);
            }
        };
        loadData();
        }, []);

      const handleSubmit = async (e) => {
        e.preventDefault();

       try{
        await addDiscipline(discipline);
        alert(`Successfully added (${discipline.name}) (${discipline.code}) in (${discipline.program})`);
        setDiscipline({name: '', code: '', program: ''})
       } catch(error){
        alert(error.message);
       }
      };


return (
    <div style={{
      flex: 1,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "80vh"
    }}>
      <div style={{ width: 400, padding: 20, borderRadius: 8, backgroundColor: "#f3f4f6", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <h2 style={{ textAlign: "center", marginBottom: 20 }}>Add Discipline</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/*select program first*/}
          <select
          value={discipline.program}
          onChange={(e) => setDiscipline({ ...discipline, program: parseInt( e.target.value)})}
          required
          style={{ width: '100%', padding: 10, borderRadius: 4, border: "1px solid #ccc" }}
          >
            <option value="">  Select Degree Program to Populate  </option>
            {program.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name} {program.code}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Discipline Name"
            value={discipline.name}
            onChange={(e) => setDiscipline({ ...discipline, name: e.target.value })}
            required
            style={{ width: '100%', padding: 10, borderRadius: 4, border: "1px solid #ccc" }}
          />
          <input
            type="text"
            placeholder="Discipline Code"
            value={discipline.code}
            onChange={(e) => setDiscipline({ ...discipline, code: e.target.value })}
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

            disabled={!discipline.program}
          >
            Add Discipline to University Database
          </button>
        </form>
      </div>
    </div>
  );

}

