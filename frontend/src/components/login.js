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
                }


            } else {
                setMessage(login_data.error);
            }


        } catch (err){
            setMessage('error: Unable to login at this moment. Please try again later.');
        }
    };


   return (
    <div style={{ maxWidth: 300, margin: '50px auto' }}>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ width: '100%', marginBottom: 10, padding: 8 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', marginBottom: 10, padding: 8 }}
        />
        <button type="submit" style={{ width: '100%', padding: 8 }}>Login</button>
      </form>
      {message && <p>{message}</p>}
    </div>
    );


}

