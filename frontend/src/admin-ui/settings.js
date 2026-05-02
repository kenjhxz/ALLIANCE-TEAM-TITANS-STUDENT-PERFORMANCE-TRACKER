import React from 'react';

export default function Settings(){
  return (
    <div>
      <div className="toprow">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-sub">Application settings</div>
        </div>
        <button className="logout-btn" onClick={() => { localStorage.clear(); window.location = '/'; }}>Logout</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div className="card" style={{padding:16}}>
          <div className="card-title">General</div>
          <div style={{marginTop:8}}>Manage app-wide settings</div>
        </div>
        <div className="card" style={{padding:16}}>
          <div className="card-title">Integrations</div>
          <div style={{marginTop:8}}>API keys and webhooks</div>
        </div>
      </div>
    </div>
  );
}
