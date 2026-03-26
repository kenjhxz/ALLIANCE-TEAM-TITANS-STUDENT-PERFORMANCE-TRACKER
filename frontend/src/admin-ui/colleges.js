import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addCollege } from '../api';

export default function College(){
    const [college, setCollege] = useState({
        name: '',
        code: ''
    });
    const navigate = useNavigate();

        useEffect(() => {
        const access = localStorage.getItem("access");
        const isAdmin = localStorage.getItem("is_admin") === "true";
        if (!access || !isAdmin) {
            navigate("/");  
        }
    }, [navigate]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        try{
            console.log("Token in localStorage:", localStorage.getItem("access"));
            await addCollege(college);
            alert(`Successfully added ${college.name} ${college.code}`);
            setCollege({name:'', code: ''});
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
        <h2 style={{ textAlign: "center", marginBottom: 20 }}>Add University College </h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            type="text"
            placeholder="University College Name"
            value={college.name}
            onChange={(e) => setCollege({ ...college, name: e.target.value })}
            required
            style={{ width: '100%', padding: 10, borderRadius: 4, border: "1px solid #ccc" }}
          />
          <input
            type="text"
            placeholder="University College Code"
            value={college.code}
            onChange={(e) => setCollege({ ...college, code: e.target.value })}
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
          >
            Add College to University Database
          </button>
        </form>
      </div>
    </div>
  );


}