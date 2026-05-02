import React, {useState} from 'react';
import {useNavigate } from "react-router-dom";



export default function Login({onLoginSuccess}){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    // Development-friendly hard-coded accounts. These are used before attempting
    // a real API login so developers can test student/teacher flows without the
    // backend running.
    const DEV_ACCOUNTS = {
        student: {
            username: 'student',
            password: 'studentpass',
            access: 'dev-access-token-student',
            refresh: 'dev-refresh-token-student',
            is_admin: false,
            is_teacher: false,
            is_student: true,
            profile: { first_name: 'Dev', last_name: 'Student', role: 'student' }
        },
        teacher: {
            username: 'teacher',
            password: 'teacherpass',
            access: 'dev-access-token-teacher',
            refresh: 'dev-refresh-token-teacher',
            is_admin: false,
            is_teacher: true,
            is_student: false,
            profile: { first_name: 'Dev', last_name: 'Teacher', role: 'teacher' }
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try{
            // Check for hard-coded dev accounts first. This lets developers
            // sign in without a backend during UI work.
            const tryDev = Object.values(DEV_ACCOUNTS).find(a => a.username === username && a.password === password);
            if (tryDev) {
                const login_data = tryDev;
                // store values expected by the rest of the app
                localStorage.setItem('access', login_data.access);
                localStorage.setItem('refresh', login_data.refresh);
                localStorage.setItem('is_admin', String(login_data.is_admin));
                localStorage.setItem('is_teacher', String(login_data.is_teacher));
                localStorage.setItem('is_student', String(login_data.is_student));
                localStorage.setItem('profile', JSON.stringify(login_data.profile));

                setMessage(`You have successfully logged in ${username}! (dev)`);
                if(onLoginSuccess) onLoginSuccess();

                if(login_data.is_admin){
                    navigate('/admin-dashboard/');
                } else if(login_data.is_teacher){
                    navigate('/teacher-dashboard');
                } else if(login_data.is_student){
                    navigate('/student-dashboard');
                }

                return; // short-circuit real API call
            }

            // Fallback to real backend login if dev account not used
            const res = await fetch('http://localhost:8000/api/login/', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({username, password})
            });

            const login_data = await res.json();

            if(res.ok){
                localStorage.setItem('access', login_data.access);
                localStorage.setItem('refresh', login_data.refresh);
                localStorage.setItem('is_admin', login_data.is_admin);
                localStorage.setItem('profile', JSON.stringify(login_data.profile));

                setMessage(`You have successfully logged in ${username}!`);
                if(onLoginSuccess)onLoginSuccess();


                if(login_data.is_admin){
                    navigate('/admin-dashboard/');
                } else if(login_data.is_teacher){
                    navigate('/teacher-dashboard');
                } else if(login_data.is_student){
                    navigate('/student-dashboard');
                }


            } else {
                setMessage(login_data.error);
            }


        } catch (err){
            setMessage('error: Unable to login at this moment. Please try again later.');
        }
    };


     return (
        <div className="auth-wrap">
            <div className="auth-card">
                <div className="auth-head">
                    <div className="auth-logo">S</div>
                    <div>
                        <div className="auth-title">Sign in</div>
                        <div className="auth-sub">Access the Student Performance Tracker</div>
                    </div>
                </div>
                <div className="auth-body">
                    {message && <div className={`auth-error ${message ? 'visible' : ''}`}>{message}</div>}
                    <form onSubmit={handleLogin} style={{display:'flex',flexDirection:'column',gap:10}}>
                        <input
                            className="auth-input"
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                        <input
                            className="auth-input"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button className="auth-btn" type="submit">Login</button>
                    </form>
                    {process.env.NODE_ENV === 'development' && (
                        <div style={{marginTop:12,fontSize:12,color:'#9aa'}}>Dev accounts: <strong>student</strong>/<strong>studentpass</strong> (Student) — <strong>teacher</strong>/<strong>teacherpass</strong> (Teacher)</div>
                    )}
                </div>
            </div>
        </div>
     );


}

