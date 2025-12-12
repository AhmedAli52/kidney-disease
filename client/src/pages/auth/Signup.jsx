import React, { useState } from 'react'
import { signup } from '../../services/auth'

export default function Signup({ onAuthChange }){
  const [name,setName]=useState(''), [email,setEmail]=useState(''), [password,setPassword]=useState(''), [role,setRole]=useState('patient'), [err,setErr]=useState(null), [loading,setLoading]=useState(false)

  async function submit(e){ e.preventDefault(); setErr(null); setLoading(true)
    try {
      const user = await signup({ name, email, password, role })
      onAuthChange(user)
    } catch (err) { setErr(err.message || 'Signup failed') } finally { setLoading(false) }
  }

  return (
    <div className="form card">
      <h2>Create account</h2>
      <p className="small">Simple signup (no email verification)</p>
      <form onSubmit={submit}>
        <label className="label">Full name</label>
        <input className="input" value={name} onChange={e=>setName(e.target.value)} />
        <label className="label">Email</label>
        <input className="input" value={email} onChange={e=>setEmail(e.target.value)} />
        <label className="label">Password</label>
        <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <label className="label">Role</label>
        <select className="input" value={role} onChange={e=>setRole(e.target.value)}>
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
        </select>
        <div style={{marginTop:12}}>
          <button className="btn primary" disabled={loading}>{loading?'Creating...':'Create account'}</button>
        </div>
        {err && <div style={{color:'#ffb4b4', marginTop:10}}>{err}</div>}
      </form>
    </div>
  )
}
