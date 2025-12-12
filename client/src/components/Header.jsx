import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { logout } from '../services/auth'

export default function Header({ user, onAuthChange }){
  const nav = useNavigate()
  function doLogout(){ logout(); onAuthChange(null); nav('/login') }
  
  return (
    <header className="header" role="banner">
      {/* FIX: Made the logo a clickable area (Link or div with onClick) 
        to retain dashboard navigation functionality.
      */}
      <div className="logo" onClick={() => nav('/')} style={{cursor: 'pointer'}}>
        <div className="mark">K</div>
        <div className="title">Kidney Disease</div>
      </div>
      
      <div className="actions">
        {user ? (
          <>
            <div style={{textAlign:'right'}}>
              <div style={{fontWeight:700}}>{user.name}</div>
              <div style={{fontSize:12,color:'var(--muted)'}}>{user.role}</div>
            </div>
            {/* REMOVED: <button className="btn ghost" onClick={()=>nav('/')}>Dashboard</button> */}
            <button className="btn" onClick={doLogout}>Logout</button>
          </>
        ):(
          <>
            <Link to="/login" className="btn ghost">Login</Link>
            <Link to="/signup" className="btn primary">Sign up</Link>
          </>
        )}
      </div>
    </header>
  )
}