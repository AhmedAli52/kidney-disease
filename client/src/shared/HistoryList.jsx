// client/src/shared/HistoryList.jsx
import React, { useEffect, useState } from 'react'
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4002'

export default function HistoryList({ patientId }) {
  const [history, setHistory] = useState([])

  async function load(pid) {
    if (!pid) { setHistory([]); return }
    try {
      const res = await fetch(`${API_BASE}/api/patients/${pid}/history`)
      const data = await res.json()
      // data is already limited to 3 by backend; ensure newest-first
      setHistory((data || []).slice(0,3))
    } catch (err) {
      console.error('history load error', err)
      setHistory([])
    }
  }

  useEffect(() => {
    load(patientId)
    function handler(e) {
      if (!e || !e.detail) return
      if (e.detail.patientId === patientId) load(patientId)
    }
    window.addEventListener('historyUpdated', handler)
    return () => window.removeEventListener('historyUpdated', handler)
  }, [patientId])

  return (
    <div className="card" style={{padding:16}}>
      <h3 style={{marginTop:0}}>Recent Results (latest 3)</h3>
      <div style={{
        marginTop:12, 
        display:'grid', 
        gap:12, 
        // FIX: Changed to 1fr 1fr for two columns
        gridTemplateColumns: '1fr 1fr'
      }}>
        {/* Header Row - Only Size Category and Stone? remain */}
        <div style={{fontWeight:700, color:'var(--muted)', fontSize:'0.85em', textTransform:'uppercase'}}>Size Category</div>
        <div style={{fontWeight:700, color:'var(--muted)', fontSize:'0.85em', textTransform:'uppercase', textAlign:'right'}}>Stone</div>

        {/* FIX: gridColumn: '1 / span 2' to span the two columns */}
        {history.length === 0 && <div className="small" style={{gridColumn: '1 / span 2'}}>No records yet</div>}
        
        {history.map((r) => {
          const p = r.prediction || {}
          
          const sizeCategory = p.size_category || p.prediction || 'N/A' 
          
          const isNoStoneClass = (String(sizeCategory).toLowerCase() === 'nostone' || String(sizeCategory).toLowerCase() === 'no_stone')
          
          const hasStone = (!isNoStoneClass) ? 'Yes' : 'No'

          return (
            <React.Fragment key={r.id}>
              {/* Size Category Column */}
              <div style={{display:'flex', alignItems:'center'}}>
                <div style={{fontWeight:700}}>{sizeCategory}</div>
              </div>
              
              {/* Stone Status Column (Right-aligned) */}
              <div style={{textAlign:'right', display:'flex', alignItems:'center', justifyContent:'flex-end'}}>
                <div style={{fontWeight:700, color: hasStone === 'Yes' ? 'var(--accent)' : 'var(--muted)'}}>{hasStone}</div>
              </div>
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}