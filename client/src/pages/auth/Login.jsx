import React, { useState } from 'react'
import { login } from '../../services/auth'
import { Link } from 'react-router-dom'

export default function Login({ onAuthChange }){
  const [email,setEmail]=useState(''), [password,setPassword]=useState(''), [err,setErr]=useState(null), [loading,setLoading]=useState(false)

  async function submit(e){ e.preventDefault(); setErr(null); setLoading(true)
    try {
      const user = await login({ email, password })
      onAuthChange(user)
    } catch (err) { setErr(err.message || 'Login failed') } finally { setLoading(false) }
  }

  return (
    <div className="form card">
      <h2>Welcome back</h2>
      <p className="small">Sign in to access dashboards</p>
      <form onSubmit={submit}>
        <label className="label">Email</label>
        <input className="input" value={email} onChange={e=>setEmail(e.target.value)} />
        <label className="label">Password</label>
        <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <div style={{marginTop:12}}>
          <button className="btn primary" disabled={loading}>{loading?'Signing...':'Sign in'}</button>
        </div>
        <div style={{marginTop:8, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <Link to="/forgot" style={{color:'var(--muted)', fontSize:13}}>Forgot password?</Link>
          <Link to="/signup" style={{color:'var(--muted)', fontSize:13}}>Create account</Link>
        </div>
        {err && <div style={{color:'#ffb4b4', marginTop:10}}>{err}</div>}
      </form>
    </div>
  )
}
