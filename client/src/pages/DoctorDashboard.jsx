// client/pages/doctordashboard.jsx
import React, { useEffect, useState } from 'react'
import FileUploader from '../shared/FileUploader'
import HistoryList from '../shared/HistoryList'
import { listPatients } from '../services/api' // Assuming listPatients is defined elsewhere

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4002'

// Helper function to fetch the single latest result
async function getLatestPrediction(patientId) {
    if (!patientId) return null
    try {
        // Fetch history; backend limits to 3, we take the first.
        const res = await fetch(`${API_BASE}/api/patients/${patientId}/history`)
        const data = await res.json()
        // Ensure the record exists and has a prediction object
        return data && data.length > 0 ? data[0].prediction : null
    } catch (err) {
        console.error('Failed to fetch latest prediction:', err)
        return null
    }
}


export default function DoctorDashboard(){
  const [patients,setPatients]=useState([]), 
    [selected,setSelected]=useState(null),
    [latestPrediction, setLatestPrediction] = useState(null),
    [loadingPatients, setLoadingPatients] = useState(true)

  // Load patients on mount
  useEffect(()=>{ 
    async function loadPatients(){ 
      setLoadingPatients(true)
      try{ 
        const p=await listPatients(); 
        setPatients(p) 
        // Automatically select the first patient if the list is not empty
        if (p.length > 0 && !selected) setSelected(p[0])
      }catch(err){ 
        console.error('Error loading patients:', err); 
        setPatients([{id:'p_anon', name:'Demo Patient'}]) 
      } finally {
        setLoadingPatients(false)
      }
    } 
    loadPatients() 
  },[])

  // Load latest prediction when selected patient changes or history updates
  useEffect(() => {
    async function updateLatest() {
        if (selected?.id) {
            const data = await getLatestPrediction(selected.id)
            setLatestPrediction(data)
        } else {
            setLatestPrediction(null)
        }
    }
    
    updateLatest()
    
    // Listen for 'historyUpdated' events to refresh the latest prediction
    const handler = (e) => {
      if (e?.detail?.patientId === selected?.id) updateLatest()
    }
    window.addEventListener('historyUpdated', handler)
    return () => window.removeEventListener('historyUpdated', handler)
  }, [selected])


  // Helper function to render the latest prediction details (Cluster focused)
  const renderLatestPrediction = () => {
    if (!latestPrediction) {
      return <div className="small">No recent results found for {selected.name}.</div>
    }

    const p = latestPrediction
    // Get the cluster name (e.g., LowReflectionStone)
    const clusterName = p.size_category || p.prediction || 'N/A' 
    const isHighReflection = clusterName === 'HighReflectionStone'
    const confidence = p.confidence != null ? Number(p.confidence).toFixed(2) + '%' : 'N/A'
    
    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
            {/* The main focus is the assigned cluster */}
            <div style={{fontWeight: 700, fontSize: 22, color: isHighReflection ? 'var(--accent-2)' : 'var(--accent)'}}>
                {clusterName}
            </div>
            <div className="small" style={{color:'var(--muted)', marginTop: -10}}>Assigned Cluster Subtype</div>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginTop: 10}}>
                <div className="small" style={{color:'var(--muted)'}}>Prediction Confidence:</div>
                <div style={{fontWeight: 700, textAlign: 'right'}}>{confidence}</div>
            </div>
        </div>
    )
  }


  return (
    // Outer div for the two main rows
    <div style={{display: 'flex', flexDirection: 'column', gap: 18}}>
      
      {/* ----------------- TOP ROW: Patients List, File Upload, & New Results (3 Columns) ----------------- */}
      <div className="grid cols-3" style={{gap:18}}>
        
        {/* COLUMN 1: Patients List */}
        <div className="card">
          <h3>Patients</h3>
          {loadingPatients && <div className="small">Loading patient list...</div>}
          <div style={{marginTop:12}}>
            {patients.map(p=>(
              <div 
                key={p.id} 
                style={{
                  padding:'8px 10px', 
                  borderRadius:8, 
                  marginBottom:8, 
                  // Highlight the selected patient
                  background: selected?.id === p.id ? 'rgba(59,130,246,0.1)' : 'transparent', 
                  border: selected?.id === p.id ? '1px solid var(--accent)' : '1px solid transparent',
                  cursor:'pointer',
                  transition: 'all 0.2s'
                }} 
                onClick={()=>setSelected(p)}
              >
                <div style={{fontWeight:700}}>{p.name}</div>
                <div className="small">{p.id}</div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMN 2: File Uploader */}
        <div className="card">
            <h3 style={{marginTop:0}}>New Analysis</h3>
            {!selected && <div className="small">Select a patient to upload and run analysis.</div>}
            {selected && (
                <>
                    <div className="small" style={{color:'var(--muted)'}}>Target Patient:</div>
                    <div style={{fontWeight:700}}>{selected.name}</div>
                    <div style={{marginTop:12}}>
                        <FileUploader patientId={selected.id} />
                    </div>
                </>
            )}
        </div>

        {/* COLUMN 3: Recent File Result */}
        <div className="card">
            <h3 style={{marginTop:0}}>Latest Cluster Result</h3>
            <div style={{marginTop:12}}>
                {!selected 
                    ? <div className="small">Select a patient to view the latest result.</div> 
                    : renderLatestPrediction()
                }
            </div>
        </div>

      </div>

      {/* ----------------- BOTTOM ROW: Patient History (Full Width) ----------------- */}
      <div className="card">
        <h3>Patient History (Recent 3)</h3>
        {selected 
          ? <div style={{marginTop:12}}><HistoryList patientId={selected.id} /></div> 
          : <div className="small" style={{marginTop:12}}>Select a patient to view their history</div>
        }
      </div>
    </div>
  )
}