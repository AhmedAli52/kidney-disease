import React, { useState } from 'react'
import { forgotPassword } from '../../services/auth'

export default function ForgotPassword(){
  const [email,setEmail]=useState(''), [status,setStatus]=useState(null)
  async function submit(e){ e.preventDefault(); setStatus('sending'); try{ await forgotPassword(email); setStatus('sent') }catch{ setStatus('error') } }
  return (
    <div className="form card">
      <h2>Reset password</h2>
      <p className="small">Simple demo (no email sent)</p>
      <form onSubmit={submit}>
        <label className="label">Email</label>
        <input className="input" value={email} onChange={e=>setEmail(e.target.value)} />
        <div style={{marginTop:12}}>
          <button className="btn primary">Send reset link</button>
        </div>
      </form>
      <div style={{marginTop:10}}>
        {status==='sending' && 'Sending...'}{status==='sent' && 'If this email exists, instructions were sent.'}{status==='error' && 'Error sending.'}
      </div>
    </div>
  )
}
