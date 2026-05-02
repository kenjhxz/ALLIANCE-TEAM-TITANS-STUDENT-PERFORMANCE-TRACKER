import React, { useEffect, useState } from 'react';
import { fetchFlags, resolveFlag, dismissFlag, reviewFlag } from '../api';

export default function Flags(){
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchFlags();
        setFlags(res.data || []);
      } catch (err) {
        console.error('Error loading flags', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleResolve = async (flagId) => {
    setActionLoading(flagId);
    try {
      await resolveFlag(flagId);
      setFlags(flags.map(f => f.id === flagId ? { ...f, status: 'resolved' } : f));
    } catch (err) {
      console.error('Error resolving flag', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDismiss = async (flagId) => {
    setActionLoading(flagId);
    try {
      await dismissFlag(flagId);
      setFlags(flags.filter(f => f.id !== flagId));
    } catch (err) {
      console.error('Error dismissing flag', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReview = async (flagId) => {
    setActionLoading(flagId);
    try {
      await reviewFlag(flagId);
      setFlags(flags.map(f => f.id === flagId ? { ...f, status: 'in_review' } : f));
    } catch (err) {
      console.error('Error reviewing flag', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="toprow">
        <div>
          <div className="page-title">Flags & requests</div>
          <div className="page-sub">User-submitted flags and requests</div>
        </div>
        <button className="logout-btn" onClick={() => { localStorage.clear(); window.location = '/'; }}>Logout</button>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Open flags</div>
          <div className="view-all">{flags.length > 0 ? `${flags.length} open` : 'None'}</div>
        </div>

        <div style={{padding:12}}>
          {loading ? (
            <div style={{textAlign:'center', padding:'20px', color:'#57473A'}}>Loading flags...</div>
          ) : flags.length === 0 ? (
            <div style={{textAlign:'center', padding:'20px', color:'#57473A'}}>No open flags</div>
          ) : (
            flags.map((f) => (
              <div className="flag-item" key={f.id}>
                <div className="flag-icon" style={{background:'#FCEBEB'}}>
                  <svg width="13" height="13" fill="none" viewBox="0 0 13 13" aria-hidden>
                    <circle cx="6.5" cy="6.5" r="6" stroke="#A32D2D" strokeWidth="1.2"/>
                    <path d="M6.5 3.5v4M6.5 9v.5" stroke="#A32D2D" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </div>

                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:500,color:'#290907'}}>{f.title}</div>
                  <div style={{fontSize:11,color:'#57473A',marginTop:4}}>{f.desc}</div>
                  <div style={{fontSize:10,color:'#888780',marginTop:6}}>{f.meta}</div>
                </div>

                <div style={{display:'flex',gap:8,marginLeft:12}}>
                  {f.action === 'Resolve' && (
                    <button 
                      className="resolve-btn" 
                      onClick={() => handleResolve(f.id)}
                      disabled={actionLoading === f.id}
                      style={{opacity: actionLoading === f.id ? 0.6 : 1}}
                    >
                      {actionLoading === f.id ? '...' : 'Resolve'}
                    </button>
                  )}
                  {f.action === 'Review' && (
                    <button 
                      className="resolve-btn" 
                      onClick={() => handleReview(f.id)}
                      disabled={actionLoading === f.id}
                      style={{opacity: actionLoading === f.id ? 0.6 : 1}}
                    >
                      {actionLoading === f.id ? '...' : 'Review'}
                    </button>
                  )}
                  <button 
                    className="dismiss-btn"
                    onClick={() => handleDismiss(f.id)}
                    disabled={actionLoading === f.id}
                    style={{opacity: actionLoading === f.id ? 0.6 : 1}}
                  >
                    {actionLoading === f.id ? '...' : 'Dismiss'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
