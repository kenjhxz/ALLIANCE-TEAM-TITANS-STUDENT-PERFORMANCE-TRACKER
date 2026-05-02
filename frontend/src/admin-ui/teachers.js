import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addTeacher, fetchCollege, fetchDiscipline } from '../api';

export default function Teacher() {
    const [teacher, setTeacher] = useState({
        teacher_id: '',
        first_name: '',
        last_name: '',
        middle_name: '',
        department: '',
        discipline: []
    });
    const [colleges, setColleges] = useState([]);
    const [disciplines, setDisciplines] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const access = localStorage.getItem("access");
        const isAdmin = localStorage.getItem("is_admin") === "true";
        if (!access || !isAdmin) {
            navigate("/");
        }
    }, [navigate]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const resColleges = await fetchCollege();
                const resDisciplines = await fetchDiscipline();
                setColleges(resColleges.data);
                setDisciplines(resDisciplines.data);
            } catch (err) {
                console.error("Error fetching data:", err);
            }
        };
        loadData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await addTeacher(teacher);
            alert(`Successfully added ${teacher.first_name} ${teacher.last_name}`);
            setTeacher({
                teacher_id: '',
                first_name: '',
                last_name: '',
                middle_name: '',
                department: '',
                discipline: []
            });
        } catch (error) {
            alert(error.message);
        }
    };

    const filteredDisciplines = disciplines.filter(d => d.college === parseInt(teacher.department));

    return (
        <div className="center" style={{ minHeight: '80vh' }}>
            <div className="card" style={{ width: 400, padding: 20 }}>
                <h2 className="page-title" style={{ textAlign: 'center', marginBottom: 20 }}>Add Teacher</h2>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <input
                        type="text"
                        placeholder="Teacher ID"
                        value={teacher.teacher_id}
                        onChange={(e) => setTeacher({ ...teacher, teacher_id: e.target.value })}
                        required
                        style={{ width: '100%', padding: 10, borderRadius: 4, border: "1px solid #ccc" }}
                    />
                    <input
                        type="text"
                        placeholder="First Name"
                        value={teacher.first_name}
                        onChange={(e) => setTeacher({ ...teacher, first_name: e.target.value })}
                        required
                        style={{ width: '100%', padding: 10, borderRadius: 4, border: "1px solid #ccc" }}
                    />
                    <input
                        type="text"
                        placeholder="Last Name"
                        value={teacher.last_name}
                        onChange={(e) => setTeacher({ ...teacher, last_name: e.target.value })}
                        required
                        style={{ width: '100%', padding: 10, borderRadius: 4, border: "1px solid #ccc" }}
                    />
                    <input
                        type="text"
                        placeholder="Middle Name (Optional)"
                        value={teacher.middle_name}
                        onChange={(e) => setTeacher({ ...teacher, middle_name: e.target.value })}
                        style={{ width: '100%', padding: 10, borderRadius: 4, border: "1px solid #ccc" }}
                    />
                    <select
                        value={teacher.department}
                        onChange={(e) => setTeacher({ ...teacher, department: parseInt(e.target.value), discipline: [] })}
                        required
                        style={{ width: '100%', padding: 10, borderRadius: 4, border: "1px solid #ccc" }}
                    >
                        <option value="">Select Department</option>
                        {colleges.map((college) => (
                            <option key={college.id} value={college.id}>
                                {college.name} ({college.code})
                            </option>
                        ))}
                    </select>
                    <select
                        multiple
                        value={teacher.discipline}
                        onChange={(e) => {
                            const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                            setTeacher({ ...teacher, discipline: selectedOptions });
                        }}
                        style={{ width: '100%', padding: 10, borderRadius: 4, border: "1px solid #ccc", minHeight: 100 }}
                    >
                        {filteredDisciplines.map((discipline) => (
                            <option key={discipline.id} value={discipline.id}>
                                {discipline.name} ({discipline.code})
                            </option>
                        ))}
                    </select>
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
                        Add Teacher
                    </button>
                </form>
            </div>
        </div>
    );
}