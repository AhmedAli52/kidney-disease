// client/src/shared/FileUploader.jsx
import React, { useState } from 'react'
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4002'

export default function FileUploader({ patientId, onUploaded }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!file) return setMsg('Select a file first')
    setLoading(true); setMsg('Uploading...')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('patientId', patientId)
      const upl = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: fd })
      const uplData = await upl.json()
      if (!upl.ok) throw new Error(uplData.error || 'Upload failed')

      setMsg('Running prediction...')
      const predRes = await fetch(`${API_BASE}/api/model/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: uplData.fileId })
      })
      const pred = await predRes.json()
      if (!predRes.ok) throw new Error(pred.error || 'Prediction failed')

      setMsg(`Result: ${pred.category || pred.prediction} (${(pred.confidence || 0).toFixed(4)})`)
      // Notify parent
      onUploaded && onUploaded({ id: uplData.fileId, filename: file.name, prediction: pred })
      // Notify HistoryList to refresh
      window.dispatchEvent(new CustomEvent('historyUpdated', { detail: { patientId } }))

    } catch (err) {
      console.error(err)
      setMsg(String(err.message || err))
    } finally {
      setLoading(false)
      setFile(null)
    }
  }

  return (
    <div className="upload-box">
      <form onSubmit={submit}>
        <input className="input" type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} />
        <div style={{marginTop:10}}>
          <button className="btn primary" type="submit" disabled={loading || !file}>{loading ? 'Processing...' : 'Upload & Predict'}</button>
        </div>
        {msg && <div style={{marginTop:8}} className="small">{msg}</div>}
      </form>
    </div>
  )
}
