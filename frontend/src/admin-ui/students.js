import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { addStudent, fetchProgram, searchUsers } from '../api';

export default function Student() {
  const [student, setStudent] = useState({
    user: '',
    student_id: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    course: '',
  });
  const [programs, setPrograms] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const access = localStorage.getItem('access');
    const isAdmin = localStorage.getItem('is_admin') === 'true';
    if (!access || !isAdmin) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const loadPrograms = async () => {
      try {
        const resPrograms = await fetchProgram();
        setPrograms(resPrograms.data);
      } catch (err) {
        console.error('Error fetching programs:', err);
      }
    };

    loadPrograms();
    

    // close suggestions when clicking outside
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // debounce the search input to reduce filtering work and support future async
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(userSearch.trim()), 200);
    return () => clearTimeout(t);
  }, [userSearch]);

  // Perform async search when debouncedSearch updates (top-level hook)
  useEffect(() => {
    if (!debouncedSearch) {
      setUsers([]);
      return;
    }

    let cancelled = false;
    const doSearch = async () => {
      try {
        const res = await searchUsers(debouncedSearch);
        if (!cancelled) setUsers(res.data || []);
      } catch (err) {
        if (!cancelled) console.error('Error searching users:', err);
      }
    };
    doSearch();
    return () => { cancelled = true; };
  }, [debouncedSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addStudent({
        ...student,
        user: parseInt(student.user, 10),
        course: parseInt(student.course, 10),
      });
      alert(`Successfully added ${student.first_name} ${student.last_name}`);
      setStudent({
        user: '',
        student_id: '',
        first_name: '',
        last_name: '',
        middle_name: '',
        course: '',
      });
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="center" style={{ minHeight: '80vh' }}>
      <div className="card" style={{ width: 400, padding: 20 }}>
        <h2 className="page-title" style={{ textAlign: 'center', marginBottom: 20 }}>Add Student</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div ref={wrapperRef} style={{position:'relative'}}>
            <input
              className="auth-input"
              placeholder="Search user by name or email"
              value={userSearch}
              onChange={(e) => { setUserSearch(e.target.value); setShowSuggestions(true); setHighlightedIndex(-1); }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (!showSuggestions) return;
                const filtered = users.filter(u => {
                  const q = debouncedSearch.toLowerCase();
                  const name = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
                  return q && ((u.username && u.username.toLowerCase().includes(q)) || (u.email && u.email.toLowerCase().includes(q)) || name.includes(q));
                }).slice(0,8);
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setHighlightedIndex((hi) => Math.min(hi + 1, filtered.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHighlightedIndex((hi) => Math.max(hi - 1, 0));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
                    const u = filtered[highlightedIndex];
                    setStudent({ ...student, user: u.id });
                    setUserSearch(u.username || `${u.first_name} ${u.last_name}` || u.email);
                    setShowSuggestions(false);
                    setHighlightedIndex(-1);
                  }
                } else if (e.key === 'Escape') {
                  setShowSuggestions(false);
                  setHighlightedIndex(-1);
                }
              }}
              style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ccc' }}
              required
            />
            {showSuggestions && debouncedSearch && (
              <div className="typeahead-list">
                {users.filter(u => {
                  const q = debouncedSearch.toLowerCase();
                  const name = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
                  return (u.username && u.username.toLowerCase().includes(q)) || (u.email && u.email.toLowerCase().includes(q)) || name.includes(q);
                }).slice(0, 8).map((u, idx) => (
                  <div key={u.id} className={`typeahead-item ${idx === highlightedIndex ? 'highlight' : ''}`} onMouseEnter={() => setHighlightedIndex(idx)} onClick={() => {
                    setStudent({ ...student, user: u.id });
                    setUserSearch(u.username || `${u.first_name} ${u.last_name}` || u.email);
                    setShowSuggestions(false);
                    setHighlightedIndex(-1);
                  }}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div>{u.username || `${u.first_name} ${u.last_name}` || u.email}</div>
                      <div style={{fontSize:11,color:'#888'}}>{`#${u.id}`}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <input
            type="text"
            placeholder="Student ID"
            value={student.student_id}
            onChange={(e) => setStudent({ ...student, student_id: e.target.value })}
            required
            style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ccc' }}
          />
          <input
            type="text"
            placeholder="First Name"
            value={student.first_name}
            onChange={(e) => setStudent({ ...student, first_name: e.target.value })}
            required
            style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ccc' }}
          />
          <input
            type="text"
            placeholder="Last Name"
            value={student.last_name}
            onChange={(e) => setStudent({ ...student, last_name: e.target.value })}
            required
            style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ccc' }}
          />
          <input
            type="text"
            placeholder="Middle Name (Optional)"
            value={student.middle_name}
            onChange={(e) => setStudent({ ...student, middle_name: e.target.value })}
            style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ccc' }}
          />
          <select
            value={student.course}
            onChange={(e) => setStudent({ ...student, course: e.target.value })}
            required
            style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ccc' }}
          >
            <option value="">Select Degree Program</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name} ({program.code})
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
              backgroundColor: '#528f5e',
              color: '#fff',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Add Student
          </button>
        </form>
      </div>
    </div>
  );
}