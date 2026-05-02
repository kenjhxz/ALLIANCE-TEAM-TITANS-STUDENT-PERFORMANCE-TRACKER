import React from 'react';

export default function Audit(){
  return (
    <div>
      <div className="toprow">
        <div>
          <div className="page-title">Audit log</div>
          <div className="page-sub">System audit trail</div>
        </div>
        <button className="logout-btn" onClick={() => { localStorage.clear(); window.location = '/'; }}>Logout</button>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Recent audit entries</div>
          <div className="view-all">Export</div>
        </div>
        <table>
          <thead>
            <tr><th>Time</th><th>User</th><th>Action</th></tr>
          </thead>
          <tbody>
            <tr><td>10:02 AM</td><td>admin</td><td>Added college: COE</td></tr>
            <tr><td>Yesterday</td><td>prof.ana</td><td>Finalized grades: CS301</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
