import React, {useState} from 'react';
import {useNavigate } from "react-router-dom";



export default function Login({onLoginSuccess}){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try{
            
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
                </div>
            </div>
        </div>
     );


}

